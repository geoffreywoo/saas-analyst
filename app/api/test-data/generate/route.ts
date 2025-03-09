import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { addDays, subDays, subMonths } from 'date-fns';

export async function POST() {
  try {
    // Check if products exist, create them if they don't
    const existingProducts = await prisma.product.findMany();
    let products = existingProducts;
    
    if (existingProducts.length === 0) {
      console.log('Creating new products...');
      // Create products
      products = await Promise.all([
        prisma.product.create({
          data: { name: 'Free', price: 0 }
        }),
        prisma.product.create({
          data: { name: 'Plus', price: 20 }
        }),
        prisma.product.create({
          data: { name: 'Pro', price: 200 }
        })
      ]);
    }
    
    // Generate new customers (10-30 new customers each time)
    const newCustomerCount = Math.floor(Math.random() * 21) + 10; // Random number between 10-30
    
    // Count all existing customers to determine the next customer number
    const customerCount = await prisma.customer.count();
    const nextCustomerNumber = customerCount + 1;
    
    console.log(`Existing customers: ${customerCount}`);
    console.log(`Starting from customer number: ${nextCustomerNumber}`);
    console.log(`Generating ${newCustomerCount} new customers...`);
    
    // Generate customers
    const newCustomers = [];
    
    for (let i = 0; i < newCustomerCount; i++) {
      const customerNumber = nextCustomerNumber + i;
      try {
        const customer = await prisma.customer.create({
          data: {
            stripeId: `cus_test${customerNumber}`,
            email: `customer${customerNumber}@example.com`,
          }
        });
        newCustomers.push(customer);
      } catch (error) {
        console.error(`Error creating customer ${customerNumber}:`, error);
      }
    }
    
    // Generate subscriptions
    const subscriptions = [];
    const now = new Date();
    
    for (const customer of newCustomers) {
      // Randomly determine subscription start date (1-12 months ago)
      const startDate = subMonths(now, Math.floor(Math.random() * 12) + 1);
      
      // 80% of subscriptions are active, 20% are canceled
      const isActive = Math.random() < 0.8;
      
      let endDate = null;
      let canceledAt = null;
      
      if (!isActive) {
        // If canceled, set canceled date between start date and now
        const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const cancelDaysAfterStart = Math.floor(Math.random() * daysSinceStart);
        canceledAt = addDays(startDate, cancelDaysAfterStart);
        endDate = addDays(canceledAt, 30); // Subscription ends 30 days after cancellation
      }
      
      // Assign product based on probability
      // 30% Free, 50% Plus, 20% Pro
      let product;
      const rand = Math.random();
      if (rand < 0.3) {
        product = products[0]; // Free
      } else if (rand < 0.8) {
        product = products[1]; // Plus
      } else {
        product = products[2]; // Pro
      }
      
      const subscription = await prisma.subscription.create({
        data: {
          stripeId: `sub_test${customer.id}`,
          customerId: customer.id,
          productId: product.id,
          status: isActive ? 'active' : 'canceled',
          amount: product.price,
          startDate,
          endDate,
          canceledAt,
        }
      });
      subscriptions.push(subscription);
      
      // 15% chance of customer having a second subscription
      // Note: In real world, multiple subscriptions often mean upgrades
      if (Math.random() < 0.15) {
        const secondStartDate = addDays(startDate, Math.floor(Math.random() * 90) + 30);
        
        if (secondStartDate < now) {
          const isSecondActive = Math.random() < 0.9; // 90% of second subscriptions are active
          
          let secondEndDate = null;
          let secondCanceledAt = null;
          
          if (!isSecondActive) {
            const daysSinceSecondStart = Math.floor((now.getTime() - secondStartDate.getTime()) / (1000 * 60 * 60 * 24));
            const cancelDaysAfterSecondStart = Math.floor(Math.random() * daysSinceSecondStart);
            secondCanceledAt = addDays(secondStartDate, cancelDaysAfterSecondStart);
            secondEndDate = addDays(secondCanceledAt, 30);
          }
          
          // Second subscription is usually an upgrade
          // If first subscription is Free, upgrade to Plus or Pro
          // If first subscription is Plus, upgrade to Pro
          // If first subscription is Pro, stay on Pro (could be add-on)
          let secondProduct;
          if (product.name === 'Free') {
            secondProduct = Math.random() < 0.7 ? products[1] : products[2]; // 70% Plus, 30% Pro
          } else if (product.name === 'Plus') {
            secondProduct = products[2]; // Pro
          } else {
            secondProduct = products[2]; // Pro
          }
          
          await prisma.subscription.create({
            data: {
              stripeId: `sub_test${customer.id}_second`,
              customerId: customer.id,
              productId: secondProduct.id,
              status: isSecondActive ? 'active' : 'canceled',
              amount: secondProduct.price,
              startDate: secondStartDate,
              endDate: secondEndDate,
              canceledAt: secondCanceledAt,
            }
          });
        }
      }
    }
    
    // Get total counts for the response
    const totalCustomers = await prisma.customer.count();
    const totalSubscriptions = await prisma.subscription.count();
    
    return NextResponse.json({
      success: true,
      newCustomersCount: newCustomers.length,
      totalCustomersCount: totalCustomers,
      totalSubscriptionsCount: totalSubscriptions,
    });
  } catch (error) {
    console.error('Failed to generate test data:', error);
    return NextResponse.json(
      { error: 'Failed to generate test data' },
      { status: 500 }
    );
  }
} 