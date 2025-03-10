import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // Extract state from query params (optional)
    const url = new URL(req.url);
    const state = url.searchParams.get('state') || Math.random().toString(36).substring(2, 15);
    
    // Get client ID from environment variable
    const clientId = process.env.STRIPE_CLIENT_ID;
    console.log('STRIPE_CLIENT_ID:', clientId);
    
    if (!clientId || clientId === '') {
      console.error('Stripe client ID is not configured');
      return NextResponse.json(
        { error: 'Stripe client ID is not configured. Please set STRIPE_CLIENT_ID in your environment variables.' },
        { status: 500 }
      );
    }
    
    // Use the environment variable for redirect URI if available, otherwise fallback to constructed URI
    const redirectUri = process.env.STRIPE_REDIRECT_URI || `${url.origin}/api/stripe/oauth/callback`;
    console.log('Redirect URI:', redirectUri);
    
    // Build Stripe Connect URL
    const stripeConnectUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    console.log('Stripe Connect URL:', stripeConnectUrl);
    
    // Redirect to Stripe
    return NextResponse.redirect(stripeConnectUrl);
  } catch (error) {
    console.error('Error initiating Stripe Connect:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Stripe Connect' },
      { status: 500 }
    );
  }
} 