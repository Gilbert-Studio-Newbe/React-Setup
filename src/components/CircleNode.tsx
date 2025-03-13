'use client';

import React, { memo } from 'react';
import { Handle, useStore, Position } from '@xyflow/react';

interface CircleNodeProps {
  id: string;
}

export default memo(({ id }: CircleNodeProps) => {
  const label = useStore((s) => {
    const node = s.nodeLookup.get(id);

    if (!node) {
      return null;
    }

    return `Position x:${parseInt(node.position.x.toString())} y:${parseInt(
      node.position.y.toString()
    )}`;
  });

  return (
    <div className="rounded-full h-[100px] w-[100px] font-mono text-center bg-white border-2 border-black flex items-center justify-center shadow-md dark:bg-gray-800 dark:border-gray-600">
      <div className="text-sm text-black dark:text-white">{label || 'no node connected'}</div>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-black dark:!bg-gray-400 rounded-sm w-2 h-4 border-none min-w-[2px] min-h-[4px]" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-black dark:!bg-gray-400 rounded-sm w-2 h-4 border-none min-w-[2px] min-h-[4px]" 
      />
    </div>
  );
}); 