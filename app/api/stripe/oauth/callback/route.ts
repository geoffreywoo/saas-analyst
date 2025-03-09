import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  // In a real app, validate the state parameter against what you stored
  
  if (!code) {
    return NextResponse.json({ error: 'Authorization code is missing' }, { status: 400 });
  }
  
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
    });
    
    // Exchange the authorization code for an access token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });
    
    // Store the connection information
    await prisma.stripeConnection.upsert({
      where: { stripeAccountId: response.stripe_user_id },
      update: {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        updatedAt: new Date(),
      },
      create: {
        stripeAccountId: response.stripe_user_id,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      },
    });
    
    // Redirect to dashboard or success page
    return NextResponse.redirect(new URL('/stripe/success', request.url));
    
  } catch (error) {
    console.error('Stripe OAuth error:', error);
    return NextResponse.json({ error: 'Failed to connect Stripe account' }, { status: 500 });
  }
} 