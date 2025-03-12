'use client';

import React, { memo } from 'react';

interface AnnotationNodeProps {
  data: {
    level: number;
    label: string | React.ReactNode;
    arrowStyle?: React.CSSProperties;
  };
}

function AnnotationNode({ data }: AnnotationNodeProps) {
  return (
    <>
      <div className="p-2.5 flex">
        <div className="mr-1">{data.level}.</div>
        <div>{data.label}</div>
      </div>
      {data.arrowStyle && (
        <div className="absolute text-2xl" style={data.arrowStyle}>
          ⤹
        </div>
      )}
    </>
  );
}

export default memo(AnnotationNode); 