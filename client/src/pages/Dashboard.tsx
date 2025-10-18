import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Key, Download, CreditCard } from "lucide-react";
import type { Subscription, License, Plugin } from "@shared/schema";
import { Link as RouterLink } from "wouter"; // <<< usar wouter

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

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

  const { data: subscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    enabled: isAuthenticated,
  });

  const { data: licenses } = useQuery<License[]>({
    queryKey: ["/api/licenses"],
    enabled: isAuthenticated,
  });

  const { data: plugins } = useQuery<Plugin[]>({
    queryKey: ["/api/plugins"],
    enabled: isAuthenticated,
  });

  const activeSubscriptions = subscriptions?.filter((s) => s.status === "active") || [];
  const activeLicenses = licenses?.filter((l) => l.status === "active") || [];

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome">
            Bem-vindo, {user?.firstName || user?.email?.split("@")[0] || "Usuário"}!
          </h1>
          <p className="text-muted-foreground">Gerencie suas assinaturas, licenças e downloads</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover-elevate transition-all" data-testid="card-stat-subscriptions">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <Badge variant={activeSubscriptions.length > 0 ? "default" : "secondary"}>
                {activeSubscriptions.length > 0 ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1" data-testid="text-stat-subscriptions">
              {activeSubscriptions.length}
            </div>
            <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
          </Card>

          <Card className="p-6 hover-elevate transition-all" data-testid="card-stat-licenses">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-chart-2" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" data-testid="text-stat-licenses">
              {activeLicenses.length}
            </div>
            <p className="text-sm text-muted-foreground">Licenças Ativas</p>
          </Card>

          <Card className="p-6 hover-elevate transition-all" data-testid="card-stat-plugins">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-chart-3" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" data-testid="text-stat-plugins">
              {plugins?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Plugins Disponíveis</p>
          </Card>

          <Card className="p-6 hover-elevate transition-all" data-testid="card-stat-billing">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-chart-4" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">
              R$ {activeSubscriptions.reduce((sum, s) => sum + Number(s.price || 0), 0).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Gasto Mensal</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild data-testid="button-browse-plugins">
              <RouterLink href="/store">
                <Package className="w-4 h-4 mr-2" />
                Explorar Plugins
              </RouterLink>
            </Button>

            <Button asChild variant="outline" data-testid="button-manage-subscriptions">
              <RouterLink href="/subscriptions">
                <CreditCard className="w-4 h-4 mr-2" />
                Gerenciar Assinaturas
              </RouterLink>
            </Button>

            <Button asChild variant="outline" data-testid="button-view-licenses">
              <RouterLink href="/licenses">
                <Key className="w-4 h-4 mr-2" />
                Ver Licenças
              </RouterLink>
            </Button>

            <Button asChild variant="outline" data-testid="button-downloads">
              <RouterLink href="/downloads">
                <Download className="w-4 h-4 mr-2" />
                Downloads
              </RouterLink>
            </Button>
          </div>
        </Card>

        {/* Active Subscriptions */}
        {Array.isArray(activeSubscriptions) && activeSubscriptions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Assinaturas Ativas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSubscriptions.map((subscription) => {
                const plugin = plugins?.find((p) => p.id === subscription.pluginId);
                return (
                  <Card
                    key={subscription.id}
                    className="p-6 hover-elevate transition-all"
                    data-testid={`card-subscription-${subscription.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold mb-1">{plugin?.name || "Plugin"}</h3>
                        <Badge variant="default" className="bg-chart-2">
                          {subscription.status}
                        </Badge>
                      </div>
                      <Badge variant="secondary">{subscription.planType}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        <strong>Valor:</strong> R$ {Number(subscription.price).toFixed(2)}/
                        {subscription.planType === "monthly" ? "mês" : "ano"}
                      </p>
                      {subscription.endDate && (
                        <p className="text-muted-foreground">
                          <strong>Renova em:</strong>{" "}
                          {new Date(subscription.endDate).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>

                    <Button asChild variant="outline" className="w-full mt-4" data-testid={`button-view-plugin-${subscription.id}`}>
                      <RouterLink href={`/plugin/${plugin?.slug}`}>Ver Plugin</RouterLink>
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeSubscriptions.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma assinatura ativa</h3>
            <p className="text-muted-foreground mb-6">
              Explore nossos plugins premium e encontre o perfeito para seu projeto
            </p>
            <Button asChild data-testid="button-empty-browse-plugins">
              <RouterLink href="/store">Explorar Plugins</RouterLink>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
