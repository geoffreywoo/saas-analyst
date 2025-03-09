import { NextResponse } from 'next/server';
import { syncStripeData } from '@/lib/stripe/syncData';

export async function POST() {
  try {
    const result = await syncStripeData();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to sync Stripe data:', error);
    return NextResponse.json(
      { error: 'Failed to sync Stripe data' },
      { status: 500 }
    );
  }
} 