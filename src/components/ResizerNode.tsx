'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

interface ResizerNodeProps {
  data: {
    label: string;
  };
}

function ResizerNode({ data }: ResizerNodeProps) {
  return (
    <>
      <NodeResizer minWidth={50} minHeight={50} />
      <Handle 
        type="target" 
        position={Position.Left} 
        className="custom-handle bg-[var(--xy-handle-border-color-default)] rounded-sm w-2 h-1 border-none min-w-[2px] min-h-[2px]" 
      />
      <div>{data.label}</div>
      <div className="flex absolute bottom-0 w-full justify-evenly left-0">
        <Handle
          className="relative left-0 transform-none custom-handle bg-[var(--xy-handle-border-color-default)] rounded-sm w-2 h-1 border-none min-w-[2px] min-h-[2px]"
          id="a"
          type="source"
          position={Position.Bottom}
        />
        <Handle
          className="relative left-0 transform-none custom-handle bg-[var(--xy-handle-border-color-default)] rounded-sm w-2 h-1 border-none min-w-[2px] min-h-[2px]"
          id="b"
          type="source"
          position={Position.Bottom}
        />
      </div>
    </>
  );
}

export default memo(ResizerNode); 