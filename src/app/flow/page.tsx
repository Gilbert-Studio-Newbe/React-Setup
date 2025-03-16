'use client';

import dynamic from 'next/dynamic';

// Import the BasicFlow component with dynamic import to prevent SSR issues
const BasicFlow = dynamic(
  () => import('./basic-flow'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '5px solid #e0e0e0',
            borderTopColor: '#3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ fontSize: '18px', color: '#333' }}>Loading Flow Editor...</p>
        </div>
    </div>
    )
  }
);

export default function FlowPage() {
  return <BasicFlow />;
} 