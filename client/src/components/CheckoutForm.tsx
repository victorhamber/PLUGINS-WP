import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { Loader2, Check } from "lucide-react";
import type { Plugin } from "@shared/schema";

interface CheckoutFormProps {
  plugin: Plugin;
  planType: "monthly" | "yearly";
  onPlanTypeChange: (planType: "monthly" | "yearly") => void;
}

// Removido: estrutura de validação de cupom

export function CheckoutForm({ plugin, planType, onPlanTypeChange }: CheckoutFormProps) {
  const { toast } = useToast();
  // Estados de cupom
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discountAmount?: number; finalAmount?: number; reason?: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const basePrice = planType === "yearly" 
    ? Number(plugin.yearlyPrice || plugin.price) 
    : Number(plugin.monthlyPrice || plugin.price);

  // Validação de cupom
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({ title: "Informe um cupom", variant: "destructive" });
      return;
    }
    try {
      setIsValidating(true);
      // Logs para Console Logs do IDE: requisição de validação de cupom
      console.log("[Checkout] Validando cupom", {
        code: couponCode.trim(),
        amount: basePrice,
        pluginId: plugin.id,
      });
      const amount = basePrice;
      const res = await apiRequest("POST", "/api/coupons/validate", {
        code: couponCode.trim(),
        amount,
        pluginId: plugin.id,
      });
      // Exibir JSON completo da resposta no Console Logs
      console.log("[Checkout] Resposta /api/coupons/validate", res);
      // Garantir formato esperado da resposta
      if (typeof res?.valid !== "boolean") {
        throw new Error(res?.message || "Resposta inválida da API para validação de cupom");
      }
      setCouponResult(res);
      if (!res.valid) {
        toast({ title: "Cupom inválido", description: res.reason || "Não foi possível validar o cupom", variant: "destructive" });
      } else {
        toast({ title: "Cupom aplicado", description: `Desconto: R$ ${Number(res.discountAmount || 0).toFixed(2)}` });
      }
    } catch (error: any) {
      // Logar erro detalhado para Console Logs
      console.error("[Checkout] Erro ao validar cupom", error);
      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
          toast({ title: "Sessão necessária", description: "Faça login para aplicar cupons.", variant: "destructive" });
        } else if (error.status === 400) {
          toast({ title: "Cupom inválido", description: error.message || "Verifique o código do cupom.", variant: "destructive" });
        } else {
          toast({ title: "Erro ao validar cupom", description: error.message || "Falha inesperada", variant: "destructive" });
        }
      } else {
        toast({ title: "Erro ao validar cupom", description: error?.message || "Falha inesperada", variant: "destructive" });
      }
    } finally {
      setIsValidating(false);
    }
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        pluginId: plugin.id,
        planType,
      };
      
      // Include coupon code if validated and valid
      if (couponResult?.valid && couponCode.trim()) {
        payload.couponCode = couponCode.trim();
      }
      
      const response = await apiRequest("POST", "/api/checkout/subscribe", payload);
      return response;
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "Erro no checkout",
          description: "URL de pagamento não encontrada",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      if (error instanceof ApiError) {
        if (error.status === 400 && (error.details?.message || error.message)?.includes("Cupons desativados")) {
          toast({
            title: "Cupons desativados",
            description: "Não foi possível aplicar cupom: recurso temporariamente desativado.",
            variant: "destructive",
          });
          return;
        }
      }
      toast({
        title: "Erro no checkout",
        description: error?.message || "Erro interno do servidor",
        variant: "destructive",
      });
    },
  });

  // Removido: ações de aplicar/remover cupom

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const finalAmount = couponResult?.valid ? Number(couponResult.finalAmount || basePrice) : basePrice;

  return (
    <Card className="p-6 sticky top-4">
      {/* Plan Selection */}
      <div className="mb-6">
        <Label className="text-base font-semibold mb-3 block">Escolha seu plano</Label>
        <div className="grid grid-cols-1 gap-3">
          <div 
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              planType === "monthly" 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onPlanTypeChange("monthly")}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Mensal</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(Number(plugin.monthlyPrice || plugin.price))}
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                planType === "monthly" 
                  ? "border-primary bg-primary" 
                  : "border-border"
              }`}>
                {planType === "monthly" && (
                  <div className="w-full h-full rounded-full bg-white scale-50" />
                )}
              </div>
            </div>
          </div>

          {plugin.yearlyPrice && (
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                planType === "yearly" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => onPlanTypeChange("yearly")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Anual</span>
                    <Badge variant="secondary" className="text-xs">
                      Economize 20%
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(Number(plugin.yearlyPrice))}
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  planType === "yearly" 
                    ? "border-primary bg-primary" 
                    : "border-border"
                }`}>
                  {planType === "yearly" && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cupom */}
      <div className="mb-6 space-y-2">
        <Label className="text-base font-semibold">Cupom de desconto</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Digite seu cupom"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <Button variant="secondary" onClick={validateCoupon} disabled={isValidating}>
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validando
              </>
            ) : (
              "Aplicar"
            )}
          </Button>
        </div>
        {couponResult && (
          <div className={`text-sm ${couponResult.valid ? "text-green-600" : "text-red-600"}`}>
            {couponResult.valid
              ? `Cupom válido! Desconto de ${formatCurrency(Number(couponResult.discountAmount || 0))}`
              : (couponResult.reason || "Cupom inválido")}
          </div>
        )}
      </div>

      {/* Price Summary */}
      <div className="mb-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>{formatCurrency(basePrice)}</span>
        </div>
        
        {/* Desconto */}
        {couponResult?.valid && (
          <div className="flex justify-between text-sm text-chart-2">
            <span>Desconto (cupom):</span>
            <span>-{formatCurrency(Number(couponResult.discountAmount || 0))}</span>
          </div>
        )}
        
        <Separator />
        
        <div className="flex justify-between font-semibold text-lg">
          <span>Total:</span>
          <span>{formatCurrency(finalAmount)}</span>
        </div>
        
        {planType === "yearly" && (
          <div className="text-sm text-muted-foreground text-center">
            Equivale a {formatCurrency(basePrice / 12)}/mês
          </div>
        )}
      </div>

      {/* Checkout Button */}
      <Button 
        className="w-full" 
        size="lg" 
        onClick={() => checkoutMutation.mutate()}
        disabled={checkoutMutation.isPending}
      >
        {checkoutMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          `Assinar por ${formatCurrency(finalAmount)}${planType === "monthly" ? "/mês" : "/ano"}`
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Cancele a qualquer momento
      </p>

      {/* Features */}
      <div className="mt-6 pt-6 border-t space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <Check className="w-5 h-5 text-chart-2" />
          <span>Atualizações automáticas</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Check className="w-5 h-5 text-chart-2" />
          <span>Suporte profissional</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Check className="w-5 h-5 text-chart-2" />
          <span>Licença para 1 domínio</span>
        </div>
      </div>
    </Card>
  );
}