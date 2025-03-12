'use client';

import React from 'react';

interface FlowToolbarProps {
  onAction: (action: string) => void;
  className?: string;
}

export default function FlowToolbar({ onAction, className = '' }: FlowToolbarProps) {
  const tools = [
    {
      id: 'copy',
      label: 'Copy',
      icon: '📋',
      shortcut: '⌘C',
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: '📌',
      shortcut: '⌘V',
    },
    {
      id: 'cut',
      label: 'Cut',
      icon: '✂️',
      shortcut: '⌘X',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑️',
      shortcut: 'Del',
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: '🔄',
      shortcut: '⌘D',
    },
    {
      id: 'selectAll',
      label: 'Select All',
      icon: '🔍',
      shortcut: '⌘A',
    },
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex gap-2 ${className}`}>
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onAction(tool.id)}
          className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={`${tool.label} (${tool.shortcut})`}
        >
          <span className="text-xl">{tool.icon}</span>
          <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">{tool.label}</span>
        </button>
      ))}
    </div>
  );
} 