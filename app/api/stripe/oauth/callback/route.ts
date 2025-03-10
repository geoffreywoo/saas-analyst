import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    
    // Check for error parameters from Stripe
    if (error) {
      console.error(`Stripe returned an error: ${error} - ${errorDescription}`);
      return NextResponse.redirect(
        new URL(`/dashboard?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`, url.origin)
      );
    }
    
    if (!code) {
      console.error('Missing authorization code in callback');
      return NextResponse.redirect(new URL('/dashboard?error=missing_code', url.origin));
    }
    
    console.log('Processing Stripe OAuth callback with code');
    
    // Exchange the authorization code for an access token
    try {
      const response = await stripe.oauth.token({
        grant_type: 'authorization_code',
        code,
      });
      
      console.log('Successfully obtained access token for account:', response.stripe_user_id);
      
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
      
      console.log('Saved connection details to database');
      
      // Initialize sync process for the newly connected account
      console.log('Initiating data sync for account:', response.stripe_user_id);
      fetch(`${url.origin}/api/stripe/sync/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stripeAccountId: response.stripe_user_id }),
      }).catch(error => {
        console.error('Failed to trigger sync:', error);
      });
      
      // Redirect the user back to the dashboard with a success message
      return NextResponse.redirect(new URL('/dashboard?connected=true', url.origin));
    } catch (tokenError: any) {
      console.error('Error exchanging code for token:', tokenError);
      let errorMessage = 'Failed to exchange authorization code for token';
      if (tokenError.message) {
        errorMessage += `: ${tokenError.message}`;
      }
      return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(errorMessage)}`, url.origin));
    }
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    const errorUrl = new URL(req.url);
    const errorMessage = error.message || 'Unknown error';
    return NextResponse.redirect(new URL(`/dashboard?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`, errorUrl.origin));
  }
} 