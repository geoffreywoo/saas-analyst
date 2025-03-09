interface MetricCardProps {
  title: string;
  value: number;
  format: 'currency' | 'percentage' | 'number';
}

export default function MetricCard({ title, value, format }: MetricCardProps) {
  const formattedValue = format === 'currency' 
    ? `$${value.toFixed(2)}`
    : format === 'percentage'
    ? `${value.toFixed(1)}%`
    : value.toLocaleString();

  return (
    <div style={{ 
      border: '1px solid #ddd', 
      padding: '15px',
      borderRadius: '5px',
      backgroundColor: 'white'
    }}>
      <h3 style={{ 
        fontSize: '14px',
        color: '#666',
        margin: '0 0 5px 0'
      }}>{title}</h3>
      <p style={{ 
        fontSize: '24px',
        fontWeight: 'bold',
        margin: 0
      }}>{formattedValue}</p>
    </div>
  );
} 