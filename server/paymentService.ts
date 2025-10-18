import type { PaymentProvider } from "@shared/schema";
import Stripe from 'stripe';

// Payment provider configuration interfaces
export interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret?: string;
}

export interface MercadoPagoConfig {
  publicKey: string;
  accessToken: string;
}

export interface HotmartConfig {
  clientId: string;
  clientSecret: string;
  basic: string;
}

export interface MonetizzeConfig {
  consumerKey: string;
  token: string;
}

export interface YampiConfig {
  alias: string;
  token: string;
  secretKey: string;
}

// Generic payment request/response interfaces
export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  description: string;
  userId: string;
  userEmail: string;
  pluginId: string;
  planType: 'monthly' | 'yearly' | 'lifetime';
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  clientSecret?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface WebhookPayload {
  provider: string;
  event: string;
  paymentId: string;
  status: 'success' | 'pending' | 'failed';
  userId?: string;
  pluginId?: string;
  metadata?: Record<string, any>;
}

// Abstract payment service interface
export interface IPaymentService {
  createPayment(request: CreatePaymentRequest): Promise<PaymentResponse>;
  verifyWebhook(payload: any, signature?: string): Promise<WebhookPayload>;
  cancelSubscription?(subscriptionId: string): Promise<boolean>;
  getPaymentStatus?(paymentId: string): Promise<string>;
}

// Stripe implementation
export class StripePaymentService implements IPaymentService {
  private config: StripeConfig;
  private stripe: Stripe;

