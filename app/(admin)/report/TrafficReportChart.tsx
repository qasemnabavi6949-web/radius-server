'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TrafficReportChart({ data }: { data: any[] }) {
  // Calculate max MB to format YAxis
  const maxBytes = Math.max(...data.map(d => d.total || 0));
  const isBytes = maxBytes < 1024;
  const isKB = maxBytes >= 1024 && maxBytes < 1024 * 1024;
  const divisor = isBytes ? 1 : isKB ? 1024 : 1024 * 1024;
  const suffix = isBytes ? 'B' : isKB ? 'KB' : 'MB';

  const chartData = data.map(d => ({
    ...d,
    download: parseFloat((d.download / divisor).toFixed(2)),
    upload: parseFloat((d.upload / divisor).toFixed(2)),
    total: parseFloat((d.total / divisor).toFixed(2)),
    realTraffic: parseFloat((d.realTraffic / divisor).toFixed(2))
  }));

  const formatYAxis = (tickItem: any) => {
    return `${tickItem} ${suffix}`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 0,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e5e7eb" />
        <XAxis 
          dataKey="day" 
          axisLine={true} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#6b7280' }} 
          dy={10} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#6b7280' }} 
          tickFormatter={formatYAxis}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '4px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#1f2937', fontSize: '13px' }}
          itemStyle={{ color: '#1f2937' }}
        />
        <Legend iconType="square" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', color: '#6b7280' }} />
        <Line type="monotone" dataKey="download" name="Download" stroke="#9ca3af" strokeWidth={2} dot={{ r: 3, fill: '#9ca3af' }} />
        <Line type="monotone" dataKey="upload" name="Upload" stroke="#d1d5db" strokeWidth={2} dot={{ r: 3, fill: '#d1d5db' }} />
        <Line type="monotone" dataKey="total" name="Total" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} />
        <Line type="monotone" dataKey="realTraffic" name="Real Traffic" stroke="#f97316" strokeWidth={2} dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
