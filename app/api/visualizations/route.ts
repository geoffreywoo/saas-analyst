import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths, format, parseISO, differenceInMonths, isBefore } from 'date-fns';

// Define simple interfaces matching our expected data structure
interface SubscriptionWithRelations {
  id: string;
  customerId: string;
  productId: string;
  amount: number;
  status: string;
  startDate: Date;
  endDate: Date | null;
  canceledAt: Date | null;
  customer: {
    id: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    price: number;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export async function GET() {
  try {
    // Get current date and first day of current month
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);

    // Generate an array of the last 12 months (for labels)
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const monthDate = subMonths(startOfCurrentMonth, 11 - i);
      return {
        label: format(monthDate, 'MMM'),
        date: monthDate,
        startTimestamp: monthDate.toISOString(),
        endTimestamp: i < 11 
          ? subMonths(startOfCurrentMonth, 10 - i).toISOString() 
          : now.toISOString()
      };
    });

    // FETCH SUBSCRIPTION DATA
    const subscriptions = await prisma.subscription.findMany({
      include: {
        customer: true,
        product: true
      }
    }) as unknown as SubscriptionWithRelations[];

    // MRR TREND CALCULATION
    const mrrTrend = last12Months.map(month => {
      // Consider only subscriptions that were active during this month
      const activeSubscriptions = subscriptions.filter((sub: SubscriptionWithRelations) => {
        const startDate = new Date(sub.startDate);
        const endDate = sub.endDate ? new Date(sub.endDate) : null;
        
        // Subscription started before or during this month
        const startedBeforeOrDuringMonth = isBefore(startDate, new Date(month.endTimestamp));
        
        // And either hasn't ended, or ended after this month started
        const activeDuringMonth = !endDate || 
          isBefore(new Date(month.startTimestamp), endDate);
        
        return startedBeforeOrDuringMonth && activeDuringMonth;
      });

      // Calculate MRR for this month
      const mrr = activeSubscriptions.reduce((sum: number, sub: SubscriptionWithRelations) => sum + sub.amount, 0);

      return {
        month: month.label,
        value: mrr
      };
    });

    // CUSTOMER GROWTH CALCULATION
    const customerGrowth = last12Months.map(month => {
      // Count customers who had active subscriptions during this month
      const activeCustomers = new Set();
      
      subscriptions.forEach((sub: SubscriptionWithRelations) => {
        const startDate = new Date(sub.startDate);
        const endDate = sub.endDate ? new Date(sub.endDate) : null;
        
        // Check if subscription was active during this month
        if (
          isBefore(startDate, new Date(month.endTimestamp)) && 
          (!endDate || isBefore(new Date(month.startTimestamp), endDate))
        ) {
          activeCustomers.add(sub.customerId);
        }
      });

      return {
        month: month.label,
        value: activeCustomers.size
      };
    });

    // PLAN DISTRIBUTION CALCULATION
    const products = await prisma.product.findMany() as unknown as Product[];
    
    // Color coding for plans
    const colorMap: Record<string, string> = {
      'Free': '#94a3b8', // slate
      'Plus': '#60a5fa', // blue
      'Pro': '#f59e0b'   // amber
    };

    // Default colors if product names don't match
    const defaultColors = ['#94a3b8', '#60a5fa', '#f59e0b', '#a855f7', '#ec4899'];
    
    // Get active subscriptions
    const activeSubscriptions = subscriptions.filter((sub: SubscriptionWithRelations) => 
      sub.status === 'active' || !sub.canceledAt
    );
    
    const planDistribution = products.map((product: Product, index: number) => {
      const customersWithPlan = new Set();
      
      activeSubscriptions.forEach((sub: SubscriptionWithRelations) => {
        if (sub.productId === product.id) {
          customersWithPlan.add(sub.customerId);
        }
      });
      
      return {
        name: product.name,
        value: customersWithPlan.size,
        color: colorMap[product.name] || defaultColors[index % defaultColors.length]
      };
    });

    // CHURN RATE CALCULATION
    const churnRate = last12Months.map((month, index) => {
      if (index === 0) {
        // For the first month, we don't have previous data to calculate churn
        return {
          month: month.label,
          value: 0
        };
      }
      
      const prevMonth = last12Months[index - 1];
      
      // Get active customers in previous month
      const prevMonthCustomers = new Set();
      subscriptions.forEach((sub: SubscriptionWithRelations) => {
        const startDate = new Date(sub.startDate);
        const endDate = sub.endDate ? new Date(sub.endDate) : null;
        
        if (
          isBefore(startDate, new Date(prevMonth.endTimestamp)) && 
          (!endDate || isBefore(new Date(prevMonth.startTimestamp), endDate))
        ) {
          prevMonthCustomers.add(sub.customerId);
        }
      });
      
      // Count how many of those customers were lost in current month
      let lostCustomers = 0;
      prevMonthCustomers.forEach(customerId => {
        const customerSubs = subscriptions.filter((sub: SubscriptionWithRelations) => sub.customerId === customerId);
        
        // Check if all of this customer's subscriptions had ended by current month
        const allEnded = customerSubs.every((sub: SubscriptionWithRelations) => {
          const endDate = sub.endDate ? new Date(sub.endDate) : null;
          return endDate && isBefore(endDate, new Date(month.startTimestamp));
        });
        
        if (allEnded) {
          lostCustomers++;
        }
      });
      
      // Calculate churn rate as percentage
      const churnRate = prevMonthCustomers.size > 0 
        ? (lostCustomers / prevMonthCustomers.size) * 100 
        : 0;
      
      return {
        month: month.label,
        value: parseFloat(churnRate.toFixed(1))
      };
    });

    // Return all visualization data
    return NextResponse.json({
      mrrTrend,
      customerGrowth,
      planDistribution,
      churnRate
    });
  } catch (error) {
    console.error("Error generating visualization data:", error);
    return NextResponse.json(
      { error: "Failed to generate visualization data" },
      { status: 500 }
    );
  }
} 