import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});
const prisma = new PrismaClient();

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;

      case 'customer.created':
      case 'customer.updated':
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerChange(customer);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await prisma.customer.findFirst({
    where: { stripeId: customerId },
  });

  if (!customer) {
    console.error(`No customer found for Stripe ID: ${customerId}`);
    return;
  }

  await prisma.subscription.upsert({
    where: { stripeId: subscription.id },
    update: {
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      quantity: subscription.items.data[0].quantity || 1,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
    create: {
      stripeId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      quantity: subscription.items.data[0].quantity || 1,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });
}

async function handleCustomerChange(customer: Stripe.Customer) {
  await prisma.customer.upsert({
    where: { stripeId: customer.id },
    update: {
      email: customer.email!,
      name: customer.name || null,
    },
    create: {
      stripeId: customer.id,
      email: customer.email!,
      name: customer.name || null,
    },
  });
} 