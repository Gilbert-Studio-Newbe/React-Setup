'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/spinner';

// Dynamically import the CalculatorExample component with SSR disabled
const CalculatorExample = dynamic(
  () => import('@/app/flow/calculator-example'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">Loading Calculator Example...</p>
        </div>
      </div>
    ),
  }
);

export default function CalculatorPage() {
  return <CalculatorExample />;
} 