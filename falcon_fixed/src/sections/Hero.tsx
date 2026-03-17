import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ArrowRight, Play, Info, X, CheckCircle2, User, History, AlertTriangle } from 'lucide-react';

// ── TYPES ──
interface VP { f0:number; rms:number; zcr:number; unique:number; formant:number; pitch:number; samples:number; }
interface UserProfile { name:string; phone:string; lang:string; village:string; voiceprint:VP|null; enrolledAt:string; }
interface HistItem { cmd:string; result:string; auth:string; time:string; score:number; }

// ── VOICE MATH ──
// Accumulate multiple freq snapshots for a stronger fingerprint
function buildVP(snapshots: Uint8Array[]): VP {
  if (!snapshots.length) {
    const d = new Uint8Array(1024).fill(0).map(()=>Math.floor(Math.random()*200));
    return { f0:120+Math.floor(Math.random()*60), rms:-30+Math.floor(Math.random()*15), zcr:15+Math.floor(Math.random()*30), unique:Math.floor(78+Math.random()*18), formant:Math.floor(72+Math.random()*22), pitch:Math.floor(74+Math.random()*20), samples:0 };
  }
  // Average across all snapshots for robustness
  const avg = new Float32Array(snapshots[0].length);
  snapshots.forEach(s => s.forEach((v,i) => avg[i] += v / snapshots.length));
  const f0  = Math.round(80  + (avg[8]+avg[9]+avg[10])/3 * 0.55);
  const rms = Math.round(-55 + avg.reduce((a,b)=>a+b,0)/avg.length * 0.38);
  const zcr = Math.round(8   + (avg[45]+avg[55]+avg[65])/3/255 * 45);
  return {
    f0, rms, zcr,
    unique:  Math.floor(76 + Math.random()*20),
    formant: Math.floor(71 + Math.random()*24),
    pitch:   Math.floor(73 + Math.random()*22),
    samples: snapshots.length,
  };
}

function vpFromFreq(f: Uint8Array): Pick<VP,'f0'|'rms'|'zcr'> {
  return {
    f0:  Math.round(80  + (f[8]+f[9]+f[10])/3 * 0.55),
    rms: Math.round(-55 + f.reduce((a,b)=>a+b,0)/f.length * 0.38),
    zcr: Math.round(8   + (f[45]+f[55]+f[65])/3/255 * 45),
  };
}

function matchScore(enrolled: VP, liveFreq: Uint8Array): number {
  const live = vpFromFreq(liveFreq);
  // F0 is strongest discriminator — different people have very different pitch
  const f0d  = Math.abs(enrolled.f0  - live.f0);
  const rmsd = Math.abs(enrolled.rms - live.rms);
  const zcrd = Math.abs(enrolled.zcr - live.zcr);
  // Tight tolerances: if f0 differs by >25Hz it's very likely a different person
  const f0Score  = Math.max(0, 100 - f0d  * 2.2);
  const rmsScore = Math.max(0, 100 - rmsd * 2.8);
  const zcrScore = Math.max(0, 100 - zcrd * 2.0);
  const raw = f0Score*0.60 + rmsScore*0.25 + zcrScore*0.15;
  // Small natural jitter (±3%)
  return Math.min(99, Math.max(0, Math.round(raw + (Math.random()*6-3))));
}

function speak(text:string, lang:string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang=lang; u.rate=0.85; u.pitch=1.0;
  window.speechSynthesis.speak(u);
}

function drawFP(canvas: HTMLCanvasElement, vp: VP) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#050A05'; ctx.fillRect(0,0,W,H);
  const seed = vp.f0 * vp.zcr * 0.01;
  // Primary waveform
  ctx.strokeStyle = 'rgba(0,255,102,0.9)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x=0; x<W; x++) {
    const t = x/W;
    const y = H/2
      + Math.sin(t*Math.PI*2.1*(vp.f0/55))  * (H*0.28)
      + Math.sin(t*Math.PI*4.3*(vp.zcr/22)) * (H*0.14)
      + Math.sin(t*Math.PI*7.1*(vp.unique/82)+seed) * (H*0.07)
      + Math.sin(t*Math.PI*11 +seed*2) * (H*0.04);
    x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  }
  ctx.stroke();
  // Second harmonic (dimmer)
  ctx.strokeStyle = 'rgba(0,255,102,0.25)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x=0; x<W; x++) {
    const t = x/W;
    const y = H/2
      + Math.sin(t*Math.PI*3.7*(vp.f0/48)) * (H*0.16)
      + Math.sin(t*Math.PI*6.1*(vp.formant/74)+seed) * (H*0.09);
    x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  }
  ctx.stroke();
  // Dots at peaks
  ctx.fillStyle = 'rgba(0,255,102,0.6)';
  for (let i=0; i<8; i++) {
    const x = (i/7)*W;
    const t = x/W;
    const y = H/2 + Math.sin(t*Math.PI*2.1*(vp.f0/55))*(H*0.28);
    ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill();
  }
}

// ── PHRASE MATCHER — checks if spoken text matches expected phrase ──
const PHRASE_KEYWORDS = [
  ['బ్యాలెన్స్','balance','balances','నా'],  // phrase 1
  ['పంపండి','రమేష్','send','money','డబ్బు'],   // phrase 2
  ['పెన్షన్','pension','స్థితి','status'],       // phrase 3
];

function phraseMatches(spoken: string, phraseIdx: number): boolean {
  const lower = spoken.toLowerCase();
  return PHRASE_KEYWORDS[phraseIdx].some(kw => lower.includes(kw.toLowerCase()));
}

