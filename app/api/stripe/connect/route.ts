import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  // Get client_id from environment variables
  const clientId = process.env.STRIPE_CLIENT_ID;
  
  // For development, you can use your localhost
  // For production, use your actual domain
  const redirectUri = process.env.STRIPE_REDIRECT_URI || 'http://localhost:3000/api/stripe/oauth/callback';
  
  // State helps prevent CSRF attacks
  const state = Math.random().toString(36).substring(2);
  
  // Store state in session/cookie to validate later
  // This is simplified - in a real app, you'd use a session system
  
  // Build the OAuth URL
  const stripeConnectUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${redirectUri}&state=${state}`;
  
  return NextResponse.redirect(stripeConnectUrl);
} 