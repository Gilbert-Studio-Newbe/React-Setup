import dynamic from 'next/dynamic';

// Import the SimpleFlowPage component with dynamic import to prevent SSR issues
const SimpleFlowPage = dynamic(
  () => import('./simple-page'),
  { ssr: false }
);

export default function FlowPage() {
  return <SimpleFlowPage />;
} 