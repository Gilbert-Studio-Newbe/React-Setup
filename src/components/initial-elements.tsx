import React from 'react';
import { MarkerType } from '@xyflow/react';
import { Node, Edge } from '@xyflow/react';

export const nodes: Node[] = [
  {
    id: 'numberinput-1',
    type: 'numberinput',
    position: { x: 100, y: 100 },
    data: {
      label: 'Number Input',
      value: 4,
      min: 0,
      max: 100,
      step: 1,
      unit: ''
    },
  },
  {
    id: 'numberinput-2',
    type: 'numberinput',
    position: { x: 500, y: 100 },
    data: {
      label: 'Number Input',
      value: 6,
      min: 0,
      max: 100,
      step: 1,
      unit: ''
    },
  },
  {
    id: 'calculation-1',
    type: 'calculation',
    position: { x: 300, y: 300 },
    data: {
      label: 'Calculation',
      operation: 'multiply',
      input1: 4,
      input2: 6,
      result: 24
    },
  },
];

export const edges: Edge[] = [
  {
    id: 'e1-3',
    source: 'numberinput-1',
    target: 'calculation-1',
    targetHandle: 'input1',
    type: undefined,
    style: { strokeWidth: 1.5, stroke: '#757575' },
    pathOptions: { 
      offset: 15, 
      borderRadius: 8,
      type: 'step'
    },
  },
  {
    id: 'e2-3',
    source: 'numberinput-2',
    target: 'calculation-1',
    targetHandle: 'input2',
    type: undefined,
    style: { strokeWidth: 1.5, stroke: '#757575' },
    pathOptions: { 
      offset: 15, 
      borderRadius: 8,
      type: 'step'
    },
  },
]; 