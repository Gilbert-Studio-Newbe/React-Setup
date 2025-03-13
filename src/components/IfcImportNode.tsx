'use client';

import React, { memo, useState, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface IfcImportNodeData {
  label?: string;
  onFileImport?: (file: File) => void;
}

const IfcImportNode = ({ data, isConnectable }: NodeProps<IfcImportNodeData>) => {
  const { label = 'IFC Import' } = data || {};
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isImported, setIsImported] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if it's an IFC file
      if (!file.name.toLowerCase().endsWith('.ifc')) {
        alert('Please select an IFC file (.ifc)');
        return;
      }
      
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      setIsImported(true);
      
      // Call the onFileImport callback if provided
      if (data?.onFileImport) {
        data.onFileImport(file);
      }
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="p-4 rounded-md border-2 border-black bg-white dark:bg-gray-800 shadow-md w-[280px]">
      {/* Title */}
      <div className="mb-3 text-lg font-bold text-black dark:text-white">
        {label}
      </div>
      
      {/* File Input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".ifc"
        className="hidden"
      />
      
      {/* Import Button */}
      <button
        onClick={handleBrowseClick}
        className="w-full mb-3 px-4 py-2 bg-white hover:bg-gray-50 text-black border-2 border-black rounded-md shadow transition-all duration-200 text-sm font-medium flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        {isImported ? 'Change IFC File' : 'Import IFC File'}
      </button>
      
      {/* File Info (shown after import) */}
      {isImported && (
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md border border-gray-300 dark:border-gray-600">
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">File Name:</span>
            <div className="text-sm text-black dark:text-white truncate" title={fileName}>
              {fileName}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Size:</span>
            <div className="text-sm text-black dark:text-white">
              {fileSize}
            </div>
          </div>
        </div>
      )}
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: '#000', 
          width: '10px', 
          height: '10px',
          border: '2px solid #000'
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(IfcImportNode); 