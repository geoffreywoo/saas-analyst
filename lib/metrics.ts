import { Subscription } from '@prisma/client';
import { subMonths } from 'date-fns';

export function calculateMetrics(subscriptions: Subscription[]) {
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);

  const activeAtStart = subscriptions.filter(sub => 
    sub.startDate <= startDate && 
    (!sub.endDate || sub.endDate > startDate)
  );

  const activeAtEnd = subscriptions.filter(sub => 
    sub.startDate <= endDate && 
    (!sub.endDate || sub.endDate > endDate)
  );

  const churnedDuringPeriod = subscriptions.filter(sub => 
    sub.canceledAt && 
    sub.canceledAt >= startDate &&
    sub.canceledAt <= endDate
  );

  // Get unique customer IDs at start and churned
  const customerIdsAtStart = [...new Set(activeAtStart.map(sub => sub.customerId))];
  const churnedCustomerIds = [...new Set(churnedDuringPeriod.map(sub => sub.customerId))];

  // Calculate gross logo retention
  const grossLogoRetention = customerIdsAtStart.length > 0 
    ? ((customerIdsAtStart.length - churnedCustomerIds.length) / customerIdsAtStart.length) * 100 
    : 100;

  const startRevenue = activeAtStart.reduce((sum, sub) => sum + sub.amount, 0);
  const endRevenue = activeAtEnd.reduce((sum, sub) => sum + sub.amount, 0);

  return {
    ndr: startRevenue ? (endRevenue / startRevenue) * 100 : 0,
    churnRate: activeAtStart.length ? 
      (churnedDuringPeriod.length / activeAtStart.length) * 100 : 0,
    ltv: subscriptions.length ? 
      (subscriptions.reduce((sum, sub) => sum + sub.amount, 0) / subscriptions.length) * 12 : 0,
    activeCustomers: activeAtEnd.length,
    grossLogoRetention: grossLogoRetention,
  };
} 