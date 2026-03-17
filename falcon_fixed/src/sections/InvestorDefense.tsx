import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Smartphone, Mic2, DollarSign, Shield, HeartPulse,
  Users, ChevronRight, CheckCircle2, XCircle, ArrowRight
} from 'lucide-react';

interface Objection {
  id: number;
  icon: React.ElementType;
  challenge: string;
  shortChallenge: string;
  rejectArg: string;
  counterTitle: string;
  counter: string;
  proof: string[];
  strength: 'strong' | 'medium';
}

const objections: Objection[] = [
  {
    id: 1,
    icon: TrendingUp,
    challenge: '"Google Pay already does this."',
    shortChallenge: 'Market exists',
    rejectArg:
      'BHIM, PhonePe, and Google Pay dominate rural UPI with massive distribution and government backing. Why would anyone adopt a student project?',
    counterTitle: 'They serve the banked. We serve the excluded.',
    counter:
      'Google Pay requires reading menus, typing amounts, and navigating UPI flows. Our users cannot do any of that. FALCON is not a payments competitor — it is the access layer that brings the 190 million RBI-identified financially excluded citizens onto any payment rail, including UPI.',
    proof: [
      '190M Indians identified as financially excluded by RBI (2023)',
      'Google Pay India DAU: ~80M — all already literate & banked',
      'FALCON targets the segment every fintech has left behind',
      'B2B model: we license to banks, not compete with them',
    ],
    strength: 'strong',
  },
  {
    id: 2,
    icon: Smartphone,
    challenge: '"Your users don\'t own smartphones."',
    shortChallenge: 'Device gap',
    rejectArg:
      'Elderly rural Indians are disproportionately on 2G feature phones. Web Speech API needs a browser, internet, and a capable device. You built a solution for a device your users don\'t own.',
    counterTitle: 'JioPhone + CSP network closes the device gap.',
    counter:
      'JioPhone 2 (₹2,999) runs KaiOS with browser support and Web Speech API access — 100M+ units sold in rural India. Additionally, our CSP (Customer Service Point) model means users can access FALCON through a local BC agent\'s smartphone, the same way they already access Aadhaar-based banking. Device ownership is a deployment question, not a product flaw.',
    proof: [
      'JioPhone: 100M+ units sold, majority rural & semi-urban',
      '5.9 lakh BC/CSP agents already cover 99% of districts',
      'Aadhaar BC model proves assisted-device access works at scale',
      'Offline PIN fallback works on any USSD-capable phone',
    ],
    strength: 'strong',
  },
  {
    id: 3,
    icon: Mic2,
    challenge: '"Voice AI fails on Indian accents."',
    shortChallenge: 'Tech accuracy',
    rejectArg:
      'Web Speech API accuracy drops significantly for Tamil, Telugu, Bhojpuri accents on budget phones in noisy environments — exactly where your users are.',
    counterTitle: 'Intent detection over transcription. Noise filtering built-in.',
    counter:
      'We do not rely on perfect transcription. Our NLP layer uses intent matching on partial, noisy input — "pension check karo" and "pens chk" both map to the same intent. We run SNR pre-screening: if audio quality is below threshold, the system switches to DTMF (keypad) input before attempting voice. Bhashini API (Government of India) provides trained Indian-language models as a fallback to Web Speech API.',
    proof: [
      'Bhashini (MeitY) supports 22 scheduled languages, purpose-built for India',
      'Intent matching requires ~60% transcription accuracy, not 100%',
      'SNR pre-check auto-routes to keypad when noise is too high',
      'Tested with Tamil, Telugu, Hindi in SRM lab environment',
    ],
    strength: 'medium',
  },
  {
    id: 4,
    icon: DollarSign,
    challenge: '"There is no business model."',
    shortChallenge: 'Revenue path',
    rejectArg:
      'Banks won\'t pay unless RBI mandates it. Governments move slowly. NGOs have no money. Users can\'t afford subscriptions. No revenue = grant-dependent project that dies.',
    counterTitle: 'Three revenue streams, zero user fees.',
    counter:
      'FALCON operates B2B2C — users never pay. Revenue comes from: (1) SaaS licensing to Regional Rural Banks and Co-operative Banks at ₹15–40 per active user/month — RRBs are actively mandated by RBI to increase financial inclusion metrics. (2) Government API transaction fees: ₹2–5 per welfare eligibility check routed through our platform. (3) White-label licensing to NGOs and MFIs funded by CSR mandates. The total addressable RRB market alone is 43 banks × estimated 2M rural users = ₹120Cr+ ARR at modest adoption.',
    proof: [
      'RBI FI Index mandate requires RRBs to show inclusion progress',
      '43 Regional Rural Banks, each serving 1–5M rural customers',
      'CSR mandate: ₹2 schedule VII covers financial inclusion tech',
      'Comparable: Fino Payments Bank charges ₹25/txn to partner banks',
    ],
    strength: 'medium',
  },
  {
    id: 5,
    icon: Shield,
    challenge: '"Regulation will kill you."',
    shortChallenge: 'Regulatory risk',
    rejectArg:
      'RBI mandates two-factor auth: knowledge factor + possession factor. Voice biometric alone does not satisfy this. You have a compliance gap at the core of your product.',
    counterTitle: 'Voice is Factor 1. OTP is always Factor 2. Fully RBI-compliant.',
    counter:
      'We never claim voice replaces OTP. Voice biometric is the knowledge/inherence factor. OTP to registered mobile is always the possession factor for any transaction above ₹500. This architecture is explicitly RBI-compliant under PA/PG guidelines. Voiceprint data is stored as an encrypted embedding vector — not raw audio — which reduces DPDP Act exposure. We are modelling our data handling on UIDAI\'s tokenisation approach.',
    proof: [
      'RBI PA/PG guidelines: inherence (biometric) + possession (OTP) = compliant',
      'Voiceprint stored as encrypted embedding, not raw biometric audio',
      'DPDP Act 2023 allows biometric processing with explicit consent',
      'Architecture reviewed against UIDAI tokenisation model',
    ],
    strength: 'strong',
  },
  {
    id: 6,
    icon: HeartPulse,
    challenge: '"Throat infection breaks the whole system."',
    shortChallenge: 'Voice reliability',
    rejectArg:
      'If the fallback is PIN or OTP anyway, why does the voice layer exist? You\'ve added complexity without solving the core problem — illiterate users still can\'t use the fallback.',
    counterTitle: 'Voice is the primary path for 90% of sessions. Fallbacks serve edge cases.',
    counter:
      'A throat infection lasts days, not months. The enrolled voice covers 330+ days a year. The fallback chain is: (1) Spoken digit PIN — no reading required, just speak numbers. (2) OTP read aloud by the system — no typing, user just listens and repeats. (3) CSP assisted — a human helps. At no point does the fallback require literacy or typing. The voice layer is not just security — it is the entire interaction paradigm that eliminates menus and text.',
    proof: [
      'Voice covers ~330/365 days — illness is a temporary edge case',
      'Spoken PIN fallback: zero literacy required, zero typing required',
      'OTP read-aloud fallback: system speaks the code, user repeats it',
      'CSP assisted mode: always available for zero-tech users',
    ],
    strength: 'strong',
  },
  {
    id: 7,
    icon: Users,
    challenge: '"Rural users won\'t trust it."',
    shortChallenge: 'Trust barrier',
    rejectArg:
      'Convincing a 70-year-old farmer that voiceprint storage is safe requires massive on-ground trust-building — more than any startup can afford.',
    counterTitle: 'Distribution through trusted intermediaries, not cold acquisition.',
    counter:
      'FALCON does not go directly to end users. We onboard through BC agents, Gram Panchayat operators, and SHG (Self-Help Group) coordinators — people the community already trusts. The enrollment happens face-to-face with a known local person. This is identical to how Jan Dhan accounts were opened: not through an app, but through a trusted local intermediary. We are not a consumer app. We are infrastructure for people who already have trusted local relationships.',
    proof: [
      'Jan Dhan: 50Cr accounts opened via BC agent network, not self-signup',
      'SHG network: 1.2Cr groups, trusted embedded in rural communities',
      'Gram Panchayat digital seva kendras: 2.5 lakh active operators',
      'No cold user acquisition — purely intermediary-led onboarding',
    ],
    strength: 'strong',
  },
];

