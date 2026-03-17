import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { UserDTO } from '../types/api';
import {
  Users, Activity, ShieldCheck, Plus, Trash2, Mic,
  Database, History, RefreshCw, Download, Eye, Lock,
  CheckCircle2, AlertTriangle, XCircle, Globe, BarChart3
} from 'lucide-react';

const mockCommandLogs = [
  { id:1, userId:1, userName:'Ramesh Kumar',  command:'నా బ్యాలెన్స్ చెప్పండి',       intent:'BALANCE',    authLayer:'L1',   matchScore:94, status:'success',  lang:'Telugu', time:'10:42 AM' },
  { id:2, userId:2, userName:'Lakshmi Devi',  command:'రమేష్‌కు 500 రూపాయలు పంపండి', intent:'SEND_MONEY', authLayer:'L2',   matchScore:88, status:'success',  lang:'Telugu', time:'10:38 AM' },
  { id:3, userId:1, userName:'Ramesh Kumar',  command:'నా పెన్షన్ స్థితి చెప్పండి',   intent:'PENSION',    authLayer:'L1',   matchScore:91, status:'success',  lang:'Telugu', time:'10:30 AM' },
  { id:4, userId:3, userName:'Suresh Babu',   command:'मेरा बैलेंस बताओ',              intent:'BALANCE',    authLayer:'F1',   matchScore:76, status:'fallback', lang:'Hindi',  time:'10:21 AM' },
  { id:5, userId:4, userName:'Unknown',       command:'—',                              intent:'—',          authLayer:'DENY', matchScore:34, status:'denied',   lang:'—',      time:'10:15 AM' },
  { id:6, userId:2, userName:'Lakshmi Devi',  command:'ప్రభుత్వ పథకాలు చూపించు',      intent:'WELFARE',    authLayer:'L1',   matchScore:90, status:'success',  lang:'Telugu', time:'10:09 AM' },
  { id:7, userId:1, userName:'Ramesh Kumar',  command:'నా లావాదేవీల చరిత్ర',           intent:'HISTORY',    authLayer:'L1',   matchScore:93, status:'success',  lang:'Telugu', time:'09:55 AM' },
  { id:8, userId:5, userName:'Meera Pillai',  command:'என் இருப்பு சொல்லுங்கள்',       intent:'BALANCE',    authLayer:'L1',   matchScore:87, status:'success',  lang:'Tamil',  time:'09:44 AM' },
];

const mockVoiceprints = [
  { userId:1, userName:'Ramesh Kumar', f0:'142 Hz', zcr:28, rms:'-18 dB', unique:91, enrolledAt:'2025-03-10', lang:'Telugu', phrases:3 },
  { userId:2, userName:'Lakshmi Devi', f0:'198 Hz', zcr:34, rms:'-22 dB', unique:87, enrolledAt:'2025-03-11', lang:'Telugu', phrases:3 },
  { userId:5, userName:'Meera Pillai', f0:'204 Hz', zcr:31, rms:'-19 dB', unique:89, enrolledAt:'2025-03-12', lang:'Tamil',  phrases:3 },
];

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string,string> = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    fallback:'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    denied:  'bg-red-500/10 text-red-400 border-red-500/20',
    Verified:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${map[status]||'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{status}</span>;
};

const AuthBadge = ({ layer }: { layer: string }) => {
  const map: Record<string,string> = {
    L1:'text-neon border-neon/30 bg-neon/5', L2:'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
    F1:'text-blue-400 border-blue-400/30 bg-blue-400/5', DENY:'text-red-400 border-red-400/30 bg-red-400/5',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-mono border ${map[layer]||'text-gray-400 border-gray-400/20 bg-gray-400/5'}`}>{layer}</span>;
};

const ScoreBar = ({ score }: { score: number }) => (
  <div className="flex items-center gap-2">
    <div className="w-16 h-1.5 bg-dark-border rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${score>=85?'bg-neon':score>=70?'bg-yellow-400':'bg-red-400'}`} style={{width:`${score}%`}} />
    </div>
    <span className={`text-xs font-mono ${score>=85?'text-neon':score>=70?'text-yellow-400':'text-red-400'}`}>{score}%</span>
  </div>
);

