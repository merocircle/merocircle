import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EsewaStatusResponse } from '@/lib/esewa-types';

const ESEWA_STATUS_URL = 'https://rc.esewa.com.np/api/epay/transaction/status/';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transaction_uuid = searchParams.get('transaction_uuid');
    const total_amount = searchParams.get('total_amount');
    const product_code = searchParams.get('product_code') || 'EPAYTEST';

    console.log('[VERIFY] Request:', { transaction_uuid, total_amount, product_code });

    if (!transaction_uuid || !total_amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify with eSewa status API
    const statusUrl = `${ESEWA_STATUS_URL}?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;
    
    console.log('[VERIFY] Checking eSewa status:', statusUrl);
    
    const esewaResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!esewaResponse.ok) {
      throw new Error(`eSewa API error: ${esewaResponse.status}`);
    }

    const esewaData: EsewaStatusResponse = await esewaResponse.json();
    
    console.log('[VERIFY] eSewa response:', esewaData);

    // Update transaction in database if payment is complete
    if (esewaData.status === 'COMPLETE') {
      const supabase = await createClient();
      
      const { data: transaction, error: updateError } = await supabase
        .from('supporter_transactions')
        .update({
          status: 'completed',
          esewa_data: {
            ...esewaData,
            verified_at: new Date().toISOString(),
          },
        })
        .eq('transaction_uuid', transaction_uuid)
        .select('*, users!creator_id(id, display_name, email)')
        .single();

      if (updateError) {
        console.error('[VERIFY] Database error:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update transaction' },
          { status: 500 }
        );
      }

      console.log('[VERIFY] Transaction completed:', transaction.id);

      return NextResponse.json({
        success: true,
        status: 'completed',
        transaction,
        esewa_data: esewaData,
      });
    }

    // Payment not complete
    return NextResponse.json({
      success: false,
      status: esewaData.status,
      message: 'Payment not completed',
      esewa_data: esewaData,
    });

  } catch (error) {
    console.error('[VERIFY] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

