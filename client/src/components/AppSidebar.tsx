import { useLocation, Link as RouterLink } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Package,
  CreditCard,
  Key,
  Download,
  Settings,
  LogOut,
  ChevronUp,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const mainItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Loja", url: "/store", icon: Package },
    { title: "Assinaturas", url: "/subscriptions", icon: CreditCard },
    { title: "Licenças", url: "/licenses", icon: Key },
    { title: "Downloads", url: "/downloads", icon: Download },
  ];

  const adminItems = [
    { title: "Relatórios", url: "/admin/reports", icon: BarChart3 },
    { title: "Gerenciar Plugins", url: "/admin/plugins", icon: Package },
    { title: "Gerenciar Usuários", url: "/admin/users", icon: ShieldCheck },
    { title: "Gerenciar Cupons", url: "/admin/coupons", icon: CreditCard },
    { title: "Provedores de Pagamento", url: "/admin/payment-providers", icon: CreditCard },
    { title: "Configurações", url: "/admin/settings", icon: Settings },
  ];

  const getInitials = (email?: string | null, firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <RouterLink href="/dashboard">
          <div className="flex items-center gap-2 cursor-pointer hover-elevate p-2 rounded-md transition-all">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">WP Plugins</span>
          </div>
        </RouterLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`sidebar-${item.url}`}
                  >
                    <RouterLink href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </RouterLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Administração
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`sidebar-${item.url}`}
                    >
                      <RouterLink href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </RouterLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="hover-elevate" data-testid="button-user-menu">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(user?.email, user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {user?.firstName || user?.email?.split("@")[0] || "Usuário"}
                  </span>
                  <ChevronUp className="ml-auto w-4 h-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuItem disabled>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.firstName || user?.email?.split("@")[0]}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  data-testid="button-logout"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {logoutMutation.isPending ? "Saindo..." : "Sair"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
