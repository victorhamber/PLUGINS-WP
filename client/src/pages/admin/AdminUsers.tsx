import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Users, ShieldCheck, Shield } from "lucide-react";
import type { User } from "@shared/schema";

export default function AdminUsers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

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

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: Boolean(isAuthenticated && user?.isAdmin),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuário atualizado",
        description: "As permissões do usuário foram atualizadas com sucesso.",
      });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        const status = error.status;
        const msg =
          status === 403
            ? "Acesso negado."
            : status === 404
            ? "Usuário não encontrado."
            : error.message || "Falha ao atualizar permissões.";
        toast({ title: "Erro", description: msg, variant: "destructive" });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar as permissões do usuário.",
          variant: "destructive",
        });
      }
    },
  });

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie permissões e visualize todos os usuários da plataforma
          </p>
        </div>

        {isLoading ? (
          <Card className="p-6">
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          </Card>
        ) : users && (users as User[]).length > 0 ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Membro desde</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
{(Array.isArray(users) ? users : []).map((u) => (
                    <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {u.firstName?.[0] || u.email?.[0] || "?"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {u.firstName && u.lastName
                                ? `${u.firstName} ${u.lastName}`
                                : u.firstName || "Sem nome"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email || "Sem email"}
                      </TableCell>
                      <TableCell>
                        {u.isAdmin ? (
                          <Badge variant="default" className="gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Administrador
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Shield className="w-3 h-3" />
                            Usuário
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={u.isAdmin ? "outline" : "default"}
                          size="sm"
                          onClick={() =>
                            toggleAdminMutation.mutate({
                              userId: u.id,
                              isAdmin: !u.isAdmin,
                            })
                          }
                          disabled={toggleAdminMutation.isPending || u.id === user.id}
                          data-testid={`button-toggle-admin-${u.id}`}
                        >
                          {u.isAdmin ? "Remover Admin" : "Tornar Admin"}
                        </Button>
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
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Não há usuários cadastrados na plataforma ainda.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
