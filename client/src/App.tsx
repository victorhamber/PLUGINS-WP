import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Package } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Store from "@/pages/Store";
import PluginDetail from "@/pages/PluginDetail";
import Dashboard from "@/pages/Dashboard";
import Subscriptions from "@/pages/Subscriptions";
import Licenses from "@/pages/Licenses";
import Downloads from "@/pages/Downloads";
import AdminPlugins from "@/pages/admin/AdminPlugins";

import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminPaymentProviders from "@/pages/admin/AdminPaymentProviders";
import AdminReports from "@/pages/admin/AdminReports";
import AdminCoupons from "@/pages/admin/AdminCoupons";
// Removidos componentes de diagnóstico/depuração relacionados a erros de .map

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={isAuthenticated ? Dashboard : Landing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/store" component={Store} />
      <Route path="/plugin/:slug" component={PluginDetail} />
      {/* Route removed - TestMapError component not found */}
      {/* Rota de debug temporária desativada */}
      {/* <Route path="/debug-coupons" component={AdminCouponsSimple} /> */}
      
      {/* Protected routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/subscriptions" component={Subscriptions} />
      <ProtectedRoute path="/licenses" component={Licenses} />
      <ProtectedRoute path="/downloads" component={Downloads} />
      <ProtectedRoute path="/admin/reports" component={() => <ErrorBoundary><AdminReports /></ErrorBoundary>} />
      <ProtectedRoute path="/admin/plugins" component={() => <ErrorBoundary><AdminPlugins /></ErrorBoundary>} />
      
      <ProtectedRoute path="/admin/users" component={() => <ErrorBoundary><AdminUsers /></ErrorBoundary>} />
      <ProtectedRoute path="/admin/payment-providers" component={() => <ErrorBoundary><AdminPaymentProviders /></ErrorBoundary>} />
      <ProtectedRoute path="/admin/coupons" component={() => <ErrorBoundary><AdminCoupons /></ErrorBoundary>} />
      <ProtectedRoute path="/admin/settings" component={() => <ErrorBoundary><AdminSettings /></ErrorBoundary>} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <>
      {isAuthenticated ? (
            <SidebarProvider style={style}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1">
                  <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-auto">
                    <ErrorBoundary>
                      <Router />
                    </ErrorBoundary>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          ) : (
            <div className="flex flex-col min-h-screen">
              <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-6 h-6 text-primary" />
                    <span className="font-bold text-xl">WP Plugins</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <a href="/auth">
                      <button 
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
                        data-testid="button-login"
                      >
                        Entrar
                      </button>
                    </a>
                  </div>
                </div>
              </header>
              <main className="flex-1">
                <ErrorBoundary>
                  <Router />
                </ErrorBoundary>
              </main>
              <footer className="border-t py-6 md:py-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                  <p className="text-sm text-muted-foreground">
                    © 2025 WP Plugins Marketplace. Todos os direitos reservados.
                  </p>
                </div>
              </footer>
            </div>
          )}
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="wp-plugins-theme">
        <AuthProvider>
          <TooltipProvider>
            {/* Global ErrorBoundary to catch runtime errors across the app */}
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
