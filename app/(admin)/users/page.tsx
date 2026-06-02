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
  const [editExpiration, setEditExpiration] = useState('');
  const [editProfile, setEditProfile] = useState('');
  const [profilesList, setProfilesList] = useState<any[]>([]);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data || []);
    } catch (e) {}
  };
  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/profiles');
      const data = await res.json();
      setProfilesList(data || []);
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

  useEffect(() => { fetchUsers(); fetchProfiles(); }, []);

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
    if (u.accountStatus === "Expired" || u.accountStatus === "expired") return "Expired";
    if (u.accountStatus === "Depleted" || u.accountStatus === "depleted") return "Depleted";
    if (u.accountStatus === "Disabled" || u.accountStatus === "disabled") return "Disabled";
    return "Active";
  };

  const countStatus = (st: string) => users.filter(u => getUserStatus(u) === st).length;

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${selectedUser.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: editPassword, group: editProfile, staticIp: editStaticIp,
          name: editName, family: editFamily, phone: editPhone, email: editEmail,
          address: editAddress, expiration: editExpiration
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
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-500 rounded-sm"></span> Expired ({countStatus('Expired')})</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Disabled ({countStatus('Disabled')})</div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)} 
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1"
          >
            🔧 Actions <span className="text-[10px]">▼</span>
          </button>
          
          {isActionsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 text-xs font-semibold text-gray-700">
              <button onClick={() => { setIsAddUserModalOpen(true); setIsActionsDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-2 text-sky-600"><span className="font-bold">+</span> New User</button>
              <hr className="border-gray-100" />
              <button onClick={() => { if(selectedUser) { setManageTab('edit'); setIsManageModalOpen(true); } else { alert('Please select a user first from table'); } setIsActionsDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-2">📝 Edit User</button>
              <button onClick={() => { if(selectedUser) { setIsTrafficModalOpen(true); } else { alert('Please select a user first from table'); } setIsActionsDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-2">📊 Add Traffic</button>
              <button onClick={() => { if(selectedUser) { setManageTab('edit'); setIsManageModalOpen(true); } else { alert('Please select a user first from table'); } setIsActionsDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-2">🔑 Change Password</button>
              <button onClick={() => { if(selectedUser) { setManageTab('edit'); setIsManageModalOpen(true); } else { alert('Please select a user first from table'); } setIsActionsDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-2">🧩 Change Profile</button>
              <hr className="border-gray-100" />
              <button onClick={async () => {
                if(!selectedUser) return alert('Please select a user first');
                if(confirm(`Are you sure you want to ENABLE user: ${selectedUser.username}?`)) {
                  try {
                    const res = await fetch(`/api/users/${selectedUser.username}`, {
                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ accountStatus: 'Active', username: selectedUser.username, password: selectedUser.password, group: selectedUser.group })
                    });
                    if(res.ok) { alert('User Enabled Successfully!'); fetchUsers(); }
                  } catch(e) {}
                }
                setIsActionsDropdownOpen(false);
              }} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-2 text-emerald-600">▶️ Enable User</button>
              <button onClick={async () => {
                if(!selectedUser) return alert('Please select a user first');
                if(confirm(`Are you sure you want to DISABLE user: ${selectedUser.username}?`)) {
                  try {
                    const res = await fetch(`/api/users/${selectedUser.username}`, {
                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ accountStatus: 'Disabled', username: selectedUser.username, password: selectedUser.password, group: selectedUser.group })
                    });
                    if(res.ok) { alert('User Disabled and Disconnected!'); fetchUsers(); }
                  } catch(e) {}
                }
                setIsActionsDropdownOpen(false);
              }} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-2 text-rose-600">⏸️ Disable User</button>
              <hr className="border-gray-100" />
              <button onClick={async () => {
                if(!selectedUser) return alert('Please select a user first');
                if(confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE user: ${selectedUser.username}?`)) {
                  try {
                    const res = await fetch(`/api/users/${selectedUser.username}`, { method: 'DELETE' });
                    if(res.ok) { alert('User completely deleted from FreeRADIUS and Dashboard!'); setSelectedUser(null); fetchUsers(); } else { alert('Delete failed'); }
                  } catch(e) {}
                }
                setIsActionsDropdownOpen(false);
              }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 font-bold">🗑️ Delete User</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 text-gray-600 font-bold border-b">
              <th className="p-3 w-10"><input type="checkbox" /></th>
              <th className="p-3 w-16">Status</th>
              <th className="p-3">Username</th>
              <th className="p-3">Name</th>
              <th className="p-3">Family</th>
              <th className="p-3">Static IP</th>
              <th className="p-3">Expiration</th>
              <th className="p-3">Parent</th>
              <th className="p-3">Traffic Limit</th>
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
                  onClick={() => { setSelectedUser(u); setEditUsername(u.username); setEditPassword(u.password || ''); setEditStaticIp(u.staticIp || ''); setEditName(u.firstName || u.name || ''); setEditFamily(u.lastName || u.family || ''); setEditPhone(u.phone || ''); setEditEmail(u.email || ''); setEditAddress(u.address || ''); setEditExpiration(u.expiration ? u.expiration.split('T')[0] : ''); setEditProfile(u.group || ''); setIsManageModalOpen(true); setManageTab('overview'); }}
                  className={`hover:bg-slate-50 transition border-b border-gray-200 cursor-pointer text-[14px] ${selectedUser?.username === u.username ? 'bg-sky-50' : ''}`}
                >
                  <td className="p-3"><input type="checkbox" checked={selectedUser?.username === u.username} readOnly /></td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold uppercase border ${
                      st === 'Online' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                      st === 'Active' ? 'bg-green-50 text-green-700 border-green-300' :
                      st === 'Depleted' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                      st === 'Expired' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                      'bg-red-50 text-red-700 border-red-300'
                    }`}>
                      <span className={`w-3 h-3 rounded-full ${
                        st === 'Online' ? 'bg-blue-600' :
                        st === 'Active' ? 'bg-green-600' :
                        st === 'Depleted' ? 'bg-yellow-500' :
                        st === 'Expired' ? 'bg-orange-600' :
                        'bg-red-600'
                      }`}></span>{st}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">{u.username}</td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{u.firstName || u.name || '-'}</td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{u.lastName || u.family || '-'}</td>
                  <td className="py-3 px-4 text-blue-600 font-semibold">{u.staticIp || '-'}</td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{u.expiration ? u.expiration.split('T')[0] : 'Permanent'}</td>
                  <td className="py-3 px-4 text-gray-600 font-medium">{u.parent || 'admin'}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{u.group || 'Unlimited'}</td>
                  <td className="py-3 px-4 font-bold text-sky-700">{u.dataLimitString && u.dataLimitString !== "" ? u.dataLimitString : "Unlimited"}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{u.daily_usage || '0.00 MB'}</td>
                  <td className="py-3 px-4 font-bold text-sky-700">{calculateDaysValue(u.expiration)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isManageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col h-[550px] overflow-hidden text-gray-800">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-lg text-sky-600">User Control Panel: {selectedUser?.username}</span>
              <button onClick={() => setIsManageModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <div className="flex border-b bg-white px-4 text-xs font-semibold gap-6">
              <button onClick={() => setManageTab('overview')} className={`py-2 border-b-2 ${manageTab === 'overview' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500'}`}>Overview</button>
              <button onClick={() => setManageTab('edit')} className={`py-2 border-b-2 ${manageTab === 'edit' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500'}`}>Edit Profile</button>
              <button onClick={() => setManageTab('traffic')} className={`py-2 border-b-2 ${manageTab === 'traffic' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500'}`}>Traffic Report</button>
              <button onClick={() => setManageTab('history')} className={`py-2 border-b-2 ${manageTab === 'history' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500'}`}>History Log</button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-white">
              {manageTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-gray-800">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center gap-4 border p-3 rounded-xl bg-white shadow-sm">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 font-bold text-xl">👤</div>
                      <div className="font-semibold space-y-1">
                        <div className="text-gray-900 font-bold text-sm">👤 {selectedUser?.firstName || selectedUser?.name || 'Goli'}</div>
                        <div className="text-gray-500">📞 {selectedUser?.phone || 'N/A'}</div>
                        <div className="text-gray-500">📍 {selectedUser?.address || 'N/A'}</div>
                        <div className="text-gray-500">✉️ {selectedUser?.email || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={async () => { if(confirm(`Activate user: ${selectedUser?.username}?`)) { await fetch(`/api/users/${selectedUser?.username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountStatus: 'Active' }) }); alert('User Activated!'); setIsManageModalOpen(false); fetchUsers(); } }} className="flex flex-col items-center justify-center p-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-bold transition gap-1 shadow-sm text-[11px]">⚡ Activate</button>
                      <button type="button" className="flex flex-col items-center justify-center p-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-bold transition gap-1 shadow-sm text-[11px]">📄 Issue Invoice</button>
                      <button type="button" onClick={() => setManageTab('edit')} className="flex flex-col items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition gap-1 shadow-sm text-[11px]">🧩 Change Profile</button>
                      <button type="button" onClick={async () => { if(confirm(`Disconnect user: ${selectedUser?.username}?`)) { await fetch(`/api/users/${selectedUser?.username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountStatus: 'Disabled' }) }); alert('User Disconnected!'); setIsManageModalOpen(false); fetchUsers(); } }} className="flex flex-col items-center justify-center p-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-bold transition gap-1 shadow-sm text-[11px]">🔌 Disconnect</button>
                      <button type="button" className="flex flex-col items-center justify-center p-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-bold transition gap-1 shadow-sm text-[11px]">💵 Deposit</button>
                      <button type="button" className="flex flex-col items-center justify-center p-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-bold transition gap-1 shadow-sm text-[11px]">💸 Withdrawal</button>
                      <button type="button" className="flex flex-col items-center justify-center p-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-bold transition gap-1 shadow-sm text-[11px]">🔄 Reset Traffic</button>
                      <button type="button" className="flex flex-col items-center justify-center p-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-bold transition gap-1 shadow-sm text-[11px]">📝 Rename</button>
                      <button type="button" onClick={async () => { if(confirm(`⚠️ WARNING: PERMANENTLY DELETE user: ${selectedUser?.username}?`)) { const res = await fetch(`/api/users/${selectedUser?.username}`, { method: 'DELETE' }); if(res.ok) { alert('User completely deleted!'); setIsManageModalOpen(false); setSelectedUser(null); fetchUsers(); } } }} className="flex flex-col items-center justify-center p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition gap-1 shadow-sm text-[11px]">🗑️ Delete</button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 border rounded-xl bg-white shadow-sm overflow-hidden font-medium">
                    <div className="flex justify-between border-b p-2.5"><span>Username</span><span className="font-bold text-gray-900">{selectedUser?.username}</span></div>
                    <div className="flex justify-between border-b p-2.5 bg-gray-50"><span>Password</span><span className="font-bold text-gray-900">{selectedUser?.password || '1234'}</span></div>
                    <div className="flex justify-between border-b p-2.5"><span>Balance</span><span className="font-bold text-emerald-600">$0.00</span></div>
                    <div className="flex justify-between border-b p-2.5 bg-gray-50"><span>Owner</span><span className="font-bold text-gray-700">{selectedUser?.parent || 'admin'}</span></div>
                    <div className="flex justify-between border-b p-2.5"><span>Profile</span><span className="font-bold text-blue-600">{selectedUser?.group || '100GB2MB-30d'}</span></div>
                    <div className="flex justify-between border-b p-2.5 bg-gray-50"><span>Expiration</span><span className="font-bold text-gray-900">{selectedUser?.expiration || 'Permanent'}</span></div>
                    <div className="flex justify-between border-b p-2.5"><span>Remaining Traffic</span><span className="font-bold text-sky-700">{selectedUser?.dataLimitString || 'Unlimited'}</span></div>
                    <div className="flex justify-between border-b p-2.5 bg-gray-50"><span>Incorrect PIN tries</span><span className="font-bold text-gray-900">0</span></div>
                    <div className="flex justify-between border-b p-2.5"><span>Status</span><span className={`font-bold ${selectedUser?.accountStatus === 'Disabled' ? 'text-red-600' : 'text-green-600'}`}>{selectedUser?.accountStatus || 'Active'}</span></div>
                    <div className="flex justify-between p-2.5 bg-gray-50"><span>Last Seen Online</span><span className="font-bold text-gray-700">{selectedUser?.last_seen || 'N/A'}</span></div>
                  </div>
                </div>
              )}

              {manageTab === 'edit' && (
                <form onSubmit={handleSaveUserEdit} className="space-y-4 bg-white text-xs text-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 bg-sky-50 p-3 rounded-lg border border-sky-200 flex justify-between items-center font-bold text-sky-800">
                      <span>📉 Remaining Traffic:</span>
                      <span className="text-sm bg-white px-3 py-1 rounded-md shadow-sm">{selectedUser?.dataLimitString || 'Unlimited'}</span>
                    </div>
                    <div><label className="block font-bold text-gray-600 mb-1">New Password</label><input type="text" value={editPassword} onChange={e=>setEditPassword(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-gray-900 bg-white border-gray-300" placeholder="Leave blank to keep old" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">First Name</label><input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-gray-900 bg-white border-gray-300" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Last Name</label><input type="text" value={editFamily} onChange={e=>setEditFamily(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-gray-900 bg-white border-gray-300" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Phone</label><input type="text" value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-gray-900 bg-white border-gray-300" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Email</label><input type="text" value={editEmail} onChange={e=>setEditEmail(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-gray-900 bg-white border-gray-300" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Address</label><input type="text" value={editAddress} onChange={e=>setEditAddress(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-gray-900 bg-white border-gray-300" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Static IP</label><input type="text" value={editStaticIp} onChange={e=>setEditStaticIp(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-gray-900 bg-white border-gray-300" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Expiration Date</label><input type="date" value={editExpiration} onChange={e=>setEditExpiration(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-gray-900 bg-white border-gray-300" /></div>
                    <div className="md:col-span-2">
                      <label className="block font-bold text-gray-600 mb-1">Select Profile</label>
                      <select value={editProfile} onChange={e=>setEditProfile(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-gray-900 bg-white border-gray-300 focus:outline-none">
                        <option value="">-- Choose Profile --</option>
                        {profilesList.map((p, idx) => (
                          <option key={idx} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-lg font-bold shadow hover:bg-sky-600 transition">Save Changes</button>
                </form>
              )}

              {manageTab === 'traffic' && (
                <div className="space-y-4">
                  <div className="flex gap-4 mb-2">
                    <select value={userTrafficMonth} onChange={e=>setUserTrafficMonth(e.target.value)} className="border p-1 text-xs rounded bg-white text-gray-900 border-gray-300">
                      {Array.from({length:12}).map((_,m)=> { const v=(m+1).toString().padStart(2,'0'); return <option key={v} value={v}>{v}</option>; })}
                    </select>
                    <select value={userTrafficYear} onChange={e=>setUserTrafficYear(e.target.value)} className="border p-1 text-xs rounded bg-white text-gray-900 border-gray-300">
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                  {isUserTrafficLoading ? <div className="text-xs text-gray-500">Loading chart data...</div> : <div className="h-64 border rounded-xl p-2 bg-gray-50"><UserTrafficChart data={userTrafficData} /></div>}
                </div>
              )}

              {manageTab === 'history' && (
                <div className="border rounded-xl bg-gray-50 overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead><tr className="bg-gray-200 border-b font-bold text-gray-600"><th className="p-2">Action</th><th className="p-2">Details</th><th className="p-2">Date</th></tr></thead>
                    <tbody>
                      {historyData.map((h,idx)=>(<tr key={idx} className="border-b text-gray-700 font-medium"><td className="p-2 font-bold">{h.action}</td><td className="p-2">{h.details}</td><td className="p-2 text-gray-500">{h.date}</td></tr>))}
                      {historyData.length===0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400 font-bold">No logs found for this account</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isTrafficModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 space-y-4 text-gray-800">
            <h3 className="font-bold text-lg text-sky-600">Add Traffic for {selectedUser?.username}</h3>
            <div>
              <label className="block font-bold text-gray-600 text-xs mb-1">Amount (MB)</label>
              <input type="number" value={trafficAmount} onChange={e=>setTrafficAmount(e.target.value)} placeholder="0" className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white border-gray-300 font-bold" />
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setIsTrafficModalOpen(false)} className="px-4 py-2 border rounded border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">Dismiss</button>
              <button onClick={async () => {
                const res = await fetch(`/api/users/${selectedUser.username}/add-traffic`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ traffic: trafficAmount }) });
                if (res.ok) { alert('Traffic Added Successfully!'); setIsTrafficModalOpen(false); fetchUsers(); }
              }} className="px-4 py-2 bg-sky-500 text-white rounded-lg font-bold shadow hover:bg-sky-600 transition">Submit</button>
            </div>
          </div>
        </div>
      )}

      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden text-gray-800">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-700">Create New User</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
            </div>
            <div className="p-4 space-y-4 text-xs max-h-[380px] overflow-y-auto bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block font-bold text-gray-600 mb-1">Username *</label><input type="text" id="new_user_name" className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 border-gray-300" placeholder="Enter username" /></div>
                <div><label className="block font-bold text-gray-600 mb-1">Password *</label><input type="text" id="new_user_pass" className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 border-gray-300" placeholder="Enter password" /></div>
                <div><label className="block font-bold text-gray-600 mb-1">First Name</label><input type="text" id="new_user_firstname" className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 border-gray-300" /></div>
                <div><label className="block font-bold text-gray-600 mb-1">Last Name</label><input type="text" id="new_user_lastname" className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 border-gray-300" /></div>
                <div><label className="block font-bold text-gray-600 mb-1">Phone</label><input type="text" id="new_user_phone" className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 border-gray-300" /></div>
                <div><label className="block font-bold text-gray-600 mb-1">Email</label><input type="text" id="new_user_email" className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 border-gray-300" /></div>
                <div><label className="block font-bold text-gray-600 mb-1">Physical Address</label><input type="text" id="new_user_address" className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 border-gray-300" /></div>
                <div><label className="block font-bold text-gray-600 mb-1">Static IP</label><input type="text" id="new_user_staticip" className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 border-gray-300" /></div>
                <div><label className="block font-bold text-gray-600 mb-1">Expiration Date</label><input type="date" id="new_user_expiration" className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 border-gray-300" defaultValue="2026-12-31" /></div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-gray-600 mb-1">Select Profile</label>
                  <select id="new_user_profile" className="w-full px-3 py-1.5 border rounded-lg text-gray-900 bg-white border-gray-300 focus:outline-none">
                    <option value="">-- Choose Profile --</option>
                    {profilesList.map((p, idx) => (
                      <option key={idx} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white flex justify-end gap-2 border-t text-xs">
              <button onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">Dismiss</button>
              <button onClick={async () => {
                const u = (document.getElementById('new_user_name') as HTMLInputElement)?.value || '';
                const p = (document.getElementById('new_user_pass') as HTMLInputElement)?.value || '';
                const fn = (document.getElementById('new_user_firstname') as HTMLInputElement)?.value || '';
                const ln = (document.getElementById('new_user_lastname') as HTMLInputElement)?.value || '';
                const ph = (document.getElementById('new_user_phone') as HTMLInputElement)?.value || '';
                const em = (document.getElementById('new_user_email') as HTMLInputElement)?.value || '';
                const ad = (document.getElementById('new_user_address') as HTMLInputElement)?.value || '';
                const ip = (document.getElementById('new_user_staticip') as HTMLInputElement)?.value || '';
                const ex = (document.getElementById('new_user_expiration') as HTMLInputElement)?.value || '';
                const pr = (document.getElementById('new_user_profile') as HTMLSelectElement)?.value || '';
                
                if(!u || !p) { alert('Please enter Username and Password'); return; }
                const res = await fetch('/api/users', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username: u, password: p, firstName: fn, lastName: ln, phone: ph, email: em, address: ad, staticIp: ip, expiration: ex, group: pr })
                });
                if (res.ok) { alert('User Created Successfully!'); setIsAddUserModalOpen(false); fetchUsers(); }
              }} className="px-4 py-2 bg-sky-500 text-white rounded-lg font-bold shadow hover:bg-sky-600 transition">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
