import React from 'react';

/**
 * UsersTab – lists registered users with role/status.
 * Later we can add pagination, search & actions. For now, basic table.
 */
const UsersTab = ({ dashboardData = {}, loading }) => {
  const { users = [] } = dashboardData;

  if (loading) {
    return <p className="text-gray-500">Loading users…</p>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">Users</h2>
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Role</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Joined</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((u) => (
            <tr key={u._id}>
              <td className="px-4 py-2 whitespace-nowrap">{u.firstName ? `${u.firstName} ${u.lastName}` : u.email}</td>
              <td className="px-4 py-2 whitespace-nowrap text-gray-500">{u.email}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                <span className={`px-2 py-0.5 text-xs rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{u.role}</span>
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-4 text-center text-gray-500">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTab;
