import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { propertyService } from '../../services/propertyService';
import { userService } from '../../services/userService';
import { bookingService } from '../../services/bookingService';
import { 
  Building2, 
  Clock, 
  Users, 
  Banknote, 
  Wallet, 
  CalendarCheck, 
  Hourglass, 
  Undo2, 
  ShieldCheck, 
  UserPlus, 
  TrendingDown, 
  TrendingUp,
  X
} from 'lucide-react';

export const AdminDashboard = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedAnalytic, setSelectedAnalytic] = useState<{ key: string, title: string } | null>(null);
  
  const [dashboardStats, setDashboardStats] = useState({
    totalListings: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    totalBookings: 0,
    revenueToday: 0,
    revenueThisMonth: 0,
    pendingPayments: 0,
    pendingRefunds: 0,
    loading: true
  });

  const [analyticDetails, setAnalyticDetails] = useState<Record<string, any[]>>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [properties, users, bookings] = await Promise.all([
          propertyService.getAllProperties(),
          userService.getAllUsers(),
          bookingService.getAllBookings()
        ]);

        const pendingApprovals = properties.filter(p => p.status === 'Pending');
        const recentlyApproved = properties.filter(p => p.status === 'Approved').sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)).slice(0, 5);
        
        const newUsers = users.sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)).slice(0, 5);

        // Calculate basic revenue (sum of platform fees or total cost depending on business logic)
        // For now, let's just sum up estimatedCost for completed/confirmed bookings
        const totalRevenue = bookings
          .filter(b => b.status === 'confirmed' || b.status === 'completed')
          .reduce((sum, b) => sum + ((b as any).totalAmount || (b as any).estimatedCost || 0) * 0.25, 0);

        const pendingPayments = bookings.filter(b => b.status === 'pending').length;
        const pendingRefunds = bookings.filter(b => b.status === 'cancelled').length; // Assuming cancelled bookings need refunds

        const now = new Date();
        const todayBookings = bookings.filter(b => {
          const bDate = b.createdAt?.toDate?.();
          return bDate && bDate.getDate() === now.getDate() && bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
        });
        const revenueToday = todayBookings
          .filter(b => b.status === 'confirmed' || b.status === 'completed')
          .reduce((sum, b) => sum + ((b as any).totalAmount || (b as any).estimatedCost || 0) * 0.25, 0);

        const thisMonthBookings = bookings.filter(b => {
          const bDate = b.createdAt?.toDate?.();
          return bDate && bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
        });
        const revenueThisMonth = thisMonthBookings
          .filter(b => b.status === 'confirmed' || b.status === 'completed')
          .reduce((sum, b) => sum + ((b as any).totalAmount || (b as any).estimatedCost || 0) * 0.25, 0);

        setDashboardStats({
          totalListings: properties.length,
          pendingApprovals: pendingApprovals.length,
          totalUsers: users.length,
          totalBookings: bookings.length,
          revenueToday: revenueToday,
          revenueThisMonth: revenueThisMonth,
          pendingPayments,
          pendingRefunds,
          loading: false
        });

        setAnalyticDetails({
          'pending-approvals': pendingApprovals.map(p => ({ id: p.id, name: p.title, owner: p.ownerId, date: p.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A' })),
          'recently-approved': recentlyApproved.map(p => ({ id: p.id, name: p.title, owner: p.ownerId, date: p.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A' })),
          'recently-registered': newUsers.map(u => ({ id: u.uid, name: u.displayName || 'Unnamed User', role: u.role, date: u.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A' })),
          'most-affordable': properties.sort((a, b) => a.pricePerDay - b.pricePerDay).slice(0, 5).map(p => ({ id: p.id, name: p.title, price: `₹${p.pricePerDay}/day`, location: p.area })),
          'most-expensive': properties.sort((a, b) => b.pricePerDay - a.pricePerDay).slice(0, 5).map(p => ({ id: p.id, name: p.title, price: `₹${p.pricePerDay}/day`, location: p.area })),
        });

        // Calculate property types
        const typeCounts = properties.reduce((acc: any, p) => {
          const type = p.type || 'Other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const colors = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'];
        const typesData = Object.keys(typeCounts).map((key, index) => ({
          name: key,
          value: typeCounts[key],
          color: colors[index % colors.length]
        }));
        setPropertyTypes(typesData);

        // Generate chart data based on timeframe
        const generateChartData = () => {
          const now = new Date();
          let data = [];
          if (timeframe === 'daily') {
            for (let i = 6; i >= 0; i--) {
              const d = new Date(now);
              d.setDate(now.getDate() - i);
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              
              const dayBookings = bookings.filter(b => {
                const bDate = b.createdAt?.toDate?.();
                return bDate && bDate.getDate() === d.getDate() && bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
              });
              
              const dayRevenue = dayBookings
                .filter(b => b.status === 'confirmed' || b.status === 'completed')
                .reduce((sum, b) => sum + ((b as any).totalAmount || (b as any).estimatedCost || 0) * 0.25, 0);

              data.push({ name: dayName, revenue: dayRevenue, bookings: dayBookings.length });
            }
          } else if (timeframe === 'weekly') {
            for (let i = 3; i >= 0; i--) {
              const d = new Date(now);
              d.setDate(now.getDate() - (i * 7));
              const weekName = `Week ${4 - i}`;
              
              const weekBookings = bookings.filter(b => {
                const bDate = b.createdAt?.toDate?.();
                if (!bDate) return false;
                const diffTime = Math.abs(now.getTime() - bDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= (i + 1) * 7 && diffDays > i * 7;
              });
              
              const weekRevenue = weekBookings
                .filter(b => b.status === 'confirmed' || b.status === 'completed')
                .reduce((sum, b) => sum + ((b as any).totalAmount || (b as any).estimatedCost || 0) * 0.25, 0);

              data.push({ name: weekName, revenue: weekRevenue, bookings: weekBookings.length });
            }
          } else if (timeframe === 'monthly') {
            for (let i = 5; i >= 0; i--) {
              const d = new Date(now);
              d.setMonth(now.getMonth() - i);
              const monthName = d.toLocaleDateString('en-US', { month: 'short' });
              
              const monthBookings = bookings.filter(b => {
                const bDate = b.createdAt?.toDate?.();
                return bDate && bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
              });
              
              const monthRevenue = monthBookings
                .filter(b => b.status === 'confirmed' || b.status === 'completed')
                .reduce((sum, b) => sum + ((b as any).totalAmount || (b as any).estimatedCost || 0) * 0.25, 0);

              data.push({ name: monthName, revenue: monthRevenue, bookings: monthBookings.length });
            }
          }
          return data;
        };

        setChartData(generateChartData());

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setDashboardStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [timeframe]);

  const stats = [
    { label: 'Total Listings', value: dashboardStats.loading ? '...' : dashboardStats.totalListings.toString(), icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Pending Approvals', value: dashboardStats.loading ? '...' : dashboardStats.pendingApprovals.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Total Users', value: dashboardStats.loading ? '...' : dashboardStats.totalUsers.toString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Revenue Today', value: dashboardStats.loading ? '...' : `₹${dashboardStats.revenueToday.toLocaleString()}`, icon: Banknote, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Total Revenue', value: dashboardStats.loading ? '...' : `₹${dashboardStats.revenueThisMonth.toLocaleString()}`, icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Total Bookings', value: dashboardStats.loading ? '...' : dashboardStats.totalBookings.toString(), icon: CalendarCheck, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  const analyticsCards = [
    { key: 'pending-payments', title: 'Pending Payments', value: dashboardStats.loading ? '...' : dashboardStats.pendingPayments.toString(), icon: Hourglass, color: 'text-orange-600', bg: 'bg-orange-100' },
    { key: 'refunds', title: 'Pending Refunds', value: dashboardStats.loading ? '...' : dashboardStats.pendingRefunds.toString(), icon: Undo2, color: 'text-red-600', bg: 'bg-red-100' },
    { key: 'pending-approvals', title: 'Pending Approvals', value: dashboardStats.loading ? '...' : dashboardStats.pendingApprovals.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { key: 'recently-approved', title: 'Recently Approved', value: dashboardStats.loading ? '...' : (analyticDetails['recently-approved']?.length || 0).toString(), icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { key: 'recently-registered', title: 'New Users', value: dashboardStats.loading ? '...' : (analyticDetails['recently-registered']?.length || 0).toString(), icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100' },
    { key: 'most-affordable', title: 'Most Affordable', value: 'View', icon: TrendingDown, color: 'text-teal-600', bg: 'bg-teal-100' },
    { key: 'most-expensive', title: 'Most Expensive', value: 'View', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold tracking-wide uppercase">Overview & Insights</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
              <div className="flex flex-col">
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
                <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">{stat.value}</div>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} strokeWidth={2} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Analytics Grid */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 mb-4">Deep Analytics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {analyticsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div 
                key={card.key} 
                onClick={() => setSelectedAnalytic({ key: card.key, title: card.title })}
                className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center cursor-pointer hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${card.bg} group-hover:-translate-y-1 transition-transform duration-300`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} strokeWidth={2} />
                </div>
                <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 mb-0.5 sm:mb-1">{card.value}</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Trends & Distribution</h2>
          <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            {(['daily', 'weekly', 'monthly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  timeframe === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Revenue Trends ({timeframe})</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                    formatter={(value: number) => [`₹${value}`, 'Revenue']}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 5, strokeWidth: 0, fill: '#2563EB' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Property Types</h3>
              <div className="h-[140px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyTypes.length > 0 ? propertyTypes : [{ name: 'No Data', value: 1, color: '#f1f5f9' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {(propertyTypes.length > 0 ? propertyTypes : [{ name: 'No Data', value: 1, color: '#f1f5f9' }]).map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold tracking-tight text-slate-900">{dashboardStats.totalListings}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-2">
                {propertyTypes.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                    <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: item.color }}></div>
                    <span className="truncate">{item.name}</span>
                    <span className="text-slate-400 ml-auto">{Math.round((item.value / dashboardStats.totalListings) * 100) || 0}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Bookings ({timeframe})</h3>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [value, 'Bookings']}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="bookings" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytic Detail Modal */}
      {selectedAnalytic && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setSelectedAnalytic(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">{selectedAnalytic.title} Details</h2>
              <button 
                onClick={() => setSelectedAnalytic(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50/50">
              {analyticDetails[selectedAnalytic.key] && analyticDetails[selectedAnalytic.key].length > 0 ? (
                <div className="space-y-3">
                  {analyticDetails[selectedAnalytic.key].map((item: any, idx: number) => (
                    <div key={item.id || idx} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-blue-200 transition-colors">
                      {Object.entries(item).filter(([k]) => k !== 'id').map(([k, v]) => (
                        <div key={k} className="w-full sm:flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{k}</div>
                          <div className="font-semibold text-slate-800 text-sm truncate">{v as React.ReactNode}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Hourglass className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">No data found</h3>
                  <p className="text-sm text-slate-500 max-w-sm">There is currently no detailed data available for this metric.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

