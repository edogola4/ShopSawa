import React from 'react';

/**
 * OrdersTab – lists recent orders with basic info and status badge.
 * Placeholder implementation. To be expanded with filters & actions later.
 */
const OrdersTab = ({ dashboardData = {}, loading }) => {
  const { orders = [] } = dashboardData;

  if (loading) {
    return <p className="text-gray-500">Loading orders…</p>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">Orders</h2>
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Order #</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Customer</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Total</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((o) => (
            <tr key={o._id}>
              <td className="px-4 py-2 whitespace-nowrap">{o.orderNumber}</td>
              <td className="px-4 py-2 whitespace-nowrap text-gray-500">{o.customer?.name || 'Guest'}</td>
              <td className="px-4 py-2 whitespace-nowrap">${o.total?.toFixed?.(2) ?? o.total}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                <span className={`px-2 py-0.5 text-xs rounded-full ${o.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{o.status}</span>
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-4 text-center text-gray-500">No orders found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTab;
