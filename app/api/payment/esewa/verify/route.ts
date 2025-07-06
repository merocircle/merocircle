import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transaction_uuid = searchParams.get('transaction_uuid');
    const total_amount = searchParams.get('total_amount');
    const product_code = searchParams.get('product_code') || 'EPAYTEST';

    if (!transaction_uuid || !total_amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify with eSewa API
    const esewaResponse = await fetch(
      `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const esewaData = await esewaResponse.json();
    
    // eSewa returns status "COMPLETE" for successful payments
    if (esewaData.status === 'COMPLETE') {
      const supabase = await createClient();
      
      // Update transaction in our database
      const { data: transaction, error: updateError } = await supabase
        .from('supporter_transactions')
        .update({
          status: 'completed',
          esewa_data: esewaData,
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_uuid', transaction_uuid)
        .select(`
          *,
          users!creator_id(id, display_name, email)
        `)
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json(
          { success: false, error: 'Database update failed' },
          { status: 500 }
        );
      }

      // Optional: Send notification to creator
      // You could add email/push notification logic here

      return NextResponse.json({
        success: true,
        status: 'completed',
        transaction,
        esewa_data: esewaData,
      });
    } else {
      // Payment not completed or failed
      return NextResponse.json({
        success: false,
        status: esewaData.status || 'failed',
        message: 'Payment verification failed',
        esewa_data: esewaData,
      });
    }

  } catch (error) {
    console.error('eSewa verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
} 