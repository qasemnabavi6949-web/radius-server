'use client';
import { useState, useEffect } from 'react';
import { X, User, Key, Package, Activity, WifiOff, Zap, RefreshCw, Edit2, Plus, Trash2, FileClock, Eye, EyeOff } from 'lucide-react';
import dynamic from 'next/dynamic';

const UserTrafficChart = dynamic(() => import('../report/TrafficReportChart'), { ssr: false });

export default function UserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manageTab, setManageTab] = useState<'overview' | 'edit' | 'traffic' | 'history'>('overview');
  const [userTrafficData, setUserTrafficData] = useState<any[]>([]);
  const [isUserTrafficLoading, setIsUserTrafficLoading] = useState(false);
  const [userHistoryData, setUserHistoryData] = useState<any[]>([]);
  const [userTrafficMonth, setUserTrafficMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [userTrafficYear, setUserTrafficYear] = useState(new Date().getFullYear().toString());

  // فیلدهای هویتی درخواستی شما برای ساخت یوزر جدید
  const [newUsername, setNewUsername] = useState(''); const [newPassword, setNewPassword] = useState('');
  const [newProfile, setNewProfile] = useState(''); const [newStaticIp, setNewStaticIp] = useState('');
  const [newName, setNewName] = useState(''); const [newFamily, setNewFamily] = useState('');
  const [newPhone, setNewPhone] = useState(''); const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState(''); const [newNationalId, setNewNationalId] = useState('');
  const [newNote, setNewNote] = useState('');

  // فیلدهای هویتی برای ویرایش یوزر
  const [editUsername, setEditUsername] = useState(''); const [editPassword, setEditPassword] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(''); const [editStaticIp, setEditStaticIp] = useState('');
  const [editExpiration, setEditExpiration] = useState(''); const [editName, setEditName] = useState('');
  const [editFamily, setEditFamily] = useState(''); const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState(''); const [editAddress, setEditAddress] = useState('');
  const [editNationalId, setEditNationalId] = useState(''); const [editNote, setEditNote] = useState('');

  useEffect(() => { fetchUsers(); fetchProfiles(); }, []);
  const fetchProfiles = async () => { try { const res = await fetch('/api/profiles'); if (res.ok) setProfiles(await res.json()); } catch (e) {} };
  const fetchUsers = async () => { try { const res = await fetch('/api/users'); if (res.ok) { const d = await res.json(); setUsers(Array.isArray(d) ? d : d.data || []); } } catch (e) {} };

  useEffect(() => {
    if (selectedUser) {
      if (manageTab === 'traffic') fetchUserTraffic();
      if (manageTab === 'history') fetchUserHistory();
    }
  }, [manageTab, selectedUser, userTrafficYear, userTrafficMonth]);

  const fetchUserTraffic = async () => {
    setIsUserTrafficLoading(true);
    try {
      const res = await fetch(`/api/report/traffic?year=${userTrafficYear}&month=${userTrafficMonth}&username=${selectedUser.username}`);
      const j = await res.json(); setUserTrafficData(j.data || j || []);
    } catch (e) {}
    setIsUserTrafficLoading(false);
  };

  const fetchUserHistory = async () => {
    try {
      const res = await fetch(`/api/users/${selectedUser.username}/history`);
      if (res.ok) {
        const j = await res.json(); const server = j.data || j || [];
        const local = JSON.parse(localStorage.getItem(`logs_${selectedUser.username}`) || '[]');
        setUserHistoryData([...local, ...server]);
      }
    } catch (e) {}
  };

  const addLocalLog = (username: string, txt: string) => {
    const k = `logs_${username}`; const old = JSON.parse(localStorage.getItem(k) || '[]');
    const dt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const n = { action: txt, log_text: txt, message: txt, date: dt, created_at: dt };
    const updated = [n, ...old]; localStorage.setItem(k, JSON.stringify(updated)); localStorage.setItem(`has_charged_${username}`, 'true');
    setUserHistoryData(updated);
  };

  const calculateDaysValue = (exp: string) => {
    if (!exp) return 999; const ed = new Date(exp); const td = new Date();
    ed.setHours(0,0,0,0); td.setHours(0,0,0,0);
    return Math.ceil((ed.getTime() - td.getTime()) / (1000 * 60 * 60 * 24)) > 0 ? Math.ceil((ed.getTime() - td.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  };

  const getUserStatus = (u: any) => {
    if (!u) return 'Disabled';
    if (u.status === 'Online') return 'Online';
    if (u.accountStatus === 'Disabled') return 'Disabled';
    if (u.remainingStr === '0.00 MB') return 'Depleted';
    return 'Active';
  };

  const countStatus = (st: string) => users.filter(u => getUserStatus(u) === st).length;
  // ثبت کاربر جدید همراه با فیلدهای هویتی و تماس جدید درخواستی شما
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: newUsername, password: newPassword, group: newProfile, staticIp: newStaticIp,
          name: newName, family: newFamily, phone: newPhone, email: newEmail, address: newAddress,
          nationalId: newNationalId, note: newNote
        })
      });
      if (res.ok) { alert('User created successfully!'); setIsAddModalOpen(false); fetchUsers(); }
    } catch (e) {}
  };

  // ذخیره دائم مشخصات هویتی و تاریخ انقضا بدون رفرش شدن
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${selectedUser.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: editUsername, password: editPassword, group: selectedProfile, staticIp: editStaticIp, expiration: editExpiration, status: 'Active',
          name: editName, family: editFamily, phone: editPhone, email: editEmail, address: editAddress,
          nationalId: editNationalId, note: editNote
        })
      });
      if (res.ok) {
        if (typeof window !== 'undefined') localStorage.setItem(`has_charged_${selectedUser.username}`, 'true');
        addLocalLog(selectedUser.username, `Profile details and Expiration updated to: ${editExpiration}`);
        alert("Saved permanently!"); setIsManageModalOpen(false); fetchUsers();
      }
    } catch (e) {}
  };

  const handleOverviewAction = async (actionType: 'charge' | 'disconnect' | 'add_traffic' | 'status') => {
    if (actionType === 'charge') {
      if (!confirm("Renew user profile package?")) return;
      try {
        const res = await fetch(`/api/users/${selectedUser.username}/charge`, { method: 'POST' });
        if (res.ok) {
          if (typeof window !== 'undefined') localStorage.setItem(`has_charged_${selectedUser.username}`, 'true');
          addLocalLog(selectedUser.username, `Profile package renewed successfully (Package: ${selectedUser.group || 'Default'})`);
          alert('User package charged successfully!'); fetchUsers();
        }
      } catch (e) {}
    }

    if (actionType === 'add_traffic') {
      const inputMb = prompt("Enter traffic amount to ADD (in MB):", "1024");
      if (!inputMb || isNaN(Number(inputMb))) return;
      try {
        const res = await fetch(`/api/users/${selectedUser.username}/charge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bytes: parseFloat(inputMb) * 1024 * 1024, traffic_mb: parseFloat(inputMb) })
        });
        if (res.ok) {
          if (typeof window !== 'undefined') localStorage.setItem(`has_charged_${selectedUser.username}`, 'true');
          const currentStr = selectedUser.remainingStr || '0.00 MB';
          const currentMb = parseFloat(currentStr.replace(/[^0-9.]/g, '')) || 0;
          const formattedRemaining = `${(currentMb + parseFloat(inputMb)).toFixed(2)} MB`;

          setSelectedUser((prev: any) => ({ ...prev, remainingStr: formattedRemaining }));
          setUsers(prev => prev.map(u => u.username === selectedUser.username ? { ...u, remainingStr: formattedRemaining } : u));
          addLocalLog(selectedUser.username, `Added manual traffic: ${inputMb} MB (New Balance: ${formattedRemaining})`);
          alert(`${inputMb} MB added successfully!`); fetchUsers();
        }
      } catch (e) {}
    }

    if (actionType === 'disconnect') {
      if (!confirm("Disconnect user?")) return;
      fetch(`/api/users/${selectedUser.username}/disconnect`, { method: 'POST' }).then(res => {
        if (res.ok) { addLocalLog(selectedUser.username, "User disconnected from network"); alert('User disconnected.'); fetchUsers(); }
      });
    }

    if (actionType === 'status') {
      if (!confirm("Change user status?")) return;
      const newStatus = selectedUser.status === 'Disabled' ? 'Active' : 'Disabled';
      fetch(`/api/users/${selectedUser.username}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }).then(res => {
        if (res.ok) { addLocalLog(selectedUser.username, `Status changed to ${newStatus}`); fetchUsers(); setIsManageModalOpen(false); }
      });
    }
  };

  const formatTableBytes = (v: any) => {
    if (!v) return '0.00 KB'; if (typeof v === 'string' && /[MGB]B/.test(v)) return v;
    const b = parseFloat(v) || 0;
    if (b >= 1073741824) return `${(b / 1073741824).toFixed(2)} GB`;
    if (b >= 1048576) return `${(b / 1048576).toFixed(2)} MB`;
    return `${(b / 1024).toFixed(2)} KB`;
  };

  return (
    <div className="space-y-4 p-6 bg-gray-50 min-h-screen text-gray-800 text-sm">
      <div className="flex flex-wrap gap-6 bg-white p-3 border border-gray-200 rounded-lg shadow-sm font-medium">
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Online ({countStatus('Online')})</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Active ({countStatus('Active')})</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-500 rounded-sm"></span> Expired ({countStatus('Expired')})</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-400 rounded-sm"></span> Depleted ({countStatus('Depleted')})</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Disabled ({countStatus('Disabled')})</div>
      </div>

      <div className="flex justify-between items-center bg-slate-800 text-white p-3 rounded-t-lg shadow-sm">
        <span className="font-semibold">Users Table | Total: {users.length}</span>
        <button onClick={() => { setNewUsername(''); setNewPassword(''); setNewStaticIp(''); setNewName(''); setNewFamily(''); setNewPhone(''); setNewEmail(''); setNewAddress(''); setNewNationalId(''); setNewNote(''); setIsAddModalOpen(true); }} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs font-bold transition"><Plus size={14}/> Add User</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-b-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs divide-y divide-gray-200">
          <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
            <tr><th className="p-3 w-10"><input type="checkbox" /></th><th className="p-3">STATUS</th><th className="p-3">USERNAME</th><th className="p-3">EXPIRATION</th><th className="p-3">PARENT</th><th className="p-3">PROFILE</th><th className="p-3">DAILY TRAFFIC</th><th className="p-3">REMAINING DAYS</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((u, i) => {
              const st = getUserStatus(u);
              return (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="p-3"><input type="checkbox" /></td>
                  <td className="p-3"><span className={`w-3 h-3 block rounded-full ${st === 'Disabled' ? 'bg-red-500' : st === 'Online' ? 'bg-blue-500' : st === 'Depleted' ? 'bg-yellow-400' : 'bg-green-500'}`}></span></td>
                  <td onClick={() => { setSelectedUser(u); setEditUsername(u.username); setEditPassword(u.password || ''); setSelectedProfile(u.group || ''); setEditStaticIp(u.staticIp || u.static_ip || ''); setEditExpiration(u.expiration || ''); setEditName(u.name || ''); setEditFamily(u.family || ''); setEditPhone(u.phone || ''); setEditEmail(u.email || ''); setEditAddress(u.address || ''); setEditNationalId(u.nationalId || u.national_id || ''); setEditNote(u.note || ''); setManageTab('overview'); setIsManageModalOpen(true); }} className="p-3 font-bold text-blue-600 cursor-pointer hover:underline">{u.username}</td>
                  <td className="p-3 text-gray-500 font-mono">{u.expiration || 'Permanent'}</td>
                  <td className="p-3 text-gray-600">{u.parent || 'admin'}</td>
                  <td className="p-3 text-blue-600 font-semibold">{u.group || 'None'}</td>
                  <td className="p-3 font-semibold text-gray-900">{u.daily_usage || u.today_traffic || '0.00 MB'}</td>
                  <td className="p-3"><span className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded font-bold text-gray-800">{calculateDaysValue(u.expiration)} Days</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* مودال مجهز و استاندارد ساخت کاربر جدید (Add User) همراه با فیلدهای هویتی درخواستی */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleCreateUser} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2"><User size={18}/> Create New Customer</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={18}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Username *</label><input type="text" required value={newUsername} onChange={e=>setNewUsername(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Password *</label><input type="text" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">First Name</label><input type="text" value={newName} onChange={e=>setNewName(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Last Name / Family</label><input type="text" value={newFamily} onChange={e=>setNewFamily(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Phone Number</label><input type="text" value={newPhone} onChange={e=>setNewPhone(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" placeholder="e.g. 079xxxxxxx" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Email Address</label><input type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" placeholder="name@example.com" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">National ID / Passport</label><input type="text" value={newNationalId} onChange={e=>setNewNationalId(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Profile / Package *</label><select value={newProfile} onChange={e=>setNewProfile(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" required><option value="">Select Package</option>{profiles.map((p:any)=><option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
            </div>
            
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Static IP Address</label><input type="text" value={newStaticIp} onChange={e=>setNewStaticIp(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" placeholder="Optional (e.g. 10.10.10.54)" /></div>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Physical Address</label><input type="text" value={newAddress} onChange={e=>setNewAddress(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Description / Note</label><textarea value={newNote} onChange={e=>setNewNote(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 h-16 resize-none" placeholder="Admin notes about this customer..."></textarea></div>
            
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold transition">Save & Create Account</button>
          </form>
        </div>
      )}

      {/* مودال مدیریت کاربر */}
      {isManageModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl border border-gray-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50"><h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Activity size={18} className="text-blue-600"/> Manage User: {selectedUser.username}</h2><button onClick={() => setIsManageModalOpen(false)}><X size={20}/></button></div>
            <div className="flex border-b bg-gray-50 px-2 gap-1">{(['overview', 'edit', 'traffic', 'history'] as const).map(tab => <button key={tab} type="button" onClick={() => setManageTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition ${manageTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>{tab}</button>)}</div>
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              {manageTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => handleOverviewAction('status')} className="flex flex-col items-center justify-center p-3 bg-slate-600 text-white rounded-lg text-xs font-medium gap-1 min-h-[75px]"><Zap size={18} /> Toggle Status</button>
                      <button type="button" onClick={() => handleOverviewAction('charge')} className="flex flex-col items-center justify-center p-3 bg-blue-600 text-white rounded-lg text-xs font-bold gap-1 min-h-[75px]"><RefreshCw size={18} /> Charge User</button>
                      <button type="button" onClick={() => setManageTab('edit')} className="flex flex-col items-center justify-center p-3 bg-slate-600 text-white rounded-lg text-xs font-medium gap-1 min-h-[75px]"><Package size={18} /> Edit Profile</button>
                      <button type="button" onClick={() => handleOverviewAction('disconnect')} className="flex flex-col items-center justify-center p-3 bg-slate-600 text-white rounded-lg text-xs font-medium gap-1 min-h-[75px]"><WifiOff size={18} /> Disconnect</button>
                      <button type="button" onClick={() => handleOverviewAction('charge')} className="flex flex-col items-center justify-center p-3 bg-slate-600 text-white rounded-lg text-xs font-medium gap-1 min-h-[75px]"><FileClock size={18} /> Reset Stats</button>
                      <button type="button" onClick={() => { const n = prompt("New name:", selectedUser.username); if(n) handleOverviewAction('charge'); }} className="flex flex-col items-center justify-center p-3 bg-slate-600 text-white rounded-lg text-xs font-medium gap-1 min-h-[75px]"><Edit2 size={18} /> Rename</button>
                      <button type="button" onClick={() => { if(confirm("Delete user?")) fetch(`/api/users/${selectedUser.username}`, { method: 'DELETE' }).then(() => { fetchUsers(); setIsManageModalOpen(false); }); }} className="flex flex-col items-center justify-center p-3 bg-red-600 text-white rounded-lg text-xs font-medium gap-1 min-h-[75px]"><Trash2 size={18} /> Delete</button>
                    </div>
                    <button type="button" onClick={() => handleOverviewAction('add_traffic')} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg font-medium"><Plus size={16} /> Add Traffic (MB)</button>
                  </div>
                  <div className="lg:col-span-7 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left bg-white divide-y divide-gray-200 text-xs">
                      <tbody className="divide-y divide-gray-100">
                        <tr><td className="p-2.5 font-semibold text-gray-600 bg-gray-50/50 w-1/3">Username / Name</td><td className="p-2.5 font-medium">{selectedUser.username} {selectedUser.name ? `(${selectedUser.name} ${selectedUser.family || ''})` : ''}</td></tr>
                        <tr><td className="p-2.5 font-semibold text-gray-600 bg-gray-50/50">Phone Number</td><td className="p-2.5 font-mono text-slate-700">{selectedUser.phone || 'Not Set'}</td></tr>
                        <tr><td className="p-2.5 font-semibold text-gray-600 bg-gray-50/50">Static IP</td><td className="p-2.5 text-indigo-600 font-semibold">{selectedUser.staticIp || selectedUser.static_ip || 'Not Set'}</td></tr>
                        <tr><td className="p-2.5 font-semibold text-gray-600 bg-gray-50/50">Profile / Group</td><td className="p-2.5 text-blue-600 font-semibold">{selectedUser.group || 'None'}</td></tr>
                        <tr><td className="p-2.5 font-semibold text-gray-600 bg-gray-50/50">Expiration</td><td className="p-2.5 text-gray-700 font-mono">{selectedUser.expiration || 'Permanent'}</td></tr>
                        <tr><td className="p-2.5 font-semibold text-gray-600 bg-gray-50/50">Remaining Traffic</td><td className="p-2.5 font-bold text-gray-900">{selectedUser.remainingStr || 'Available'}</td></tr>
                        {selectedUser.note && <tr><td className="p-2.5 font-semibold text-gray-600 bg-gray-50/50">Admin Note</td><td className="p-2.5 text-orange-600 italic">{selectedUser.note}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {manageTab === 'edit' && (
                <form onSubmit={handleSaveUserEdit} className="space-y-4 bg-white p-2 rounded-xl text-xs max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block font-bold text-gray-600 mb-1">Username</label><input type="text" value={editUsername} onChange={e=>setEditUsername(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">New Password</label><input type="text" value={editPassword} onChange={e=>setEditPassword(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" placeholder="Leave empty to keep old" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">First Name</label><input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Last Name</label><input type="text" value={editFamily} onChange={e=>setEditFamily(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Phone Number</label><input type="text" value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Email Address</label><input type="email" value={editEmail} onChange={e=>setEditEmail(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">National ID</label><input type="text" value={editNationalId} onChange={e=>setEditNationalId(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Profile</label><select value={selectedProfile} onChange={e=>setSelectedProfile(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900"><option value="">Select Profile</option>{profiles.map((p:any)=><option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div><label className="block font-bold text-gray-600 mb-1">Static IP</label><input type="text" value={editStaticIp} onChange={e=>setEditStaticIp(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Expiration Date (YYYY-MM-DD)</label><input type="text" value={editExpiration} onChange={e=>setEditExpiration(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Physical Address</label><input type="text" value={editAddress} onChange={e=>setEditAddress(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900" /></div>
                    <div><label className="block font-bold text-gray-600 mb-1">Admin Notes</label><textarea value={editNote} onChange={e=>setEditNote(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 h-16 resize-none"></textarea></div>
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition mt-2">Save Changes</button>
                </form>
              )}

              {manageTab === 'traffic' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-gray-50 border p-4 rounded-xl">
                    <h3 className="text-base font-bold text-gray-900">Traffic Report</h3>
                    <div className="flex gap-2">
                      <select value={userTrafficMonth} onChange={e=>setUserTrafficMonth(e.target.value)} className="px-3 py-1.5 border rounded-lg bg-white text-gray-900"><option value="01">January</option><option value="02">February</option><option value="03">March</option><option value="04">April</option><option value="05">May</option><option value="06">June</option><option value="07">July</option><option value="08">August</option><option value="09">September</option><option value="10">October</option><option value="11">November</option><option value="12">December</option></select>
                      <select value={userTrafficYear} onChange={e=>setUserTrafficYear(e.target.value)} className="px-3 py-1.5 border rounded-lg bg-white text-gray-900"><option value="2026">2026</option><option value="2025">2025</option></select>
                    </div>
                  </div>
                  {isUserTrafficLoading ? <div className="text-center py-10 text-gray-500">Loading charts...</div> : <div className="border rounded-xl p-4 bg-white"><UserTrafficChart data={userTrafficData} /></div>}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs text-gray-700 bg-white divide-y divide-gray-200">
                      <thead className="bg-gray-50 font-bold border-b"><tr><th className="p-3">Day</th><th className="p-3">Download</th><th className="p-3">Upload</th><th className="p-3">Total</th><th className="p-3">Real Traffic</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {userTrafficData.length === 0 ? (<tr><td colSpan={5} className="p-4 text-center text-gray-400">No daily data found</td></tr>) : (userTrafficData.map((row: any, idx: number) => (<tr key={idx} className="hover:bg-gray-50/50"><td className="p-3 font-semibold text-gray-900">{row.day || row.date || `${userTrafficYear}-${userTrafficMonth}-${idx+1}`}</td><td className="p-3 text-blue-600">{formatTableBytes(row.download_bytes || row.download)}</td><td className="p-3 text-purple-600">{formatTableBytes(row.upload_bytes || row.upload)}</td><td className="p-3 text-green-600 font-bold">{formatTableBytes(row.total_bytes || row.total)}</td><td className="p-3 text-orange-600 font-bold">{formatTableBytes(row.realTraffic || row.real_traffic || row.total)}</td></tr>)))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {manageTab === 'history' && (
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-left bg-white">
                    <thead className="bg-gray-50 text-xs font-bold border-b"><tr><th className="p-3">Action / Log</th><th className="p-3">Date & Time</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {userHistoryData.map((h: any, i) => (<tr key={i} className="hover:bg-gray-50"><td className="p-3 font-medium text-gray-800">{h.action || h.log_text || h.message}</td><td className="p-3 text-gray-500 font-mono">{h.date || h.created_at}</td></tr>))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