export const InvestorDefense = () => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const active = objections.find((o) => o.id === activeId);

  return (
    <section id="investor-defense" className="py-24 bg-dark-bg">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono mb-6"
          >
            <XCircle className="w-4 h-4" />
            Investor stress test
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Every objection.{' '}
            <span className="text-neon-gradient">Every answer.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            We stress-tested FALCON against the toughest investor rejections.
            Click any challenge to see our defence.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">

          {/* Left: objection cards */}
          <div className="flex flex-col gap-3">
            {objections.map((obj, i) => (
              <motion.button
                key={obj.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setActiveId(activeId === obj.id ? null : obj.id)}
                className={`w-full text-left glass-panel p-4 flex items-center gap-4 transition-all duration-200 group
                  ${activeId === obj.id
                    ? 'border-neon/60 bg-neon/5'
                    : 'hover:border-neon/30'
                  }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${activeId === obj.id ? 'bg-neon text-dark-bg' : 'bg-red-500/10 text-red-400 group-hover:bg-neon/10 group-hover:text-neon'}`}>
                  <obj.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border
                      ${obj.strength === 'strong'
                        ? 'text-neon border-neon/30 bg-neon/5'
                        : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5'
                      }`}>
                      {obj.strength === 'strong' ? 'Strong counter' : 'Good counter'}
                    </span>
                  </div>
                  <p className="text-white font-medium text-sm truncate">{obj.shortChallenge}</p>
                  <p className="text-gray-500 text-xs truncate">{obj.challenge}</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200
                  ${activeId === obj.id ? 'rotate-90 text-neon' : 'group-hover:text-gray-300'}`} />
              </motion.button>
            ))}
          </div>

          {/* Right: answer panel */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="glass-panel p-8 border-neon/20"
                >
                  {/* Challenge */}
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-red-400 text-xs font-mono font-bold uppercase tracking-wide">
                        The rejection
                      </span>
                    </div>
                    <p className="text-red-200 text-sm leading-relaxed">{active.rejectArg}</p>
                  </div>

                  {/* Counter */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-neon flex-shrink-0" />
                      <span className="text-neon text-xs font-mono font-bold uppercase tracking-wide">
                        Our answer
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-3">{active.counterTitle}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{active.counter}</p>
                  </div>

                  {/* Proof points */}
                  <div className="border-t border-dark-border pt-5">
                    <p className="text-gray-500 text-xs font-mono mb-3 uppercase tracking-wide">
                      Supporting evidence
                    </p>
                    <ul className="space-y-2">
                      {active.proof.map((point, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                          <ArrowRight className="w-3 h-3 text-neon flex-shrink-0 mt-1" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-panel p-8 flex flex-col items-center justify-center text-center min-h-[320px]"
                >
                  <div className="w-16 h-16 rounded-full bg-neon/10 flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-neon" />
                  </div>
                  <p className="text-white font-bold text-lg mb-2">Select an objection</p>
                  <p className="text-gray-500 text-sm">
                    Click any challenge on the left to see our full counter-argument and supporting evidence.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Business model callout */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 p-5 bg-gradient-to-r from-neon/10 to-transparent border border-neon/20 rounded-xl"
            >
              <p className="text-neon text-xs font-mono mb-1 uppercase tracking-wide">Business model</p>
              <p className="text-white font-bold mb-2">Zero fees to users. B2B SaaS revenue.</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { val: '₹15–40', label: 'per user/mo\n(RRB SaaS)' },
                  { val: '₹2–5', label: 'per welfare\nAPI call' },
                  { val: '₹120Cr+', label: 'TAM at 5%\nRRB adoption' },
                ].map((m, i) => (
                  <div key={i} className="bg-dark-bg/60 rounded-lg p-3">
                    <div className="text-neon font-bold text-sm">{m.val}</div>
                    <div className="text-gray-500 text-xs mt-0.5 whitespace-pre-line leading-tight">{m.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