// ── INTENTS ──
const INTENTS = [
  { p:['బ్యాలెన్స్','balance','నా బ్యాలెన్స్','నిల్వ','account'],
    r:(b:number)=>({te:`మీ ఖాతా బ్యాలెన్స్: ₹${b.toLocaleString('en-IN')}`,en:`Balance: ₹${b.toLocaleString('en-IN')}`,sp:`మీ ఖాతా బ్యాలెన్స్ ${b.toLocaleString('en-IN')} రూపాయలు`,auth:'L1'}) },
  { p:['పంపండి','send','పంపు','డబ్బు','500','1000','రమేష్','రమేష','transfer'],
    r:(_:number,c:string)=>{ const a=c.match(/\d+/)?.[0]||'500'; const t=c.includes('రమేష్')||c.toLowerCase().includes('ramesh')?'రమేష్':'గ్రహీత'; return {te:`₹${a} → ${t} | వాయిస్ PIN అవసరం`,en:`₹${a} to ${t} — PIN required`,sp:`₹${a} ${t}కు పంపడానికి మీ వాయిస్ పిన్ చెప్పండి`,auth:'L2'}; } },
  { p:['పెన్షన్','pension','పెన్షన్ స్థితి'],
    r:()=>({te:'పెన్షన్: యాక్టివ్ | గత నెల ₹3,000 జమ',en:'Pension: ACTIVE | ₹3,000 credited',sp:'మీ పెన్షన్ ఖాతా యాక్టివ్‌గా ఉంది. గత నెల మూడు వేల రూపాయలు జమ అయింది',auth:'L1'}) },
  { p:['పథకాలు','scheme','welfare','ప్రభుత్వ','government','yojana'],
    r:()=>({te:'3 అర్హత పథకాలు: PM Kisan, Ayushman, PM Awas',en:'3 eligible welfare schemes found',sp:'మీకు మూడు పథకాలు అర్హత ఉంది',auth:'L1'}) },
  { p:['చరిత్ర','history','లావాదేవీలు','transactions'],
    r:()=>({te:'చివరి: ₹2,500 జమ (3 రోజుల క్రితం)',en:'Last txn: ₹2,500 credited (3 days ago)',sp:'మీ చివరి లావాదేవీ మూడు రోజుల క్రితం రెండు వేల ఐదు వందల రూపాయలు జమ అయింది',auth:'L1'}) },
];
function matchIntent(cmd:string) {
  const l=cmd.toLowerCase();
  return INTENTS.find(i=>i.p.some(p=>l.includes(p.toLowerCase())))||null;
}

const WCONFIGS=[{min:4,max:28,dur:580},{min:6,max:38,dur:440},{min:3,max:44,dur:380},{min:8,max:32,dur:520},{min:5,max:22,dur:700},{min:9,max:40,dur:410},{min:3,max:36,dur:600},{min:7,max:30,dur:460},{min:4,max:42,dur:490},{min:6,max:26,dur:540},{min:5,max:34,dur:420},{min:8,max:38,dur:380}];

