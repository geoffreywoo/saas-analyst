'use client';

import { useState } from 'react';
import { formatDistance, differenceInMonths } from 'date-fns';

type CustomerWithSubscriptions = {
  id: string;
  email: string;
  stripeId: string;
  subscriptions: Array<{
    id: string;
    status: string;
    amount: number;
    startDate: string | Date;
    endDate: string | Date | null;
    canceledAt: string | Date | null;
    product: {
      id: string;
      name: string;
      price: number;
    }
  }>;
};

interface CustomerTableProps {
  customers: CustomerWithSubscriptions[];
}

export default function CustomerTable({ customers }: CustomerTableProps) {
  const [sortField, setSortField] = useState<string>('email');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const sortedCustomers = [...customers].sort((a, b) => {
    if (sortField === 'email') {
      return sortDirection === 'asc' 
        ? a.email.localeCompare(b.email)
        : b.email.localeCompare(a.email);
    } else if (sortField === 'startDate') {
      const aDate = getEarliestStartDate(a);
      const bDate = getEarliestStartDate(b);
      return sortDirection === 'asc' 
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    } else if (sortField === 'value') {
      const aValue = getTotalSubscriptionValue(a);
      const bValue = getTotalSubscriptionValue(b);
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    } else if (sortField === 'status') {
      const aActive = getCustomerStatus(a) === 'Active';
      const bActive = getCustomerStatus(b) === 'Active';
      if (aActive === bActive) return 0;
      return sortDirection === 'asc' 
        ? (aActive ? 1 : -1)
        : (aActive ? -1 : 1);
    } else if (sortField === 'months') {
      const aMonths = getMonthsActive(a);
      const bMonths = getMonthsActive(b);
      return sortDirection === 'asc' ? aMonths - bMonths : bMonths - aMonths;
    } else if (sortField === 'totalPaid') {
      const aPaid = getTotalAmountPaid(a);
      const bPaid = getTotalAmountPaid(b);
      return sortDirection === 'asc' ? aPaid - bPaid : bPaid - aPaid;
    } else if (sortField === 'product') {
      const aProduct = getCurrentProduct(a)?.name || '';
      const bProduct = getCurrentProduct(b)?.name || '';
      return sortDirection === 'asc'
        ? aProduct.localeCompare(bProduct)
        : bProduct.localeCompare(aProduct);
    }
    return 0;
  });
  
  // Helper to get the current product for a customer
  const getCurrentProduct = (customer: CustomerWithSubscriptions) => {
    const activeSubscriptions = customer.subscriptions.filter(
      sub => sub.status === 'active'
    );
    
    if (activeSubscriptions.length === 0) {
      // If no active subscriptions, return the last canceled one
      const sortedByDate = [...customer.subscriptions].sort((a, b) => {
        const aDate = a.canceledAt ? new Date(a.canceledAt) : new Date(0);
        const bDate = b.canceledAt ? new Date(b.canceledAt) : new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
      
      return sortedByDate[0]?.product;
    }
    
    // If there are active subscriptions, return the one with highest price
    return activeSubscriptions.sort((a, b) => b.product.price - a.product.price)[0].product;
  };

  // Helper to get the earliest start date for a customer
  const getEarliestStartDate = (customer: CustomerWithSubscriptions): Date => {
    if (!customer.subscriptions.length) return new Date();
    
    let oldestDate = new Date();
    
    customer.subscriptions.forEach(sub => {
      const startDate = new Date(sub.startDate);
      if (startDate < oldestDate) {
        oldestDate = startDate;
      }
    });
    
    return oldestDate;
  };
  
  const getTotalSubscriptionValue = (customer: CustomerWithSubscriptions) => {
    return customer.subscriptions.reduce((sum, sub) => {
      if (sub.status === 'active') {
        return sum + sub.amount;
      }
      return sum;
    }, 0);
  };
  
  const getCustomerStatus = (customer: CustomerWithSubscriptions) => {
    const hasActiveSubscription = customer.subscriptions.some(sub => sub.status === 'active');
    return hasActiveSubscription ? 'Active' : 'Inactive';
  };
  
  const getStartDate = (customer: CustomerWithSubscriptions) => {
    if (!customer.subscriptions.length) return 'N/A';
    
    try {
      const oldestDate = getEarliestStartDate(customer);
      return oldestDate.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const getMonthsActive = (customer: CustomerWithSubscriptions) => {
    if (!customer.subscriptions.length) return 0;
    
    try {
      const oldestDate = getEarliestStartDate(customer);
      const now = new Date();
      return Math.max(1, differenceInMonths(now, oldestDate)); // Ensure at least 1 month
    } catch (error) {
      return 0;
    }
  };
  
  // Calculate total amount paid based on months active and subscription value
  const getTotalAmountPaid = (customer: CustomerWithSubscriptions) => {
    // For active subscriptions, use the full duration
    // For canceled subscriptions, calculate duration from start to end date
    let totalPaid = 0;
    
    customer.subscriptions.forEach(sub => {
      const startDate = new Date(sub.startDate);
      const endDate = sub.status === 'active' ? new Date() : 
        (sub.endDate ? new Date(sub.endDate) : new Date());
      
      const subscriptionMonths = Math.max(1, differenceInMonths(endDate, startDate));
      totalPaid += sub.amount * subscriptionMonths;
    });
    
    return totalPaid;
  };

  // Helper to get product badge style
  const getProductBadgeStyle = (productName: string) => {
    switch (productName) {
      case 'Free':
        return {
          backgroundColor: '#e5e7eb',
          color: '#374151'
        };
      case 'Plus':
        return {
          backgroundColor: '#dbeafe',
          color: '#1e40af'
        };
      case 'Pro':
        return {
          backgroundColor: '#fef3c7',
          color: '#92400e'
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          color: '#1f2937'
        };
    }
  };

  // Add this check to display a message when no customers are available
  if (!customers || customers.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        <p>No customers found. Generate test data or connect your Stripe account to see customer data.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        border: '1px solid #e2e8f0'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th 
              onClick={() => handleSort('email')}
              style={{ 
                textAlign: 'left', 
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              onClick={() => handleSort('product')}
              style={{ 
                textAlign: 'left', 
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              Product {sortField === 'product' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              onClick={() => handleSort('startDate')}
              style={{ 
                textAlign: 'left', 
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              Start Date {sortField === 'startDate' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              onClick={() => handleSort('status')}
              style={{ 
                textAlign: 'left', 
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              onClick={() => handleSort('months')}
              style={{ 
                textAlign: 'center', 
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              Months Active {sortField === 'months' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              onClick={() => handleSort('value')}
              style={{ 
                textAlign: 'right', 
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              Monthly Value {sortField === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              onClick={() => handleSort('totalPaid')}
              style={{ 
                textAlign: 'right', 
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              Total Paid {sortField === 'totalPaid' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCustomers.map((customer) => {
            const currentProduct = getCurrentProduct(customer);
            const productBadgeStyle = currentProduct ? getProductBadgeStyle(currentProduct.name) : {};
            
            return (
              <tr key={customer.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px' }}>{customer.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  {currentProduct && (
                    <span style={{
                      backgroundColor: productBadgeStyle.backgroundColor,
                      color: productBadgeStyle.color,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}>
                      {currentProduct.name}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>{getStartDate(customer)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    backgroundColor: getCustomerStatus(customer) === 'Active' ? '#d1fae5' : '#fee2e2',
                    color: getCustomerStatus(customer) === 'Active' ? '#047857' : '#b91c1c',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}>
                    {getCustomerStatus(customer)}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {getMonthsActive(customer)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  ${getTotalSubscriptionValue(customer).toFixed(2)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  ${getTotalAmountPaid(customer).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 