  constructor(config: StripeConfig) {
    this.config = config;
    this.stripe = new Stripe(config.secretKey);
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100),
        currency: request.currency.toLowerCase(),
        description: request.description,
        receipt_email: request.userEmail,
        metadata: {
          userId: request.userId,
          pluginId: request.pluginId,
          planType: request.planType,
          ...request.metadata,
        },
      });

      return {
        success: true,
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyWebhook(payload: any, signature?: string): Promise<WebhookPayload> {
    try {
      if (!signature) {
        throw new Error('Stripe signature is required');
      }

      // Note: Configure webhook secret in your payment provider config as 'webhookSecret'
      const webhookSecret = (this.config as any).webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '';
      
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        return {
          provider: 'stripe',
          event: event.type,
          paymentId: paymentIntent.id,
          status: 'success',
          userId: paymentIntent.metadata.userId,
          pluginId: paymentIntent.metadata.pluginId,
          metadata: {
            ...paymentIntent.metadata,
            amount: paymentIntent.amount,
            amount_received: paymentIntent.amount_received,
            currency: paymentIntent.currency,
          },
        };
      }

      return {
        provider: 'stripe',
        event: event.type,
        paymentId: (event.data.object as any).id || '',
        status: 'pending',
      };
    } catch (error: any) {
      throw new Error(`Stripe webhook verification failed: ${error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
      return paymentIntent.status;
    } catch (error) {
      return 'unknown';
    }
  }
}

// Mercado Pago implementation
// NOTE: This is a template implementation. Configure based on Mercado Pago docs:
// https://www.mercadopago.com.br/developers/pt/docs/checkout-api/landing
export class MercadoPagoPaymentService implements IPaymentService {
  private config: MercadoPagoConfig;
  private baseUrl = 'https://api.mercadopago.com';

  constructor(config: MercadoPagoConfig) {
    this.config = config;
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      // This is a basic Pix payment example
      // For credit card, adjust payment_method_id and add card token
      // For preference-based checkout, use /checkout/preferences endpoint
      const response = await fetch(`${this.baseUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${request.userId}-${Date.now()}`,
        },
        body: JSON.stringify({
          transaction_amount: request.amount,
          description: request.description,
          payment_method_id: 'pix',
          payer: {
            email: request.userEmail,
            // Add required fields: first_name, last_name, identification
          },
          metadata: {
            user_id: request.userId,
            plugin_id: request.pluginId,
            plan_type: request.planType,
            ...request.metadata,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Mercado Pago payment creation failed'
        };
      }

      return {
        success: true,
        paymentId: data.id.toString(),
        checkoutUrl: data.point_of_interaction?.transaction_data?.ticket_url,
        metadata: {
          qrCode: data.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyWebhook(payload: any): Promise<WebhookPayload> {
    const action = payload.action || payload.type;
    const paymentId = payload.data?.id || payload.id || '';
    
    let status: 'success' | 'pending' | 'failed' = 'pending';
    if (action === 'payment.updated' || action === 'payment.created') {
      if (payload.data?.status === 'approved') {
        status = 'success';
      } else if (payload.data?.status === 'rejected' || payload.data?.status === 'cancelled') {
        status = 'failed';
      }
    }

    return {
      provider: 'mercadopago',
      event: action,
      paymentId: paymentId.toString(),
      status,
      metadata: payload.data
    };
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      const data = await response.json();
      return data.status || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
}

// Hotmart implementation
// NOTE: Template implementation - Hotmart typically uses product codes and postback URLs
// Configure based on: https://developers.hotmart.com/docs/pt-BR/
export class HotmartPaymentService implements IPaymentService {
  private config: HotmartConfig;
  private baseUrl = 'https://api-checkout.hotmart.com';

  constructor(config: HotmartConfig) {
    this.config = config;
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      // TEMPLATE IMPLEMENTATION - Configure according to Hotmart docs
      // This is a placeholder that returns a checkout URL template
      return {
        success: false,
        error: 'Hotmart integration needs configuration. Configure your product code in admin panel and implement the real API calls. Docs: https://developers.hotmart.com',
        checkoutUrl: `https://pay.hotmart.com/${request.pluginId}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyWebhook(payload: any): Promise<WebhookPayload> {
    const event = payload.event || 'unknown';
    const transaction = payload.data?.purchase?.transaction || '';
    const status = payload.data?.purchase?.status;
    
    let paymentStatus: 'success' | 'pending' | 'failed' = 'pending';
    if (status === 'approved' || status === 'complete') {
      paymentStatus = 'success';
    } else if (status === 'cancelled' || status === 'refunded') {
      paymentStatus = 'failed';
    }

    return {
      provider: 'hotmart',
      event,
      paymentId: transaction,
      status: paymentStatus,
      metadata: payload.data
    };
  }
}

// Monetizze implementation
// NOTE: Template implementation - Monetizze uses product IDs and checkout redirects
// Configure based on: https://docs.monetizze.com.br/
export class MonetizzePaymentService implements IPaymentService {
  private config: MonetizzeConfig;

  constructor(config: MonetizzeConfig) {
    this.config = config;
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      // TEMPLATE IMPLEMENTATION - Configure according to Monetizze docs
      const checkoutUrl = `https://checkout.monetizze.com.br/checkout/${request.pluginId}`;
      
      return {
        success: false,
        error: 'Monetizze integration needs configuration. Configure your product code in admin panel and implement the real API calls. Docs: https://docs.monetizze.com.br',
        checkoutUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyWebhook(payload: any): Promise<WebhookPayload> {
    const tipoEvento = payload.tipoEvento || payload.tipo_evento || 'unknown';
    const vendaId = payload.venda?.id || payload.id || '';
    const status = payload.venda?.status || payload.status;
    
    let paymentStatus: 'success' | 'pending' | 'failed' = 'pending';
    if (status === '2' || status === 2 || status === 'Completo') {
      paymentStatus = 'success';
    } else if (status === '3' || status === 3 || status === 'Cancelado') {
      paymentStatus = 'failed';
    }

    return {
      provider: 'monetizze',
      event: tipoEvento,
      paymentId: vendaId.toString(),
      status: paymentStatus,
      metadata: payload
    };
  }
}

// Yampi implementation  
// NOTE: Template implementation - Yampi uses SKUs and cart/checkout flow
// Configure based on: https://api.yampi.com.br/docs
export class YampiPaymentService implements IPaymentService {
  private config: YampiConfig;
  private baseUrl = `https://api.yampi.com.br/v2`;

  constructor(config: YampiConfig) {
    this.config = config;
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      // TEMPLATE IMPLEMENTATION - Configure according to Yampi docs
      const checkoutUrl = `https://${this.config.alias}.yampi.io/checkout?sku=${request.pluginId}`;
      
      return {
        success: false,
        error: 'Yampi integration needs configuration. Configure your alias and SKU codes in admin panel and implement the real API calls. Docs: https://api.yampi.com.br/docs',
        checkoutUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyWebhook(payload: any): Promise<WebhookPayload> {
    const event = payload.event || payload.type || 'unknown';
    const orderId = payload.data?.id || payload.id || '';
    const status = payload.data?.status;
    
    let paymentStatus: 'success' | 'pending' | 'failed' = 'pending';
    if (status === 'paid' || status === 'approved') {
      paymentStatus = 'success';
    } else if (status === 'cancelled' || status === 'refunded') {
      paymentStatus = 'failed';
    }

    return {
      provider: 'yampi',
      event,
      paymentId: orderId.toString(),
      status: paymentStatus,
      metadata: payload.data
    };
  }
}

// Factory to create payment service based on provider
export class PaymentServiceFactory {
  static createService(provider: PaymentProvider): IPaymentService {
    const config = provider.config as any;

    switch (provider.type.toLowerCase()) {
      case 'stripe':
        return new StripePaymentService(config as StripeConfig);
      
      case 'mercadopago':
        return new MercadoPagoPaymentService(config as MercadoPagoConfig);
      
      case 'hotmart':
        return new HotmartPaymentService(config as HotmartConfig);
      
      case 'monetizze':
        return new MonetizzePaymentService(config as MonetizzeConfig);
      
      case 'yampi':
        return new YampiPaymentService(config as YampiConfig);
      
      default:
        throw new Error(`Unsupported payment provider: ${provider.type}`);
    }
  }
}
