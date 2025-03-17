'use client';

import dynamic from 'next/dynamic';

// Import the calculator example with dynamic import to prevent SSR issues
const CalculatorExample = dynamic(() => import('./calculator-example'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen flex-col">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-lg text-gray-600">Loading Flow Editor...</p>
    </div>
  ),
});

export default function FlowPage() {
  return <CalculatorExample />;
} 