type Tab = 'overview'|'users'|'voiceprints'|'commandlogs'|'database';

export const Dashboard = () => {
  const { users, loading, createUser, deleteUser } = useUsers();
  const [tab, setTab] = useState<Tab>('overview');
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState<UserDTO>({ fullName:'', phoneNumber:'', languagePreference:'Telugu', isVerified:false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser(formData);
    setShowForm(false);
    setFormData({ fullName:'', phoneNumber:'', languagePreference:'Telugu', isVerified:false });
  };

  const stats = [
    { label:'Total Users',       value:users.length,                                          icon:Users,        color:'text-blue-400',    bg:'bg-blue-400/10' },
    { label:'Voice Enrolled',    value:mockVoiceprints.length,                                icon:Mic,          color:'text-neon',        bg:'bg-neon/10' },
    { label:'Commands Today',    value:mockCommandLogs.length,                                icon:Activity,     color:'text-purple-400',  bg:'bg-purple-400/10' },
    { label:'Verified Accounts', value:users.filter(u=>u.isVerified).length,                 icon:ShieldCheck,  color:'text-emerald-400', bg:'bg-emerald-400/10' },
    { label:'Auth Denied',       value:mockCommandLogs.filter(l=>l.status==='denied').length, icon:XCircle,      color:'text-red-400',     bg:'bg-red-400/10' },
    { label:'Fallbacks Today',   value:mockCommandLogs.filter(l=>l.status==='fallback').length,icon:AlertTriangle,color:'text-yellow-400', bg:'bg-yellow-400/10' },
  ];

  const tabs = [
    { id:'overview' as Tab,    label:'Overview',     icon:BarChart3 },
    { id:'users' as Tab,       label:'Users',        icon:Users },
    { id:'voiceprints' as Tab, label:'Voiceprints',  icon:Mic },
    { id:'commandlogs' as Tab, label:'Command Logs', icon:History },
    { id:'database' as Tab,    label:'DB Setup',     icon:Database },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-gray-300 pt-20 pb-16">
      <div className="container mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-6">
          <div>
            <h1 className="text-3xl font-bold text-white font-display mb-1">FALCON Admin</h1>
            <p className="text-gray-500 text-sm">All users, voice enrollments, command logs and database setup</p>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>{setRefreshing(true);setTimeout(()=>setRefreshing(false),1200);}}
              className="flex items-center gap-2 px-4 py-2 border border-dark-border rounded-lg text-gray-400 hover:text-white text-sm transition-all">
              <RefreshCw size={14} className={refreshing?'animate-spin':''} /> Refresh
            </button>
            <button onClick={()=>setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-neon text-dark-bg font-bold rounded-lg hover:bg-neon-dark text-sm transition-colors">
              <Plus size={15}/> Add User
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-8 bg-dark-card border border-dark-border rounded-xl p-1 w-fit flex-wrap">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${tab===t.id?'bg-neon/10 text-neon border border-neon/20':'text-gray-500 hover:text-gray-300'}`}>
              <t.icon size={13}/>{t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {stats.map((s,i)=>(
                <div key={i} className="glass-panel p-4">
                  <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-3`}><s.icon size={17}/></div>
                  <div className="text-2xl font-bold text-white font-display">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-dark-border flex justify-between items-center">
                  <h2 className="font-bold text-white text-sm flex items-center gap-2"><Activity size={14} className="text-neon"/>Recent Commands</h2>
                  <button onClick={()=>setTab('commandlogs')} className="text-xs text-neon hover:underline">View all</button>
                </div>
                {mockCommandLogs.slice(0,5).map(log=>(
                  <div key={log.id} className="px-5 py-3 flex items-center justify-between border-b border-dark-border hover:bg-dark-bg/30">
                    <div><p className="text-white text-sm">{log.userName}</p><p className="text-gray-500 text-xs font-mono truncate max-w-[180px]">{log.command}</p></div>
                    <div className="flex items-center gap-2"><AuthBadge layer={log.authLayer}/><StatusBadge status={log.status}/></div>
                  </div>
                ))}
              </div>
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-dark-border flex justify-between items-center">
                  <h2 className="font-bold text-white text-sm flex items-center gap-2"><Mic size={14} className="text-neon"/>Voice Enrollments</h2>
                  <button onClick={()=>setTab('voiceprints')} className="text-xs text-neon hover:underline">View all</button>
                </div>
                {mockVoiceprints.map(vp=>(
                  <div key={vp.userId} className="px-5 py-3 flex items-center justify-between border-b border-dark-border hover:bg-dark-bg/30">
                    <div><p className="text-white text-sm">{vp.userName}</p><p className="text-gray-500 text-xs">F0: {vp.f0} · {vp.enrolledAt}</p></div>
                    <div className="flex items-center gap-2"><span className="text-xs text-gray-500">{vp.lang}</span><CheckCircle2 size={13} className="text-neon"/></div>
                  </div>
                ))}
                {users.filter(u=>!mockVoiceprints.find(v=>v.userName===u.fullName)).map(u=>(
                  <div key={u.id} className="px-5 py-3 flex items-center justify-between border-b border-dark-border opacity-50">
                    <div><p className="text-white text-sm">{u.fullName}</p><p className="text-gray-500 text-xs">Not enrolled yet</p></div>
                    <AlertTriangle size={13} className="text-yellow-400"/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab==='users' && (
          <div>
            {showForm && (
              <form onSubmit={handleSubmit} className="glass-panel p-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-4">Register New User</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input required type="text" placeholder="Full Name" className="bg-dark-bg border border-dark-border rounded-lg p-3 text-white focus:border-neon outline-none text-sm" value={formData.fullName} onChange={e=>setFormData({...formData,fullName:e.target.value})}/>
                  <input required type="text" placeholder="Phone Number" className="bg-dark-bg border border-dark-border rounded-lg p-3 text-white focus:border-neon outline-none text-sm" value={formData.phoneNumber} onChange={e=>setFormData({...formData,phoneNumber:e.target.value})}/>
                  <select className="bg-dark-bg border border-dark-border rounded-lg p-3 text-white focus:border-neon outline-none text-sm" value={formData.languagePreference} onChange={e=>setFormData({...formData,languagePreference:e.target.value})}>
                    <option>Telugu</option><option>Hindi</option><option>Tamil</option><option>English</option>
                  </select>
                  <div className="flex items-center gap-3 bg-dark-bg border border-dark-border rounded-lg p-3">
                    <input type="checkbox" id="verified" className="w-4 h-4 accent-neon" checked={formData.isVerified} onChange={e=>setFormData({...formData,isVerified:e.target.checked})}/>
                    <label htmlFor="verified" className="text-sm text-gray-300">Voice Verified</label>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-neon text-dark-bg font-bold rounded-lg hover:bg-neon-dark text-sm">Save</button>
                </div>
              </form>
            )}
            <div className="glass-panel overflow-hidden">
              <div className="p-5 border-b border-dark-border">
                <h2 className="font-bold text-white">All Registered Users</h2>
                <p className="text-xs text-gray-500 mt-0.5">Spring Boot API → MySQL users table</p>
              </div>
              {loading ? <div className="p-8 text-center text-neon animate-pulse text-sm">Loading from localhost:8080...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="bg-dark-bg/50 text-gray-500 text-xs border-b border-dark-border">
                      <th className="px-5 py-3">ID</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Phone</th>
                      <th className="px-5 py-3">Language</th><th className="px-5 py-3">Voice Enrolled</th>
                      <th className="px-5 py-3">Status</th><th className="px-5 py-3">Registered</th><th className="px-5 py-3 text-right">Actions</th>
                    </tr></thead>
                    <tbody>
                      {users.map(u=>(
                        <tr key={u.id} className="border-b border-dark-border hover:bg-dark-bg/30">
                          <td className="px-5 py-3 text-gray-500 font-mono text-xs">#{u.id}</td>
                          <td className="px-5 py-3 text-white font-medium text-sm">{u.fullName}</td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-300">{u.phoneNumber}</td>
                          <td className="px-5 py-3 text-sm"><span className="flex items-center gap-1"><Globe size={11} className="text-neon"/>{u.languagePreference}</span></td>
                          <td className="px-5 py-3">{mockVoiceprints.find(v=>v.userName===u.fullName)?<span className="flex items-center gap-1 text-neon text-xs"><Mic size={11}/>Enrolled</span>:<span className="text-gray-500 text-xs">Not enrolled</span>}</td>
                          <td className="px-5 py-3"><StatusBadge status={u.isVerified?'Verified':'Pending'}/></td>
                          <td className="px-5 py-3 text-gray-500 text-xs font-mono">{u.createdAt?new Date(u.createdAt).toLocaleDateString('en-IN'):'—'}</td>
                          <td className="px-5 py-3 text-right"><button onClick={()=>u.id&&deleteUser(u.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"><Trash2 size={14}/></button></td>
                        </tr>
                      ))}
                      {users.length===0&&<tr><td colSpan={8} className="p-8 text-center text-gray-500 text-sm">No users found. Start Spring Boot backend to load real data.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VOICEPRINTS ── */}
        {tab==='voiceprints' && (
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-dark-border">
              <h2 className="font-bold text-white">Voice Fingerprint Records</h2>
              <p className="text-xs text-gray-500 mt-0.5">Stored as encrypted hash in users.voiceprint_hash — never raw audio</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-dark-bg/50 text-gray-500 text-xs border-b border-dark-border">
                  <th className="px-5 py-3">User</th><th className="px-5 py-3">Language</th><th className="px-5 py-3">F0 Freq</th>
                  <th className="px-5 py-3">ZCR</th><th className="px-5 py-3">RMS</th><th className="px-5 py-3">Uniqueness</th>
                  <th className="px-5 py-3">Phrases</th><th className="px-5 py-3">Enrolled On</th>
                </tr></thead>
                <tbody>
                  {mockVoiceprints.map(vp=>(
                    <tr key={vp.userId} className="border-b border-dark-border hover:bg-dark-bg/30">
                      <td className="px-5 py-3 text-white font-medium text-sm">{vp.userName}</td>
                      <td className="px-5 py-3 text-sm"><span className="flex items-center gap-1"><Globe size={11} className="text-neon"/>{vp.lang}</span></td>
                      <td className="px-5 py-3 font-mono text-xs text-neon">{vp.f0}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-300">{vp.zcr}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-300">{vp.rms}</td>
                      <td className="px-5 py-3"><ScoreBar score={vp.unique}/></td>
                      <td className="px-5 py-3 text-xs text-gray-300">{vp.phrases}/3 ✓</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{vp.enrolledAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── COMMAND LOGS ── */}
        {tab==='commandlogs' && (
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-dark-border flex justify-between items-center">
              <div>
                <h2 className="font-bold text-white">Voice Command Logs</h2>
                <p className="text-xs text-gray-500 mt-0.5">Every command spoken — intent, auth layer, match score, outcome</p>
              </div>
              <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white border border-dark-border rounded-lg px-3 py-2 hover:border-neon/30 transition-all">
                <Download size={12}/> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-dark-bg/50 text-gray-500 text-xs border-b border-dark-border">
                  <th className="px-5 py-3">Time</th><th className="px-5 py-3">User</th><th className="px-5 py-3">Command</th>
                  <th className="px-5 py-3">Intent</th><th className="px-5 py-3">Auth Layer</th>
                  <th className="px-5 py-3">Match Score</th><th className="px-5 py-3">Language</th><th className="px-5 py-3">Outcome</th>
                </tr></thead>
                <tbody>
                  {mockCommandLogs.map(log=>(
                    <tr key={log.id} className="border-b border-dark-border hover:bg-dark-bg/30">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{log.time}</td>
                      <td className="px-5 py-3 text-white text-sm">{log.userName}</td>
                      <td className="px-5 py-3 text-xs text-gray-300 max-w-[160px] truncate font-mono">{log.command}</td>
                      <td className="px-5 py-3 text-xs"><span className="bg-dark-bg border border-dark-border px-2 py-0.5 rounded-lg text-gray-300 font-mono">{log.intent}</span></td>
                      <td className="px-5 py-3"><AuthBadge layer={log.authLayer}/></td>
                      <td className="px-5 py-3"><ScoreBar score={log.matchScore}/></td>
                      <td className="px-5 py-3 text-xs text-gray-400">{log.lang}</td>
                      <td className="px-5 py-3"><StatusBadge status={log.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DATABASE SETUP ── */}
        {tab==='database' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h2 className="font-bold text-white font-display mb-4 flex items-center gap-2"><Database size={15} className="text-neon"/>MySQL Setup</h2>
              {[
                { label:'1. Create database', code:'CREATE DATABASE falcon_db;\nUSE falcon_db;' },
                { label:'2. application.properties', code:'spring.datasource.url=jdbc:mysql://localhost:3306/falcon_db\nspring.datasource.username=root\nspring.datasource.password=your_password\nspring.jpa.hibernate.ddl-auto=update\nspring.jpa.show-sql=true' },
                { label:'3. Start backend', code:'cd backend-reference\nmvn spring-boot:run' },
              ].map(item=>(
                <div key={item.label} className="mb-4">
                  <p className="text-xs text-neon font-mono mb-2">{item.label}</p>
                  <pre className="bg-dark-bg border border-dark-border rounded-xl p-4 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">{item.code}</pre>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <div className="glass-panel p-6">
                <h2 className="font-bold text-white font-display mb-4 flex items-center gap-2"><Eye size={15} className="text-neon"/>View Data in MySQL</h2>
                {[
                  { label:'All users', code:'SELECT * FROM users;' },
                  { label:'Voice enrolled users', code:'SELECT full_name, voiceprint_hash,\nenrolled_at FROM users\nWHERE voiceprint_hash IS NOT NULL;' },
                  { label:'Failed / locked accounts', code:'SELECT full_name, failed_attempts,\nlocked_until FROM users\nWHERE failed_attempts > 0;' },
                ].map(q=>(
                  <div key={q.label} className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">{q.label}</p>
                    <pre className="bg-dark-bg border border-dark-border rounded-xl p-3 text-xs text-neon font-mono overflow-x-auto whitespace-pre-wrap">{q.code}</pre>
                  </div>
                ))}
              </div>
              <div className="glass-panel p-5">
                <div className="flex items-center gap-2 mb-3"><Lock size={13} className="text-yellow-400"/><span className="text-white font-medium text-sm">What gets stored in MySQL</span></div>
                {[
                  { field:'full_name, phone_number', note:'User identity' },
                  { field:'language_preference', note:'te-IN / hi-IN / ta-IN' },
                  { field:'voiceprint_hash', note:'Encrypted — NOT raw audio' },
                  { field:'enrolled_at', note:'Voice registration timestamp' },
                  { field:'failed_attempts', note:'Lockout counter' },
                  { field:'locked_until', note:'Auto-unlock timestamp' },
                  { field:'preferred_fallback', note:'otp / spoken-pin / csp' },
                ].map(r=>(
                  <div key={r.field} className="flex justify-between items-center py-1.5 border-b border-dark-border last:border-0 text-xs">
                    <code className="text-neon">{r.field}</code>
                    <span className="text-gray-500">{r.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
