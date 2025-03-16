'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { NodeProps } from '@xyflow/react';

// Dynamically import the DebugDisplayNode with SSR disabled
const DebugDisplayNode = dynamic(
  () => import('./DebugDisplayNode'),
  { ssr: false }
);

// Create a wrapper component that only renders on the client
function ClientOnlyDebugDisplayNode(props: NodeProps<any>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Return a placeholder with the same dimensions during SSR
    return (
      <div className="p-4 rounded-md border-2 border-black bg-white dark:bg-gray-800 shadow-md w-[350px]">
        <div className="text-lg font-bold text-black dark:text-white">
          {props.data?.label || 'Debug Display'}
        </div>
        <div className="text-gray-500 dark:text-gray-400 italic">
          Loading debug information...
        </div>
      </div>
    );
  }

  // On the client, render the actual component
  return <DebugDisplayNode {...props} />;
}

export default ClientOnlyDebugDisplayNode; 