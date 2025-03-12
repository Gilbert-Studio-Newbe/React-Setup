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
    <div className="w-[150px] font-mono text-left">
      {dimensionAttrs.map((attr) => (
        <Fragment key={attr}>
          <label>Node {attr}</label>
          <input
            type="number"
            value={dimensions ? parseInt(dimensions[attr as keyof typeof dimensions].toString()) : 0}
            onChange={updateDimension(attr)}
            className="w-full box-border my-[5px] mx-0 rounded border border-[var(--xy-node-border-default)] nodrag appearance-textfield"
            disabled={!dimensions}
          />
        </Fragment>
      ))}
      {!dimensionAttrs && 'no node connected'}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="custom-handle bg-[var(--xy-handle-border-color-default)] rounded-sm w-2 h-1 border-none min-w-[2px] min-h-[2px]" 
      />
    </div>
  );
}); 