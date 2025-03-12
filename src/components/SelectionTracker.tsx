'use client';

import { useCallback } from 'react';
import { useOnSelectionChange } from '@xyflow/react';

interface SelectionTrackerProps {
  onSelectionChange: (nodeIds: string[], edgeIds: string[]) => void;
}

export default function SelectionTracker({ onSelectionChange }: SelectionTrackerProps) {
  const handleSelectionChange = useCallback(
    ({ nodes, edges }) => {
      const nodeIds = nodes.map((node) => node.id);
      const edgeIds = edges.map((edge) => edge.id);
      onSelectionChange(nodeIds, edgeIds);
    },
    [onSelectionChange]
  );

  useOnSelectionChange({
    onChange: handleSelectionChange,
  });

  // This component doesn't render anything
  return null;
} 