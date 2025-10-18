import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Users, Package, DollarSign, Download, Target, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportsOverview {
  totalUsers: number;
  totalPlugins: number;
  activeSubscriptions: number;
  totalDownloads: number;
  totalRevenue: number;
  lastUpdated: string;
}

interface SalesData {
  period: string;
  data: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  totalSales: number;
  totalRevenue: number;
}

interface RevenueData {
  period: string;
  data: Array<{
    period: string;
    revenue: number;
    subscriptions: number;
  }>;
  totalRevenue: number;
}

interface TopPluginsData {
  data: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    subscriptions: number;
    revenue: number;
    downloads: number;
  }>;
  limit: number;
}

interface UsersData {
  period: string;
  newUsers: Array<{
    date: string;
    new_users: number;
  }>;
  totalUsers: number;
  activeUsers: number;
  totalNewUsers: number;
}

interface ConversionData {
  period: string;
  totalDownloads: number;
  totalSubscriptions: number;
  conversionRate: number;
  data: {
    downloads: number;
    subscriptions: number;
    rate: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminReports() {
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [topPluginsData, setTopPluginsData] = useState<TopPluginsData | null>(null);
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesPeriod, setSalesPeriod] = useState("30d");
  const [revenuePeriod, setRevenuePeriod] = useState("12m");
  const [usersPeriod, setUsersPeriod] = useState("30d");
  const [conversionPeriod, setConversionPeriod] = useState("30d");
  const { toast } = useToast();

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/admin/reports/overview');
      if (!response.ok) throw new Error('Failed to fetch overview');
      const data = await response.json();
      setOverview(data);
    } catch (error) {
      console.error('Error fetching overview:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar visão geral dos relatórios",
        variant: "destructive",
      });
    }
  };

  const fetchSalesData = async (period: string) => {
    try {
      const response = await fetch(`/api/admin/reports/sales?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch sales data');
      const data = await response.json();
      setSalesData(data);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de vendas",
        variant: "destructive",
      });
    }
  };

  const fetchRevenueData = async (period: string) => {
    try {
      const response = await fetch(`/api/admin/reports/revenue?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      const data = await response.json();
      setRevenueData(data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de receita",
        variant: "destructive",
      });
    }
  };

  const fetchTopPluginsData = async () => {
    try {
      const response = await fetch('/api/admin/reports/plugins?limit=10');
      if (!response.ok) throw new Error('Failed to fetch top plugins data');
      const data = await response.json();
      setTopPluginsData(data);
    } catch (error) {
      console.error('Error fetching top plugins data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados dos plugins mais vendidos",
        variant: "destructive",
      });
    }
  };

  const fetchUsersData = async (period: string) => {
    try {
      const response = await fetch(`/api/admin/reports/users?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch users data');
      const data = await response.json();
      setUsersData(data);
    } catch (error) {
      console.error('Error fetching users data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de usuários",
        variant: "destructive",
      });
    }
  };

  const fetchConversionData = async (period: string) => {
    try {
      const response = await fetch(`/api/admin/reports/conversion?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch conversion data');
      const data = await response.json();
      setConversionData(data);
    } catch (error) {
      console.error('Error fetching conversion data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de conversão",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchSalesData(salesPeriod),
        fetchRevenueData(revenuePeriod),
        fetchTopPluginsData(),
        fetchUsersData(usersPeriod),
        fetchConversionData(conversionPeriod)
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    fetchSalesData(salesPeriod);
  }, [salesPeriod]);

  useEffect(() => {
    fetchRevenueData(revenuePeriod);
  }, [revenuePeriod]);

  useEffect(() => {
    fetchUsersData(usersPeriod);
  }, [usersPeriod]);

  useEffect(() => {
    fetchConversionData(conversionPeriod);
  }, [conversionPeriod]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando relatórios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios e Analytics</h1>
          <p className="text-muted-foreground">
            Visão geral das métricas e performance da plataforma
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <Calendar className="w-4 h-4 mr-2" />
          Atualizar Dados
        </Button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Plugins</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalPlugins}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.activeSubscriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalDownloads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="plugins">Top Plugins</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="conversion">Conversão</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Relatório de Vendas</CardTitle>
                  <CardDescription>Vendas e receita por período</CardDescription>
                </div>
                <Select value={salesPeriod} onValueChange={setSalesPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 dias</SelectItem>
                    <SelectItem value="30d">30 dias</SelectItem>
                    <SelectItem value="90d">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {salesData && salesData.data && Array.isArray(salesData.data) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Vendas</p>
                      <p className="text-2xl font-bold">{salesData.totalSales}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Receita Total</p>
                      <p className="text-2xl font-bold">{formatCurrency(salesData.totalRevenue)}</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={formatDate}
                        formatter={(value, name) => [
                          name === 'revenue' ? formatCurrency(Number(value)) : value,
                          name === 'revenue' ? 'Receita' : 'Vendas'
                        ]}
                      />
                      <Bar dataKey="sales" fill="#8884d8" name="sales" />
                      <Bar dataKey="revenue" fill="#82ca9d" name="revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Relatório de Receita</CardTitle>
                  <CardDescription>Evolução da receita ao longo do tempo</CardDescription>
                </div>
                <Select value={revenuePeriod} onValueChange={setRevenuePeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6m">6 meses</SelectItem>
                    <SelectItem value="12m">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {revenueData && revenueData.data && Array.isArray(revenueData.data) && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Receita Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(revenueData.totalRevenue)}</p>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plugins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Plugins</CardTitle>
              <CardDescription>Plugins mais vendidos e com maior receita</CardDescription>
            </CardHeader>
            <CardContent>
              {topPluginsData && topPluginsData.data && Array.isArray(topPluginsData.data) && (
                <div className="space-y-4">
                  {topPluginsData.data.map((plugin, index) => (
                    <div key={plugin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <div>
                          <h3 className="font-semibold">{plugin.name}</h3>
                          <p className="text-sm text-muted-foreground">{plugin.slug}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{plugin.subscriptions} assinaturas</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(plugin.revenue)}</p>
                        <p className="text-xs text-muted-foreground">{plugin.downloads} downloads</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Relatório de Usuários</CardTitle>
                  <CardDescription>Crescimento e atividade dos usuários</CardDescription>
                </div>
                <Select value={usersPeriod} onValueChange={setUsersPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 dias</SelectItem>
                    <SelectItem value="30d">30 dias</SelectItem>
                    <SelectItem value="90d">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {usersData && usersData.newUsers && Array.isArray(usersData.newUsers) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Novos Usuários</p>
                      <p className="text-2xl font-bold">{usersData.totalNewUsers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Usuários</p>
                      <p className="text-2xl font-bold">{usersData.totalUsers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                      <p className="text-2xl font-bold">{usersData.activeUsers}</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usersData.newUsers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatDate} />
                      <Bar dataKey="new_users" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Taxa de Conversão</CardTitle>
                  <CardDescription>Conversão de downloads para assinaturas</CardDescription>
                </div>
                <Select value={conversionPeriod} onValueChange={setConversionPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 dias</SelectItem>
                    <SelectItem value="30d">30 dias</SelectItem>
                    <SelectItem value="90d">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {conversionData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Downloads</p>
                      <p className="text-2xl font-bold">{conversionData.totalDownloads}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Assinaturas</p>
                      <p className="text-2xl font-bold">{conversionData.totalSubscriptions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                      <p className="text-2xl font-bold flex items-center">
                        {conversionData.conversionRate}%
                        <Target className="w-4 h-4 ml-2 text-green-500" />
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="50%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Downloads', value: conversionData.totalDownloads - conversionData.totalSubscriptions },
                            { name: 'Conversões', value: conversionData.totalSubscriptions }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Array.from({ length: 2 }, (_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}