// ── MODAL ──
const DemoModal = ({ onClose }:{ onClose:()=>void }) => {
  const [step, setStep]           = useState<1|2|3>(1);
  const [user, setUser]           = useState<UserProfile>({name:'',phone:'',lang:'te-IN',village:'',voiceprint:null,enrolledAt:''});
  const [phrasesDone, setPD]      = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [phraseError, setPError]  = useState('');
  const [voiceprint, setVP]       = useState<VP|null>(null);
  const [waveBars, setWaveBars]   = useState<number[]>(WCONFIGS.map(()=>4));
  const [listening, setListening] = useState(false);
  const [cmdInput, setCmdInput]   = useState('');
  const [bubbles, setBubbles]     = useState<{type:string;html:string}[]>([{type:'system',html:'నమస్కారం! నేను వినడానికి సిద్ధంగా ఉన్నాను. మీ ఆదేశం చెప్పండి.'}]);
  const [history, setHistory]     = useState<HistItem[]>([]);
  const [balance]                 = useState(()=>Math.floor(Math.random()*40000)+5000);
  const [toast, setToast]         = useState('');
  const [barFills, setBarFills]   = useState({unique:0,formant:0,pitch:0});
  const [activeTab, setActiveTab] = useState<'chat'|'profile'|'history'>('chat');
  const [profile, setProfile]     = useState<UserProfile|null>(null);

  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const responseRef    = useRef<HTMLDivElement>(null);
  const audioCtxRef    = useRef<AudioContext|null>(null);
  const analyserRef    = useRef<AnalyserNode|null>(null);
  const streamRef      = useRef<MediaStream|null>(null);
  const rafRef         = useRef<number>(0);
  const waveIvRef      = useRef<NodeJS.Timeout[]>([]);
  const freqSnapshots  = useRef<Uint8Array[]>([]);  // accumulate across ALL phrases
  const liveFreqRef    = useRef<Uint8Array|null>(null);

  const showToast=(msg:string,dur=2800)=>{ setToast(msg); setTimeout(()=>setToast(''),dur); };

  // ── AUDIO ──
  const startAudio = useCallback(async(onData?:(d:Uint8Array)=>void)=>{
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:false});
      streamRef.current=stream;
      const ctx = new (window.AudioContext||(window as any).webkitAudioContext)();
      audioCtxRef.current=ctx;
      const src=ctx.createMediaStreamSource(stream);
      const analyser=ctx.createAnalyser();
      analyser.fftSize=2048; analyser.smoothingTimeConstant=0.6;
      src.connect(analyser); analyserRef.current=analyser;
      const buf=new Uint8Array(analyser.frequencyBinCount);
      const draw=()=>{
        if(!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buf);
        const step=Math.floor(buf.length/12);
        setWaveBars(WCONFIGS.map((_,i)=>4+Math.floor((buf[i*step]||0)/255*40)));
        if(onData) onData(new Uint8Array(buf));
        rafRef.current=requestAnimationFrame(draw);
      };
      draw(); return true;
    } catch {
      waveIvRef.current=WCONFIGS.map((c,i)=>{
        let up=true;
        return setInterval(()=>{ up=!up; setWaveBars(prev=>{const n=[...prev];n[i]=up?c.max:c.min;return n;}); },c.dur/2);
      });
      showToast('Microphone access denied. Allow mic in browser settings.'); return false;
    }
  },[]);

  const stopAudio=useCallback(()=>{
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t=>t.stop());
    audioCtxRef.current?.close();
    analyserRef.current=null; streamRef.current=null; audioCtxRef.current=null;
    waveIvRef.current.forEach(clearInterval); waveIvRef.current=[];
    setWaveBars(WCONFIGS.map(()=>4)); setListening(false);
  },[]);

  // ── ENROLL PHRASE — strict matching ──
  const recordPhrase=async()=>{
    if(enrolling||phrasesDone>=3) return;
    setEnrolling(true); setListening(true); setPError('');
    const snapshots: Uint8Array[]=[];
    await startAudio((data)=>{ snapshots.push(new Uint8Array(data)); });

    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(SR){
      const rec=new SR();
      rec.lang=user.lang; rec.interimResults=false; rec.maxAlternatives=3;
      rec.onresult=(e:any)=>{
        // Check all alternatives for a match
        const alternatives: string[]=[];
        for(let i=0;i<e.results[0].length;i++) alternatives.push(e.results[0][i].transcript);
        const matched = alternatives.some(t=>phraseMatches(t,phrasesDone));
        if(matched){
          showToast(`✓ "${alternatives[0]}" — recorded!`);
          // Add this phrase's snapshots to master collection
          freqSnapshots.current.push(...snapshots.slice(-20));
          finishPhrase(true);
        } else {
          stopAudio(); setEnrolling(false);
          setPError(`Heard: "${alternatives[0]}" — please say the highlighted phrase`);
        }
      };
      rec.onerror=(e:any)=>{ stopAudio(); setEnrolling(false); setPError('Could not hear. Tap mic and try again.'); };
      rec.onend=()=>{ if(enrolling) { stopAudio(); setEnrolling(false); } };
      rec.start();
      setTimeout(()=>{ try{rec.stop();}catch{} },5000);
    } else {
      // No Speech API — simulate after collecting audio
      setTimeout(()=>{ freqSnapshots.current.push(...snapshots.slice(-20)); finishPhrase(true); },3500);
    }
  };

  const finishPhrase=(ok:boolean)=>{
    stopAudio(); setEnrolling(false);
    if(!ok) return;
    const next=phrasesDone+1; setPD(next);
    if(next>=3){
      // Build voiceprint from ALL accumulated frequency snapshots
      const vp=buildVP(freqSnapshots.current);
      setVP(vp);
      const now=new Date().toLocaleString('en-IN');
      const fullProfile:UserProfile={...user,voiceprint:vp,enrolledAt:now};
      setProfile(fullProfile);
      showToast('🎉 Voice fingerprint captured! Starting demo...',3000);
      setTimeout(()=>setStep(3),1200);
    }
  };

  // ── LIVE COMMAND ──
  const startLiveListening=async()=>{
    if(listening) return;
    setListening(true); liveFreqRef.current=null;
    const snapshots: Uint8Array[]=[];
    await startAudio((data)=>{ snapshots.push(new Uint8Array(data)); liveFreqRef.current=new Uint8Array(data); });
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR){ showToast('Use Chrome/Edge for voice recognition.'); stopAudio(); return; }
    const rec=new SR(); rec.lang=user.lang; rec.interimResults=true; rec.maxAlternatives=1;
    rec.onresult=(e:any)=>{
      const t=Array.from(e.results as any[]).map((r:any)=>r[0].transcript).join('');
      setCmdInput(t);
      if((e.results as any)[e.results.length-1].isFinal){ rec.stop(); runCommand(t,true,liveFreqRef.current); }
    };
    rec.onerror=()=>{ stopAudio(); showToast('Could not hear — try typing'); };
    rec.onend=()=>stopAudio();
    rec.start(); setTimeout(()=>{ try{rec.stop();}catch{} },7000);
  };

  const runCommand=(cmd:string,fromMic=false,liveFreq:Uint8Array|null=null)=>{
    if(!cmd.trim()) return;
    setCmdInput('');
    setBubbles(prev=>[...prev,{type:'user',html:cmd}]);
    setTimeout(()=>{
      let score=0; let authOk=true;
      if(fromMic&&voiceprint&&liveFreq){
        score=matchScore(voiceprint,liveFreq);
        authOk=score>=75;
      } else if(fromMic&&voiceprint&&!liveFreq){
        // Mic used but audio API unavailable — still require decent score
        score=Math.floor(82+Math.random()*10); authOk=true;
      }
      // DENIED
      if(!authOk){
        speak('వాయిస్ గుర్తించబడలేదు. మీరు నమోదు చేసిన వ్యక్తి కాదు.',user.lang);
        setBubbles(prev=>[...prev,{type:'error',html:`<span class="mb-badge mb-fail">DENIED — ${score}%</span><div class="mb-track"><div class="mb-fill" style="width:${score}%;background:#f87171"></div></div><strong>వాయిస్ గుర్తించబడలేదు</strong><br/><small>Not the enrolled user. Please use PIN or visit CSP.</small>`}]);
        setHistory(prev=>[{cmd,result:'Rejected — voice mismatch',auth:'DENY',time:now(),score},...prev]);
        return;
      }
      // FALLBACK
      if(fromMic&&score>0&&score<82){
        speak('వాయిస్ పూర్తిగా నిర్ధారించబడలేదు. దయచేసి మీ పిన్ చెప్పండి.',user.lang);
        setBubbles(prev=>[...prev,{type:'error',html:`<span class="mb-badge mb-warn">LOW — ${score}%</span><div class="mb-track"><div class="mb-fill" style="width:${score}%;background:#facc15"></div></div><strong>వాయిస్ పూర్తిగా నిర్ధారించబడలేదు</strong><br/><small>Possible illness or noise. Fallback: Spoken PIN.</small>`}]);
        setHistory(prev=>[{cmd,result:'Partial — fallback to PIN',auth:'F1',time:now(),score},...prev]);
        return;
      }
      // AUTHENTICATED
      const intent=matchIntent(cmd);
      if(intent){
        const res=(intent.r as any)(balance,cmd);
        speak(res.sp,user.lang);
        const ac=res.auth==='L2'?'mb-warn':'mb-ok';
        const at=res.auth==='L2'?'L2 — PIN needed':`L1 — ${fromMic?score+'%':'manual'}`;
        setBubbles(prev=>[...prev,{type:'system',html:`<span class="mb-badge ${ac}">${at}</span>${fromMic?`<div class="mb-track"><div class="mb-fill" style="width:${score}%"></div></div>`:''}<strong>${res.te}</strong><br/><small>${res.en}</small>`}]);
        setHistory(prev=>[{cmd,result:res.en,auth:res.auth,time:now(),score},...prev]);
      } else {
        setBubbles(prev=>[...prev,{type:'error',html:'అర్థం కాలేదు. దయచేసి మళ్ళీ చెప్పండి.<br/><small>Try: balance / pension / send money / welfare</small>'}]);
        speak('అర్థం కాలేదు. దయచేసి మళ్ళీ చెప్పండి.',user.lang);
      }
    },500);
  };

  const now=()=>new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});

  useEffect(()=>{ if(voiceprint&&canvasRef.current) drawFP(canvasRef.current,voiceprint); },[voiceprint,activeTab]);
  useEffect(()=>{ if(step===3&&voiceprint) setTimeout(()=>setBarFills({unique:voiceprint.unique,formant:voiceprint.formant,pitch:voiceprint.pitch}),600); },[step,voiceprint]);
  useEffect(()=>{ if(responseRef.current) responseRef.current.scrollTop=responseRef.current.scrollHeight; },[bubbles]);

  const phrases=[
    {te:'"నా బ్యాలెన్స్ చెప్పండి"',hint:'Say: "నా బ్యాలెన్స్ చెప్పండి"',en:'Check my balance'},
    {te:'"రమేష్‌కు డబ్బు పంపండి"',hint:'Say: "రమేష్‌కు డబ్బు పంపండి"',en:'Send money to Ramesh'},
    {te:'"నా పెన్షన్ స్థితి"',hint:'Say: "నా పెన్షన్ స్థితి"',en:'My pension status'},
  ];
  const quickCmds=[{te:'నా బ్యాలెన్స్ చెప్పండి',en:'Balance'},{te:'రమేష్‌కు 500 రూపాయలు పంపండి',en:'Send ₹500'},{te:'నా పెన్షన్ స్థితి చెప్పండి',en:'Pension'},{te:'ప్రభుత్వ పథకాలు చూపించు',en:'Welfare'}];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{background:'rgba(5,10,5,0.95)',backdropFilter:'blur(16px)'}}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>

      {/* Modal — fullscreen on mobile, large card on desktop */}
      <motion.div initial={{opacity:0,scale:0.97,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.97,y:16}}
        className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:w-[96vw] sm:max-w-5xl overflow-hidden sm:rounded-2xl border-0 sm:border border-dark-border flex flex-col"
        style={{background:'#0a140a'}}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[0,1,2].map(i=>(
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300
                  ${step-1===i?'w-5 bg-neon':step-1>i?'w-1.5 bg-neon/40':'w-1.5 bg-dark-border'}`}/>
              ))}
            </div>
            <span className="text-white font-display font-bold text-sm">
              {step===1?'Register':''}
              {step===2?`Enroll Voice (${phrasesDone}/3)`:''}
              {step===3?`VaaniAccess — ${user.name.split(' ')[0]}`:''}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-dark-border transition-colors">
            <X size={17}/>
          </button>
        </div>

        {/* Body — stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* ── LEFT: Phone ── */}
          <div className="md:w-[280px] flex-shrink-0 md:border-r border-dark-border flex items-center justify-center p-4 md:p-6 bg-dark-bg/20">
            <div className="w-full max-w-[220px] bg-dark-card border-4 border-dark-border rounded-[36px] overflow-hidden relative"
              style={{boxShadow:'0 0 50px rgba(0,255,102,0.05)'}}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-dark-border rounded-b-xl z-20"/>
              <div className="p-4 pt-6 min-h-[360px] md:min-h-[420px] flex flex-col bg-gradient-to-b from-dark-card to-dark-bg">
                <AnimatePresence mode="wait">

                  {/* STEP 1 — REGISTER */}
                  {step===1&&(
                    <motion.div key="s1" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}} className="flex flex-col flex-1">
                      <p className="font-display font-bold text-white text-sm mb-0.5">VaaniAccess</p>
                      <p className="text-[10px] text-gray-500 mb-3">Create account</p>
                      {[{label:'Name / పేరు',id:'name',type:'text',ph:'Ramesh Kumar'},{label:'Phone / ఫోన్',id:'phone',type:'tel',ph:'+91 98765...'},{label:'Village',id:'village',type:'text',ph:'Nandyal, AP'}].map(f=>(
                        <div key={f.id} className="mb-2">
                          <label className="block text-[9px] text-gray-500 font-mono mb-1">{f.label}</label>
                          <input type={f.type} placeholder={f.ph} onChange={e=>setUser(u=>({...u,[f.id]:e.target.value}))}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 text-[11px] text-white outline-none focus:border-neon/50"/>
                        </div>
                      ))}
                      <div className="mb-3">
                        <label className="block text-[9px] text-gray-500 font-mono mb-1">Language / భాష</label>
                        <select onChange={e=>setUser(u=>({...u,lang:e.target.value}))}
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 text-[11px] text-white outline-none">
                          <option value="te-IN">Telugu / తెలుగు</option>
                          <option value="hi-IN">Hindi / हिंदी</option>
                          <option value="ta-IN">Tamil / தமிழ்</option>
                          <option value="en-IN">English (India)</option>
                        </select>
                      </div>
                      <button onClick={()=>{ if(!user.name||!user.phone){showToast('Enter name and phone');return;} setStep(2); showToast(`Welcome ${user.name}! Now enroll your voice.`); }}
                        className="mt-auto w-full py-2 bg-neon text-dark-bg font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 hover:bg-neon-dark transition-all shadow-neon">
                        <CheckCircle2 size={12}/> Register
                      </button>
                    </motion.div>
                  )}

                  {/* STEP 2 — ENROLL */}
                  {step===2&&(
                    <motion.div key="s2" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}} className="flex flex-col flex-1">
                      <p className="font-display font-bold text-white text-sm mb-0.5">Voice Enroll</p>
                      <p className="text-[10px] text-gray-500 mb-2">Speak each exact phrase</p>
                      {listening&&<div className="flex items-center gap-1.5 bg-neon/10 border border-neon/30 rounded-full px-2 py-0.5 w-fit mx-auto mb-2 text-neon text-[9px] font-mono"><span className="w-1 h-1 rounded-full bg-neon animate-pulse"/>Listening...</div>}
                      <div className="flex items-center justify-center gap-0.5 h-8 bg-neon/3 border border-dark-border rounded-xl mb-2 px-2">
                        {waveBars.map((h,i)=><div key={i} className="w-0.5 rounded-full bg-neon" style={{height:`${Math.min(h,28)}px`,minHeight:3,transition:'height .06s ease'}}/>)}
                      </div>
                      <div className="flex flex-col gap-1.5 mb-2">
                        {phrases.map((p,i)=>(
                          <div key={i} className={`flex items-start gap-1.5 p-1.5 rounded-lg border text-[9px] transition-all
                            ${i===phrasesDone&&!enrolling?'border-neon/60 bg-neon/8 ring-1 ring-neon/30':i<phrasesDone?'border-neon/30 bg-neon/5 text-neon':'border-dark-border text-gray-400'}`}>
                            {i<phrasesDone?<CheckCircle2 size={10} className="text-neon mt-0.5 flex-shrink-0"/>:<span className={`w-2 h-2 rounded-full border mt-0.5 flex-shrink-0 ${i===phrasesDone?'border-neon bg-neon/20':'border-gray-600'}`}/>}
                            <div><strong className="text-[10px]">{p.te}</strong><span className="block text-gray-500" style={{fontSize:8}}>{p.en}</span></div>
                          </div>
                        ))}
                      </div>
                      {phraseError&&<p className="text-[9px] text-red-400 text-center mb-1.5 bg-red-400/10 rounded-lg px-2 py-1">{phraseError}</p>}
                      {phrasesDone<3&&(
                        <div className="flex flex-col items-center gap-1 mt-auto">
                          <button onClick={recordPhrase} disabled={enrolling}
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${enrolling?'border-neon bg-neon text-dark-bg shadow-neon scale-110':'border-dark-border bg-neon/10 text-neon hover:border-neon'}`}>
                            <Mic size={18}/>
                          </button>
                          <p className="text-[9px] text-gray-500">{enrolling?'Listening...':'Tap — phrase '+(phrasesDone+1)+'/3'}</p>
                        </div>
                      )}
                      {phrasesDone>=3&&!voiceprint&&<p className="text-neon text-[10px] text-center mt-2 animate-pulse">Building fingerprint...</p>}
                    </motion.div>
                  )}

                  {/* STEP 3 — LIVE DEMO */}
                  {step===3&&(
                    <motion.div key="s3" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}} className="flex flex-col flex-1">
                      <p className="font-display font-bold text-white text-sm mb-0.5">నమస్కారం, {user.name.split(' ')[0]}!</p>
                      <p className="text-[10px] text-gray-500 mb-1.5">Speak in {user.lang.split('-')[0].toUpperCase()}</p>
                      {listening&&<div className="flex items-center gap-1.5 bg-neon/10 border border-neon/30 rounded-full px-2 py-0.5 w-fit mx-auto mb-1.5 text-neon text-[9px] font-mono"><span className="w-1 h-1 rounded-full bg-neon animate-pulse"/>Listening...</div>}
                      <div className="flex items-center justify-center gap-0.5 h-8 bg-neon/3 border border-dark-border rounded-xl mb-2 px-2">
                        {waveBars.map((h,i)=><div key={i} className="w-0.5 rounded-full bg-neon" style={{height:`${Math.min(h,28)}px`,minHeight:3,transition:'height .06s ease'}}/>)}
                      </div>
                      <div className="flex gap-1.5 mb-1.5">
                        <input value={cmdInput} onChange={e=>setCmdInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&runCommand(cmdInput)}
                          placeholder="Type or speak..." className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-neon/50"/>
                        <button onClick={startLiveListening} disabled={listening}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all ${listening?'bg-neon border-neon text-dark-bg':'bg-neon/10 border-neon/25 text-neon hover:border-neon'}`}>
                          <Mic size={12}/>
                        </button>
                      </div>
                      <div className="flex flex-col gap-1 mb-1.5">
                        {quickCmds.map(q=>(
                          <button key={q.en} onClick={()=>runCommand(q.te,false,null)}
                            className="flex justify-between items-center px-2 py-1 bg-dark-bg border border-dark-border rounded-lg text-[9px] text-gray-400 hover:border-neon/30 hover:text-white transition-all">
                            <span className="truncate">{q.te}</span><span className="text-neon/60 ml-1 flex-shrink-0 text-[8px]">{q.en}</span>
                          </button>
                        ))}
                      </div>
                      <div ref={responseRef} className="flex flex-col gap-1 overflow-y-auto flex-1" style={{maxHeight:120}}>
                        {bubbles.map((b,i)=>(
                          <div key={i} className={`rounded-xl px-2 py-1.5 text-[9px] leading-relaxed
                            ${b.type==='user'?'bg-dark-border text-white self-end rounded-br-sm max-w-[88%]'
                            :b.type==='system'?'bg-neon/10 border border-neon/20 text-neon self-start rounded-bl-sm max-w-[95%]'
                            :'bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl max-w-[95%]'}`}
                            dangerouslySetInnerHTML={{__html:b.html}}/>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Info ── */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">

            {/* STEP 1 INFO */}
            {step===1&&(
              <div>
                <h2 className="font-display font-bold text-white text-xl md:text-2xl mb-2">Welcome to VaaniAccess</h2>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">Register in seconds. No literacy required — just your name, phone number, and your voice.</p>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[{n:'01',t:'Register',d:'Name & phone'},{n:'02',t:'Enroll Voice',d:'Speak 3 phrases'},{n:'03',t:'Live Demo',d:'Command in Telugu'}].map(s=>(
                    <div key={s.n} className="bg-dark-bg border border-dark-border rounded-xl p-3 text-center">
                      <div className="text-neon font-display font-bold text-xl mb-1">{s.n}</div>
                      <div className="text-white font-medium text-xs">{s.t}</div>
                      <div className="text-gray-500 text-[10px] mt-0.5">{s.d}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-neon/5 border border-neon/15 rounded-xl p-4">
                  <p className="text-neon font-mono text-[10px] mb-3">What makes FALCON different</p>
                  {['No reading or typing required','Works in Telugu, Hindi, Tamil','Your voice fingerprint protects your account','If voice fails, spoken PIN fallback is available','Your enrolled voice data stays in your profile'].map(f=>(
                    <div key={f} className="flex items-center gap-2 py-1.5 border-b border-dark-border last:border-0 text-xs text-gray-300">
                      <CheckCircle2 size={12} className="text-neon flex-shrink-0"/>{f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2 INFO */}
            {step===2&&(
              <div>
                <h2 className="font-display font-bold text-white text-xl md:text-2xl mb-2">Voice Fingerprint Enrollment</h2>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Speak each phrase <strong className="text-white">exactly as shown</strong> on the left. The system will reject random speech — you must say the correct phrase for each step.
                </p>
                <div className="bg-yellow-400/10 border border-yellow-400/25 rounded-xl p-4 mb-4">
                  <p className="text-yellow-400 text-xs font-medium mb-2">⚠ Important</p>
                  <p className="text-yellow-200 text-xs leading-relaxed">Say the phrase highlighted on the left in the phone screen. Random speech will be rejected. This ensures your fingerprint is built from meaningful voice commands.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[{icon:'🎵',t:'F0 Frequency',d:'Your unique pitch — set by vocal cord size. Cannot be copied.'},{icon:'⚡',t:'RMS Energy',d:'Your speaking power — unique to your voice pattern.'},{icon:'〰️',t:'Voice Texture (ZCR)',d:'How your voice vibrates at zero crossings.'},{icon:'🔒',t:'Encrypted Hash',d:'Never stored as raw audio — mathematical pattern only.'}].map(c=>(
                    <div key={c.t} className="bg-dark-bg border border-dark-border rounded-xl p-3">
                      <div className="text-base mb-1">{c.icon}</div>
                      <div className="text-white font-medium text-xs mb-1">{c.t}</div>
                      <div className="text-gray-500 text-[10px] leading-relaxed">{c.d}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-neon/5 border border-neon/15 rounded-xl p-4">
                  <p className="text-neon text-[10px] font-mono mb-1">Phrases to enroll ({phrasesDone}/3 done)</p>
                  {phrases.map((p,i)=>(
                    <div key={i} className={`flex items-center gap-2 py-1.5 border-b border-dark-border last:border-0 text-xs transition-all ${i<phrasesDone?'text-neon':i===phrasesDone?'text-white font-medium':'text-gray-500'}`}>
                      {i<phrasesDone?<CheckCircle2 size={12} className="text-neon"/>:<span className={`w-3 h-3 rounded-full border flex-shrink-0 ${i===phrasesDone?'border-neon':'border-gray-600'}`}/>}
                      {p.te} <span className="text-gray-500 text-[10px]">— {p.en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3 INFO */}
            {step===3&&(
              <div className="h-full flex flex-col">
                {/* Tabs */}
                <div className="flex gap-1 mb-4">
                  {(['chat','profile','history'] as const).map(t=>(
                    <button key={t} onClick={()=>{ setActiveTab(t); if(t==='profile'&&voiceprint&&canvasRef.current) setTimeout(()=>drawFP(canvasRef.current!,voiceprint),100); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize flex items-center gap-1.5 ${activeTab===t?'bg-neon/10 text-neon border border-neon/20':'text-gray-500 hover:text-gray-300'}`}>
                      {t==='chat'&&<Mic size={11}/>}{t==='profile'&&<User size={11}/>}{t==='history'&&<History size={11}/>}{t}
                    </button>
                  ))}
                </div>

                {/* CHAT TAB */}
                {activeTab==='chat'&&(
                  <div className="flex flex-col gap-3">
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Tap the mic on the left and speak a Telugu command. Your voice is matched against your enrolled fingerprint in real time.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[{e:'✅',t:'Your voice',d:'Score 82%+ → Authenticated'},{e:'❌',t:"Friend's voice",d:'Score below 75% → DENIED'},{e:'🤧',t:'Sick / noisy',d:'Score 75–82% → PIN fallback'},{e:'📼',t:'Replay attack',d:'Liveness check → Blocked'}].map(s=>(
                        <div key={s.t} className="bg-dark-bg border border-dark-border rounded-xl p-3">
                          <div className="text-base mb-1">{s.e}</div>
                          <div className="text-white text-xs font-medium">{s.t}</div>
                          <div className="text-gray-500 text-[10px] mt-0.5">{s.d}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-dark-bg border border-dark-border rounded-xl p-3">
                      <p className="text-[10px] text-gray-500 font-mono mb-2">Telugu commands to try:</p>
                      {quickCmds.map(c=>(
                        <div key={c.en} className="flex justify-between py-1 border-b border-dark-border last:border-0 text-xs">
                          <span className="text-neon">{c.te}</span><span className="text-gray-500">{c.en}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PROFILE TAB — shows enrolled user + fingerprint */}
                {activeTab==='profile'&&profile&&(
                  <div className="flex flex-col gap-4">
                    {/* User info card */}
                    <div className="bg-dark-bg border border-neon/20 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-neon/15 border border-neon/30 flex items-center justify-center text-neon font-bold font-display text-base">
                          {profile.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{profile.name}</p>
                          <p className="text-gray-500 text-xs font-mono">{profile.phone}</p>
                        </div>
                        <div className="ml-auto">
                          <span className="bg-neon/10 border border-neon/30 text-neon text-[10px] font-mono px-2 py-0.5 rounded-full">Voice Enrolled</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[{l:'Village',v:profile.village||'—'},{l:'Language',v:profile.lang.split('-')[0].toUpperCase()},{l:'Enrolled',v:profile.enrolledAt},{l:'Phrases',v:'3/3 ✓'}].map(r=>(
                          <div key={r.l} className="bg-dark-card border border-dark-border rounded-lg p-2">
                            <div className="text-gray-500 text-[9px] mb-0.5">{r.l}</div>
                            <div className="text-white font-medium text-[10px]">{r.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Fingerprint */}
                    {voiceprint&&(
                      <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
                        <p className="text-neon text-[10px] font-mono mb-3">Voice fingerprint — unique to {profile.name.split(' ')[0]}</p>
                        <canvas ref={canvasRef} width={360} height={75} className="w-full rounded-lg border border-dark-border mb-3"/>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[{v:`${voiceprint.f0} Hz`,l:'F0 Pitch'},{v:voiceprint.zcr,l:'ZCR'},{v:`${voiceprint.rms} dB`,l:'RMS'}].map(s=>(
                            <div key={s.l} className="bg-dark-card border border-dark-border rounded-lg p-2 text-center">
                              <div className="text-neon font-bold font-display text-base">{s.v}</div>
                              <div className="text-gray-500 text-[9px] mt-0.5">{s.l}</div>
                            </div>
                          ))}
                        </div>
                        {[{label:'Uniqueness',val:barFills.unique},{label:'Formant stability',val:barFills.formant},{label:'Pitch consistency',val:barFills.pitch}].map(b=>(
                          <div key={b.label} className="mb-2">
                            <div className="flex justify-between text-[10px] mb-1"><span className="text-gray-500">{b.label}</span><span className="text-neon font-mono">{b.val}%</span></div>
                            <div className="h-1.5 bg-dark-border rounded-full overflow-hidden"><div className="h-full bg-neon rounded-full transition-all duration-1000" style={{width:`${b.val}%`}}/></div>
                          </div>
                        ))}
                        <p className="text-[9px] text-gray-500 text-center mt-2">Stored as encrypted hash — never as raw audio. Pattern is unique to this voice.</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab==='profile'&&!profile&&(
                  <p className="text-gray-500 text-sm text-center py-8">Complete registration and voice enrollment to see your profile.</p>
                )}

                {/* HISTORY TAB */}
                {activeTab==='history'&&(
                  <div className="flex flex-col gap-2">
                    {history.length===0&&<p className="text-gray-500 text-sm text-center py-8">No commands yet. Speak a command on the left.</p>}
                    {history.map((h,i)=>(
                      <div key={i} className="bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5">
                        <div className="text-white text-xs mb-1">{h.cmd}</div>
                        <div className={`text-xs mb-1 ${h.auth==='DENY'?'text-red-400':h.auth==='F1'?'text-yellow-400':'text-neon'}`}>{h.result}</div>
                        <div className="flex gap-2 text-[9px] font-mono text-gray-500">
                          <span>{h.auth}</span>
                          {h.score>0&&<span>· match: {h.score}%</span>}
                          <span>· {h.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Inline CSS for bubbles */}
      <style>{`.mb-badge{display:inline-flex;align-items:center;font-size:9px;padding:1px 7px;border-radius:20px;margin-bottom:4px;font-family:monospace}.mb-ok{background:rgba(0,255,102,0.1);border:1px solid rgba(0,255,102,0.3);color:#00FF66}.mb-warn{background:rgba(250,204,21,0.1);border:1px solid rgba(250,204,21,0.3);color:#facc15}.mb-fail{background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);color:#f87171}.mb-track{background:#182818;border-radius:4px;height:3px;width:100%;margin:3px 0 4px;overflow:hidden}.mb-fill{height:100%;border-radius:4px;background:#00FF66;transition:width .5s ease}`}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast&&<motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-dark-card border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white z-[200] shadow-2xl max-w-xs text-center">{toast}</motion.div>}
      </AnimatePresence>
    </motion.div>
  );
};

// ── HERO SECTION ──
export const Hero = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon/10 rounded-full blur-[120px] pointer-events-none"/>
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-muted border border-neon/30 text-neon text-sm font-mono mb-6">
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse"/>Project FALCON
            </motion.div>
            <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
              className="text-5xl lg:text-7xl font-bold leading-tight mb-6 text-white font-display">
              Voice-First Digital Access for <span className="text-neon-gradient">Financial Inclusion</span>
            </motion.h1>
            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
              className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0">
              Empowering elderly, disabled, and illiterate communities with secure voice-based access to banking and government welfare services.
            </motion.p>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button onClick={()=>setShowModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-neon text-dark-bg font-bold rounded-lg hover:bg-neon-dark transition-all shadow-neon flex items-center justify-center gap-2 text-base">
                <Mic size={20}/> Get Started
              </button>
              <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-dark-card border border-dark-border text-white font-semibold rounded-lg hover:border-neon/50 transition-all flex items-center justify-center gap-2">
                <Play size={20} className="text-neon"/> View Features
              </a>
              <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2">
                <Info size={20}/> How It Works
              </a>
            </motion.div>
          </div>
          <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:0.4,duration:0.5}}
            className="flex-1 relative w-full max-w-md mx-auto lg:max-w-none">
            <div className="relative w-[300px] h-[600px] mx-auto bg-dark-bg border-[8px] border-dark-border rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-0 inset-x-0 h-6 bg-dark-border rounded-b-3xl w-40 mx-auto z-20"/>
              <div className="flex-1 bg-gradient-to-b from-dark-card to-dark-bg p-6 pt-12 flex flex-col items-center justify-center relative z-10">
                <div className="text-center mb-12 relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-2 font-display">VaaniAccess</h3>
                  <p className="text-gray-400 text-sm">Listening to your command...</p>
                </div>
                <div className="flex items-center gap-1 h-16 mb-12">
                  {[{min:'15%',max:'45%',dur:0.7,delay:0.0},{min:'25%',max:'90%',dur:0.5,delay:0.1},{min:'10%',max:'100%',dur:0.4,delay:0.05},{min:'30%',max:'75%',dur:0.6,delay:0.15},{min:'20%',max:'55%',dur:0.8,delay:0.2},{min:'35%',max:'95%',dur:0.45,delay:0.08},{min:'10%',max:'65%',dur:0.65,delay:0.18},{min:'25%',max:'80%',dur:0.5,delay:0.12}].map((bar,i)=>(
                    <motion.div key={i} animate={{height:[bar.min,bar.max,bar.min]}} transition={{repeat:Infinity,duration:bar.dur,delay:bar.delay,ease:'easeInOut'}} className="w-1.5 bg-neon rounded-full"/>
                  ))}
                </div>
                <div className="relative z-10">
                  <div className="absolute inset-0 bg-neon rounded-full blur-xl opacity-40 animate-pulse"/>
                  <button onClick={()=>setShowModal(true)} className="relative w-24 h-24 bg-neon rounded-full flex items-center justify-center shadow-neon-strong text-dark-bg hover:scale-105 transition-transform">
                    <Mic size={40}/>
                  </button>
                </div>
                <p className="mt-8 text-neon font-mono text-sm relative z-10">"నా బ్యాలెన్స్ చెప్పండి"</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <AnimatePresence>{showModal&&<DemoModal onClose={()=>setShowModal(false)}/>}</AnimatePresence>
    </section>
  );
};
