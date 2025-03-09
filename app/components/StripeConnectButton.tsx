'use client';

import { useState } from 'react';

export default function StripeConnectButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [showApiKeyInfo, setShowApiKeyInfo] = useState(false);

  const connectWithStripe = async () => {
    // This would typically redirect to Stripe OAuth
    alert('In a production app, this would redirect to Stripe OAuth');
  };

  const generateTestData = async () => {
    setIsLoading(true);
    setLoadingMessage('Adding test data...');
    setSuccess(false);
    
    try {
      const response = await fetch('/api/test-data/generate', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setLoadingMessage(`Successfully added ${data.newCustomersCount} customers! Total: ${data.totalCustomersCount} customers and ${data.totalSubscriptionsCount} subscriptions.`);
      } else {
        setLoadingMessage(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setLoadingMessage('Failed to generate test data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={connectWithStripe}
          style={{
            backgroundColor: '#6772e5',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M33.3333 6.66666H6.66667C4.8 6.66666 3.33333 8.16666 3.33333 10V30C3.33333 31.8333 4.8 33.3333 6.66667 33.3333H33.3333C35.2 33.3333 36.6667 31.8333 36.6667 30V10C36.6667 8.16666 35.2 6.66666 33.3333 6.66666Z" fill="white" />
            <path d="M20 23.3333C21.8333 23.3333 23.3333 21.8333 23.3333 20C23.3333 18.1667 21.8333 16.6667 20 16.6667C18.1667 16.6667 16.6667 18.1667 16.6667 20C16.6667 21.8333 18.1667 23.3333 20 23.3333ZM13.3333 13.3333H26.6667V26.6667H13.3333V13.3333Z" fill="#6772e5" />
          </svg>
          Connect with Stripe
        </button>
        
        <button
          onClick={generateTestData}
          disabled={isLoading}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '4px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            fontWeight: 'bold',
          }}
        >
          {isLoading ? 'Adding Test Data...' : 'Add Test Data'}
        </button>
        
        <button
          onClick={() => setShowApiKeyInfo(!showApiKeyInfo)}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Setup LLM Chat
        </button>
      </div>
      
      {showApiKeyInfo && (
        <div style={{
          backgroundColor: '#fff7ed',
          border: '1px solid #fdba74',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#9a3412' }}>Setup OpenAI API Key</h3>
          <p style={{ margin: '0 0 12px 0' }}>
            To enable the AI chat assistant, you need to add your OpenAI API key to the <code>.env.local</code> file:
          </p>
          <pre style={{
            backgroundColor: '#fef3c7', 
            padding: '12px',
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
            OPENAI_API_KEY=your_openai_api_key_here
          </pre>
          <p style={{ margin: '12px 0 0 0' }}>
            After adding the key, restart the server for changes to take effect.
          </p>
        </div>
      )}
      
      {loadingMessage && (
        <div style={{
          padding: '10px',
          backgroundColor: success ? '#dcfce7' : '#fee2e2',
          borderRadius: '4px',
          marginTop: '10px',
          color: success ? '#166534' : '#991b1b'
        }}>
          {loadingMessage}
        </div>
      )}
    </div>
  );
} 