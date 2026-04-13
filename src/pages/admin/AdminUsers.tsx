import { showToast } from '../../utils/toast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { UserProfile } from '../../contexts/AuthContext';

export const AdminUsers = () => {
  const [activeTab, setActiveTab] = useState<'visitors' | 'owners'>('visitors');
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const name = u.displayName || u.name || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const visitors = filteredUsers.filter(u => u.role === 'visitor');
  const owners = filteredUsers.filter(u => u.role === 'owner');

  const handleStatusToggle = async (uid: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await userService.updateUserStatus(uid, newStatus as any);
      setUsers(users.map(u => u.uid === uid ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error("Error updating user status:", error);
      showToast("An error occurred", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage platform visitors and property owners.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('visitors')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'visitors' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Property Seekers (Visitors)
        </button>
        <button
          onClick={() => setActiveTab('owners')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'owners' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Property Owners
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {activeTab === 'visitors' ? 'All Visitors' : 'All Property Owners'}
          </h2>
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading users...</div>
          ) : activeTab === 'visitors' ? (
            <>
              {/* Desktop Table */}
              <table className="w-full text-left border-collapse hidden md:table">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Registration Date</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visitors.map((visitor) => {
                    const status = (visitor as any).status || 'Active';
                    return (
                    <tr key={visitor.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{visitor.displayName || 'Unnamed User'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{visitor.email}</div>
                        <div className="text-xs text-slate-500">{visitor.phoneNumber || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {visitor.createdAt?.toDate ? visitor.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleStatusToggle(visitor.uid, status)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {visitors.map((visitor) => {
                  const status = (visitor as any).status || 'Active';
                  return (
                    <div key={visitor.uid} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{visitor.displayName || 'Unnamed User'}</div>
                          <div className="text-xs text-slate-500">{visitor.email}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="text-[10px] text-slate-400 font-medium">
                          Joined: {visitor.createdAt?.toDate ? visitor.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                        </div>
                        <button 
                          onClick={() => handleStatusToggle(visitor.uid, status)}
                          className="text-xs font-bold text-blue-600"
                        >
                          {status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {visitors.length === 0 && (
                <div className="px-6 py-8 text-center text-slate-500 text-sm">No visitors found.</div>
              )}
            </>
          ) : (
            <>
              {/* Desktop Table */}
              <table className="w-full text-left border-collapse hidden md:table">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Registration Date</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {owners.map((owner) => {
                    const status = (owner as any).status || 'Active';
                    return (
                    <tr key={owner.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{owner.displayName || 'Unnamed Owner'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{owner.email}</div>
                        <div className="text-xs text-slate-500">{owner.phoneNumber || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {owner.createdAt?.toDate ? owner.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => navigate(`/admin-secret-dashboard/users/owner/${owner.uid}`)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline mr-4"
                        >
                          View Profile
                        </button>
                        <button 
                          onClick={() => handleStatusToggle(owner.uid, status)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {owners.map((owner) => {
                  const status = (owner as any).status || 'Active';
                  return (
                    <div key={owner.uid} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{owner.displayName || 'Unnamed Owner'}</div>
                          <div className="text-xs text-slate-500">{owner.email}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="text-[10px] text-slate-400 font-medium">
                          Joined: {owner.createdAt?.toDate ? owner.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => navigate(`/admin-secret-dashboard/users/owner/${owner.uid}`)}
                            className="text-xs font-bold text-blue-600"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleStatusToggle(owner.uid, status)}
                            className="text-xs font-bold text-blue-600"
                          >
                            {status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {owners.length === 0 && (
                <div className="px-6 py-8 text-center text-slate-500 text-sm">No owners found.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
