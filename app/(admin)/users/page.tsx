'use client';
import { useState, useEffect } from 'react';
import { X, User, Key, Package, Activity, WifiOff, Zap, RefreshCw, Edit2, Plus, Trash2, FileClock, Eye, EyeOff } from 'lucide-react';
import dynamic from 'next/dynamic';

const UserTrafficChart = dynamic(() => import('../report/TrafficReportChart'), { ssr: false });

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [manageTab, setManageTab] = useState<'overview' | 'edit' | 'traffic' | 'history'>('overview');

  const [userTrafficData, setUserTrafficData] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isUserTrafficLoading, setIsUserTrafficLoading] = useState(false);
  const [userTrafficMonth, setUserTrafficMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [userTrafficYear, setUserTrafficYear] = useState(new Date().getFullYear().toString());

  const [trafficTarget, setTrafficTarget] = useState('all');
  const [trafficAmount, setTrafficAmount] = useState('');
  const [trafficComment, setTrafficComment] = useState('');

  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStaticIp, setEditStaticIp] = useState('');
  const [editName, setEditName] = useState('');
  const [editFamily, setEditFamily] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNationalId, setEditNationalId] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editExpiration, setEditExpiration] = useState('');
  const [editProfile, setEditProfile] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data || []);
    } catch (e) {}
  };

  const fetchUserTraffic = async () => {
    if (!selectedUser) return;
    setIsUserTrafficLoading(true);
    try {
      const res = await fetch(`/api/report/traffic?year=${userTrafficYear}&month=${userTrafficMonth}&username=${selectedUser.username}`);
      const j = await res.json();
      setUserTrafficData(j.data || j || []);
    } catch (e) {}
    setIsUserTrafficLoading(false);
  };

  const fetchUserHistory = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/users/${selectedUser.username}/history`);
      const j = await res.json();
      setHistoryData(j.data || j || []);
    } catch (e) {}
  };

  useEffect(() => { fetchUsers(); }, []);
  
  useEffect(() => { 
    if (manageTab === 'traffic') fetchUserTraffic(); 
    if (manageTab === 'history') fetchUserHistory();
  }, [manageTab, selectedUser, userTrafficYear, userTrafficMonth]);

  const calculateDaysValue = (exp: string) => {
    if (!exp || exp === '') return 'Permanent';
    const ed = new Date(exp);
    const td = new Date();
    ed.setHours(0,0,0,0); td.setHours(0,0,0,0);
    const diff = Math.ceil((ed.getTime() - td.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} Days` : 'Expired';
  };

  const getUserStatus = (u: any) => {
    if (!u) return "Disabled";
    if (u.status === "Online" || u.status === "online" || u.is_online === 1) return "Online";
    if (u.accountStatus === "Disabled" && parseFloat(u.daily_usage || u.daily_traffic || "0") > 0) return "Depleted";
    if (u.accountStatus === "Disabled") return "Disabled";
    return "Active";
  };

  const countStatus = (st: string) => users.filter(u => getUserStatus(u) === st).length;

  const handleOverviewAction = async (actionType: string, payload?: any) => {
    let url = `/api/users/${selectedUser.username}/${actionType}`;
    try {
      const res = await fetch(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : null
      });
      if (res.ok) {
        alert('Success!');
        setIsManageModalOpen(false);
        setIsTrafficModalOpen(false);
        fetchUsers();
      }
    } catch (e) {}
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${selectedUser.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: editPassword, group: editProfile, staticIp: editStaticIp,
          name: editName, family: editFamily, phone: editPhone, email: editEmail,
          address: editAddress, nationalId: editNationalId, note: editNote, expiration: editExpiration
        })
      });
      if (res.ok) { alert("Saved successfully!"); setIsManageModalOpen(false); fetchUsers(); }
    } catch (err) {}
  };
  return (
    <div className="space-y-4 p-6 bg-gray-50 min-h-screen text-gray-800 text-sm">
      <div className="flex justify-between items-center bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-6 font-medium">
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Online ({countStatus('Online')})</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Active ({countStatus('Active')})</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-400 rounded-sm"></span> Depleted ({countStatus('Depleted')})</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Disabled ({countStatus('Disabled')})</div>
        </div>
        <button onClick={() => setIsAddUserModalOpen(true)} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 text-gray-600 font-bold border-b">
              <th className="p-3 w-10"><input type="checkbox" /></th>
              <th className="p-3 w-16">Status</th>
              <th className="p-3">Username</th>
              <th className="p-3">Expiration</th>
              <th className="p-3">Parent</th>
              <th className="p-3">Remaining Traffic</th>
              <th className="p-3">Daily Traffic</th>
              <th className="p-3">Remaining Days</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const st = getUserStatus(u);
              return (
                <tr 
                  key={i} 
                  onClick={() => { setSelectedUser(u); setManageTab('overview'); setTrafficAmount(''); setTrafficComment(''); setEditUsername(u.username); setEditPassword(u.password || ''); setEditStaticIp(u.staticIp || ''); setEditName(u.name || ''); setEditFamily(u.family || ''); setEditPhone(u.phone || ''); setEditEmail(u.email || ''); setEditAddress(u.address || ''); setEditNationalId(u.nationalId || ''); setEditNote(u.note || ''); setEditExpiration(u.expiration ? u.expiration.split('T')[0] : ''); setEditProfile(u.group || '100GB2MB-30d'); setIsManageModalOpen(true); }} 
                  className="hover:bg-slate-50/80 transition-all duration-150 border-b border-gray-200 cursor-pointer even:bg-gray-50/20 text-[14px]"
                >
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-400 text-sky-600 focus:ring-sky-500 w-4 h-4" /></td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide uppercase border ${
                      st === 'Online' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                      st === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                      st === 'Depleted' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                      'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      <span className={`w-3 h-3 rounded-full ${st === 'Online' ? 'bg-blue-600 animate-pulse' : st === 'Active' ? 'bg-emerald-600' : st === 'Depleted' ? 'bg-amber-600' : 'bg-rose-600'}`}></span>
                      {st}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">{u.username}</td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{u.expiration ? u.expiration.replace('T', ' ').substring(0, 19) : 'Permanent'}</td>
                  <td className="py-3 px-4 text-gray-600 font-medium">{u.parent || 'admin'}</td>
                  <td className="py-3 px-4"><span className="font-bold text-slate-800">{u.dataLimitString || 'Unlimited'}</span></td>
                  <td className="py-3 px-4"><span className="font-bold text-slate-800">{u.daily_usage || '0.00 MB'}</span></td>
                  <td className="py-3 px-4"><span className={`font-bold ${calculateDaysValue(u.expiration).includes('Expired') ? 'text-rose-600' : 'text-sky-700'}`}>{calculateDaysValue(u.expiration)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden text-gray-800 flex flex-col h-[550px]">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sky-600 font-bold text-lg">
                <span>Manage User: {selectedUser?.username}</span>
              </div>
              <button onClick={() => setIsManageModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
            </div>

            <div className="flex border-b bg-white px-4 text-xs font-semibold text-gray-500 gap-6">
              <button onClick={() => setManageTab('overview')} className={`py-2 border-b-2 ${manageTab === 'overview' ? 'border-sky-500 text-sky-600' : 'border-transparent hover:text-gray-700'}`}>Overview</button>
              <button onClick={() => setManageTab('edit')} className={`py-2 border-b-2 ${manageTab === 'edit' ? 'border-sky-500 text-sky-600' : 'border-transparent hover:text-gray-700'}`}>Edit</button>
              <button onClick={() => setManageTab('traffic')} className={`py-2 border-b-2 ${manageTab === 'traffic' ? 'border-sky-500 text-sky-600' : 'border-transparent hover:text-gray-700'}`}>Traffic</button>
              <button onClick={() => setManageTab('history')} className={`py-2 border-b-2 ${manageTab === 'history' ? 'border-sky-500 text-sky-600' : 'border-transparent hover:text-gray-700'}`}>History</button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-white">
              {manageTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleOverviewAction('status')} className="p-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg flex flex-col items-center justify-center text-center gap-2 shadow-sm transition"><Zap className="w-5 h-5" /><span className="text-[10px] font-bold">Toggle Status</span></button>
                    <button onClick={() => handleOverviewAction('charge')} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex flex-col items-center justify-center text-center gap-2 shadow-sm transition"><RefreshCw className="w-5 h-5" /><span className="text-[10px] font-bold">Charge User</span></button>
                    <button onClick={() => setManageTab('edit')} className="p-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg flex flex-col items-center justify-center text-center gap-2 shadow-sm transition"><Package className="w-5 h-5" /><span className="text-[10px] font-bold">Edit Profile</span></button>
                    <button onClick={() => handleOverviewAction('disconnect')} className="p-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg flex flex-col items-center justify-center text-center gap-2 shadow-sm transition"><WifiOff className="w-5 h-5" /><span className="text-[10px] font-bold">Disconnect</span></button>
                    <button className="p-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg flex flex-col items-center justify-center text-center gap-2 shadow-sm transition"><Activity className="w-5 h-5" /><span className="text-[10px] font-bold">Reset Stats</span></button>
                    <button onClick={() => setManageTab('edit')} className="p-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg flex flex-col items-center justify-center text-center gap-2 shadow-sm transition"><Edit2 className="w-5 h-5" /><span className="text-[10px] font-bold">Rename</span></button>
                    <button className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex flex-col items-center justify-center text-center gap-2 shadow-sm transition col-span-1"><Trash2 className="w-5 h-5" /><span className="text-[10px] font-bold">Delete</span></button>
                    <button onClick={() => { setIsTrafficModalOpen(true); }} className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex col-span-3 items-center justify-center text-center gap-2 shadow-sm transition font-bold text-xs"><Plus className="w-4 h-4" /> + Add Traffic (MB)</button>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 text-xs space-y-3 font-medium">
                    <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Username / Name</span><span className="text-gray-900 font-bold">{selectedUser?.username}</span></div>
                    <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Phone Number</span><span className="text-gray-900">{selectedUser?.phone || 'Not Set'}</span></div>
                    <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Static IP</span><span className="text-blue-600 font-semibold">{selectedUser?.staticIp || 'Not Set'}</span></div>
                    <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Profile / Group</span><span className="text-blue-600 font-bold">{selectedUser?.group}</span></div>
                    <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Expiration</span><span className="text-gray-900 font-bold">{selectedUser?.expiration ? selectedUser.expiration.replace('T', ' ').substring(0, 19) : 'Permanent'}</span></div>
                    <div className="flex justify-between pt-1"><span className="text-gray-500">Remaining Traffic</span><span className="text-gray-900 font-bold bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">{selectedUser?.dataLimitString || '0.00 MB'}</span></div>
                  </div>
                </div>
              )}
              {manageTab === 'edit' && (
                <form onSubmit={handleSaveUserEdit} className="space-y-4 bg-white text-xs max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block font-bold text-gray-600 mb-1">Username</label><input type="text" value={editUsername} disabled className="w-full px-3 py-1.5 border rounded-lg bg-gray-100 text-gray-500" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">New Password</label><input type="text" value={editPassword} onChange={e=>setEditPassword(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" placeholder="Leave empty to keep old" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">First Name</label><input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Last Name</label><input type="text" value={editFamily} onChange={e=>setEditFamily(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Phone</label><input type="text" value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Email</label><input type="text" value={editEmail} onChange={e=>setEditEmail(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Address</label><input type="text" value={editAddress} onChange={e=>setEditAddress(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">National ID</label><input type="text" value={editNationalId} onChange={e=>setEditNationalId(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Static IP</label><input type="text" value={editStaticIp} onChange={e=>setEditStaticIp(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Expiration Date</label><input type="date" value={editExpiration} onChange={e=>setEditExpiration(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-1">Select Profile</label>
                      <select value={editProfile} onChange={e=>setEditProfile(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 focus:outline-none">
                        <option value="100GB2MB-30d">100GB2MB-30d</option>
                      </select>
                    </div>
                    <div className="md:col-span-2"><label className="block font-bold text-gray-600 mb-1">Note</label><textarea value={editNote} onChange={e=>setEditNote(e.target.value)} rows={2} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-lg font-bold shadow hover:bg-sky-600 transition">Save Changes</button>
                </form>
              )}
              {manageTab === 'traffic' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                    <h4 className="font-bold text-gray-700 text-xs">Daily Usage Reports</h4>
                    <div className="flex gap-2">
                      <select value={userTrafficYear} onChange={e=>setUserTrafficYear(e.target.value)} className="px-2 py-1 border rounded bg-white text-xs text-gray-800">
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                      </select>
                      <select value={userTrafficMonth} onChange={e=>setUserTrafficMonth(e.target.value)} className="px-2 py-1 border rounded bg-white text-xs text-gray-800">
                        {Array.from({length:12}).map((_,m)=> {
                          const v = (m+1).toString().padStart(2,'0');
                          return <option key={v} value={v}>{v}</option>
                        })}
                      </select>
                    </div>
                  </div>
                  {isUserTrafficLoading ? (
                    <div className="p-10 text-center text-gray-400 font-semibold">Loading charts...</div>
                  ) : (
                    <div className="h-64 border rounded-xl p-2 bg-gray-50">
                      <UserTrafficChart data={userTrafficData} />
                    </div>
                  )}
                </div>
              )}

              {manageTab === 'history' && (
                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-gray-700 border-b pb-2">User Connection History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border border-gray-100 rounded-lg">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                        <tr><th className="p-2">Action</th><th className="p-2">Details/Comment</th><th className="p-2">Date</th></tr>
                      </thead>
                      <tbody>
                        {historyData.map((h: any, idx: number) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-semibold text-sky-600">{h.action}</td>
                            <td className="p-2 text-gray-700">{h.details || h.comment || 'N/A'}</td>
                            <td className="p-2 text-gray-500">{h.date ? new Date(h.date).toLocaleString() : 'N/A'}</td>
                          </tr>
                        ))}
                        {historyData.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-gray-400">No history data available for this cycle.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isTrafficModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-gray-800">
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <h3 className="font-bold text-lg text-gray-700">Add/Remove Traffic</h3>
              <button onClick={() => setIsTrafficModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Username</label>
                <input type="text" value={selectedUser?.username || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 font-semibold" />
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Target</label>
                <select value={trafficTarget} onChange={e => setTrafficTarget(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-800 focus:outline-none">
                  <option value="all">Download + Upload</option>
                  <option value="down">Only Download</option>
                  <option value="up">Only Upload</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Amount (MB)</label>
                <input type="number" value={trafficAmount} onChange={e => setTrafficAmount(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 font-bold" />
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Comment</label>
                <textarea value={trafficComment} onChange={e => setTrafficComment(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none" />
              </div>
            </div>
            <div className="p-4 bg-white flex justify-end gap-2 border-t">
              <button onClick={() => setIsTrafficModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">Dismiss</button>
              <button onClick={async () => {
                const amt = parseFloat(trafficAmount) || 0;
                if (amt === 0) { alert('Please enter an amount'); return; }
                try {
                  const res = await fetch(`/api/users/${selectedUser.username}/add-traffic`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ traffic: amt, target: trafficTarget, comment: trafficComment })
                  });
                  if (res.ok) {
                    alert('Traffic Added Successfully!');
                    setIsManageModalOpen(false);
                    setIsTrafficModalOpen(false);
                    fetchUsers();
                  } else {
                    alert('Server Error!');
                  }
                } catch (e) {
                  alert('Network Error!');
                }
              }} className="px-4 py-2 bg-sky-400 hover:bg-sky-500 text-white rounded text-sm font-medium shadow-sm transition">Submit</button>
            </div>
          </div>
        </div>
      )}

      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-gray-800">
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <h3 className="font-bold text-lg text-gray-700">Create New User</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Username</label>
                <input type="text" id="new_user_name" className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900" placeholder="Enter username" />
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Password</label>
                <input type="text" id="new_user_pass" className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900" placeholder="Enter password" />
              </div>
            </div>
            <div className="p-4 bg-white flex justify-end gap-2 border-t">
              <button onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">Dismiss</button>
              <button onClick={async () => {
                const u = (document.getElementById('new_user_name') as HTMLInputElement)?.value || '';
                const p = (document.getElementById('new_user_pass') as HTMLInputElement)?.value || '';
                if (!u || !p) { alert('Please fill all fields'); return; }
                try {
                  const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: u, password: p })
                  });
                  if (res.ok) { alert('User Created Successfully!'); setIsAddUserModalOpen(false); fetchUsers(); } else { alert('Error creating user'); }
                } catch (e) { alert('Network Error'); }
              }} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded text-sm font-medium shadow-sm transition">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
