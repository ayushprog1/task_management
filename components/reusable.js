// components/reusable.js
import React from 'react';

// --- 1. Basic Reusable Card Component ---
export const Card = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white shadow-lg rounded-xl p-6 ${className}`}>
      {title && <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>}
      {children}
    </div>
  );
};

// --- 2. Reusable Table Component ---
export const DataTable = ({ columns, data, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow-md">
        <thead className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="py-3 px-6 text-left">{col.header}</th>
            ))}
            {(onEdit || onDelete) && <th className="py-3 px-6 text-center">Actions</th>}
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm font-light">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-100">
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-6 text-left whitespace-nowrap">
                  {/* Render based on custom renderer or plain data */}
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="py-3 px-6 text-center">
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(row)}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(row)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- 3. Simple Status Badge Component ---
export const StatusBadge = ({ status }) => {
    let colorClass = 'bg-gray-200 text-gray-800';
    if (status === 'Done') {
        colorClass = 'bg-green-100 text-green-800';
    } else if (status === 'InProgress') {
        colorClass = 'bg-yellow-100 text-yellow-800';
    } else if (status === 'Admin') {
        colorClass = 'bg-red-100 text-red-800';
    } else if (status === 'Manager') {
        colorClass = 'bg-blue-100 text-blue-800';
    }
    
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
            {status}
        </span>
    );
};