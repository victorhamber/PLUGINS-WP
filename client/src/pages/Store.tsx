import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { PluginCard } from "@/components/PluginCard";
import type { Plugin } from "@shared/schema";
import { useState } from "react";

export default function Store() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: plugins, isLoading } = useQuery<Plugin[]>({
    queryKey: ["/api/plugins"],
  });

const categories = Array.from(
  new Set(
    (Array.isArray(plugins) ? plugins : []).map(p => p.category).filter(Boolean)
  )
) as string[];

  const filteredPlugins = plugins?.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(search.toLowerCase()) ||
                         plugin.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || plugin.category === selectedCategory;
    return matchesSearch && matchesCategory && plugin.isActive;
  });

  const featuredPlugins = filteredPlugins?.filter(p => p.isFeatured);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Search */}
      <section className="bg-gradient-to-r from-primary to-purple-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-6 text-center">
            Explore Nossos Plugins
          </h1>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar plugins..."
              className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-plugins"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer hover-elevate whitespace-nowrap"
              onClick={() => setSelectedCategory(null)}
              data-testid="badge-category-all"
            >
              Todos
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer hover-elevate whitespace-nowrap"
                onClick={() => setSelectedCategory(category)}
                data-testid={`badge-category-${category}`}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}

        {/* Featured Plugins */}
        {featuredPlugins && featuredPlugins.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Plugins em Destaque</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPlugins.map((plugin) => (
                <PluginCard key={plugin.id} plugin={plugin} />
              ))}
            </div>
          </div>
        )}

        {/* All Plugins */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Todos os Plugins
            {filteredPlugins && <span className="text-muted-foreground text-lg ml-2">({filteredPlugins.length})</span>}
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredPlugins && filteredPlugins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-plugins">
              {filteredPlugins.map((plugin) => (
                <PluginCard key={plugin.id} plugin={plugin} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Nenhum plugin encontrado. Tente ajustar sua busca.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
