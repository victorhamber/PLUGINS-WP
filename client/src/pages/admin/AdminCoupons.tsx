import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { queryClient, apiRequest, ApiError } from "@/lib/queryClient";
import { TicketPercent, Trash2, Edit } from "lucide-react";
import type { Coupon, InsertCoupon, Plugin } from "@shared/schema";

type CouponForm = {
  code: string;
  name: string;
  discountType: "percentage" | "fixed" | (string & {});
  discountValue: string;
  isActive: boolean;
  usageLimit?: number;
  userUsageLimit?: number;
  minimumAmount?: string;
  maximumDiscount?: string;
  startsAt?: string;
  expiresAt?: string;
  applicablePlugins?: string[];
};

export default function AdminCoupons() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      setTimeout(() => { window.location.href = "/"; }, 500);
    }
  }, [isAuthenticated, authLoading, user, toast]);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"],
    enabled: Boolean(isAuthenticated && user?.isAdmin),
  });

  const { data: plugins } = useQuery<Plugin[]>({
    queryKey: ["/api/admin/plugins"],
    enabled: Boolean(isAuthenticated && user?.isAdmin),
  });

  const [form, setForm] = useState<CouponForm>({
    code: "",
    name: "",
    discountType: "percentage",
    discountValue: "10",
    isActive: true,
    applicablePlugins: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const normalizePayload = (f: CouponForm): InsertCoupon => ({
    code: f.code.trim(),
    name: f.name.trim(),
    discountType: f.discountType,
    discountValue: f.discountValue,
    isActive: f.isActive,
    usageLimit: f.usageLimit,
    userUsageLimit: f.userUsageLimit,
    minimumAmount: f.minimumAmount,
    maximumDiscount: f.maximumDiscount,
    startsAt: f.startsAt,
    expiresAt: f.expiresAt,
    applicablePlugins: (f.applicablePlugins && f.applicablePlugins.length > 0) ? f.applicablePlugins : [],
  } as InsertCoupon);

  const createMutation = useMutation({
    mutationFn: async (payload: InsertCoupon) => {
      return await apiRequest("POST", "/api/admin/coupons", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setForm({ code: "", name: "", discountType: "percentage", discountValue: "10", isActive: true });
      toast({ title: "Cupom criado", description: "Cupom cadastrado com sucesso." });
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : "Falha ao criar cupom.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCoupon> }) => {
      return await apiRequest("PUT", `/api/admin/coupons/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setEditingId(null);
      toast({ title: "Cupom atualizado", description: "Alterações salvas com sucesso." });
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : "Falha ao atualizar cupom.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Cupom removido", description: "Cupom excluído com sucesso." });
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : "Falha ao remover cupom.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  if (authLoading || !isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciar Cupons</h1>
            <p className="text-muted-foreground">Crie, edite e remova cupons de desconto</p>
          </div>
          <TicketPercent className="w-8 h-8 text-muted-foreground" />
        </div>

        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Código</Label>
              <Input value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PROMO10" />
            </div>
            <div>
              <Label>Nome</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Promo 10%" />
            </div>
            <div>
              <Label>Tipo de Desconto</Label>
              <Select value={form.discountType || "percentage"} onValueChange={(value) => setForm({ ...form, discountType: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual</SelectItem>
                  <SelectItem value="fixed">Valor Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor do Desconto</Label>
              <Input type="number" value={form.discountValue || ""} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            </div>
            <div>
              <Label>Ativo</Label>
              <Select value={String(form.isActive ?? true)} onValueChange={(value) => setForm({ ...form, isActive: value === 'true' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Uso Máximo (opcional)</Label>
              <Input type="number" value={Number(form.usageLimit || 0)} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) || undefined })} />
            </div>
            <div>
              <Label>Limite por usuário (opcional)</Label>
              <Input type="number" value={Number(form.userUsageLimit || 0)} onChange={(e) => setForm({ ...form, userUsageLimit: Number(e.target.value) || undefined })} />
            </div>
            <div>
              <Label>Valor mínimo (opcional)</Label>
              <Input type="number" step="0.01" value={String(form.minimumAmount || "")} onChange={(e) => setForm({ ...form, minimumAmount: e.target.value })} />
            </div>
            <div>
              <Label>Desconto máximo (opcional)</Label>
              <Input type="number" step="0.01" value={String(form.maximumDiscount || "")} onChange={(e) => setForm({ ...form, maximumDiscount: e.target.value })} />
            </div>
            <div>
              <Label>Início (opcional)</Label>
              <Input 
                type="date" 
                value={form.startsAt || ""} 
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })} 
                className="dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <Label>Expira (opcional)</Label>
              <Input 
                type="date" 
                value={form.expiresAt || ""} 
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} 
                className="dark:[color-scheme:dark]"
              />
            </div>
            <div className="md:col-span-3">
              <Label>Aplicável aos plugins (deixe vazio para todos)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 p-2 border rounded-md">
                {(plugins || []).map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(form.applicablePlugins?.includes(p.id))}
                      onChange={(e) => {
                        const current = new Set(form.applicablePlugins || []);
                        if (e.target.checked) current.add(p.id); else current.delete(p.id);
                        setForm({ ...form, applicablePlugins: Array.from(current) });
                      }}
                    />
                    {p.name}
                  </label>
                ))}
                {(!plugins || plugins.length === 0) && (
                  <div className="text-muted-foreground text-sm">Nenhum plugin carregado.</div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {editingId ? (
              <>
                <Button onClick={() => updateMutation.mutate({ id: editingId, data: normalizePayload(form) })} disabled={updateMutation.isPending}>Salvar Alterações</Button>
                <Button variant="outline" onClick={() => { setEditingId(null); setForm({ code: "", name: "", discountType: "percentage", discountValue: "10", isActive: true, usageLimit: undefined, userUsageLimit: undefined, minimumAmount: undefined, maximumDiscount: undefined, startsAt: undefined, expiresAt: undefined, applicablePlugins: [] }); }}>Cancelar</Button>
              </>
            ) : (
              <Button onClick={() => createMutation.mutate(normalizePayload(form))} disabled={createMutation.isPending || !form.code || !form.name}>Criar Cupom</Button>
            )}
          </div>
        </Card>

        {isLoading ? (
          <Card className="p-6">
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          </Card>
        ) : coupons && Array.isArray(coupons) && coupons.length > 0 ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono">{c.code}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="capitalize">{c.discountType}</TableCell>
                      <TableCell>{c.discountType === "percentage" ? `${Number(c.discountValue)}%` : formatCurrency(Number(c.discountValue))}</TableCell>
                      <TableCell>{c.usageCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</TableCell>
                      <TableCell>
                        {c.isActive ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingId(c.id); setForm({ code: c.code, name: c.name, discountType: c.discountType as any, discountValue: String(c.discountValue), isActive: Boolean(c.isActive), usageLimit: c.usageLimit as any, userUsageLimit: c.userUsageLimit as any, minimumAmount: (c.minimumAmount as any)?.toString?.() || undefined, maximumDiscount: (c.maximumDiscount as any)?.toString?.() || undefined, startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0,10) : undefined, expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0,10) : undefined, applicablePlugins: Array.isArray(c.applicablePlugins) ? c.applicablePlugins as any : [] }); }}>
                            <Edit className="w-4 h-4 mr-1" /> Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(c.id)}>
                            <Trash2 className="w-4 h-4 mr-1" /> Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <TicketPercent className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cupom cadastrado</h3>
              <p className="text-sm text-muted-foreground">Crie seu primeiro cupom usando o formulário acima.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
