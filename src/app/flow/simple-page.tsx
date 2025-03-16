'use client';

import React, { useState, useEffect } from 'react';
import { ReactFlowProvider, Background, Controls, MiniMap } from '@xyflow/react';

export default function SimpleFlowPage() {
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client side
  if (!isClient) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading Flow Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <ReactFlowProvider>
        <div style={{ width: '100%', height: '100%' }}>
          <Background color="#aaa" gap={20} size={1} variant="dots" />
          <Controls />
          <MiniMap />
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
            Flow page loaded successfully
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
} 