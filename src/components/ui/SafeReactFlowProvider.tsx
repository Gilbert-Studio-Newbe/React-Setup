'use client';

import React, { ReactNode } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useIsInsideReactFlowProvider } from './ClientOnlyReactFlow';

interface SafeReactFlowProviderProps {
  children: ReactNode;
}

/**
 * A component that safely wraps children with ReactFlowProvider only if they're not already wrapped.
 * This helps prevent the "zustand provider as an ancestor" error caused by double wrapping.
 * 
 * Usage:
 * ```tsx
 * <SafeReactFlowProvider>
 *   <YourComponentThatUsesReactFlowHooks />
 * </SafeReactFlowProvider>
 * ```
 */
export default function SafeReactFlowProvider({ children }: SafeReactFlowProviderProps) {
  // Check if we're already inside a ReactFlowProvider
  const isInsideProvider = useIsInsideReactFlowProvider();

  // If we're already inside a provider, don't wrap again
  if (isInsideProvider) {
    console.info('SafeReactFlowProvider: Already inside a ReactFlowProvider, skipping additional wrapping.');
    return <>{children}</>;
  }

  // If we're not inside a provider, wrap with one
  return (
    <ReactFlowProvider>
      {children}
    </ReactFlowProvider>
  );
} 