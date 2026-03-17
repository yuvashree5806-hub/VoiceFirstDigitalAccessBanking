import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ShieldCheck, AlertTriangle, XCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { useVoiceAuth } from '../hooks/useVoiceAuth';

const scenarios = [
  { key: 'normal', label: 'Normal voice',    icon: '🎤', color: 'border-neon/40 hover:border-neon' },
  { key: 'sick',   label: 'Throat infection', icon: '🤧', color: 'border-yellow-500/40 hover:border-yellow-400' },
  { key: 'noise',  label: 'Noisy background', icon: '🔊', color: 'border-yellow-500/40 hover:border-yellow-400' },
  { key: 'fake',   label: 'Impersonation',    icon: '🎭', color: 'border-red-500/40 hover:border-red-400' },
  { key: 'replay', label: 'Recording replay', icon: '📼', color: 'border-red-500/40 hover:border-red-400' },
  { key: 'large',  label: 'Large transfer',   icon: '💸', color: 'border-blue-500/40 hover:border-blue-400' },
];

const WaveBar = ({ index, active }: { index: number; active: boolean }) => {
  const configs = [
    { min: 4, max: 18, dur: 0.70, delay: 0.00 },
    { min: 6, max: 36, dur: 0.50, delay: 0.10 },
    { min: 3, max: 40, dur: 0.40, delay: 0.05 },
    { min: 8, max: 30, dur: 0.60, delay: 0.15 },
    { min: 5, max: 22, dur: 0.80, delay: 0.20 },
    { min: 9, max: 38, dur: 0.45, delay: 0.08 },
    { min: 3, max: 26, dur: 0.65, delay: 0.18 },
    { min: 7, max: 32, dur: 0.50, delay: 0.12 },
    { min: 4, max: 20, dur: 0.72, delay: 0.22 },
    { min: 6, max: 35, dur: 0.48, delay: 0.06 },
  ];
  const c = configs[index % configs.length];
  return (
    <motion.div
      animate={active
        ? { height: [c.min, c.max, c.min] }
        : { height: 4 }
      }
      transition={active
        ? { repeat: Infinity, duration: c.dur, delay: c.delay, ease: 'easeInOut' }
        : { duration: 0.3 }
      }
      className="w-1.5 rounded-full bg-neon"
      style={{ minHeight: 4 }}
    />
  );
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'authenticated') return <CheckCircle2 className="w-5 h-5 text-neon" />;
  if (status === 'denied') return <XCircle className="w-5 h-5 text-red-400" />;
  return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
};

export const VoiceDemoSection = () => {
  const { isListening, result, simulateAuth } = useVoiceAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ match: '—', snr: '—', f0: '—', layer: '—' });

  const run = (key: string) => {
    setSelected(key);
    setMetrics({ match: '...', snr: '...', f0: '...', layer: '...' });
    simulateAuth(key);
  };

  useEffect(() => {
    if (result) {
      setMetrics({
        match: result.matchScore + '%',
        snr: result.audioQuality,
        f0: result.f0Match,
        layer: result.authLayer,
      });
    }
  }, [result]);

  const matchColor = !result ? 'text-gray-500'
    : result.matchScore >= 85 ? 'text-neon'
    : result.matchScore >= 70 ? 'text-yellow-400'
    : 'text-red-400';

  const statusBg = !result ? 'bg-dark-card border-dark-border text-gray-500'
    : result.status === 'authenticated' ? 'bg-neon/10 border-neon/30 text-neon'
    : result.status === 'denied' ? 'bg-red-500/10 border-red-500/30 text-red-400'
    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';

  return (
    <section id="voice-demo" className="py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          title="Voice Authentication — Live Demo"
          subtitle="See how FALCON handles every real-world scenario including attacks, illness, and noise."
        />

        <div className="grid lg:grid-cols-2 gap-12 mt-16 max-w-5xl mx-auto items-start">

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="relative w-[280px] h-[560px] bg-dark-bg border-[7px] border-dark-border rounded-[2.8rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-0 inset-x-0 flex justify-center z-20">
                <div className="h-5 w-32 bg-dark-border rounded-b-2xl" />
              </div>

              <div className="flex-1 bg-gradient-to-b from-dark-card to-dark-bg p-5 pt-10 flex flex-col relative z-10">
                {/* App header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-white font-bold text-base font-display">VaaniAccess</p>
                    <p className="text-gray-500 text-xs">Voice authentication</p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-neon" />
                </div>

                {/* Waveform */}
                <div className="flex items-center justify-center gap-1 h-14 bg-dark-bg/60 rounded-xl mb-5 px-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <WaveBar key={i} index={i} active={isListening} />
                  ))}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    { label: 'Voice match', val: metrics.match, color: matchColor },
                    { label: 'Audio quality', val: metrics.snr, color: 'text-white' },
                    { label: 'F0 pattern', val: metrics.f0, color: 'text-white' },
                    { label: 'Auth layer', val: metrics.layer, color: 'text-white' },
                  ].map((m) => (
                    <div key={m.label} className="bg-dark-bg border border-dark-border rounded-lg p-2.5 text-center">
                      <div className={`text-base font-bold ${m.color}`}>{m.val}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div className={`border rounded-xl px-3 py-2.5 text-center text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${statusBg}`}>
                  {result && <StatusIcon status={result.status} />}
                  <span>
                    {isListening ? 'Analysing voice...'
                      : !result ? 'Select a scenario'
                      : result.status === 'authenticated' ? 'Authenticated'
                      : result.status === 'denied' ? 'Access denied'
                      : 'Fallback activated'}
                  </span>
                </div>

                {/* Result message */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 text-xs text-gray-400 leading-relaxed bg-dark-bg/50 rounded-lg p-3"
                    >
                      {result.message}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mic button */}
                <div className="flex justify-center mt-4">
                  <div className="relative">
                    {isListening && (
                      <div className="absolute inset-0 bg-neon rounded-full blur-xl opacity-30 animate-pulse" />
                    )}
                    <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all
                      ${isListening ? 'bg-neon text-dark-bg scale-110' : 'bg-dark-border text-gray-400'}`}>
                      <Mic className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Scenario selector */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-400 text-sm mb-5">
              Tap a scenario to simulate what FALCON does in each real-world situation:
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {scenarios.map((s) => (
                <button
                  key={s.key}
                  onClick={() => run(s.key)}
                  disabled={isListening}
                  className={`glass-panel p-4 text-left transition-all duration-200 border
                    ${selected === s.key ? 'border-neon/60 bg-neon/5' : s.color}
                    ${isListening ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-white text-sm font-semibold">{s.label}</div>
                </button>
              ))}
            </div>

            {/* What each outcome means */}
            <div className="space-y-3">
              {[
                { icon: <CheckCircle2 className="w-4 h-4 text-neon" />, label: 'Authenticated', desc: 'Voice match passed. Transaction proceeds immediately.' },
                { icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />, label: 'Fallback activated', desc: 'Voice degraded or high-risk action. System switches to spoken PIN or OTP — zero typing, zero reading required.' },
                { icon: <XCircle className="w-4 h-4 text-red-400" />, label: 'Access denied', desc: 'Formant mismatch or replay detected. Attempt logged. 3 failures locks account and alerts registered contact.' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-3 bg-dark-card/40 rounded-lg border border-dark-border">
                  <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-white text-sm font-semibold">{item.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
