import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Star } from "lucide-react";
import type { Plugin } from "@shared/schema";
import { Link } from "@/components/ui/link";

interface PluginCardProps {
  plugin: Plugin;
}

export function PluginCard({ plugin }: PluginCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate transition-all group" data-testid={`card-plugin-${plugin.id}`}>
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img
          src={plugin.imageUrl || "https://placehold.co/600x400/222222/9333ea?text=Plugin"}
          alt={plugin.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {plugin.isFeatured && (
          <Badge className="absolute top-3 right-3 bg-primary">
            <Star className="w-3 h-3 mr-1" />
            Destaque
          </Badge>
        )}
      </div>
      
      <div className="p-6">
        {plugin.category && (
          <Badge variant="secondary" className="mb-3" data-testid={`badge-category-${plugin.id}`}>
            {plugin.category}
          </Badge>
        )}
        
        <h3 className="text-xl font-semibold mb-2" data-testid={`text-plugin-name-${plugin.id}`}>
          {plugin.name}
        </h3>
        
        <p className="text-muted-foreground mb-4 line-clamp-2" data-testid={`text-plugin-description-${plugin.id}`}>
          {plugin.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="w-4 h-4" />
            <span>{plugin.downloadCount || 0} downloads</span>
          </div>
          <div className="text-sm text-muted-foreground">
            v{plugin.version}
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-2xl font-bold" data-testid={`text-plugin-price-${plugin.id}`}>
              R$ {Number(plugin.monthlyPrice || plugin.price).toFixed(2)}
            </span>
            <span className="text-muted-foreground text-sm">/mês</span>
          </div>
          <Link href={`/plugin/${plugin.slug}`}>
            <Button data-testid={`button-view-plugin-${plugin.id}`}>
              Ver Detalhes
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
