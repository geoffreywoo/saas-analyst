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
    <div className="metric-card">
      <h3 className="metric-title">{title}</h3>
      <p className="metric-value">{formattedValue}</p>
    </div>
  );
} 