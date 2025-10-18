import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link as RouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Check, ArrowLeft } from "lucide-react";
import type { Plugin } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { CheckoutForm } from "@/components/CheckoutForm";

export default function PluginDetail() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");

  const { data: plugin, isLoading } = useQuery<Plugin>({
    queryKey: [`/api/plugins/${slug}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Plugin não encontrado</h1>
          <Button asChild>
            <RouterLink href="/store">Voltar para a Loja</RouterLink>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button asChild variant="ghost" className="mb-6" data-testid="button-back-to-store">
          <RouterLink href="/store">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a Loja
          </RouterLink>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hero Image */}
            <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-muted">
              <img
                src={plugin.imageUrl || "https://placehold.co/1200x675/222222/9333ea?text=Plugin"}
                alt={plugin.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title and Meta */}
            <div className="mb-6">
              {plugin.category && (
                <Badge className="mb-3" data-testid="badge-category">
                  {plugin.category}
                </Badge>
              )}
              <h1 className="text-4xl font-bold mb-4" data-testid="text-plugin-name">
                {plugin.name}
              </h1>
              <p className="text-xl text-muted-foreground" data-testid="text-plugin-description">
                {plugin.description}
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description" className="mb-8">
              <TabsList data-testid="tabs-plugin-details">
                <TabsTrigger value="description">Descrição</TabsTrigger>
                <TabsTrigger value="features">Recursos</TabsTrigger>
                <TabsTrigger value="changelog">Changelog</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <Card className="p-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p>{plugin.longDescription || plugin.description}</p>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="mt-6">
                <Card className="p-6">
                  <ul className="space-y-3">
                    {Array.isArray(plugin.features) && plugin.features.length > 0 ? (
                      plugin.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-chart-2 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">Nenhum recurso listado</li>
                    )}
                  </ul>
                </Card>
              </TabsContent>

              <TabsContent value="changelog" className="mt-6">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Versão {plugin.version}</h3>
                      <p className="text-muted-foreground">Última versão disponível</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Checkout */}
          <div className="lg:col-span-1">
            {isAuthenticated ? (
              <CheckoutForm
                plugin={plugin}
                planType={planType}
                onPlanTypeChange={setPlanType}
              />
            ) : (
              <Card className="p-6 sticky top-4" data-testid="card-purchase">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold" data-testid="text-plugin-price">
                      R$ {Number(plugin.monthlyPrice || plugin.price).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  {plugin.yearlyPrice && (
                    <p className="text-sm text-muted-foreground">
                      ou R$ {Number(plugin.yearlyPrice).toFixed(2)}/ano (economize 20%)
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => (window.location.href = "/auth")}
                    data-testid="button-login-to-subscribe"
                  >
                    Fazer Login para Assinar
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-5 h-5 text-chart-2" />
                    <span>Atualizações automáticas</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-5 h-5 text-chart-2" />
                    <span>Suporte profissional</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-5 h-5 text-chart-2" />
                    <span>Licença para 1 domínio</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Download className="w-5 h-5 text-chart-2" />
                    <span>{plugin.downloadCount || 0} downloads</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Versão:</strong> {plugin.version}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Última atualização:</strong>{" "}
                    {new Date(plugin.updatedAt!).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
