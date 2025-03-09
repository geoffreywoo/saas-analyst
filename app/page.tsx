import { prisma } from '@/lib/prisma';
import MetricCard from '@/components/MetricCard';
import { calculateMetrics } from '@/lib/metrics';
import StripeConnectButton from '@/components/StripeConnectButton';
import CustomerTable from '@/components/CustomerTable';
import ProductTable from '@/components/ProductTable';
import ChatInterface from '@/components/ChatInterface';
import DashboardVisualizations from '@/components/DashboardVisualizations';

export default async function DashboardPage() {
  const subscriptions = await prisma.subscription.findMany({
    include: { customer: true },
  });

  const metrics = calculateMetrics(subscriptions);
  
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
  const productsWithStats = products.map(product => {
    const activeSubscriptions = product.subscriptions.filter(
      sub => sub.status === 'active'
    );
    const mrr = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);

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
  const serializedCustomers = customers.map(customer => ({
    ...customer,
    subscriptions: customer.subscriptions.map(sub => ({
      ...sub,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate ? sub.endDate.toISOString() : null,
      canceledAt: sub.canceledAt ? sub.canceledAt.toISOString() : null,
    }))
  }));

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>SaaS Analytics Dashboard</h1>
      
      {!stripeConnection ? (
        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '16px', marginBottom: '10px' }}>
            Connect your Stripe account to see your real subscription data.
          </p>
          <StripeConnectButton />
        </div>
      ) : (
        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '16px', color: 'green' }}>
            Stripe account connected! Last synced: {new Date(stripeConnection.updatedAt).toLocaleString()}
          </p>
          <button
            onClick={async () => {
              await fetch('/api/stripe/sync', { method: 'POST' });
              window.location.reload();
            }}
            style={{
              backgroundColor: '#32325d',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            Sync Data
          </button>
        </div>
      )}
      
      {/* Metrics cards */}
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', marginBottom: '30px' }}>
        <MetricCard
          title="Net Dollar Retention"
          value={metrics.ndr}
          format="percentage"
        />
        <MetricCard
          title="Gross Logo Retention"
          value={metrics.grossLogoRetention}
          format="percentage"
        />
        <MetricCard
          title="Monthly Churn Rate"
          value={metrics.churnRate}
          format="percentage"
        />
        <MetricCard
          title="Customer LTV"
          value={metrics.ltv}
          format="currency"
        />
        <MetricCard
          title="Active Customers"
          value={metrics.activeCustomers}
          format="number"
        />
      </div>

      {/* Data Visualizations - NEW SECTION */}
      <h2 style={{ color: '#333', marginBottom: '16px', fontSize: '1.5rem', fontWeight: 'bold' }}>Performance Trends</h2>
      <DashboardVisualizations />

      {/* Chat Interface */}
      <h2 style={{ color: '#333', marginBottom: '16px', fontSize: '1.5rem', fontWeight: 'bold' }}>Ask About Your Data</h2>
      <ChatInterface />

      {/* Products Table Section */}
      <h2 style={{ color: '#333', marginBottom: '16px', fontSize: '1.5rem', fontWeight: 'bold' }}>Product Tiers</h2>
      <ProductTable products={productsWithStats} />

      {/* Customer List Section */}
      <h2 style={{ color: '#333', marginBottom: '16px', fontSize: '1.5rem', fontWeight: 'bold' }}>Customer List</h2>
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        marginBottom: '40px'
      }}>
        <CustomerTable customers={serializedCustomers} />
      </div>
    </div>
  );
} 