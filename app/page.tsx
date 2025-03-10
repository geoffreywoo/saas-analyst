import { prisma } from '@/app/lib/prisma';
import MetricCard from '@/app/components/MetricCard';
import { calculateMetrics } from '@/app/lib/metrics';
import StripeConnect from '@/app/components/StripeConnect';
import CustomerTable from '@/app/components/CustomerTable';
import ProductTable from '@/app/components/ProductTable';
import ChatInterface from '@/app/components/ChatInterface';
import DashboardVisualizations from '@/app/components/DashboardVisualizations';

// Define interfaces for our data structures
interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  amount: number;
  status: string;
  startDate: Date;
  endDate: Date | null;
  canceledAt: Date | null;
  customer?: {
    id: string;
    email: string;
    name?: string;
  };
  product?: {
    id: string;
    name: string;
    price: number;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  _count: {
    subscriptions: number;
  };
  subscriptions: {
    status: string;
    amount: number;
  }[];
}

interface Customer {
  id: string;
  email: string;
  name?: string;
  subscriptions: Subscription[];
}

interface ProductWithStats extends Omit<Product, 'subscriptions'> {
  activeCount: number;
  mrr: number;
  subscriptions?: undefined;
}

export default async function DashboardPage() {
  const subscriptions = await prisma.subscription.findMany({
    include: { customer: true },
  });

  const metrics = calculateMetrics(subscriptions);
  
  // Calculate additional metrics for display
  const activeSubscriptions = subscriptions.filter(sub => 
    sub.status === 'active' || sub.status === 'trialing'
  );
  
  const mrr = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const arr = mrr * 12;
  const arpu = metrics.activeCustomers > 0 ? mrr / metrics.activeCustomers : 0;
  
  // Check if we have a Stripe connection
  const stripeConnection = await prisma.stripeConnection.findFirst();

  // Fetch products with subscription counts
  const products = await prisma.product.findMany({
    include: {
      _count: {
        select: {
          subscriptions: true
        }
      },
      subscriptions: {
        select: {
          status: true,
          amount: true
        }
      }
    }
  });

  // Calculate active customers and MRR for each product
  const productsWithStats = products.map((product: Product): ProductWithStats => {
    const activeSubscriptions = product.subscriptions.filter(
      (sub) => sub.status === 'active'
    );
    const mrr = activeSubscriptions.reduce((sum: number, sub) => sum + sub.amount, 0);

    return {
      ...product,
      activeCount: activeSubscriptions.length,
      mrr,
      subscriptions: undefined // Remove subscriptions from the object
    };
  });

  // Fetch customers with their subscriptions and product info
  const customers = await prisma.customer.findMany({
    include: {
      subscriptions: {
        include: {
          product: true
        }
      },
    },
  });

  // Serialize the dates and prepare data for client components
  const serializedCustomers = customers.map((customer: Customer) => ({
    ...customer,
    subscriptions: customer.subscriptions.map((sub: Subscription) => ({
      ...sub,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate ? sub.endDate.toISOString() : null,
      canceledAt: sub.canceledAt ? sub.canceledAt.toISOString() : null,
    }))
  }));

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>SaaS Analytics Dashboard</h1>
      <p style={{ color: '#555', marginBottom: '30px', fontSize: '16px', fontStyle: 'italic', maxWidth: '800px' }}>
        This AI replaces your basic $200K/year investment banking and venture capital associate who just crunches your cohorts and produces net dollar retention and gross logo retention metrics.
      </p>
      
      <div style={{ marginBottom: '30px' }}>
        <StripeConnect />
      </div>

      {/* Metrics section */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>Key Metrics</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <MetricCard title="Monthly Recurring Revenue (MRR)" value={mrr} format="currency" />
          <MetricCard title="Annual Recurring Revenue (ARR)" value={arr} format="currency" />
          <MetricCard title="Active Subscriptions" value={activeSubscriptions.length} format="number" />
          <MetricCard title="Avg. Revenue Per User" value={arpu} format="currency" />
          <MetricCard title="Churn Rate" value={metrics.churnRate} format="percentage" />
          <MetricCard title="Net Dollar Retention" value={metrics.ndr} format="percentage" />
        </div>
      </div>

      {/* Chat Interface */}
      <ChatInterface />
      
      {/* Visualizations */}
      <DashboardVisualizations />

      {/* Customers table */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>Customers</h2>
        <CustomerTable customers={serializedCustomers} />
      </div>

      {/* Products table */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>Products</h2>
        <ProductTable products={productsWithStats} />
      </div>
    </div>
  );
} 