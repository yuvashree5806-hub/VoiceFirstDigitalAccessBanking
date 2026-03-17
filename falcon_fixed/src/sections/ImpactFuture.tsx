import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Rocket, TrendingUp, CheckCircle } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';

const useCountUp = (target: number, duration = 1800, inView: boolean) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return val;
};

const StatCard = ({ value, suffix, label, inView }: { value: number; suffix: string; label: string; inView: boolean }) => {
  const count = useCountUp(value, 1800, inView);
  return (
    <div className="bg-dark-bg border border-dark-border p-6 rounded-xl flex items-center gap-4">
      <div className="flex-1">
        <div className="text-2xl font-bold text-neon font-display">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-white font-medium text-sm mt-1">{label}</div>
      </div>
    </div>
  );
};

export const ImpactFuture = () => {
  return (
    <section id="impact" className="py-24 bg-dark-card/30">
      <div className="container mx-auto px-6">
        
        <div className="grid lg:grid-cols-2 gap-16 mb-32">
          {/* Innovation */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-8">
              <Lightbulb className="w-10 h-10 text-neon" />
              <h2 className="text-3xl font-bold text-white">What Makes FALCON Unique?</h2>
            </div>
            
            <ul className="space-y-6 mb-8">
              {[
                "Voice-first design instead of text-heavy banking apps",
                "Built specifically for elderly, disabled, and illiterate users",
                "Local language interaction removes literacy barriers",
                "Combines banking and welfare services in one platform"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 glass-panel p-4">
                  <CheckCircle className="w-6 h-6 text-neon flex-shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="p-6 bg-neon-muted border border-neon/20 rounded-xl">
              <h4 className="text-neon font-bold mb-2">Innovation:</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Uses speech recognition, intent detection, and secure APIs to create a natural conversation-based digital service experience.
              </p>
            </div>
          </motion.div>

          {/* Future Scope */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-8">
              <Rocket className="w-10 h-10 text-blue-400" />
              <h2 className="text-3xl font-bold text-white">Future Scope</h2>
            </div>
            
            <div className="grid gap-4">
              {[
                "Offline and low-internet support",
                "Integration with UPI and digital wallets",
                "AI-based voice authentication for stronger security",
                "Support for more regional languages",
                "Expansion into healthcare, agriculture, and public service platforms"
              ].map((item, i) => (
                <div key={i} className="glass-panel p-5 flex items-center gap-4 border-l-2 border-l-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Long Term Impact */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          {({ isInView }: any) => (
            <>
              <TrendingUp className="w-16 h-16 text-neon mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-white mb-6 font-display">Long-Term Impact</h2>
              <p className="text-xl text-gray-400 mb-12">
                FALCON has the potential to significantly improve financial inclusion. The platform can scale across rural regions in India and other developing countries.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 text-left">
                <StatCard value={190} suffix="M+" label="financially excluded Indians (RBI 2023)" inView={true} />
                <StatCard value={59} suffix="L+" label="BC/CSP agents already in the field" inView={true} />
                <StatCard value={120} suffix="Cr+" label="TAM at 5% RRB adoption (₹)" inView={true} />
                <StatCard value={22} suffix="" label="Indian languages supported via Bhashini" inView={true} />
              </div>
            </>
          )}
        </motion.div>

      </div>
    </section>
  );
};
