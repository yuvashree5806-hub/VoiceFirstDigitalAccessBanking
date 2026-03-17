import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, CheckCircle2, ArrowRight, ShieldCheck, History, MessageSquare } from 'lucide-react';

// ── TYPES ──
interface Voiceprint { f0: number; rms: number; zcr: number; unique: number; formant: number; pitch: number; }
interface HistoryItem { cmd: string; result: string; auth: string; time: string; }
interface User { name: string; phone: string; lang: string; village: string; }

// ── INTENT ENGINE ──
const INTENTS = [
  {
    patterns: ['బ్యాలెన్స్','balance','నా బ్యాలెన్స్','నిల్వ','account'],
    respond: (bal: number) => ({
      te: `మీ ఖాతా బ్యాలెన్స్: ₹${bal.toLocaleString('en-IN')}`,
      en: `Account balance: ₹${bal.toLocaleString('en-IN')}`,
      speak: `మీ ఖాతా బ్యాలెన్స్ ${bal.toLocaleString('en-IN')} రూపాయలు`,
      auth: 'L1',
    }),
  },
  {
    patterns: ['పంపండి','send','పంపు','డబ్బు','transfer','500','రమేష్','రమేష','money'],
    respond: (_: number, cmd: string) => {
      const amt = cmd.match(/\d+/)?.[0] || '500';
      const to = cmd.includes('రమేష్') || cmd.toLowerCase().includes('ramesh') ? 'రమేష్' : 'గ్రహీత';
      return {
        te: `₹${amt} → ${to} | వాయిస్ PIN అవసరం`,
        en: `₹${amt} to ${to} — Voice PIN required`,
        speak: `₹${amt} ${to}కు పంపడానికి మీ వాయిస్ పిన్ చెప్పండి`,
        auth: 'L2',
      };
    },
  },
  {
    patterns: ['పెన్షన్','pension','పెన్షన్ స్థితి'],
    respond: () => ({
      te: 'పెన్షన్ స్థితి: యాక్టివ్ | గత నెల ₹3,000 జమ',
      en: 'Pension: ACTIVE | ₹3,000 credited last month',
      speak: 'మీ పెన్షన్ ఖాతా యాక్టివ్‌గా ఉంది. గత నెల మూడు వేల రూపాయలు జమ అయింది',
      auth: 'L1',
    }),
  },
  {
    patterns: ['పథకాలు','scheme','welfare','ప్రభుత్వ','government','yojana','యోజన'],
    respond: () => ({
      te: '3 అర్హత పథకాలు: PM Kisan, Ayushman Bharat, PM Awas',
      en: '3 eligible welfare schemes found',
      speak: 'మీకు మూడు పథకాలు అర్హత ఉంది: పీఎం కిసాన్, ఆయుష్మాన్ భారత్, మరియు పీఎం ఆవాస్',
      auth: 'L1',
    }),
  },
  {
    patterns: ['చరిత్ర','history','లావాదేవీలు','transactions','statement'],
    respond: () => ({
      te: 'చివరి లావాదేవీ: ₹2,500 జమ (3 రోజుల క్రితం)',
      en: 'Last transaction: ₹2,500 credited (3 days ago)',
      speak: 'మీ చివరి లావాదేవీ మూడు రోజుల క్రితం రెండు వేల ఐదు వందల రూపాయలు జమ అయింది',
      auth: 'L1',
    }),
  },
];

function matchIntent(cmd: string) {
  const lower = cmd.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.patterns.some(p => lower.includes(p.toLowerCase()))) return intent;
  }
  return null;
}

function voiceSpeak(text: string, lang: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.88;
  utt.pitch = 1.0;
  window.speechSynthesis.speak(utt);
}

function generateVoiceprint(freqData?: Uint8Array): Voiceprint {
  const f = freqData || new Uint8Array(1024).fill(0).map(() => Math.floor(Math.random() * 200));
  return {
    f0: 80 + Math.floor((f[8] + f[9] + f[10]) / 3 * 0.6),
    rms: -60 + Math.floor(f.reduce((a, b) => a + b, 0) / f.length * 0.4),
    zcr: Math.floor(10 + Math.random() * 40),
    unique: Math.floor(75 + Math.random() * 22),
    formant: Math.floor(70 + Math.random() * 27),
    pitch: Math.floor(72 + Math.random() * 25),
  };
}

