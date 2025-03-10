'use client';

import { useState, useEffect } from 'react';
import { PrismaClient } from '@prisma/client';

export default function StripeConnect() {
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Fetch existing Stripe connections
  useEffect(() => {
    async function fetchConnections() {
      try {
        const response = await fetch('/api/stripe/connections');
        if (response.ok) {
          const data = await response.json();
          setConnections(data.connections || []);
        }
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      }
    }

    fetchConnections();
  }, []);

  // Start the Stripe connect flow
  const handleConnectStripe = () => {
    setLoading(true);
    
    // Generate a random state param for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    
    // Redirect to our server-side handler which will redirect to Stripe
    window.location.href = `/api/stripe/connect?state=${state}`;
  };

  // Sync data from a connected Stripe account
  const handleSync = async (stripeAccountId: string) => {
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/stripe/sync/all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stripeAccountId }),
      });

      if (response.ok) {
        setSyncStatus('synced');
        setLastSynced(new Date().toLocaleString());
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  // Render connection list or connect button
  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Stripe Integration</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Connect your Stripe account to analyze your subscription data.</p>
        </div>

        {connections.length > 0 ? (
          <div className="mt-5">
            <h4 className="text-md font-medium leading-6 text-gray-700">Connected Accounts</h4>
            <ul className="mt-3 divide-y divide-gray-200 border-t border-b border-gray-200">
              {connections.map((connection) => (
                <li key={connection.stripeAccountId} className="flex items-center justify-between py-3">
                  <div>
                    <span className="text-sm font-medium">{connection.stripeAccountId}</span>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Connected
                    </span>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => handleSync(connection.stripeAccountId)}
                      disabled={syncStatus === 'syncing'}
                    >
                      {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Data'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {lastSynced && (
              <p className="mt-2 text-xs text-gray-500">
                Last synced: {lastSynced}
              </p>
            )}
            {syncStatus === 'error' && (
              <p className="mt-2 text-xs text-red-500">
                Error syncing data. Please try again.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5">
            <button
              type="button"
              onClick={handleConnectStripe}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              {loading ? 'Connecting...' : 'Connect Stripe Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 