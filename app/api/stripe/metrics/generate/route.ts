import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const prisma = new PrismaClient();

// Define types for our data structures
type CustomerWithSubscriptions = {
  id: string;
  stripeId: string;
  email: string;
  subscriptions: Array<{
    id: string;
    stripeId: string;
    customerId: string;
    productId: string;
    status: string;
    amount: number;
    startDate: Date;
    endDate: Date | null;
    canceledAt: Date | null;
  }>;
};

type SubscriptionType = {
  id: string;
  stripeId: string;
  customerId: string;
  productId: string;
  status: string;
  amount: number;
  startDate: Date;
  endDate: Date | null;
  canceledAt: Date | null;
};

export async function POST(req: Request) {
  try {
    const { stripeAccountId } = await req.json();
    
    if (!stripeAccountId) {
      return NextResponse.json({ error: 'Stripe account ID is required' }, { status: 400 });
    }
    
    // Get the connection to verify account exists
    const connection = await prisma.stripeConnection.findUnique({
      where: { stripeAccountId },
    });
    
    if (!connection) {
      return NextResponse.json({ error: 'Stripe connection not found' }, { status: 404 });
    }
    
    // Get all customers
    const customers = await prisma.customer.findMany({
      include: {
        subscriptions: true,
      },
    }) as CustomerWithSubscriptions[];
    
    // Calculate current MRR and active customers
    const now = new Date();
    const activeSubscriptions: SubscriptionType[] = [];
    
    customers.forEach((customer: CustomerWithSubscriptions) => {
      customer.subscriptions.forEach((subscription: SubscriptionType) => {
        if (
          subscription.status === 'active' || 
          subscription.status === 'trialing'
        ) {
          activeSubscriptions.push(subscription);
        }
      });
    });
    
    // Calculate MRR (Monthly Recurring Revenue)
    const currentMRR = activeSubscriptions.reduce((total: number, sub: SubscriptionType) => total + sub.amount, 0);
    
    // Calculate churn rate (last 30 days)
    const lastMonth = subMonths(now, 1);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);
    
    // All subscriptions active at the start of last month
    const subscriptionsLastMonthStart = await prisma.subscription.findMany({
      where: {
        startDate: {
          lte: lastMonthStart,
        },
        OR: [
          { endDate: { gte: lastMonthStart } },
          { endDate: null },
        ],
        status: {
          in: ['active', 'trialing'],
        },
      },
    });
    
    // Count cancellations during last month
    const cancellationsLastMonth = await prisma.subscription.findMany({
      where: {
        canceledAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });
    
    const churnRate = subscriptionsLastMonthStart.length > 0
      ? (cancellationsLastMonth.length / subscriptionsLastMonthStart.length) * 100
      : 0;
    
    // Calculate MRR growth for the last 6 months
    const mrrData: Array<{ month: string; mrr: number }> = [];
    
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM yyyy');
      
      // Find subscriptions active during this month
      const activeSubsForMonth = await prisma.subscription.findMany({
        where: {
          AND: [
            {
              startDate: {
                lte: monthEnd,
              },
            },
            {
              OR: [
                { endDate: { gte: monthStart } },
                { endDate: null },
              ],
            },
            {
              status: {
                in: ['active', 'trialing'],
              },
            },
          ],
        },
      }) as SubscriptionType[];
      
      const monthlyMRR = activeSubsForMonth.reduce((total: number, sub: SubscriptionType) => total + sub.amount, 0);
      
      mrrData.push({
        month: monthLabel,
        mrr: monthlyMRR,
      });
    }
    
    // Sort MRR data chronologically
    mrrData.reverse();
    
    // Store the calculated metrics
    const metrics = [
      {
        type: 'mrr',
        value: currentMRR,
        date: now,
      },
      {
        type: 'churn_rate',
        value: churnRate,
        date: now,
      },
      {
        type: 'active_customers',
        value: activeSubscriptions.length,
        date: now,
      },
    ];
    
    // Insert metrics in database
    await prisma.metric.createMany({
      data: metrics.map(metric => ({
        customerId: '1', // Using a placeholder for global metrics
        type: metric.type,
        value: metric.value,
        date: metric.date,
      })),
      skipDuplicates: true,
    });
    
    return NextResponse.json({
      success: true,
      metrics: {
        mrr: currentMRR,
        churnRate,
        activeCustomers: activeSubscriptions.length,
        mrrTrend: mrrData,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
} 