'use client';

import React, { useState } from 'react';

interface HelpPanelProps {
  className?: string;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Help"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-14 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-72 z-20">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Help</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Adding Nodes</h4>
              <p className="text-gray-600 dark:text-gray-400">Use the panel on the left to add new nodes to the canvas.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Connecting Nodes</h4>
              <p className="text-gray-600 dark:text-gray-400">Drag from a node's handle to another node's handle to create a connection.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Deleting</h4>
              <p className="text-gray-600 dark:text-gray-400">Select nodes and press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Delete</kbd> to remove them.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Navigation</h4>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="block">• Pan: Drag the canvas</span>
                <span className="block">• Zoom: Mouse wheel or pinch gesture</span>
                <span className="block">• Select: Click on nodes</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpPanel; 