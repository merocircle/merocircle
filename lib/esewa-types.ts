export interface PaymentRequestData {
  amount: string | number;
  creatorId: string;
  supporterId: string;
  supporterMessage?: string;
}

export interface EsewaConfig {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

