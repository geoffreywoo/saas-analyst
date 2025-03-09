import { Subscription } from '@prisma/client';

export function calculateNetDollarRetention(
  subscriptions: Subscription[],
  startDate: Date,
  endDate: Date
): number {
  const activeAtStart = subscriptions.filter(sub => 
    sub.startDate <= startDate && 
    (!sub.endDate || sub.endDate > startDate)
  );

  const activeAtEnd = subscriptions.filter(sub => 
    sub.startDate <= endDate && 
    (!sub.endDate || sub.endDate > endDate)
  );

  const startRevenue = activeAtStart.reduce((sum, sub) => sum + sub.amount, 0);
  const endRevenue = activeAtEnd.reduce((sum, sub) => sum + sub.amount, 0);

  return startRevenue ? (endRevenue / startRevenue) * 100 : 0;
}

export function calculateChurnRate(
  subscriptions: Subscription[],
  startDate: Date,
  endDate: Date
): number {
  const activeAtStart = subscriptions.filter(sub => 
    sub.startDate <= startDate && 
    (!sub.endDate || sub.endDate > startDate)
  ).length;

  const churned = subscriptions.filter(sub => 
    sub.canceledAt && 
    sub.canceledAt >= startDate &&
    sub.canceledAt <= endDate
  ).length;

  return activeAtStart ? (churned / activeAtStart) * 100 : 0;
}

export function calculateLTV(subscriptions: Subscription[]): number {
  const avgMonthlyRevenue = subscriptions.reduce((sum, sub) => sum + sub.amount, 0) / subscriptions.length;
  const avgLifespanMonths = 12; // This should be calculated based on historical data
  return avgMonthlyRevenue * avgLifespanMonths;
} 