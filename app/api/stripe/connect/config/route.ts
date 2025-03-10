import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.STRIPE_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Stripe client ID not configured' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    clientId
  });
} 