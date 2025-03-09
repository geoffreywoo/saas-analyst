'use client';

import { useState, useEffect } from 'react';

type Visualization = 'mrr' | 'customers' | 'plans' | 'churn';

type VisualizationData = {
  mrrTrend: { month: string; value: number }[];
  customerGrowth: { month: string; value: number }[];
  planDistribution: { name: string; value: number; color: string }[];
  churnRate: { month: string; value: number }[];
};

export default function DashboardVisualizations() {
  const [activeTab, setActiveTab] = useState<Visualization>('mrr');
  const [data, setData] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch visualization data
    const fetchData = async () => {
      try {
        // In a real app, we would fetch this data from an API endpoint
        // For now, we'll fetch directly using fetch API
        const response = await fetch('/api/visualizations');
        
        // If API isn't available yet, fall back to sample data
        if (!response.ok) {
          const sampleData: VisualizationData = {
            mrrTrend: generateMRRData(),
            customerGrowth: generateCustomerGrowthData(),
            planDistribution: [
              { name: 'Free', value: 30, color: '#94a3b8' },
              { name: 'Plus', value: 50, color: '#60a5fa' },
              { name: 'Pro', value: 20, color: '#f59e0b' }
            ],
            churnRate: generateChurnData()
          };
          
          setData(sampleData);
        } else {
          const apiData = await response.json();
          setData(apiData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching visualization data:", error);
        
        // Fall back to sample data on error
        const sampleData: VisualizationData = {
          mrrTrend: generateMRRData(),
          customerGrowth: generateCustomerGrowthData(),
          planDistribution: [
            { name: 'Free', value: 30, color: '#94a3b8' },
            { name: 'Plus', value: 50, color: '#60a5fa' },
            { name: 'Pro', value: 20, color: '#f59e0b' }
          ],
          churnRate: generateChurnData()
        };
        
        setData(sampleData);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const generateMRRData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Generate last 12 months of data
    return months.map((month, i) => {
      const monthIndex = (currentMonth - 11 + i) % 12;
      const adjustedMonth = months[monthIndex < 0 ? monthIndex + 12 : monthIndex];
      
      // Create a growth curve with some randomness
      const baseValue = 2000;
      const growthFactor = 1.12;
      const randomness = 0.9 + Math.random() * 0.2;
      
      return {
        month: adjustedMonth,
        value: Math.round(baseValue * Math.pow(growthFactor, i) * randomness)
      };
    });
  };

  const generateCustomerGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Generate last 12 months of data
    return months.map((month, i) => {
      const monthIndex = (currentMonth - 11 + i) % 12;
      const adjustedMonth = months[monthIndex < 0 ? monthIndex + 12 : monthIndex];
      
      // Create a growth curve with some randomness
      const baseValue = 10;
      const growthFactor = 1.15;
      const randomness = 0.9 + Math.random() * 0.2;
      
      return {
        month: adjustedMonth,
        value: Math.round(baseValue * Math.pow(growthFactor, i) * randomness)
      };
    });
  };

  const generateChurnData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Generate last 12 months of data
    return months.map((month, i) => {
      const monthIndex = (currentMonth - 11 + i) % 12;
      const adjustedMonth = months[monthIndex < 0 ? monthIndex + 12 : monthIndex];
      
      // Create a decreasing churn rate with some randomness
      const baseValue = 10;
      const decreaseFactor = 0.95;
      const randomness = 0.8 + Math.random() * 0.4;
      
      return {
        month: adjustedMonth,
        value: parseFloat((baseValue * Math.pow(decreaseFactor, i) * randomness).toFixed(1))
      };
    });
  };

  const renderMRRTrend = () => {
    if (!data) return null;
    
    const maxValue = Math.max(...data.mrrTrend.map(item => item.value));
    const chartHeight = 200;
    
    // Calculate Y-axis labels
    const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
      return Math.round(maxValue * (4 - i) / 4);
    });
    
    return (
      <div style={{ padding: '20px 0' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}>
          Monthly Recurring Revenue Growth
        </h3>
        
        <div style={{ display: 'flex' }}>
          {/* Y-axis labels */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            paddingRight: '10px',
            height: `${chartHeight}px`,
            width: '60px',
          }}>
            {yAxisLabels.map((label, i) => (
              <div key={i} style={{ 
                fontSize: '0.7rem', 
                color: '#6b7280',
                textAlign: 'right',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
                ${label.toLocaleString()}
              </div>
            ))}
          </div>
          
          {/* Chart */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              position: 'relative',
              height: `${chartHeight}px`,
              borderLeft: '1px solid #e5e7eb',
              borderBottom: '1px solid #e5e7eb',
            }}>
              {/* Horizontal grid lines */}
              {yAxisLabels.map((_, i) => (
                <div key={i} style={{ 
                  position: 'absolute',
                  top: `${(i * chartHeight) / 4}px`,
                  left: 0,
                  right: 0,
                  borderTop: '1px dashed #e5e7eb',
                  height: '1px',
                }}></div>
              ))}
              
              {/* Bars */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-end', 
                height: '100%', 
                gap: '2px',
                position: 'relative',
                zIndex: 2,
              }}>
                {data.mrrTrend.map((item, index) => {
                  const height = (item.value / maxValue) * chartHeight;
                  
                  return (
                    <div key={index} style={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      height: '100%', 
                      justifyContent: 'flex-end',
                    }}>
                      <div style={{ 
                        height: `${height}px`, 
                        width: '70%', 
                        backgroundColor: '#3b82f6',
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px',
                        position: 'relative'
                      }}>
                        {/* Tooltip on hover */}
                        <div style={{ 
                          position: 'absolute',
                          top: '-30px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#1e40af',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          pointerEvents: 'none',
                        }} className="bar-tooltip">
                          ${item.value.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* X-axis labels */}
            <div style={{ display: 'flex', marginTop: '8px' }}>
              {data.mrrTrend.map((item, index) => (
                <div key={index} style={{ 
                  flex: 1, 
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  color: '#6b7280', 
                }}>
                  {item.month}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Label for X-axis */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          color: '#6b7280',
          marginTop: '16px'
        }}>
          Last 12 Months
        </div>
        
        {/* Label for Y-axis */}
        <div style={{ 
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'rotate(-90deg) translateX(50%)',
          fontSize: '0.8rem',
          color: '#6b7280',
          whiteSpace: 'nowrap',
          transformOrigin: 'left center',
          display: 'none' // Hidden for layout reasons, enable if layout allows
        }}>
          Revenue (USD)
        </div>
      </div>
    );
  };

  const renderCustomerGrowth = () => {
    if (!data) return null;
    
    const maxValue = Math.max(...data.customerGrowth.map(item => item.value));
    const chartHeight = 200;
    
    // Calculate Y-axis labels with nice rounded numbers
    const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
      return Math.round(maxValue * (4 - i) / 4);
    });
    
    return (
      <div style={{ padding: '20px 0' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}>
          Customer Growth
        </h3>
        
        <div style={{ display: 'flex' }}>
          {/* Y-axis labels */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            paddingRight: '10px',
            height: `${chartHeight}px`,
            width: '60px',
          }}>
            {yAxisLabels.map((label, i) => (
              <div key={i} style={{ 
                fontSize: '0.7rem', 
                color: '#6b7280',
                textAlign: 'right',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
                {label}
              </div>
            ))}
          </div>
          
          {/* Chart */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              position: 'relative',
              height: `${chartHeight}px`,
              borderLeft: '1px solid #e5e7eb',
              borderBottom: '1px solid #e5e7eb',
            }}>
              {/* Horizontal grid lines */}
              {yAxisLabels.map((_, i) => (
                <div key={i} style={{ 
                  position: 'absolute',
                  top: `${(i * chartHeight) / 4}px`,
                  left: 0,
                  right: 0,
                  borderTop: '1px dashed #e5e7eb',
                  height: '1px',
                }}></div>
              ))}
              
              {/* Line chart */}
              <svg 
                width="100%" 
                height="100%" 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0,
                  overflow: 'visible'
                }}
              >
                {/* Area under the line */}
                <defs>
                  <linearGradient id="customerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                <path
                  d={data.customerGrowth.map((point, i) => {
                    const x = (i / (data.customerGrowth.length - 1)) * 100 + '%';
                    const y = (1 - point.value / maxValue) * chartHeight;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ') + 
                    ` L 100% ${chartHeight} L 0 ${chartHeight} Z`}
                  fill="url(#customerGradient)"
                />
                
                {/* Line */}
                <path
                  d={data.customerGrowth.map((point, i) => {
                    const x = (i / (data.customerGrowth.length - 1)) * 100 + '%';
                    const y = (1 - point.value / maxValue) * chartHeight;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2"
                />
                
                {/* Data points */}
                {data.customerGrowth.map((point, i) => {
                  const x = (i / (data.customerGrowth.length - 1)) * 100 + '%';
                  const y = (1 - point.value / maxValue) * chartHeight;
                  
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="white"
                        stroke="#4f46e5"
                        strokeWidth="2"
                      />
                      {/* Tooltip */}
                      <text
                        x={x}
                        y={y - 15}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#4f46e5"
                        fontWeight="bold"
                        opacity="0"
                        className="point-tooltip"
                      >
                        {point.value}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* X-axis labels */}
            <div style={{ display: 'flex', marginTop: '8px' }}>
              {data.customerGrowth.map((item, index) => (
                <div key={index} style={{ 
                  flex: 1, 
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  color: '#6b7280', 
                }}>
                  {item.month}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Label for X-axis */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          color: '#6b7280',
          marginTop: '16px'
        }}>
          Last 12 Months
        </div>
      </div>
    );
  };

  const renderPlanDistribution = () => {
    if (!data) return null;
    
    const total = data.planDistribution.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div style={{ padding: '20px 0' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}>
          Plan Distribution
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ 
            width: '220px', 
            height: '220px', 
            borderRadius: '50%', 
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* Generate pie chart slices */}
            {data.planDistribution.map((item, i, arr) => {
              const prevTotal = arr.slice(0, i).reduce((sum, p) => sum + p.value, 0);
              const startPercentage = (prevTotal / total) * 100;
              const endPercentage = startPercentage + (item.value / total) * 100;
              
              // Calculate angles for SVG arc
              const startAngle = (startPercentage / 100) * Math.PI * 2 - Math.PI / 2;
              const endAngle = (endPercentage / 100) * Math.PI * 2 - Math.PI / 2;
              
              const x1 = 110 + 100 * Math.cos(startAngle);
              const y1 = 110 + 100 * Math.sin(startAngle);
              const x2 = 110 + 100 * Math.cos(endAngle);
              const y2 = 110 + 100 * Math.sin(endAngle);
              
              // Flag for large arc (more than 180 degrees)
              const largeArcFlag = endPercentage - startPercentage > 50 ? 1 : 0;
              
              return (
                <svg 
                  key={i}
                  width="220" 
                  height="220" 
                  style={{ position: 'absolute', top: 0, left: 0 }}
                  viewBox="0 0 220 220"
                >
                  <path
                    d={`M 110 110 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={item.color}
                  />
                </svg>
              );
            })}
            
            {/* Center circle with total */}
            <div style={{ 
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              backgroundColor: 'white',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              boxShadow: '0 0 15px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 'bold' }}>{total}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Customers</div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px' }}>
          {data.planDistribution.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '14px', 
                height: '14px', 
                backgroundColor: item.color,
                borderRadius: '4px'
              }}></div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {item.value} customers ({Math.round((item.value / total) * 100)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChurnRate = () => {
    if (!data) return null;
    
    const maxValue = 15; // Set a fixed max for churn to better visualize changes
    const chartHeight = 200;
    
    // Calculate Y-axis labels with percentages
    const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
      return (maxValue * (4 - i) / 4).toFixed(1);
    });
    
    return (
      <div style={{ padding: '20px 0' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}>
          Monthly Churn Rate
        </h3>
        
        <div style={{ display: 'flex' }}>
          {/* Y-axis labels */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            paddingRight: '10px',
            height: `${chartHeight}px`,
            width: '60px',
          }}>
            {yAxisLabels.map((label, i) => (
              <div key={i} style={{ 
                fontSize: '0.7rem', 
                color: '#6b7280',
                textAlign: 'right',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
                {label}%
              </div>
            ))}
          </div>
          
          {/* Chart */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              position: 'relative',
              height: `${chartHeight}px`,
              borderLeft: '1px solid #e5e7eb',
              borderBottom: '1px solid #e5e7eb',
            }}>
              {/* Horizontal grid lines */}
              {yAxisLabels.map((_, i) => (
                <div key={i} style={{ 
                  position: 'absolute',
                  top: `${(i * chartHeight) / 4}px`,
                  left: 0,
                  right: 0,
                  borderTop: '1px dashed #e5e7eb',
                  height: '1px',
                }}></div>
              ))}
              
              {/* Area chart */}
              <svg 
                width="100%" 
                height="100%" 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0,
                  overflow: 'visible'
                }}
              >
                <defs>
                  <linearGradient id="churnGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                <path
                  d={data.churnRate.map((point, i) => {
                    const x = (i / (data.churnRate.length - 1)) * 100 + '%';
                    const y = (1 - Math.min(point.value, maxValue) / maxValue) * chartHeight;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ') + 
                    ` L 100% ${chartHeight} L 0 ${chartHeight} Z`}
                  fill="url(#churnGradient)"
                />
                
                <path
                  d={data.churnRate.map((point, i) => {
                    const x = (i / (data.churnRate.length - 1)) * 100 + '%';
                    const y = (1 - Math.min(point.value, maxValue) / maxValue) * chartHeight;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                
                {/* Data points with tooltips */}
                {data.churnRate.map((point, i) => {
                  const x = (i / (data.churnRate.length - 1)) * 100 + '%';
                  const y = (1 - Math.min(point.value, maxValue) / maxValue) * chartHeight;
                  
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="white"
                        stroke="#ef4444"
                        strokeWidth="2"
                      />
                      {/* Tooltip */}
                      <text
                        x={x}
                        y={y - 15}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#ef4444"
                        fontWeight="bold"
                        opacity="0"
                        className="point-tooltip"
                      >
                        {point.value}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* X-axis labels */}
            <div style={{ display: 'flex', marginTop: '8px' }}>
              {data.churnRate.map((item, index) => (
                <div key={index} style={{ 
                  flex: 1, 
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  color: '#6b7280', 
                }}>
                  {item.month}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Label for X-axis */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          color: '#6b7280',
          marginTop: '16px'
        }}>
          Last 12 Months
        </div>
        
        {/* Add help text */}
        <div style={{ 
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#6b7280',
          marginTop: '5px',
          fontStyle: 'italic'
        }}>
          Lower churn rates indicate better customer retention
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      marginBottom: '30px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden'
    }}>
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid #e5e7eb', 
        backgroundColor: '#f9fafb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
          SaaS Analytics
        </h3>
        
        <div style={{ display: 'flex', gap: '2px' }}>
          <button 
            onClick={() => setActiveTab('mrr')}
            style={{
              padding: '8px 12px',
              backgroundColor: activeTab === 'mrr' ? '#e0e7ff' : 'transparent',
              color: activeTab === 'mrr' ? '#4338ca' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'mrr' ? 'bold' : 'normal',
            }}
          >
            MRR
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            style={{
              padding: '8px 12px',
              backgroundColor: activeTab === 'customers' ? '#e0e7ff' : 'transparent',
              color: activeTab === 'customers' ? '#4338ca' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'customers' ? 'bold' : 'normal',
            }}
          >
            Customers
          </button>
          <button 
            onClick={() => setActiveTab('plans')}
            style={{
              padding: '8px 12px',
              backgroundColor: activeTab === 'plans' ? '#e0e7ff' : 'transparent',
              color: activeTab === 'plans' ? '#4338ca' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'plans' ? 'bold' : 'normal',
            }}
          >
            Plans
          </button>
          <button 
            onClick={() => setActiveTab('churn')}
            style={{
              padding: '8px 12px',
              backgroundColor: activeTab === 'churn' ? '#e0e7ff' : 'transparent',
              color: activeTab === 'churn' ? '#4338ca' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'churn' ? 'bold' : 'normal',
            }}
          >
            Churn
          </button>
        </div>
      </div>
      
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#6b7280',
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            Loading data...
          </div>
        ) : (
          <>
            {activeTab === 'mrr' && renderMRRTrend()}
            {activeTab === 'customers' && renderCustomerGrowth()}
            {activeTab === 'plans' && renderPlanDistribution()}
            {activeTab === 'churn' && renderChurnRate()}
          </>
        )}
      </div>
      
      {/* Hover effects for tooltips - Add to global stylesheet or as a style tag */}
      <style jsx>{`
        .bar-tooltip {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        
        div:hover .bar-tooltip {
          opacity: 1;
        }
        
        .point-tooltip {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        
        circle:hover + .point-tooltip {
          opacity: 1;
        }
      `}</style>
    </div>
  );
} 