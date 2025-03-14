'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './BaseNode';
import Papa from 'papaparse';

// Extend BaseNodeData with CSV-specific properties
interface CSVImportNodeData extends BaseNodeData {
  csvData?: any[];
  fileName?: string;
  headers?: string[];
  rowCount?: number;
  previewRows?: any[];
  error?: string;
  isLoading?: boolean;
  isCollapsed?: boolean;
}

const defaultData: CSVImportNodeData = {
  label: 'CSV Import',
  csvData: [],
  fileName: '',
  headers: [],
  rowCount: 0,
  previewRows: [],
  error: '',
  isLoading: false,
  isCollapsed: false,
  outputValue: null
};

const CSVImportNode: React.FC<NodeProps<CSVImportNodeData>> = ({ data = defaultData, isConnectable, id }) => {
  const { setNodes } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize state with default values or data props
  const [csvData, setCsvData] = useState<any[]>(data.csvData || []);
  const [fileName, setFileName] = useState<string>(data.fileName || '');
  const [headers, setHeaders] = useState<string[]>(data.headers || []);
  const [rowCount, setRowCount] = useState<number>(data.rowCount || 0);
  const [previewRows, setPreviewRows] = useState<any[]>(data.previewRows || []);
  const [error, setError] = useState<string>(data.error || '');
  const [isLoading, setIsLoading] = useState<boolean>(data.isLoading || false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(data.isCollapsed || false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Update node data when state changes
  const updateNodeData = useCallback(() => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === id) {
          const newData: CSVImportNodeData = {
            ...node.data,
            csvData,
            fileName,
            headers,
            rowCount,
            previewRows,
            error,
            isLoading,
            isCollapsed,
            outputValue: csvData
          };
          return {
            ...node,
            data: newData
          };
        }
        return node;
      })
    );
  }, [csvData, fileName, headers, rowCount, previewRows, error, isLoading, isCollapsed, id, setNodes]);

  // Update node data when state changes
  useEffect(() => {
    updateNodeData();
  }, [csvData, fileName, headers, rowCount, previewRows, error, isLoading, isCollapsed, updateNodeData]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file) return;
    
    setIsLoading(true);
    setError('');
    setFileName(file.name);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          setIsLoading(false);
          return;
        }
        
        const data = results.data as any[];
        const headers = results.meta.fields || [];
        const previewRows = data.slice(0, 5); // Show first 5 rows as preview
        
        setCsvData(data);
        setHeaders(headers);
        setRowCount(data.length);
        setPreviewRows(previewRows);
        setIsLoading(false);
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setIsLoading(false);
      }
    });
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle click on file input button
  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'text/csv') {
      handleFileSelect(file);
    } else {
      setError('Please drop a valid CSV file');
    }
  }, [handleFileSelect]);

  // Toggle collapsed state
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  // Render the node content based on collapsed state
  const renderContent = () => {
    if (isCollapsed) {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate max-w-[180px] font-medium">
              {fileName || 'No file selected'}
            </span>
          </div>
          <button
            onClick={toggleCollapsed}
            className="nodrag p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      );
    }

    return (
      <>
        {/* File Input Area */}
        <div 
          className={`
            mb-4 p-4 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileButtonClick}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv" 
            onChange={handleFileInputChange}
          />
          
          {fileName ? (
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fileName}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rowCount} rows • {headers.length} columns</span>
              <button 
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 nodrag"
                onClick={(e) => {
                  e.stopPropagation();
                  setFileName('');
                  setCsvData([]);
                  setHeaders([]);
                  setRowCount(0);
                  setPreviewRows([]);
                }}
              >
                Change file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Drag & drop a CSV file here</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">or click to browse</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mb-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Data Preview */}
        {previewRows.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview (first {previewRows.length} rows)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {headers.slice(0, 4).map((header, index) => (
                      <th 
                        key={index} 
                        className="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate max-w-[80px]"
                      >
                        {header}
                      </th>
                    ))}
                    {headers.length > 4 && (
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        +{headers.length - 4} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {previewRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.slice(0, 4).map((header, colIndex) => (
                        <td 
                          key={colIndex} 
                          className="px-2 py-1 whitespace-nowrap text-gray-800 dark:text-gray-200 truncate max-w-[80px]"
                        >
                          {row[header]}
                        </td>
                      ))}
                      {headers.length > 4 && (
                        <td className="px-2 py-1 whitespace-nowrap text-gray-500 dark:text-gray-400">
                          ...
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
              {rowCount} rows total
            </div>
          </div>
        )}

        {/* Collapse Button */}
        <button
          onClick={toggleCollapsed}
          className="nodrag w-full flex items-center justify-center p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs text-gray-600 dark:text-gray-300"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          Collapse
        </button>
      </>
    );
  };

  return (
    <BaseNode<CSVImportNodeData>
      data={data}
      isConnectable={isConnectable}
      error={error}
      handles={{
        outputs: [
          { 
            id: 'output', 
            position: 50,
            style: { 
              background: '#f59e0b',
              border: '2px solid #f59e0b',
              width: '10px',
              height: '10px'
            }
          }
        ]
      }}
    >
      {renderContent()}
    </BaseNode>
  );
};

export default React.memo(CSVImportNode); 