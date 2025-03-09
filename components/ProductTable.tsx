'use client';

type Product = {
  id: string;
  name: string;
  price: number;
  _count?: {
    subscriptions: number;
  };
  activeCount?: number;
  mrr?: number; // Monthly Recurring Revenue
};

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products }: ProductTableProps) {
  // Sort products by price (lowest to highest)
  const sortedProducts = [...products].sort((a, b) => a.price - b.price);
  
  // Calculate totals for the summary
  const totalCustomers = products.reduce((sum, product) => sum + (product._count?.subscriptions || 0), 0);
  const totalActiveCustomers = products.reduce((sum, product) => sum + (product.activeCount || 0), 0);
  const totalMrr = products.reduce((sum, product) => sum + (product.mrr || 0), 0);
  
  return (
    <div className="mb-8">
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        backgroundColor: 'white'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              Product
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
              Price
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
              Total Customers
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
              Active Customers
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
              Monthly Revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedProducts.map((product) => {
            // Define styling for product badges
            const badgeStyle = {
              backgroundColor: 
                product.name === 'Pro' ? '#fef3c7' : 
                product.name === 'Plus' ? '#dbeafe' : 
                '#f3f4f6',
              color: 
                product.name === 'Pro' ? '#92400e' : 
                product.name === 'Plus' ? '#1e40af' : 
                '#374151',
              padding: '4px 12px',
              borderRadius: '4px',
              fontWeight: 'bold' as const,
              display: 'inline-block'
            };
            
            return (
              <tr key={product.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px' }}>
                  <span style={badgeStyle}>{product.name}</span>
                </td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold' }}>
                  ${product.price.toFixed(2)}/mo
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  {product._count?.subscriptions || 0}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  {product.activeCount || 0}
                </td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold' }}>
                  ${(product.mrr || 0).toFixed(2)}
                </td>
              </tr>
            );
          })}
          
          {/* Summary row */}
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <td style={{ padding: '16px', fontWeight: 'bold' }}>
              Total
            </td>
            <td style={{ padding: '16px' }}></td>
            <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold' }}>
              {totalCustomers}
            </td>
            <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold' }}>
              {totalActiveCustomers}
            </td>
            <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold' }}>
              ${totalMrr.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 