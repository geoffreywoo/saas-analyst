'use client';

export default function StripeConnectButton() {
  return (
    <a 
      href="/api/stripe/connect"
      style={{
        display: 'inline-block',
        backgroundColor: '#635bff',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '4px',
        textDecoration: 'none',
        fontWeight: 'bold',
        margin: '20px 0',
      }}
    >
      Connect with Stripe
    </a>
  );
} 