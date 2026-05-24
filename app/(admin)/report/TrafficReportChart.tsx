'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TrafficReportChart({ data }: { data: any[] }) {
  const rawData = Array.isArray(data) ? data : (data as any)?.data || [];

  const chartData = rawData.map((d: any) => {
    // گرفتن تاریخ و بریدن کاراکترهای اضافه برای تبدیل به حالت استاندارد YYYY-MM-DD
    let rawDay = d.Day || d.day || '';
    if (rawDay.includes('T')) {
      rawDay = rawDay.split('T')[0];
    }

    return {
      day: rawDay,
      download: parseFloat(d.Download || d.download || 0),
      upload: parseFloat(d.Upload || d.upload || 0),
      total: parseFloat(d.Total || d.total || 0),
      realTraffic: parseFloat(d.RealTraffic || d.realTraffic || 0)
    };
  });

  const formatYAxis = (tickItem: any) => {
    return `${tickItem} MB`;
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
          tick={{ fontSize: 11, fill: '#6b7280' }}
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
        
        {/* خط دانلود با رنگ آبی مشخص */}
        <Line type="monotone" dataKey="download" name="Download" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} />
        
        {/* خط آپلود با رنگ سبز مشخص */}
        <Line type="monotone" dataKey="upload" name="Upload" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4, fill: '#16a34a' }} />
        
        {/* خط مجموع ترافیک با رنگ نارنجی مشخص */}
        <Line type="monotone" dataKey="total" name="Total" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
