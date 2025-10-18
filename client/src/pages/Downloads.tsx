import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest, ApiError } from "@/lib/queryClient";
import { Download, Package, FileDown, Calendar } from "lucide-react";
import type { Subscription, Plugin } from "@shared/schema";

export default function Downloads() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: subscriptions, isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    enabled: isAuthenticated,
  });

  const { data: plugins } = useQuery<Plugin[]>({
    queryKey: ["/api/plugins"],
    enabled: isAuthenticated,
  });

  const downloadMutation = useMutation({
    mutationFn: async (pluginId: string) => {
      const response = await apiRequest("POST", `/api/downloads`, { pluginId });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Download iniciado",
        description: "Seu plugin está sendo baixado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        const status = error.status;
        const msg =
          status === 401
            ? "Não autorizado. Faça login para baixar o plugin."
            : status === 403
            ? "Você não tem permissão para baixar este plugin."
            : status === 422
            ? "Assinatura inválida ou expirada."
            : error.message || "Falha ao iniciar download.";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível baixar o plugin.",
          variant: "destructive",
        });
      }
    },
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeSubscriptions = Array.isArray(subscriptions) ? subscriptions.filter(s => s.status === 'active') : [];
  const availablePlugins = Array.isArray(activeSubscriptions) ? activeSubscriptions
    .map(sub => plugins?.find(p => p.id === sub.pluginId))
    .filter(Boolean) as Plugin[] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Downloads</h1>
          <p className="text-muted-foreground">
            Baixe os plugins das suas assinaturas ativas
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-card rounded-lg animate-pulse" />
            ))}
          </div>
        ) : Array.isArray(availablePlugins) && availablePlugins.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlugins.map((plugin) => (
              <Card key={plugin.id} className="p-6 hover-elevate transition-all" data-testid={`card-download-${plugin.id}`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1" data-testid={`text-plugin-name-${plugin.id}`}>
                      {plugin.name}
                    </h3>
                    <Badge variant="secondary">v{plugin.version}</Badge>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Download className="w-4 h-4" />
                    <span>{plugin.downloadCount || 0} downloads totais</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Atualizado em {new Date(plugin.updatedAt!).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    if (plugin.downloadUrl) {
                      // Se houver URL real, baixar
                      window.open(plugin.downloadUrl, '_blank');
                      downloadMutation.mutate(plugin.id);
                    } else {
                      // Caso contrário, apenas registrar o download
                      downloadMutation.mutate(plugin.id);
                    }
                  }}
                  disabled={downloadMutation.isPending}
                  data-testid={`button-download-${plugin.id}`}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Baixar Plugin
                </Button>

                {plugin.downloadUrl && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Arquivo .zip será baixado automaticamente
                  </p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Download className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum download disponível</h3>
            <p className="text-muted-foreground mb-6">
              Você precisa ter assinaturas ativas para baixar plugins
            </p>
            <Button data-testid="button-browse-plugins" onClick={() => window.location.href = "/store"}>
              Explorar Plugins
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
