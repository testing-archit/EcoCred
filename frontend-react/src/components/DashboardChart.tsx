import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardChartProps {
    data: Array<{ day: string; credits: number }>;
}

export function DashboardChart({ data }: DashboardChartProps) {
    const hasData = data && data.some(d => d.credits > 0);
    const chartData = data && data.length > 0 ? data : [
        { day: 'Mon', credits: 0 },
        { day: 'Tue', credits: 0 },
        { day: 'Wed', credits: 0 },
        { day: 'Thu', credits: 0 },
        { day: 'Fri', credits: 0 },
        { day: 'Sat', credits: 0 },
        { day: 'Sun', credits: 0 }
    ];

    return (
        <motion.div 
            className="h-80 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            {!hasData ? (
                <div className="h-full flex flex-col items-center justify-center text-secondary-400">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-lg font-medium">No data available yet</p>
                    <p className="text-sm mt-2">Start logging eco actions to see your carbon credits chart</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                            <stop offset="50%" stopColor="#22c55e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="strokeCredits" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#16a34a" />
                            <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="day" 
                        stroke="#64748b" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fill: '#64748b' }}
                    />
                    <YAxis 
                        stroke="#64748b" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `${value}`}
                        tick={{ fill: '#64748b' }}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <Tooltip
                        contentStyle={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '12px', 
                            border: '1px solid #e2e8f0', 
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            padding: '12px'
                        }}
                        itemStyle={{ color: '#22c55e', fontWeight: '600' }}
                        labelStyle={{ color: '#1f2937', fontWeight: '600', marginBottom: '4px' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="credits" 
                        stroke="url(#strokeCredits)" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorCredits)"
                        dot={{ fill: '#22c55e', r: 4, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
            )}
        </motion.div>
    );
}
