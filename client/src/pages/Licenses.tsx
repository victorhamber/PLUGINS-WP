import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Key, Copy, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { License, Plugin } from "@shared/schema";

export default function Licenses() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const { data: licenses, isLoading } = useQuery<License[]>({
    queryKey: ["/api/licenses"],
    enabled: isAuthenticated,
  });

  const { data: plugins } = useQuery<Plugin[]>({
    queryKey: ["/api/plugins"],
    enabled: isAuthenticated,
  });

  const copyToClipboard = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    setCopiedKey(licenseKey);
    toast({
      title: "Copiado!",
      description: "Chave de licença copiada para a área de transferência.",
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-chart-2" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'inactive':
      case 'revoked':
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      active: { variant: "default", className: "bg-chart-2" },
      expired: { variant: "destructive", className: "" },
      inactive: { variant: "secondary", className: "" },
      revoked: { variant: "destructive", className: "" },
    };
    return variants[status] || variants.active;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Minhas Licenças</h1>
          <p className="text-muted-foreground">
            Gerencie as chaves de licença de seus plugins
          </p>
        </div>

        {isLoading ? (
          <Card className="p-6">
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          </Card>
        ) : licenses && licenses.length > 0 ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plugin</TableHead>
                    <TableHead>Chave de Licença</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Domínios</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(licenses) && licenses.map((license) => {
                    const plugin = plugins?.find(p => p.id === license.pluginId);
                    const badgeConfig = getStatusBadge(license.status);
                    
                    return (
                      <TableRow key={license.id} data-testid={`row-license-${license.id}`}>
                        <TableCell className="font-medium" data-testid={`text-plugin-${license.id}`}>
                          {plugin?.name || 'Plugin'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-muted rounded text-sm font-mono" data-testid={`text-license-key-${license.id}`}>
                              {license.licenseKey}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(license.licenseKey)}
                              data-testid={`button-copy-${license.id}`}
                            >
                              {copiedKey === license.licenseKey ? (
                                <CheckCircle2 className="w-4 h-4 text-chart-2" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(license.status)}
                            <Badge {...badgeConfig} data-testid={`badge-status-${license.id}`}>
                              {license.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium">
                              {license.activatedDomains?.length || 0}/{license.maxDomains}
                            </span>
                            {Array.isArray(license.activatedDomains) && license.activatedDomains.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {license.activatedDomains.map((domain, idx) => (
                                  <div key={idx} className="text-xs text-muted-foreground">
                                    {domain}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {license.expiresAt ? (
                            <span className="text-sm" data-testid={`text-expires-${license.id}`}>
                              {new Date(license.expiresAt).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Vitalícia</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" data-testid={`button-manage-${license.id}`}>
                            Gerenciar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <Key className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma licença</h3>
            <p className="text-muted-foreground mb-6">
              Você ainda não possui licenças. Assine um plugin para começar!
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
