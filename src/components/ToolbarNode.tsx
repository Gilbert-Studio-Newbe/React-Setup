'use client';

import React, { memo, useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';

interface ToolbarNodeProps {
  data: {
    label: string;
  };
}

const emojis = ['🚀', '🔥', '✨'];

function ToolbarNode({ data }: ToolbarNodeProps) {
  const [emoji, setEmoji] = useState('🚀');

  return (
    <>
      <NodeToolbar isVisible>
        {emojis.map(emoji => (
          <button 
            key={emoji} 
            onClick={() => setEmoji(emoji)} 
            aria-label={`Select emoji ${emoji}`}
            className="cursor-pointer bg-inherit border-none p-[5px_7px] m-[3px] rounded-full shadow-[var(--xy-node-boxshadow-default)] hover:bg-[#4d4d4d]"
          >
            {emoji}
          </button>
        ))}
      </NodeToolbar>
      <div>
        <div>{emoji}</div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div>{data.label}</div>
    </>
  );
}

export default memo(ToolbarNode); 