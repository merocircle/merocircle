import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      creatorId, 
      supporterId,
      supporterMessage, 
      productCode = 'EPAYTEST',
      secretKey = '8gBm/:&EnhH.1/q',
      successUrl,
      failureUrl 
    } = body;

    if (!supporterId) {
      return NextResponse.json(
        { error: 'Supporter ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Verify creator exists and get payment details
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', creatorId)
      .eq('role', 'creator')
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Generate unique transaction UUID
    const transactionUuid = crypto.randomUUID();
    
    // Create signature for eSewa API
    const totalAmount = amount;
    const taxAmount = '0';
    const productServiceCharge = '0';
    const productDeliveryCharge = '0';
    
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('base64');

    // Store transaction in database
    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .insert({
        transaction_uuid: transactionUuid,
        supporter_id: supporterId,
        creator_id: creatorId,
        amount: totalAmount,
        gateway: 'esewa',
        status: 'pending',
        message: supporterMessage,
        product_code: productCode,
        signature: signature,
        esewa_data: {
          product_code: productCode,
          signature,
          success_url: successUrl,
          failure_url: failureUrl
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    // Prepare eSewa payment form data
    const esewaFormData = {
      amount: totalAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: productServiceCharge,
      product_delivery_charge: productDeliveryCharge,
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      failure_url: failureUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature: signature,
    };

    // eSewa payment URL (test environment)
    const esewaUrl = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      esewa_url: esewaUrl,
      form_data: esewaFormData,
      message: 'Payment form data generated successfully'
    });

  } catch (error) {
    console.error('eSewa payment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const transactionUuid = searchParams.get('transaction_uuid');
  const productCode = searchParams.get('product_code');
  const totalAmount = searchParams.get('total_amount');

  if (!transactionUuid || !productCode || !totalAmount) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    
    // Verify transaction with eSewa
    const esewaStatusUrl = `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${productCode}&total_amount=${totalAmount}&transaction_uuid=${transactionUuid}`;
    
    const esewaResponse = await fetch(esewaStatusUrl);
    const esewaStatus = await esewaResponse.json();

    if (esewaStatus.status === 'COMPLETE') {
      // Update transaction status in database
      const { data: updatedTransaction, error: updateError } = await supabase
        .from('supporter_transactions')
        .update({ 
          status: 'completed',
          esewa_data: {
            ...esewaStatus,
            verified_at: new Date().toISOString()
          }
        })
        .eq('transaction_uuid', transactionUuid)
        .select()
        .single();

      if (updateError) {
        console.error('Transaction update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update transaction' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        status: 'completed',
        transaction: updatedTransaction,
        esewa_response: esewaStatus
      });
    } else {
      return NextResponse.json({
        success: false,
        status: esewaStatus.status || 'pending',
        esewa_response: esewaStatus
      });
    }

  } catch (error) {
    console.error('eSewa verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 