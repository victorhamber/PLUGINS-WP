// AdminPlugins.tsx — Gerenciamento de plugins (corrigido e completo)
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, ApiError } from "@/lib/queryClient";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
import { Package, Trash2, Edit, Loader2 } from "lucide-react";

import type { Plugin, InsertPlugin } from "@shared/schema";

/* ---------------------------------- Types --------------------------------- */

type PluginForm = {
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  version: string;
  price: string;         // string no form; convertida ao enviar
  monthlyPrice?: string; // idem
  yearlyPrice?: string;  // idem
  imageUrl?: string;
  downloadUrl?: string;
  category?: string;
  features?: string[];
  isActive: boolean;
  isFeatured: boolean;
};

/* ------------------------------- Util helpers ------------------------------ */

const initialForm: PluginForm = {
  name: "",
  slug: "",
  description: "",
  longDescription: "",
  version: "1.0.0",
  price: "0",
  monthlyPrice: "",
  yearlyPrice: "",
  imageUrl: "",
  downloadUrl: "",
  category: "",
  features: [],
  isActive: true,
  isFeatured: false,
};

const toNumberOrUndefined = (s?: string) => {
  if (s == null || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

/** Converte os valores do form para o payload do backend */
const normalizePayload = (f: PluginForm): InsertPlugin => {
  const priceNum = toNumberOrUndefined(f.price);
  const monthlyNum = toNumberOrUndefined(f.monthlyPrice);
  const yearlyNum = toNumberOrUndefined(f.yearlyPrice);

  return {
    name: f.name.trim(),
    slug: f.slug.trim(),
    description: f.description.trim(),
    longDescription: f.longDescription.trim(),
    version: f.version.trim(),
    // Se o schema esperar string, ajuste aqui. Mantido como number quando possível.
    price: (priceNum ?? 0) as unknown as InsertPlugin["price"],
    monthlyPrice: (monthlyNum ?? undefined) as unknown as InsertPlugin["monthlyPrice"],
    yearlyPrice: (yearlyNum ?? undefined) as unknown as InsertPlugin["yearlyPrice"],
    imageUrl: f.imageUrl?.trim() || undefined,
    downloadUrl: f.downloadUrl?.trim() || undefined,
    category: f.category?.trim() || undefined,
    features: f.features && f.features.length > 0 ? f.features : undefined,
    isActive: f.isActive,
    isFeatured: f.isFeatured,
  };
};

const formatCurrency = (value: number | string | null | undefined) => {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(n) ? (n as number) : 0
  );
};

/* -------------------------------- Component -------------------------------- */

export default function AdminPlugins() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Proteção de rota + redirect leve
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      const t = setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return () => clearTimeout(t);
    }
  }, [authLoading, isAuthenticated, user, toast]);

  /* ------------------------------- Data fetch ------------------------------ */

  const {
    data: plugins,
    isLoading,
    isFetching, // v5
  } = useQuery<Plugin[]>({
    queryKey: ["/api/admin/plugins"],
    enabled: Boolean(isAuthenticated && user?.isAdmin),
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/plugins");
      return Array.isArray(res) ? (res as Plugin[]) : [];
    },
    staleTime: 30_000,
  });

  /* --------------------------------- State --------------------------------- */

  const [form, setForm] = useState<PluginForm>(initialForm);
  const [featuresInput, setFeaturesInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  // Dropzone: estados de arraste para evitar popups do sistema
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  /* ------------------------------- Mutations -------------------------------- */

  const createMutation = useMutation({
    mutationFn: async (payload: InsertPlugin) => {
      return await apiRequest("POST", "/api/admin/plugins", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugins"] });
      resetForm();
      toast({ title: "Plugin criado", description: "Plugin cadastrado com sucesso." });
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : "Falha ao criar plugin.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPlugin> }) => {
      return await apiRequest("PUT", `/api/admin/plugins/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugins"] });
      resetForm();
      toast({ title: "Plugin atualizado", description: "Alterações salvas com sucesso." });
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : "Falha ao atualizar plugin.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/plugins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugins"] });
      setPendingDeleteId(null);
      toast({ title: "Plugin removido", description: "Plugin excluído com sucesso." });
    },
    onError: (error: unknown) => {
      const msg = error instanceof ApiError ? error.message : "Falha ao remover plugin.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  /* -------------------------------- Handlers -------------------------------- */

  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const handleFeaturesChange = (value: string) => {
    setFeaturesInput(value);
    const featuresArray = value
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, features: featuresArray }));
  };

  const openForCreate = () => {
    resetForm();
    setEditingId(null);
  };

  const openForEdit = (plugin: Plugin) => {
    setEditingId(plugin.id);
    setForm({
      name: plugin.name ?? "",
      slug: plugin.slug ?? "",
      description: plugin.description ?? "",
      longDescription: plugin.longDescription ?? "",
      version: plugin.version ?? "1.0.0",
      price: String(plugin.price ?? "0"),
      monthlyPrice:
        plugin.monthlyPrice !== null && plugin.monthlyPrice !== undefined
          ? String(plugin.monthlyPrice)
          : "",
      yearlyPrice:
        plugin.yearlyPrice !== null && plugin.yearlyPrice !== undefined
          ? String(plugin.yearlyPrice)
          : "",
      imageUrl: plugin.imageUrl ?? "",
      downloadUrl: plugin.downloadUrl ?? "",
      category: plugin.category ?? "",
      features: Array.isArray(plugin.features) ? plugin.features : [],
      isActive: Boolean(plugin.isActive),
      isFeatured: Boolean(plugin.isFeatured),
    });
    setFeaturesInput(Array.isArray(plugin.features) ? plugin.features.join("\n") : "");
  };

  const resetForm = () => {
    setForm(initialForm);
    setFeaturesInput("");
    setEditingId(null);
  };

  const handleSubmit = () => {
    const payload = normalizePayload(form);
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // removido: input file-based upload (substituído por dropzone inline)

  // removido: input image-based upload (substituído por dropzone inline)

// Upload direto sem input para evitar popup (imagem)
const uploadImageFileDirect = async (file: File) => {
  setIsImageUploading(true);
  try {
    const fd = new FormData();
    fd.append("image", file);
    const response = await fetch("/api/admin/plugins/upload-image", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!response.ok) throw new Error("Image upload failed");
    const result = await response.json();
    setForm((prev) => ({ ...prev, imageUrl: result.imageUrl }));
    toast({ title: "Sucesso", description: "Imagem enviada com sucesso!" });
  } catch (error) {
    console.error("Erro no upload de imagem:", error);
    toast({
      title: "Erro",
      description: "Falha no upload da imagem",
      variant: "destructive",
    });
  } finally {
    setIsImageUploading(false);
  }
};

// Upload direto sem input para evitar popup (arquivo do plugin)
const uploadPluginFileDirect = async (file: File) => {
  setIsFileUploading(true);
  try {
    const fd = new FormData();
    fd.append("file", file);
    const response = await fetch("/api/admin/plugins/upload", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!response.ok) throw new Error("Upload failed");
    const result = await response.json();
    setForm((prev) => ({ ...prev, downloadUrl: result.downloadUrl }));
    toast({ title: "Sucesso", description: "Arquivo enviado com sucesso!" });
  } catch (error) {
    console.error("Erro no upload de arquivo:", error);
    toast({
      title: "Erro",
      description: "Falha no upload do arquivo",
      variant: "destructive",
    });
  } finally {
    setIsFileUploading(false);
  }
};

// Handlers de drop para imagem e arquivo
const onImageFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setIsDraggingImage(false);
  const file = e.dataTransfer.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast({
      title: "Formato inválido",
      description: "Envie um arquivo de imagem",
      variant: "destructive",
    });
    return;
  }
  await uploadImageFileDirect(file);
};

const onPluginFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setIsDraggingFile(false);
  const file = e.dataTransfer.files?.[0];
  if (!file) return;
  const allowed = [".zip", ".rar", ".tar", ".gz"];
  const name = file.name.toLowerCase();
  if (!allowed.some((ext) => name.endsWith(ext))) {
    toast({
      title: "Formato inválido",
      description: "Envie .zip, .rar, .tar ou .gz",
      variant: "destructive",
    });
    return;
  }
  await uploadPluginFileDirect(file);
};

  /* --------------------------------- Render -------------------------------- */

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
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔧 Gerenciar Plugins</h1>
            <p className="text-muted-foreground">
              Crie, edite e remova plugins da sua plataforma
            </p>
          </div>
        </div>

        {/* Formulário inline (sem popup), seguindo padrão de Cupons */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nome</Label>
              <Input
                data-testid="input-plugin-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Nome do Plugin"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="slug-do-plugin"
              />
            </div>
            <div>
              <Label>Versão</Label>
              <Input
                value={form.version}
                onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
                placeholder="1.0.0"
              />
            </div>

                  <div>
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Preço Mensal (R$) — opcional</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.monthlyPrice}
                      onChange={(e) => setForm((p) => ({ ...p, monthlyPrice: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Preço Anual (R$) — opcional</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.yearlyPrice}
                      onChange={(e) => setForm((p) => ({ ...p, yearlyPrice: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={form.category || ""}
                      onValueChange={(value) => setForm((p) => ({ ...p, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="seo">SEO</SelectItem>
                        <SelectItem value="security">Segurança</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="utility">Utilitário</SelectItem>
                        <SelectItem value="other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Ativo</Label>
                    <Select
                      value={String(form.isActive)}
                      onValueChange={(value) =>
                        setForm((p) => ({ ...p, isActive: value === "true" }))
                      }
                    >
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
                    <Label>Destacado</Label>
                    <Select
                      value={String(form.isFeatured)}
                      onValueChange={(value) =>
                        setForm((p) => ({ ...p, isFeatured: value === "true" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione se é destacado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Label>Descrição Curta</Label>
                    <Textarea
                      data-testid="input-plugin-description"
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      placeholder="Descrição breve do plugin"
                      rows={2}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label>Descrição Longa</Label>
                    <Textarea
                      value={form.longDescription}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, longDescription: e.target.value }))
                      }
                      placeholder="Descrição detalhada do plugin"
                      rows={4}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label>Recursos (um por linha)</Label>
                    <Textarea
                      value={featuresInput}
                      onChange={(e) => handleFeaturesChange(e.target.value)}
                      placeholder={"Recurso 1\nRecurso 2\nRecurso 3"}
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label>URL da Imagem (opcional)</Label>
                    <Input
                      value={form.imageUrl}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, imageUrl: e.target.value }))
                      }
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label>Upload de Imagem</Label>
                    <div
                      className={`border-2 border-dashed rounded-md p-4 text-sm ${isDraggingImage ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
                      onDragLeave={() => setIsDraggingImage(false)}
                      onDrop={onImageFileDrop}
                      onPaste={(e) => {
                        const file = (e.clipboardData?.files && e.clipboardData.files[0]) || null;
                        if (file) uploadImageFileDirect(file);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <p className="text-muted-foreground">Arraste e solte a imagem aqui, ou cole com Ctrl+V.</p>
                      {isImageUploading && (
                        <div className="mt-2 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Enviando imagem...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <Label>URL de Download (opcional)</Label>
                    <Input
                      value={form.downloadUrl}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, downloadUrl: e.target.value }))
                      }
                      placeholder="https://exemplo.com/plugin.zip"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label>Upload de Arquivo</Label>
                    <div
                      className={`border-2 border-dashed rounded-md p-4 text-sm ${isDraggingFile ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={onPluginFileDrop}
                      onPaste={(e) => {
                        const file = (e.clipboardData?.files && e.clipboardData.files[0]) || null;
                        if (file) uploadPluginFileDirect(file);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <p className="text-muted-foreground">Arraste o arquivo do plugin (.zip, .rar, .tar, .gz) aqui ou cole com Ctrl+V.</p>
                      <p className="text-xs text-muted-foreground mt-1">Alternativa: informe a URL de download acima para evitar upload.</p>
                      {isFileUploading && (
                        <div className="mt-2 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Enviando arquivo...</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  !form.name ||
                  !form.slug
                }
              >
                {editingId ? "Salvar Alterações" : "Criar Plugin"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </Card>

        </div>

        {/* Lista */}
        {isLoading || isFetching ? (
          <Card className="p-6">
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          </Card>
        ) : plugins && plugins.length > 0 ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plugins.map((plugin) => (
                    <TableRow key={plugin.id}>
                      <TableCell className="font-medium">{plugin.name}</TableCell>
                      <TableCell className="font-mono text-sm">{plugin.slug}</TableCell>
                      <TableCell>{formatCurrency(plugin.price as any)}</TableCell>
                      <TableCell>
                        {plugin.isActive ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">
                        {plugin.category || "-"}
                      </TableCell>
                      <TableCell>{(plugin as any).downloadCount ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openForEdit(plugin)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          {pendingDeleteId === plugin.id ? (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteMutation.mutate(plugin.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Confirmar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPendingDeleteId(null)}
                                disabled={deleteMutation.isPending}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setPendingDeleteId(plugin.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          )}
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
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plugin cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Crie seu primeiro plugin usando o formulário acima.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