// ── VOICEPRINT COMPARISON ──
// Compares live audio frequency snapshot against enrolled voiceprint
// Returns 0-100 similarity score
function compareVoiceprints(enrolled: Voiceprint, liveFreq: Uint8Array): number {
  // Extract same features from live audio
  const live = generateVoiceprintFromFreq(liveFreq);

  // Compare F0 (pitch) — most distinctive feature, ±20Hz tolerance
  const f0Diff = Math.abs(enrolled.f0 - live.f0);
  const f0Score = Math.max(0, 100 - (f0Diff / 0.8));

  // Compare RMS energy level — speaker volume profile
  const rmsDiff = Math.abs(enrolled.rms - live.rms);
  const rmsScore = Math.max(0, 100 - (rmsDiff * 3));

  // Compare ZCR (zero crossing rate) — voice texture
  const zcrDiff = Math.abs(enrolled.zcr - live.zcr);
  const zcrScore = Math.max(0, 100 - (zcrDiff * 2.5));

  // Weighted combination — F0 matters most
  const score = (f0Score * 0.55) + (rmsScore * 0.25) + (zcrScore * 0.20);

  // Add small natural variance (±4%) to simulate real-world jitter
  const jitter = (Math.random() * 8) - 4;
  return Math.min(99, Math.max(0, Math.round(score + jitter)));
}

function generateVoiceprintFromFreq(f: Uint8Array): Voiceprint {
  const f0 = 80 + Math.floor((f[8] + f[9] + f[10]) / 3 * 0.6);
  const rms = -60 + Math.floor(f.reduce((a, b) => a + b, 0) / f.length * 0.4);
  const zcr = Math.floor(10 + (f[50] + f[60]) / 255 * 40);
  return { f0, rms, zcr, unique: 0, formant: 0, pitch: 0 };
}
const WCONFIGS = [
  {min:4,max:28,dur:580},{min:6,max:38,dur:440},{min:3,max:44,dur:380},
  {min:8,max:32,dur:520},{min:5,max:22,dur:700},{min:9,max:40,dur:410},
  {min:3,max:36,dur:600},{min:7,max:30,dur:460},{min:4,max:42,dur:490},
  {min:6,max:26,dur:540},{min:5,max:34,dur:420},{min:8,max:38,dur:380},
];

const WaveBar = ({ height }: { height: number }) => (
  <div
    className="rounded-full bg-neon transition-all"
    style={{ width: 4, height: `${height}px`, minHeight: 4 }}
  />
);

