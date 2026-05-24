'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TrafficReportChart({ data }: { data: any[] }) {
  // گرفتن آرایه اصلی داده‌ها بر اساس ساختار لود شده از سرور شما
  const rawData = Array.isArray(data) ? data : (data as any)?.data || [];

  // ۱. ساخت آرایه خالی ۳۱ روزه ماه
  const fullMonthData = Array.from({ length: 31 }, (_, i) => {
    const dayNumber = i + 1;
    return {
      day: dayNumber.toString(),
      fullDate: `Day ${dayNumber}`,
      download: 0,
      upload: 0,
      total: 0
    };
  });

  // ۲. تزریق داده‌های واقعی دیتابیس (تبدیل بایت خام به مگابایت)
  rawData.forEach((d: any) => {
    const rawDayStr = d.day || ''; // نام فیلد در دیتابیس شما day با حروف کوچک است
    let dayString = '';

    if (rawDayStr && rawDayStr.includes('T')) {
      // برش دقیق تاریخ زولو: 2026-05-24T00:00:00.000Z
      const datePart = rawDayStr.split('T')[0]; // خروجی: "2026-05-24"
      const parts = datePart.split('-');        // خروجی: ["2026", "05", "24"]
      dayString = parts[2];                     // خروجی نهایی عدد روز: "24"
    } else if (rawDayStr && rawDayStr.includes('-')) {
      const parts = rawDayStr.split('-');
      dayString = parts[parts.length - 1];
    } else {
      dayString = rawDayStr;
    }

    const dayNum = parseInt(dayString);
    const dayIdx = dayNum - 1;

    if (dayIdx >= 0 && dayIdx < 31) {
      // تبدیل بایت خام به مگابایت (تقسیم بر 1024 * 1024) با دقت ۲ رقم اعشار
      const dlBytes = parseFloat(d.download_bytes) || 0;
      const ulBytes = parseFloat(d.upload_bytes) || 0;
      const ttlBytes = parseFloat(d.total_bytes) || 0;

      fullMonthData[dayIdx].download = parseFloat((dlBytes / 1048576).toFixed(2));
      fullMonthData[dayIdx].upload = parseFloat((ulBytes / 1048576).toFixed(2));
      fullMonthData[dayIdx].total = parseFloat((ttlBytes / 1048576).toFixed(2));
      
      // فرمت تمیز نمایش تاریخ در جدول پایین صفحه
      fullMonthData[dayIdx].fullDate = rawDayStr.includes('T') ? rawDayStr.split('T')[0] : rawDayStr;
    }
  });

  const formatYAxis = (tickItem: any) => {
    if (tickItem >= 1024) return `${(tickItem / 1024).toFixed(1)} GB`;
    return `${tickItem} MB`;
  };

  const formatTableBytes = (v: number) => {
    if (!v || v === 0) return '0.00 MB';
    if (v >= 1024) return `${(v / 1024).toFixed(2)} GB`;
    return `${v.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={fullMonthData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e5e7eb" />
          <XAxis dataKey="day" axisLine={true} tickLine={true} tick={{ fontSize: 11, fill: '#6b7280' }} dy={5} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={formatYAxis} />
          <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #e5e7eb', backgroundColor: '#fff', fontSize: '13px' }} formatter={(value: any) => [`${formatTableBytes(value)}`]} />
          <Legend iconType="square" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
          
          {/* خطوط رنگی بر اساس فیلدهای اصلاح‌شده فرانت‌اِند */}
          <Line type="monotone" dataKey="download" name="Download" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 2, fill: '#2563eb' }} connectNulls={true} />
          <Line type="monotone" dataKey="upload" name="Upload" stroke="#9ca3af" strokeWidth={2.5} dot={{ r: 2, fill: '#9ca3af' }} connectNulls={true} />
          <Line type="monotone" dataKey="total" name="Total" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: '#22c55e' }} connectNulls={true} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 border rounded-lg overflow-hidden shadow-sm bg-white">
        <div className="bg-gray-100 p-3 font-semibold border-b text-gray-700 text-xs uppercase">
          Monthly Full Days Traffic Table (1 to 31)
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-left bg-white text-xs border-collapse">
            <thead className="bg-gray-50 font-semibold text-gray-600 uppercase border-b sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3">Day</th>
                <th className="p-3">Download</th>
                <th className="p-3">Upload</th>
                <th className="p-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fullMonthData.map((row: any) => (
                <tr key={row.day} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium text-gray-700">{row.fullDate}</td>
                  <td className="p-3 text-blue-600 font-medium">{formatTableBytes(row.download)}</td>
                  <td className="p-3 text-gray-500">{formatTableBytes(row.upload)}</td>
                  <td className="p-3 text-green-600 font-medium">{formatTableBytes(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
