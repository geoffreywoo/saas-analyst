export default function StripeSuccess() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ color: '#32325d', marginBottom: '20px' }}>Stripe Account Connected!</h1>
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>
        Your Stripe account has been successfully connected. We can now sync your subscription data.
      </p>
      <a 
        href="/"
        style={{
          backgroundColor: '#635bff',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '4px',
          textDecoration: 'none',
          fontWeight: 'bold',
        }}
      >
        Return to Dashboard
      </a>
    </div>
  );
} 