import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { subMonths } from 'date-fns';

export async function syncStripeData() {
  // Get the Stripe connection
  const stripeConnection = await prisma.stripeConnection.findFirst();
  
  if (!stripeConnection) {
    throw new Error('No Stripe account connected');
  }
  
  // Initialize Stripe with the access token
  const stripe = new Stripe(stripeConnection.accessToken, {
    apiVersion: '2023-10-16',
  });
  
  // Fetch customers
  const customers = await fetchAllStripeCustomers(stripe);
  
  // Fetch subscriptions
  const subscriptions = await fetchAllStripeSubscriptions(stripe);
  
  // Store customers in the database
  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { stripeId: customer.id },
      update: {
        email: customer.email || '',
      },
      create: {
        stripeId: customer.id,
        email: customer.email || '',
      },
    });
  }
  
  // Store subscriptions in the database
  for (const subscription of subscriptions) {
    // Find the customer
    const customer = await prisma.customer.findUnique({
      where: { stripeId: subscription.customer as string },
    });
    
    if (customer) {
      await prisma.subscription.upsert({
        where: { stripeId: subscription.id },
        update: {
          status: subscription.status,
          amount: subscription.items.data[0].price.unit_amount! / 100,
          endDate: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
        create: {
          stripeId: subscription.id,
          customerId: customer.id,
          status: subscription.status,
          amount: subscription.items.data[0].price.unit_amount! / 100,
          currency: subscription.currency,
          startDate: new Date(subscription.start_date * 1000),
          endDate: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
      });
    }
  }
  
  return {
    customersCount: customers.length,
    subscriptionsCount: subscriptions.length,
  };
}

// Helper function to fetch all customers using pagination
async function fetchAllStripeCustomers(stripe: Stripe) {
  let customers: Stripe.Customer[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;
  
  while (hasMore) {
    const response = await stripe.customers.list({
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

// Helper function to fetch all subscriptions using pagination
async function fetchAllStripeSubscriptions(stripe: Stripe) {
  let subscriptions: Stripe.Subscription[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;
  
  while (hasMore) {
    const response = await stripe.subscriptions.list({
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.customer', 'data.items.data.price'],
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