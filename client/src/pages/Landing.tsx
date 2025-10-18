import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Zap, Download, Clock, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary via-primary/90 to-purple-900" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-white/20 text-white border-white/30" data-testid="badge-hero">
            Premium WordPress Plugins
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6" data-testid="text-hero-title">
            Potencialize seu WordPress com Plugins Premium
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            Assinaturas flexíveis, licenças seguras e suporte profissional para desenvolvedores
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = "/auth"}
              className="bg-white text-primary hover:bg-white/90"
              data-testid="button-get-started"
            >
              Começar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => window.location.href = "/store"}
              className="border-white text-white hover:bg-white/10 backdrop-blur-sm"
              data-testid="button-view-plugins"
            >
              Ver Plugins
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-features-title">
              Por que escolher nossa plataforma?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar plugins WordPress de forma profissional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover-elevate transition-all" data-testid="card-feature-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Licenças Seguras</h3>
              <p className="text-muted-foreground">
                Sistema robusto de licenciamento com validação em tempo real e controle de domínios
              </p>
            </Card>

            <Card className="p-6 hover-elevate transition-all" data-testid="card-feature-2">
              <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-chart-2" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Atualizações Automáticas</h3>
              <p className="text-muted-foreground">
                Receba as últimas versões automaticamente com um clique
              </p>
            </Card>

            <Card className="p-6 hover-elevate transition-all" data-testid="card-feature-3">
              <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Download Ilimitado</h3>
              <p className="text-muted-foreground">
                Baixe seus plugins quantas vezes precisar enquanto sua assinatura estiver ativa
              </p>
            </Card>

            <Card className="p-6 hover-elevate transition-all" data-testid="card-feature-4">
              <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-chart-4" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Planos Flexíveis</h3>
              <p className="text-muted-foreground">
                Escolha entre planos mensais, anuais ou vitalícios que se adaptam às suas necessidades
              </p>
            </Card>

            <Card className="p-6 hover-elevate transition-all" data-testid="card-feature-5">
              <div className="w-12 h-12 bg-chart-5/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-chart-5" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Suporte Profissional</h3>
              <p className="text-muted-foreground">
                Equipe dedicada para ajudar você a aproveitar ao máximo seus plugins
              </p>
            </Card>

            <Card className="p-6 hover-elevate transition-all" data-testid="card-feature-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Garantia de Qualidade</h3>
              <p className="text-muted-foreground">
                Todos os plugins são testados e otimizados para máxima performance
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Planos para cada necessidade</h2>
            <p className="text-muted-foreground text-lg">
              Escolha o plano ideal para seu projeto
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 hover-elevate transition-all" data-testid="card-plan-basic">
              <h3 className="text-2xl font-bold mb-2">Básico</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ 29</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>1 plugin premium</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>Atualizações automáticas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>Suporte por email</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>1 domínio</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline" onClick={() => window.location.href = "/auth"} data-testid="button-plan-basic">
                Começar
              </Button>
            </Card>

            <Card className="p-8 border-primary shadow-lg hover-elevate transition-all relative" data-testid="card-plan-pro">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                Mais Popular
              </Badge>
              <h3 className="text-2xl font-bold mb-2">Profissional</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ 79</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>5 plugins premium</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>Atualizações automáticas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>Suporte prioritário</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>5 domínios</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => window.location.href = "/auth"} data-testid="button-plan-pro">
                Começar
              </Button>
            </Card>

            <Card className="p-8 hover-elevate transition-all" data-testid="card-plan-enterprise">
              <h3 className="text-2xl font-bold mb-2">Empresarial</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ 149</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>Plugins ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>Atualizações automáticas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>Suporte 24/7</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-chart-2" />
                  <span>Domínios ilimitados</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline" onClick={() => window.location.href = "/auth"} data-testid="button-plan-enterprise">
                Começar
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a milhares de desenvolvedores que já confiam em nossa plataforma
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/auth"}
            className="bg-white text-primary hover:bg-white/90"
            data-testid="button-cta-start"
          >
            Criar Conta Grátis
          </Button>
        </div>
      </section>
    </div>
  );
}
