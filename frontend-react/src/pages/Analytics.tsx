import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Activity, Users, Leaf } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from 'recharts';
import { useUser } from '../contexts/UserContext';

interface TrendDataPoint {
    date: string;
    credits: number;
    actions: number;
}

interface ActionTypeDataPoint {
    name: string;
    value: number;
}

interface TopCompany {
    name: string;
    credits: number;
}

export function Analytics() {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
    const [stats, setStats] = useState({
        totalCredits: 0,
        totalActions: 0,
        totalCompanies: 0,
        growthRate: 0
    });
    const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
    const [actionTypeData, setActionTypeData] = useState<ActionTypeDataPoint[]>([]);
    const [topCompanies, setTopCompanies] = useState<TopCompany[]>([]);
    const { user } = useUser();
    
    const isVerifier = user?.role?.toUpperCase() === 'VERIFIER';
    const isAuditor = user?.role?.toUpperCase() === 'AUDITOR';

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    async function loadAnalytics() {
        setLoading(true);
        try {
            // Placeholder - in real app would call api.getAnalytics(timeRange)
            const response = {
                stats: { totalCredits: 0, totalActions: 0, totalCompanies: 0, growthRate: 0 },
                trend: [],
                actionTypes: [],
                topCompanies: []
            };
            setStats(response.stats || {});
            setTrendData(response.trend || []);
            setActionTypeData(response.actionTypes || []);
            setTopCompanies(response.topCompanies || []);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    }

    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">
                        {isVerifier ? 'Verification Analytics' : isAuditor ? 'Audit Analytics' : 'Platform Analytics'}
                    </h1>
                    <p className="mt-2 text-secondary-600">
                        {isVerifier 
                            ? 'Track your verification performance and statistics.'
                            : isAuditor
                            ? 'Monitor platform compliance and audit metrics.'
                            : 'Comprehensive insights into platform performance and trends.'}
                        Comprehensive insights into carbon credit activities.
                    </p>
                </div>

                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
                    className="px-4 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last Year</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={40} className="animate-spin text-primary-600" />
                </div>
            ) : (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                                    <Leaf size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">Total Credits</p>
                                    <p className="text-2xl font-bold text-secondary-900">{stats.totalCredits}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">Total Actions</p>
                                    <p className="text-2xl font-bold text-secondary-900">{stats.totalActions}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">Companies</p>
                                    <p className="text-2xl font-bold text-secondary-900">{stats.totalCompanies}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">Growth Rate</p>
                                    <p className="text-2xl font-bold text-green-600">+{stats.growthRate}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Credits Trend Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200 mb-8">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Credits Over Time</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="credits"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorCredits)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Action Types Distribution */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Action Types Distribution</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={actionTypeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {actionTypeData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Companies */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Top Companies</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topCompanies}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip />
                                    <Bar dataKey="credits" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
