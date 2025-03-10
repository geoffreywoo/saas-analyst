import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { stripeAccountId } = await req.json();
    
    if (!stripeAccountId) {
      return NextResponse.json({ error: 'Stripe account ID is required' }, { status: 400 });
    }

    // Get the host from headers
    const headersList = headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Sync customers
    const customersResponse = await fetch(`${baseUrl}/api/stripe/sync/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stripeAccountId }),
    });

    if (!customersResponse.ok) {
      const errorData = await customersResponse.json();
      return NextResponse.json({ 
        error: 'Failed to sync customers',
        details: errorData
      }, { status: 500 });
    }

    // Sync subscriptions
    const subscriptionsResponse = await fetch(`${baseUrl}/api/stripe/sync/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stripeAccountId }),
    });

    if (!subscriptionsResponse.ok) {
      const errorData = await subscriptionsResponse.json();
      return NextResponse.json({ 
        error: 'Failed to sync subscriptions',
        details: errorData
      }, { status: 500 });
    }

    const customersResult = await customersResponse.json();
    const subscriptionsResult = await subscriptionsResponse.json();

    // Generate analytics metrics based on synced data
    const metricsResponse = await fetch(`${baseUrl}/api/stripe/metrics/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stripeAccountId }),
    }).catch(() => null);

    let metricsResult = null;
    if (metricsResponse && metricsResponse.ok) {
      metricsResult = await metricsResponse.json();
    }

    return NextResponse.json({
      success: true,
      customers: customersResult,
      subscriptions: subscriptionsResult,
      metrics: metricsResult,
    });
  } catch (error) {
    console.error('Error syncing all Stripe data:', error);
    return NextResponse.json(
      { error: 'Failed to sync Stripe data' },
      { status: 500 }
    );
  }
} 