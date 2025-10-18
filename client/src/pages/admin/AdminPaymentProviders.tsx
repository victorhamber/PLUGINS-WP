import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { queryClient, apiRequest, ApiError } from "@/lib/queryClient";
import { CreditCard, Plus, Edit, Trash2, Star, Check } from "lucide-react";
import type { PaymentProvider } from "@shared/schema";

const PROVIDER_TYPES = [
  { value: "stripe", label: "Stripe" },
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "hotmart", label: "Hotmart" },
  { value: "monetizze", label: "Monetizze" },
  { value: "yampi", label: "Yampi" },
  { value: "custom", label: "Personalizado" },
];

const PROVIDER_CONFIG_TEMPLATES: Record<string, any> = {
  stripe: { publicKey: "", secretKey: "" },
  mercadopago: { publicKey: "", accessToken: "" },
  hotmart: { clientId: "", clientSecret: "", basic: "" },
  monetizze: { consumerKey: "", token: "" },
  yampi: { alias: "", token: "", secretKey: "" },
  custom: {},
};

export default function AdminPaymentProviders() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "stripe",
    displayName: "",
    description: "",
    isActive: false,
    isDefault: false,
    config: "{}",
    webhookUrl: "",
  });

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

  const { data: providers, isLoading } = useQuery<PaymentProvider[]>({
    queryKey: ["/api/admin/payment-providers"],
    enabled: Boolean(isAuthenticated && user?.isAdmin),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/payment-providers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-providers"] });
      toast({
        title: "Provedor criado",
        description: "O provedor de pagamento foi criado com sucesso.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        const status = error.status;
        const msg =
          status === 422
            ? "Dados inválidos. Verifique a configuração JSON e os campos obrigatórios."
            : status === 409
            ? "Conflito: já existe um provedor com este nome."
            : status === 401 || status === 403
            ? "Acesso negado."
            : error.message || "Falha ao criar o provedor.";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar o provedor de pagamento.",
          variant: "destructive",
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/admin/payment-providers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-providers"] });
      toast({
        title: "Provedor atualizado",
        description: "O provedor de pagamento foi atualizado com sucesso.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        const status = error.status;
        const msg =
          status === 422
            ? "Dados inválidos. Verifique a configuração JSON e os campos obrigatórios."
            : status === 409
            ? "Conflito ao atualizar: nome em uso."
            : status === 401 || status === 403
            ? "Acesso negado."
            : error.message || "Falha ao atualizar o provedor.";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o provedor de pagamento.",
          variant: "destructive",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/payment-providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-providers"] });
      toast({
        title: "Provedor removido",
        description: "O provedor de pagamento foi removido com sucesso.",
      });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        const status = error.status;
        const msg =
          status === 409
            ? "Conflito: não é possível remover este provedor."
            : status === 401 || status === 403
            ? "Acesso negado."
            : error.message || "Falha ao remover o provedor.";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível remover o provedor de pagamento.",
          variant: "destructive",
        });
      }
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/payment-providers/${id}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-providers"] });
      toast({
        title: "Provedor padrão definido",
        description: "O provedor foi definido como padrão com sucesso.",
      });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        const status = error.status;
        const msg =
          status === 409
            ? "Conflito: não é possível definir este provedor como padrão."
            : status === 401 || status === 403
            ? "Acesso negado."
            : error.message || "Falha ao definir provedor padrão.";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível definir o provedor como padrão.",
          variant: "destructive",
        });
      }
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "stripe",
      displayName: "",
      description: "",
      isActive: false,
      isDefault: false,
      config: "{}",
      webhookUrl: "",
    });
    setEditingProvider(null);
  };

  const handleEdit = (provider: PaymentProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      type: provider.type,
      displayName: provider.displayName,
      description: provider.description || "",
      isActive: provider.isActive || false,
      isDefault: provider.isDefault || false,
      config: JSON.stringify(provider.config, null, 2),
      webhookUrl: provider.webhookUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const parsedConfig = JSON.parse(formData.config);
      
      const data = {
        name: formData.name,
        type: formData.type,
        displayName: formData.displayName,
        description: formData.description,
        isActive: formData.isActive,
        isDefault: formData.isDefault,
        config: parsedConfig,
        webhookUrl: formData.webhookUrl,
      };

      if (editingProvider) {
        updateMutation.mutate({ id: editingProvider.id, data });
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      toast({
        title: "Erro de validação",
        description: "A configuração JSON está inválida.",
        variant: "destructive",
      });
    }
  };

  const handleTypeChange = (type: string) => {
    setFormData({
      ...formData,
      type,
      config: JSON.stringify(PROVIDER_CONFIG_TEMPLATES[type] || {}, null, 2),
    });
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Provedores de Pagamento</h1>
            <p className="text-muted-foreground">
              Configure diferentes métodos de pagamento para sua plataforma
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} data-testid="button-add-provider">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Provedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProvider ? "Editar Provedor" : "Novo Provedor de Pagamento"}
                </DialogTitle>
                <DialogDescription>
                  Configure um provedor de pagamento para processar transações
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Interno</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="stripe-main"
                      required
                      data-testid="input-provider-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo de Provedor</Label>
                    <Select value={formData.type} onValueChange={handleTypeChange}>
                      <SelectTrigger data-testid="select-provider-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="displayName">Nome de Exibição</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Stripe Principal"
                    required
                    data-testid="input-provider-display-name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional do provedor"
                    rows={2}
                    data-testid="input-provider-description"
                  />
                </div>

                <div>
                  <Label htmlFor="config">Configuração (JSON)</Label>
                  <Textarea
                    id="config"
                    value={formData.config}
                    onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                    placeholder='{"publicKey": "", "secretKey": ""}'
                    className="font-mono text-sm"
                    rows={6}
                    required
                    data-testid="input-provider-config"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Insira a configuração em formato JSON
                  </p>
                </div>

                <div>
                  <Label htmlFor="webhookUrl">URL do Webhook (opcional)</Label>
                  <Input
                    id="webhookUrl"
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    placeholder="https://seu-dominio.com/webhook/pagamento"
                    data-testid="input-provider-webhook"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      data-testid="switch-provider-active"
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isDefault"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                      data-testid="switch-provider-default"
                    />
                    <Label htmlFor="isDefault" className="cursor-pointer">Padrão</Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" data-testid="button-save-provider">
                    {editingProvider ? "Atualizar" : "Criar"} Provedor
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
          </div>
        ) : providers && providers.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
{(Array.isArray(providers) ? providers : []).map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{provider.displayName}</p>
                          <p className="text-sm text-muted-foreground">{provider.name}</p>
                          {provider.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {provider.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PROVIDER_TYPES.find((t) => t.value === provider.type)?.label || provider.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {provider.isActive ? (
                          <Badge variant="default">
                            <Check className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                        {provider.isDefault && (
                          <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                            <Star className="w-3 h-3 mr-1" />
                            Padrão
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {provider.webhookUrl ? (
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">
                          {provider.webhookUrl}
                        </p>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!provider.isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDefaultMutation.mutate(provider.id)}
                            data-testid={`button-set-default-${provider.id}`}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(provider)}
                          data-testid={`button-edit-${provider.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja remover este provedor?")) {
                              deleteMutation.mutate(provider.id);
                            }
                          }}
                          data-testid={`button-delete-${provider.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum provedor configurado</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Adicione um provedor de pagamento para começar a processar transações
              </p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-provider">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Provedor
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
