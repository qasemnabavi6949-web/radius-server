'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PackageActivationChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 0,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis 
          dataKey="day" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          dy={10} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#64748b' }} 
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#1e293b' }}
          itemStyle={{ color: '#1e293b' }}
        />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
        <Bar dataKey="activations" name="Activations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
