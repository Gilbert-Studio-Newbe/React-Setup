'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import dynamic from 'next/dynamic';
import { ReactFlowProps, ReactFlowProvider } from '@xyflow/react';

// Create a context to track if we're already inside a ReactFlowProvider
const ReactFlowProviderContext = createContext(false);

// Hook to check if we're inside a ReactFlowProvider
export function useIsInsideReactFlowProvider() {
  return useContext(ReactFlowProviderContext);
}

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
  // Check if we're already inside a ReactFlowProvider
  const isInsideProvider = useIsInsideReactFlowProvider();

  // If we're already inside a provider, don't wrap again
  if (isInsideProvider) {
    console.warn(
      'ClientReactFlowWithProvider: Component is already inside a ReactFlowProvider. ' +
      'Skipping additional provider to prevent double wrapping.'
    );
    return <ClientOnlyReactFlow {...props} />;
  }

  // If we're not inside a provider, wrap with one
  return (
    <ReactFlowProvider>
      <ReactFlowProviderContext.Provider value={true}>
        <ClientOnlyReactFlow {...props} />
      </ReactFlowProviderContext.Provider>
    </ReactFlowProvider>
  );
} 