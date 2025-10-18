import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, Save, Key } from "lucide-react";
import type { Setting } from "@shared/schema";

export default function AdminSettings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [stripePublicKey, setStripePublicKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [isAuthenticated, authLoading, user, toast]);

  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/admin/settings"],
    enabled: Boolean(isAuthenticated && user?.isAdmin),
  });

  useEffect(() => {
    if (settings) {
      const publicKey = (settings as Setting[]).find(s => s.key === 'VITE_STRIPE_PUBLIC_KEY');
      const secretKey = (settings as Setting[]).find(s => s.key === 'STRIPE_SECRET_KEY');
      
      if (publicKey?.value) setStripePublicKey(publicKey.value);
      if (secretKey?.value) setStripeSecretKey('••••••••'); // Mask secret
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; isSecret: boolean }[]) => {
      await apiRequest("POST", "/api/admin/settings", { settings: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const settingsToSave = [];

    if (stripePublicKey) {
      settingsToSave.push({
        key: "VITE_STRIPE_PUBLIC_KEY",
        value: stripePublicKey,
        isSecret: false,
      });
    }

    if (stripeSecretKey && stripeSecretKey !== '••••••••') {
      settingsToSave.push({
        key: "STRIPE_SECRET_KEY",
        value: stripeSecretKey,
        isSecret: true,
      });
    }

    saveMutation.mutate(settingsToSave);
  };

  if (authLoading || !isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground">
            Configure integrações e métodos de pagamento
          </p>
        </div>

        <div className="space-y-6">
          {/* Stripe Configuration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Configuração do Stripe</h2>
                <p className="text-sm text-muted-foreground">
                  Configure suas chaves de API do Stripe para aceitar pagamentos
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <div className="h-20 bg-muted rounded-lg animate-pulse" />
                <div className="h-20 bg-muted rounded-lg animate-pulse" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stripePublicKey">Chave Pública do Stripe (Publishable Key)</Label>
                  <Input
                    id="stripePublicKey"
                    type="text"
                    value={stripePublicKey}
                    onChange={(e) => setStripePublicKey(e.target.value)}
                    placeholder="pk_test_..."
                    className="font-mono"
                    data-testid="input-stripe-public-key"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta chave é segura para ser exposta no frontend
                  </p>
                </div>

                <div>
                  <Label htmlFor="stripeSecretKey">Chave Secreta do Stripe (Secret Key)</Label>
                  <Input
                    id="stripeSecretKey"
                    type="password"
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                    placeholder="sk_test_..."
                    className="font-mono"
                    data-testid="input-stripe-secret-key"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta chave deve ser mantida em segredo
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Como obter suas chaves do Stripe:</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Acesse <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dashboard.stripe.com/apikeys</a></li>
                    <li>Copie sua "Publishable key" (começa com pk_)</li>
                    <li>Copie sua "Secret key" (começa com sk_)</li>
                    <li>Cole as chaves acima e clique em Salvar</li>
                  </ol>
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Dica:</strong> Para testes, use as chaves do modo "Test". Para produção, use as chaves do modo "Live".
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              data-testid="button-save-settings"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>

          {/* Status Card */}
          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Status da Integração
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Stripe Configurado:</span>
                {stripePublicKey && stripeSecretKey && stripeSecretKey !== '' ? (
                  <span className="text-sm text-chart-2 font-medium">✓ Sim</span>
                ) : (
                  <span className="text-sm text-muted-foreground">✗ Não</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Modo:</span>
                <span className="text-sm text-muted-foreground">
                  {stripePublicKey?.startsWith('pk_live') ? 'Produção (Live)' : stripePublicKey?.startsWith('pk_test') ? 'Teste (Test)' : 'Não configurado'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
