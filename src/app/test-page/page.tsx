// This is explicitly a Server Component
export default function TestPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
        Test Server Component Page
      </h1>
      <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
        This is a test page using a React Server Component to check rendering.
      </p>
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '1rem', 
        borderRadius: '0.5rem',
        border: '1px solid #ddd' 
      }}>
        <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Server component information:
        </p>
        <p>Time rendered: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
} 