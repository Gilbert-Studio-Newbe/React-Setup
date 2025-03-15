'use client';

import React, { useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';

interface ContextNodeMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onNodeSelect: (type: string) => void;
}

const ContextNodeMenu: React.FC<ContextNodeMenuProps> = ({ position, onClose, onNodeSelect }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Node types available for selection
  const nodeTypes = [
    { type: 'numberinput', label: 'Number Input' },
    { type: 'costinput', label: 'Cost Input' },
    { type: 'calculation', label: 'Calculation' },
    { type: 'join', label: 'Join String' },
    { type: 'csvimport', label: 'CSV Import' },
    { type: 'result', label: 'Result' },
    { type: 'ifcimport', label: 'IFC Import' },
    { type: 'jsonload', label: 'JSON Load' },
    { type: 'jsondisplay', label: 'JSON Display' },
    { type: 'debugdisplay', label: 'Debug Display' },
    { type: 'materialcost', label: 'Material Cost' },
    { type: 'jsonparameterformatter', label: 'Parameter Formatter' },
  ];

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle node selection
  const handleNodeSelect = (type: string) => {
    onNodeSelect(type);
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add Node</h3>
      </div>
      <div className="p-3 max-h-[400px] overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {nodeTypes.map((node) => (
            <button
              key={node.type}
              onClick={() => handleNodeSelect(node.type)}
              className="px-3 py-2 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200 text-sm font-medium flex items-center justify-center"
            >
              {node.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContextNodeMenu; 