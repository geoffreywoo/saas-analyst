import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: Request) {
  try {
    const { stripeAccountId } = await req.json();
    
    if (!stripeAccountId) {
      return NextResponse.json({ error: 'Stripe account ID is required' }, { status: 400 });
    }
    
    // Get the connection details for this Stripe account
    const connection = await prisma.stripeConnection.findUnique({
      where: { stripeAccountId },
    });
    
    if (!connection) {
      return NextResponse.json({ error: 'Stripe connection not found' }, { status: 404 });
    }
    
    // Initialize Stripe with the connected account's access token
    const connectedStripe = new Stripe(connection.accessToken, {
      apiVersion: '2025-02-24.acacia',
    });
    
    // Fetch all customers from Stripe (paginating through all results)
    const customers = await fetchAllCustomers(connectedStripe);
    
    // Process and store the customers
    const results = await Promise.all(
      customers.map(async (stripeCustomer) => {
        return await prisma.customer.upsert({
          where: { stripeId: stripeCustomer.id },
          update: {
            email: stripeCustomer.email || 'unknown@example.com',
          },
          create: {
            stripeId: stripeCustomer.id,
            email: stripeCustomer.email || 'unknown@example.com',
          },
        });
      })
    );
    
    return NextResponse.json({ 
      success: true, 
      message: `Synced ${results.length} customers` 
    });
  } catch (error) {
    console.error('Error syncing customers:', error);
    return NextResponse.json(
      { error: 'Failed to sync customers' },
      { status: 500 }
    );
  }
}

async function fetchAllCustomers(stripeClient: Stripe) {
  let customers: Stripe.Customer[] = [];
  let hasMore = true;
  let startingAfter: string | undefined = undefined;
  
  while (hasMore) {
    const response: Stripe.ApiList<Stripe.Customer> = await stripeClient.customers.list({
      limit: 100,
      starting_after: startingAfter,
    });
    
    customers = [...customers, ...response.data];
    hasMore = response.has_more;
    
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }
  
  return customers;
} 