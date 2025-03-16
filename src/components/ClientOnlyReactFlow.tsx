'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ReactFlowProps, ReactFlowProvider } from '@xyflow/react';

// Dynamically import ReactFlow with SSR disabled
const ReactFlow = dynamic(
  () => import('@xyflow/react').then((mod) => mod.ReactFlow),
  { ssr: false }
);

// Create a wrapper component that only renders on the client
function ClientOnlyReactFlow(props: ReactFlowProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Return a placeholder during SSR
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-500">
          Loading Flow Editor...
        </div>
      </div>
    );
  }

  // On the client, render the actual ReactFlow component
  return <ReactFlow {...props} />;
}

// Export a wrapped version that includes the ReactFlowProvider
export default function ClientReactFlowWithProvider(props: ReactFlowProps) {
  return (
    <ReactFlowProvider>
      <ClientOnlyReactFlow {...props} />
    </ReactFlowProvider>
  );
} 