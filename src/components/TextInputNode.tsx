'use client';

import React, { Fragment, memo } from 'react';
import { Handle, useStore, Position, useReactFlow } from '@xyflow/react';

interface TextInputNodeProps {
  id: string;
}

const dimensionAttrs = ['width', 'height'];

export default memo(({ id }: TextInputNodeProps) => {
  const { setNodes } = useReactFlow();
  const dimensions = useStore((s) => {
    const node = s.nodeLookup.get('2-3');
    if (
      !node ||
      !node.measured.width ||
      !node.measured.height ||
      !s.edges.some((edge) => edge.target === id)
    ) {
      return null;
    }
    return {
      width: node.measured.width,
      height: node.measured.height,
    };
  });
  
  const updateDimension = (attr: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === '2-3') {
          const parentNode = nds.find(node => node.id === '2-1');
          const parentWidth = parentNode?.style?.width ? parentNode.style.width : Infinity;
          const parentHeight = parentNode?.style?.height ? parentNode.style.height : Infinity;
          
          const currentNode = nds.find(node => node.id === '2-3');
          const currentPosX = currentNode?.position?.x || 0;
          const currentPosY = currentNode?.position?.y || 0;
  
          const maxWidth = Math.max(parentWidth as number - currentPosX, 0);
          const maxHeight = Math.max(parentHeight as number - currentPosY, 0);
  
          const newSize = {
            width: attr === 'width' ? Math.min(value, maxWidth) : currentNode?.style?.width,
            height: attr === 'height' ? Math.min(value, maxHeight) : currentNode?.style?.height,
          };
  
          return {
            ...n,
            style: {
              ...n.style,
              [attr]: newSize[attr],
            },
          };
        }
  
        return n;
      }),
    );
  };
  
  return (
    <div className="w-[200px] font-mono text-left bg-white border-2 border-black p-4 rounded-md shadow-md dark:bg-gray-800 dark:border-gray-600">
      <div className="text-lg font-bold mb-2 text-black dark:text-white">Text Input</div>
      {dimensionAttrs.map((attr) => (
        <Fragment key={attr}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Node {attr}</label>
          <input
            type="number"
            value={dimensions ? parseInt(dimensions[attr as keyof typeof dimensions].toString()) : 0}
            onChange={updateDimension(attr)}
            className="w-full box-border mb-3 p-2 rounded border border-gray-300 dark:border-gray-600 nodrag focus:ring-2 focus:ring-black dark:focus:ring-gray-400 focus:border-transparent"
            disabled={!dimensions}
          />
        </Fragment>
      ))}
      {!dimensionAttrs && <div className="text-gray-500 dark:text-gray-400">No node connected</div>}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-black dark:!bg-gray-400 rounded-sm w-2 h-4 border-none min-w-[2px] min-h-[4px]" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-black dark:!bg-gray-400 rounded-sm w-2 h-4 border-none min-w-[2px] min-h-[4px]" 
      />
    </div>
  );
}); 