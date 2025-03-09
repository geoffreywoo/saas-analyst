import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function syncHistoricalSubscriptions() {
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.customer'],
    });

    for (const subscription of subscriptions.data) {
      const customer = subscription.customer as Stripe.Customer;
      
      await prisma.customer.upsert({
        where: { stripeId: customer.id },
        update: {},
        create: {
          stripeId: customer.id,
          email: customer.email || '',
        },
      });

      await prisma.subscription.upsert({
        where: { stripeId: subscription.id },
        update: {
          status: subscription.status,
          amount: subscription.items.data[0].price.unit_amount! / 100,
          currency: subscription.currency,
          endDate: subscription.ended_at 
            ? new Date(subscription.ended_at * 1000)
            : null,
          canceledAt: subscription.canceled_at 
            ? new Date(subscription.canceled_at * 1000)
            : null,
        },
        create: {
          stripeId: subscription.id,
          customerId: customer.id,
          status: subscription.status,
          amount: subscription.items.data[0].price.unit_amount! / 100,
          currency: subscription.currency,
          startDate: new Date(subscription.start_date * 1000),
          endDate: subscription.ended_at 
            ? new Date(subscription.ended_at * 1000)
            : null,
          canceledAt: subscription.canceled_at 
            ? new Date(subscription.canceled_at * 1000)
            : null,
        },
      });
    }

    hasMore = subscriptions.has_more;
    startingAfter = subscriptions.data[subscriptions.data.length - 1]?.id;
  }
} 