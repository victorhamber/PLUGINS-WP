import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Package, Calendar, CreditCard } from "lucide-react";
import type { Subscription, Plugin } from "@shared/schema";
import { Link as RouterLink } from "wouter"; // <<< usar wouter

export default function Subscriptions() {
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

  const cancelMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      await apiRequest("DELETE", `/api/subscriptions/${subscriptionId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a assinatura.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      active: { variant: "default", className: "bg-chart-2" },
      expired: { variant: "destructive", className: "" },
      cancelled: { variant: "secondary", className: "" },
      pending: { variant: "outline", className: "border-yellow-500 text-yellow-500" },
    };
    return variants[status] || variants.active;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Minhas Assinaturas</h1>
          <p className="text-muted-foreground">Gerencie suas assinaturas de plugins</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-card rounded-lg animate-pulse" />
            ))}
          </div>
        ) : Array.isArray(subscriptions) && subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((subscription) => {
              const plugin = plugins?.find((p) => p.id === subscription.pluginId);
              const badgeConfig = getStatusBadge(subscription.status);

              return (
                <Card
                  key={subscription.id}
                  className="p-6 hover-elevate transition-all"
                  data-testid={`card-subscription-${subscription.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold" data-testid={`text-subscription-plugin-${subscription.id}`}>
                          {plugin?.name || "Plugin"}
                        </h3>
                      </div>
                      <Badge {...badgeConfig} data-testid={`badge-status-${subscription.id}`}>
                        {subscription.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        R$ {Number(subscription.price).toFixed(2)}/
                        {subscription.planType === "monthly" ? "mês" : "ano"}
                      </span>
                    </div>

                    {subscription.startDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Início: {new Date(subscription.startDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}

                    {subscription.endDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Renovação: {new Date(subscription.endDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Plano: <span className="font-medium">{subscription.planType}</span>
                      </p>
                      {subscription.autoRenew && subscription.status === "active" && (
                        <p className="text-xs text-muted-foreground mt-1">Renovação automática ativada</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Botão de link sem aninhar <button> dentro de <a> */}
                    <Button asChild variant="outline" className="w-full flex-1" data-testid={`button-view-plugin-${subscription.id}`}>
                      <RouterLink href={`/plugin/${plugin?.slug}`}>Ver Plugin</RouterLink>
                    </Button>

                    {subscription.status === "active" && (
                      <Button
                        variant="destructive"
                        onClick={() => cancelMutation.mutate(subscription.id)}
                        disabled={cancelMutation.isPending}
                        data-testid={`button-cancel-${subscription.id}`}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma assinatura</h3>
            <p className="text-muted-foreground mb-6">
              Você ainda não possui assinaturas ativas. Explore nossos plugins!
            </p>
            <Button asChild data-testid="button-browse-plugins">
              <RouterLink href="/store">Explorar Plugins</RouterLink>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
