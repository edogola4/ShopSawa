import React from 'react';
import { formatDate, formatCurrency } from '../../utils/format';

const DataTable = ({
  columns,
  data,
  rowKey = 'id',
  loading = false,
  emptyText = 'No data available',
  onRowClick,
  className = ''
}) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyText}</p>
      </div>
    );
  }

  // Format cell content based on type
  const formatCellContent = (value, column) => {
    if (value === undefined || value === null) return '-';
    
    switch (column.dataType) {
      case 'date':
        return formatDate(value);
      case 'currency':
        return formatCurrency(value);
      case 'status':
        return (
          <span 
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              value === 'active' || value === 'completed' || value === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {String(value).toUpperCase()}
          </span>
        );
      case 'custom':
        return column.render ? column.render(value) : String(value);
      default:
        return String(value);
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr 
                key={item[rowKey] || rowIndex}
                onClick={() => onRowClick && onRowClick(item)}
                className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : 'hover:bg-gray-50'}
              >
                {columns.map((column) => (
                  <td 
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {formatCellContent(
                      column.dataIndex ? item[column.dataIndex] : item[column.key],
                      column
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
