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
    
    // Fetch all subscriptions from Stripe (paginating through all results)
    const subscriptions = await fetchAllSubscriptions(connectedStripe);
    
    // Process and store the subscriptions
    let processedCount = 0;
    
    for (const subscription of subscriptions) {
      // Find the customer record
      const customer = await prisma.customer.findUnique({
        where: { stripeId: subscription.customer as string },
      });
      
      if (!customer) {
        console.warn(`Customer not found for subscription ${subscription.id}, skipping`);
        continue;
      }
      
      // Get the product info
      const priceId = subscription.items.data[0]?.price.id;
      if (!priceId) continue;
      
      const price = await connectedStripe.prices.retrieve(priceId);
      if (!price.product) continue;
      
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      
      // Get or create the product
      const product = await prisma.product.upsert({
        where: { name: productId },
        update: { price: price.unit_amount ? price.unit_amount / 100 : 0 },
        create: {
          name: productId,
          price: price.unit_amount ? price.unit_amount / 100 : 0,
        },
      });
      
      // Create or update the subscription
      await prisma.subscription.upsert({
        where: { stripeId: subscription.id },
        update: {
          status: subscription.status,
          amount: price.unit_amount ? price.unit_amount / 100 : 0,
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
        create: {
          stripeId: subscription.id,
          customerId: customer.id,
          productId: product.id,
          status: subscription.status,
          amount: price.unit_amount ? price.unit_amount / 100 : 0,
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
      });
      
      processedCount++;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Synced ${processedCount} subscriptions` 
    });
  } catch (error) {
    console.error('Error syncing subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscriptions' },
      { status: 500 }
    );
  }
}

async function fetchAllSubscriptions(stripeClient: Stripe) {
  let subscriptions: Stripe.Subscription[] = [];
  let hasMore = true;
  let startingAfter: string | undefined = undefined;
  
  while (hasMore) {
    const response: Stripe.ApiList<Stripe.Subscription> = await stripeClient.subscriptions.list({
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.default_payment_method', 'data.items.data.price.product'],
    });
    
    subscriptions = [...subscriptions, ...response.data];
    hasMore = response.has_more;
    
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }
  
  return subscriptions;
} 