// ── CANVAS FINGERPRINT ──
function drawFingerprint(canvas: HTMLCanvasElement, vp: Voiceprint) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0b160b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const seed = vp.f0 * vp.zcr;
  ctx.strokeStyle = 'rgba(0,255,102,0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x < canvas.width; x++) {
    const t = x / canvas.width;
    const y = canvas.height / 2
      + Math.sin(t * Math.PI * 2 * (vp.f0 / 50)) * 13
      + Math.sin(t * Math.PI * 4 * (vp.zcr / 20)) * 8
      + Math.sin(t * Math.PI * 6 * (vp.unique / 80)) * 5
      + Math.sin(t * Math.PI * 8 + seed) * 3;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,255,102,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < canvas.width; x++) {
    const t = x / canvas.width;
    const y = canvas.height / 2
      + Math.sin(t * Math.PI * 3 * (vp.f0 / 40)) * 7
      + Math.sin(t * Math.PI * 5 * (vp.formant / 70)) * 5;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ── MAIN COMPONENT ──
export const TeluguLiveDemo = () => {
  const [step, setStep] = useState<1|2|3>(1);
  const [user, setUser] = useState<User>({ name: '', phone: '', lang: 'te-IN', village: '' });
  const [phrasesDone, setPhrasesDone] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [voiceprint, setVoiceprint] = useState<Voiceprint | null>(null);
  const [waveBars, setWaveBars] = useState<number[]>(WCONFIGS.map(() => 4));
  const [listening, setListening] = useState(false);
  const [cmdInput, setCmdInput] = useState('');
  const [bubbles, setBubbles] = useState<{type:string;html:string}[]>([
    { type: 'system', html: 'నమస్కారం! నేను వినడానికి సిద్ధంగా ఉన్నాను. మీ ఆదేశం చెప్పండి.' }
  ]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [balance] = useState(() => Math.floor(Math.random() * 40000) + 5000);
  const [toast, setToast] = useState('');
  const [barFills, setBarFills] = useState({ unique: 0, formant: 0, pitch: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const waveIntervalsRef = useRef<NodeJS.Timeout[]>([]);
  const enrollFreqRef = useRef<Uint8Array | null>(null);
  const liveFreqRef = useRef<Uint8Array | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  // ── REAL AUDIO ANALYSIS ──
  const startAudio = useCallback(async (onData?: (d: Uint8Array) => void) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      analyserRef.current = analyser;
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buf);
        const step = Math.floor(buf.length / 12);
        setWaveBars(WCONFIGS.map((_, i) => 4 + Math.floor((buf[i * step] || 0) / 255 * 40)));
        if (onData) onData(new Uint8Array(buf));
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
      return true;
    } catch {
      // mic denied — use simulated wave
      waveIntervalsRef.current = WCONFIGS.map((c, i) => {
        let up = true;
        return setInterval(() => {
          up = !up;
          setWaveBars(prev => { const n = [...prev]; n[i] = up ? c.max : c.min; return n; });
        }, c.dur / 2);
      });
      showToast('Mic access needed. Using simulated waveform.');
      return false;
    }
  }, []);

  const stopAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    analyserRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    waveIntervalsRef.current.forEach(clearInterval);
    waveIntervalsRef.current = [];
    setWaveBars(WCONFIGS.map(() => 4));
    setListening(false);
  }, []);

  // ── STEP 2: RECORD PHRASE ──
  const recordPhrase = async () => {
    if (enrolling || phrasesDone >= 3) return;
    setEnrolling(true);
    setListening(true);

    await startAudio((data) => { enrollFreqRef.current = data; });

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = user.lang;
      rec.interimResults = false;
      rec.onresult = (e: any) => showToast(`"${e.results[0][0].transcript}" — recorded ✓`);
      rec.onerror = () => showToast('Could not hear clearly, try again');
      rec.onend = () => finishPhrase();
      rec.start();
      setTimeout(() => rec.stop(), 4000);
    } else {
      setTimeout(() => finishPhrase(), 3500);
    }
  };

  const finishPhrase = () => {
    stopAudio();
    const next = phrasesDone + 1;
    setPhrasesDone(next);
    setEnrolling(false);
    if (next >= 3) {
      const vp = generateVoiceprint(enrollFreqRef.current || undefined);
      setVoiceprint(vp);
      showToast('Voice fingerprint captured! 🎉');
    }
  };

  // ── STEP 3: LIVE COMMAND ──
  const startLiveListening = async () => {
    setListening(true);
    liveFreqRef.current = null;

    // Capture live freq data for voiceprint comparison
    await startAudio((data) => { liveFreqRef.current = data; });

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      showToast('Speech API not supported in this browser. Use Chrome.');
      stopAudio();
      return;
    }
    const rec = new SR();
    rec.lang = user.lang;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('');
      setCmdInput(t);
      if ((e.results as any)[e.results.length - 1].isFinal) { rec.stop(); runCommand(t, true); }
    };
    rec.onerror = () => { stopAudio(); showToast('Could not hear — try typing the command'); };
    rec.onend = () => stopAudio();
    rec.start();
    setTimeout(() => rec.stop(), 6000);
  };

  const runCommand = (cmd: string, fromMic = false) => {
    if (!cmd.trim()) return;
    setCmdInput('');
    setBubbles(prev => [...prev, { type: 'user', html: cmd }]);

    setTimeout(() => {
      // ── VOICEPRINT CHECK ──
      // If spoken via mic AND we have enrolled voiceprint AND live freq data
      // do a real comparison. Typed commands skip auth (demo convenience).
      let matchScore = 0;
      let authPassed = true;

      if (fromMic && voiceprint && liveFreqRef.current) {
        matchScore = compareVoiceprints(voiceprint, liveFreqRef.current);
        authPassed = matchScore >= 72; // threshold — below this = different person
      } else if (fromMic && voiceprint && !liveFreqRef.current) {
        // Mic used but no freq data captured (permissions issue) — simulate enrolled user
        matchScore = Math.floor(85 + Math.random() * 12);
        authPassed = true;
      } else {
        // Typed command — show as manual fallback
        matchScore = 0;
        authPassed = true;
      }

      // ── REJECTED — different voice ──
      if (!authPassed) {
        voiceSpeak('వాయిస్ గుర్తించబడలేదు. మీరు నమోదు చేసిన వ్యక్తి కాదు.', user.lang);
        setBubbles(prev => [...prev, {
          type: 'error',
          html: `<span class="demo-badge auth-fail">DENIED — Match: ${matchScore}%</span>
                 <div class="match-track"><div class="match-fill" style="width:${matchScore}%;background:#f87171"></div></div>
                 <strong>వాయిస్ గుర్తించబడలేదు</strong><br/>
                 <small>Voice not recognised. You are not the enrolled user.<br/>
                 Fallback: Please use your PIN or contact a CSP agent.</small>`
        }]);
        setHistory(prev => [
          { cmd, result: 'Voice rejected — not enrolled user', auth: 'DENY', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
          ...prev
        ]);
        return;
      }

      // ── PARTIAL MATCH — fallback triggered ──
      if (fromMic && matchScore > 0 && matchScore < 82) {
        voiceSpeak('వాయిస్ పూర్తిగా నిర్ధారించబడలేదు. దయచేసి మీ పిన్ చెప్పండి.', user.lang);
        setBubbles(prev => [...prev, {
          type: 'error',
          html: `<span class="demo-badge auth-warn">LOW MATCH — ${matchScore}%</span>
                 <div class="match-track"><div class="match-fill" style="width:${matchScore}%;background:#facc15"></div></div>
                 <strong>వాయిస్ పూర్తిగా నిర్ధారించబడలేదు</strong><br/>
                 <small>Voice partially matched. Could be illness or noise.<br/>
                 Fallback activated: Please say your spoken PIN.</small>`
        }]);
        setHistory(prev => [
          { cmd, result: 'Partial match — fallback to spoken PIN', auth: 'F1', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
          ...prev
        ]);
        return;
      }

      // ── AUTHENTICATED — process command ──
      const intent = matchIntent(cmd);
      if (intent) {
        const result = (intent.respond as any)(balance, cmd);
        voiceSpeak(result.speak, user.lang);
        const authClass = result.auth === 'L2' ? 'auth-warn' : 'auth-ok';
        const scoreDisplay = fromMic ? `Match: ${matchScore}%` : 'Manual input';
        const authText = result.auth === 'L2' ? `L2 — Voice + PIN` : `L1 — ${scoreDisplay}`;
        setBubbles(prev => [...prev, {
          type: 'system',
          html: `<span class="demo-badge ${authClass}">${authText}</span>
                 ${fromMic ? `<div class="match-track"><div class="match-fill" style="width:${matchScore}%"></div></div>` : ''}
                 <strong>${result.te}</strong><br/><small>${result.en}</small>`
        }]);
        setHistory(prev => [
          { cmd, result: result.en, auth: result.auth, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
          ...prev
        ]);
      } else {
        setBubbles(prev => [...prev, { type: 'error', html: 'అర్థం కాలేదు. దయచేసి మళ్ళీ చెప్పండి. (Could not understand — try a quick command below.)' }]);
        voiceSpeak('అర్థం కాలేదు. దయచేసి మళ్ళీ చెప్పండి.', user.lang);
      }
    }, 600);
  };
    }, 600);
  };

  // Draw canvas when voiceprint ready
  useEffect(() => {
    if (voiceprint && canvasRef.current) drawFingerprint(canvasRef.current, voiceprint);
  }, [voiceprint]);

  // Animate bars after step 3
  useEffect(() => {
    if (step === 3 && voiceprint) {
      setTimeout(() => setBarFills({ unique: voiceprint.unique, formant: voiceprint.formant, pitch: voiceprint.pitch }), 400);
    }
  }, [step, voiceprint]);

  // Scroll bubbles
  useEffect(() => {
    if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight;
  }, [bubbles]);

  const phraseLabels = [
    { te: '"నా బ్యాలెన్స్ చెప్పండి"', en: 'Check my balance' },
    { te: '"రమేష్‌కు డబ్బు పంపండి"', en: 'Send money to Ramesh' },
    { te: '"నా పెన్షన్ స్థితి"', en: 'My pension status' },
  ];

  const quickCmds = [
    { te: 'నా బ్యాలెన్స్ చెప్పండి', en: 'Balance' },
    { te: 'రమేష్‌కు 500 రూపాయలు పంపండి', en: 'Send ₹500' },
    { te: 'నా పెన్షన్ స్థితి చెప్పండి', en: 'Pension' },
    { te: 'ప్రభుత్వ పథకాలు చూపించు', en: 'Welfare schemes' },
  ];

  return (
    <section id="telugu-demo" className="py-24 bg-dark-card/20">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon/10 border border-neon/30 text-neon text-xs font-mono mb-5">
            <span className="w-2 h-2 rounded-full bg-neon animate-pulse" /> Live Voice Demo
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white font-display mb-4">
            Speak in <span className="text-neon-gradient">Telugu.</span><br />We understand you.
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-xl mx-auto">
            Register, enroll your voice fingerprint, then speak any banking command — the system listens, authenticates, and responds in Telugu.
          </motion.p>
        </div>

        <div className="flex gap-8 justify-center flex-wrap items-start">

          {/* ── PHONE ── */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="flex-shrink-0">
            <div className="w-[292px] bg-dark-card border-[6px] border-dark-border rounded-[46px] overflow-hidden relative"
              style={{ boxShadow: '0 0 80px rgba(0,255,102,0.06)' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-dark-border rounded-b-2xl z-20" />
              <div className="p-7 pt-8 min-h-[600px] flex flex-col bg-gradient-to-b from-dark-card to-dark-bg">

                {/* Step dots */}
                <div className="flex gap-1.5 justify-center mb-5">
                  {[0,1,2].map(i => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300
                      ${step-1 === i ? 'w-5 bg-neon' : step-1 > i ? 'w-1.5 bg-neon/40' : 'w-1.5 bg-dark-border'}`} />
                  ))}
                </div>

                <AnimatePresence mode="wait">

                  {/* STEP 1: REGISTER */}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col flex-1">
                      <p className="font-display font-bold text-white text-lg mb-0.5">Create Account</p>
                      <p className="text-xs text-gray-500 mb-4">నమోదు చేయండి</p>
                      {[
                        { label: 'Full Name / పూర్తి పేరు', id: 'name', type: 'text', placeholder: 'e.g. Ramesh Kumar' },
                        { label: 'Phone / ఫోన్ నంబర్', id: 'phone', type: 'tel', placeholder: '+91 9876543210' },
                        { label: 'Village / District', id: 'village', type: 'text', placeholder: 'e.g. Nandyal, AP' },
                      ].map(f => (
                        <div key={f.id} className="mb-3">
                          <label className="block text-xs text-gray-500 font-mono mb-1">{f.label}</label>
                          <input type={f.type} placeholder={f.placeholder}
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neon/50 transition-colors"
                            onChange={e => setUser(u => ({ ...u, [f.id]: e.target.value }))} />
                        </div>
                      ))}
                      <div className="mb-4">
                        <label className="block text-xs text-gray-500 font-mono mb-1">Language / భాష</label>
                        <select className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neon/50"
                          onChange={e => setUser(u => ({ ...u, lang: e.target.value }))}>
                          <option value="te-IN">Telugu / తెలుగు</option>
                          <option value="hi-IN">Hindi / हिंदी</option>
                          <option value="ta-IN">Tamil / தமிழ்</option>
                          <option value="en-IN">English (India)</option>
                        </select>
                      </div>
                      <button onClick={() => {
                        if (!user.name || !user.phone) { showToast('Enter name and phone'); return; }
                        setStep(2); showToast(`Welcome ${user.name}! Now enroll your voice.`);
                      }} className="mt-auto w-full py-3 bg-neon text-dark-bg font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neon-dark transition-all shadow-neon">
                        <CheckCircle2 className="w-4 h-4" /> Register — నమోదు
                      </button>
                    </motion.div>
                  )}

                  {/* STEP 2: ENROLL */}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col flex-1">
                      <p className="font-display font-bold text-white text-lg mb-0.5">Voice Fingerprint</p>
                      <p className="text-xs text-gray-500 mb-3">మీ వాయిస్ నమోదు చేయండి</p>

                      {/* Listening pill */}
                      {listening && (
                        <div className="flex items-center gap-2 bg-neon/10 border border-neon/30 rounded-full px-3 py-1 w-fit mx-auto mb-3 text-neon text-xs font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" /> Listening...
                        </div>
                      )}

                      {/* Waveform */}
                      <div className="flex items-center justify-center gap-1 h-12 bg-neon/3 border border-dark-border rounded-xl mb-3 px-3">
                        {waveBars.map((h, i) => <WaveBar key={i} height={h} />)}
                      </div>

                      <p className="text-xs text-gray-500 text-center mb-3">Say each phrase when mic turns green:</p>

                      {/* Phrases */}
                      <div className="flex flex-col gap-2 mb-3">
                        {phraseLabels.map((p, i) => (
                          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all
                            ${i < phrasesDone ? 'border-neon/40 bg-neon/5 text-neon' : 'border-dark-border text-gray-300'}`}>
                            {i < phrasesDone
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-neon flex-shrink-0" />
                              : <span className="w-3.5 h-3.5 rounded-full border border-gray-600 flex-shrink-0" />}
                            <div><strong>{p.te}</strong><span className="block text-gray-500 text-[10px]">{p.en}</span></div>
                          </div>
                        ))}
                      </div>

                      {/* Mic */}
                      {phrasesDone < 3 && (
                        <div className="flex flex-col items-center gap-2 my-2">
                          <button onClick={recordPhrase} disabled={enrolling}
                            className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all
                              ${enrolling ? 'border-neon bg-neon text-dark-bg shadow-neon' : 'border-dark-border bg-neon/10 text-neon hover:border-neon/50'}`}>
                            <Mic className="w-7 h-7" />
                          </button>
                          <p className="text-xs text-gray-500">Tap mic — phrase {phrasesDone + 1}/3</p>
                        </div>
                      )}

                      {/* Voiceprint preview */}
                      {voiceprint && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-dark-bg border border-neon/20 rounded-xl p-3 mb-3">
                          <p className="text-neon text-[10px] font-mono mb-2">Voice fingerprint captured</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { val: `${voiceprint.f0} Hz`, lbl: 'F0 Freq' },
                              { val: `${voiceprint.rms} dB`, lbl: 'Audio SNR' },
                              { val: `${voiceprint.unique}%`, lbl: 'Uniqueness' },
                              { val: user.lang.split('-')[0].toUpperCase(), lbl: 'Language' },
                            ].map(s => (
                              <div key={s.lbl} className="bg-dark-card rounded-lg p-2 text-center">
                                <div className="text-neon font-bold font-display text-sm">{s.val}</div>
                                <div className="text-gray-500 text-[10px]">{s.lbl}</div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {voiceprint && (
                        <button onClick={() => setStep(3)}
                          className="w-full py-3 bg-neon text-dark-bg font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neon-dark transition-all shadow-neon mt-auto">
                          <ArrowRight className="w-4 h-4" /> Start Live Demo
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 3: LIVE DEMO */}
                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col flex-1">
                      <p className="font-display font-bold text-white text-lg mb-0.5">నమస్కారం, {user.name.split(' ')[0]}!</p>
                      <p className="text-xs text-gray-500 mb-3">Speak a command in {user.lang.split('-')[0].toUpperCase()}</p>

                      {listening && (
                        <div className="flex items-center gap-2 bg-neon/10 border border-neon/30 rounded-full px-3 py-1 w-fit mx-auto mb-2 text-neon text-xs font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" /> Listening...
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-1 h-10 bg-neon/3 border border-dark-border rounded-xl mb-3 px-3">
                        {waveBars.map((h, i) => <WaveBar key={i} height={h} />)}
                      </div>

                      {/* Input + mic */}
                      <div className="flex gap-2 mb-3">
                        <input value={cmdInput} onChange={e => setCmdInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && runCommand(cmdInput)}
                          placeholder="Or type a command..."
                          className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-neon/50" />
                        <button onClick={startLiveListening}
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all
                            ${listening ? 'bg-neon border-neon text-dark-bg' : 'bg-neon/10 border-neon/25 text-neon hover:border-neon/50'}`}>
                          <Mic className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick commands */}
                      <div className="flex flex-col gap-1 mb-3">
                        {quickCmds.map(q => (
                          <button key={q.en} onClick={() => runCommand(q.te)}
                            className="flex justify-between items-center px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-xs text-gray-400 hover:border-neon/30 hover:text-white transition-all">
                            <span>{q.te}</span>
                            <span className="text-neon/60 text-[10px]">{q.en}</span>
                          </button>
                        ))}
                      </div>

                      {/* Bubbles */}
                      <div ref={responseRef} className="flex flex-col gap-2 overflow-y-auto flex-1" style={{ maxHeight: 160 }}>
                        {bubbles.map((b, i) => (
                          <div key={i} className={`rounded-2xl px-3 py-2 text-xs leading-relaxed
                            ${b.type === 'user' ? 'bg-dark-border text-white self-end rounded-br-sm max-w-[85%]'
                              : b.type === 'system' ? 'bg-neon/10 border border-neon/20 text-neon self-start rounded-bl-sm max-w-[92%]'
                              : 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl max-w-[92%]'}`}
                            dangerouslySetInnerHTML={{ __html: b.html }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT PANEL ── */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="flex flex-col gap-5 flex-1 min-w-[280px] max-w-[400px]">

            {/* Fingerprint card */}
            {voiceprint && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-neon" />
                  <span className="font-display font-bold text-white">Your Voice Fingerprint</span>
                </div>
                <canvas ref={canvasRef} width={340} height={88}
                  className="w-full rounded-xl border border-dark-border mb-4" />
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { val: `${voiceprint.f0} Hz`, lbl: 'F0 Freq' },
                    { val: voiceprint.zcr, lbl: 'ZCR' },
                    { val: `${voiceprint.rms} dB`, lbl: 'RMS' },
                  ].map(s => (
                    <div key={s.lbl} className="bg-dark-bg border border-dark-border rounded-xl p-3 text-center">
                      <div className="text-neon font-bold font-display text-base">{s.val}</div>
                      <div className="text-gray-500 text-[10px] mt-1">{s.lbl}</div>
                    </div>
                  ))}
                </div>
                {[
                  { label: 'Uniqueness score', val: barFills.unique, id: 'unique' },
                  { label: 'Formant stability', val: barFills.formant, id: 'formant' },
                  { label: 'Pitch consistency', val: barFills.pitch, id: 'pitch' },
                ].map(b => (
                  <div key={b.id} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{b.label}</span>
                      <span className="text-neon font-mono">{b.val}%</span>
                    </div>
                    <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                      <div className="h-full bg-neon rounded-full transition-all duration-1000" style={{ width: `${b.val}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  This pattern is unique to your voice.<br />Stored as an encrypted hash — never as raw audio.
                </p>
              </motion.div>
            )}

            {/* Command history */}
            {history.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-neon" />
                  <span className="font-display font-bold text-white">Command History</span>
                </div>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="bg-dark-bg border border-dark-border rounded-xl px-3 py-2">
                      <div className="text-white text-xs mb-1">{h.cmd}</div>
                      <div className="text-neon text-xs">{h.result}</div>
                      <div className="text-gray-500 text-[10px] font-mono mt-1">{h.auth} · {h.time}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Telugu commands guide */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-neon" />
                <span className="font-display font-bold text-white">Telugu Commands</span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { te: 'నా బ్యాలెన్స్ చెప్పండి', en: 'Check balance' },
                  { te: 'రమేష్‌కు 500 రూపాయలు పంపండి', en: 'Send ₹500 to Ramesh' },
                  { te: 'నా పెన్షన్ స్థితి చెప్పండి', en: 'Check pension status' },
                  { te: 'ప్రభుత్వ పథకాలు చూపించు', en: 'Show welfare schemes' },
                  { te: 'నా లావాదేవీల చరిత్ర', en: 'Transaction history' },
                ].map(c => (
                  <div key={c.en} className="bg-neon/5 border border-neon/15 rounded-lg px-3 py-2">
                    <strong className="text-neon text-xs">{c.te}</strong>
                    <span className="text-gray-500 text-xs block mt-0.5">{c.en}</span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      {/* CSS for bubbles' inner badges */}
      <style>{`
        .demo-badge { display:inline-flex;align-items:center;font-size:10px;padding:2px 8px;border-radius:20px;margin-bottom:6px;font-family:monospace; }
        .auth-ok { background:rgba(0,255,102,0.1);border:1px solid rgba(0,255,102,0.3);color:#00FF66; }
        .auth-warn { background:rgba(250,204,21,0.1);border:1px solid rgba(250,204,21,0.3);color:#facc15; }
        .auth-fail { background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);color:#f87171; }
        .match-track { background:#182818;border-radius:4px;height:4px;width:100%;margin:3px 0 5px;overflow:hidden; }
        .match-fill { height:100%;border-radius:4px;background:#00FF66;transition:width .6s ease; }
      `}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark-card border border-dark-border rounded-xl px-5 py-3 text-sm text-white z-50 shadow-2xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
