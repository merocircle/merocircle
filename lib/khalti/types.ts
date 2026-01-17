/**
 * Khalti Payment Types
 */

export interface KhaltiPaymentRequest {
  orderId: string;
  amount: number;
  creatorId: string;
  supporterId: string;
  supporterMessage?: string;
  tier_level?: number;
}

export interface KhaltiInitiatePayload {
  return_url: string;
  website_url: string;
  amount: number;
  purchase_order_id: string;
  purchase_order_name: string;
  customer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  amount_breakdown?: {
    label: string;
    amount: number;
  }[];
  product_details?: {
    identity: string;
    name: string;
    total_price: number;
    quantity: number;
    unit_price: number;
  }[];
}

export interface KhaltiInitiateResponse {
  success: boolean;
  pidx?: string;
  payment_url?: string;
  expires_at?: string;
  expires_in?: number;
  error?: string;
  message?: string;
}

export interface KhaltiVerificationPayload {
  pidx: string;
}

export interface KhaltiVerificationResponse {
  success: boolean;
  status?: string;
  pidx?: string;
  total_amount?: number;
  transaction_id?: string;
  fee?: number;
  refunded?: boolean;
  error?: string;
  message?: string;
}

export interface KhaltiLookupResponse {
  pidx: string;
  total_amount: number;
  status: 'Completed' | 'Pending' | 'Initiated' | 'Refunded' | 'Expired' | 'User canceled';
  transaction_id: string;
  fee: number;
  refunded: boolean;
  purchase_order_id: string;
  purchase_order_name: string;
  extra_merchant_params?: Record<string, unknown>;
}
