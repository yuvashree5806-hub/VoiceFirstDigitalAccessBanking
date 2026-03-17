import React from 'react';
import { motion } from 'framer-motion';
import { Layout, Server, Database, Lock, Mic, ArrowRight } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';

export const ArchitectureFlow = () => {
  const techStack = [
    {
      icon: Layout,
      title: "Frontend",
      items: ["HTML5 for structure", "CSS3 for accessible styling", "JavaScript for voice interaction", "Web Speech API (Speech-to-text)", "Speech Synthesis API (Voice responses)"]
    },
    {
      icon: Server,
      title: "Backend",
      items: ["Java", "Spring Boot framework", "REST APIs", "Business logic for transactions & checks"]
    },
    {
      icon: Database,
      title: "Database",
      items: ["MySQL database", "Stores user profiles", "Welfare schemes data", "Transaction history"]
    },
    {
      icon: Lock,
      title: "Security",
      items: ["Voice confirmation for transactions", "Identity verification", "Security questions"]
    },
    {
      icon: Mic,
      title: "Voice Biometrics",
      items: ["Web Audio API waveform analysis", "F0 fundamental frequency matching", "Formant frequency extraction", "SNR noise pre-screening", "Liveness challenge (anti-replay)", "Bhashini API fallback (22 languages)"]
    }
  ];

  const flowSteps = [
    "User Voice Input",
    "Frontend Speech Recognition",
    "Backend API Processing",
    "Database / Government APIs",
    "Voice Response to User"
  ];

  return (
    <section id="architecture" className="py-24">
      <div className="container mx-auto px-6">
        
        {/* Technical Architecture */}
        <div className="mb-32">
          <SectionHeading title="Technical Approach" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {techStack.map((tech, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-6"
              >
                <div className="flex items-center gap-3 mb-6 border-b border-dark-border pb-4">
                  <tech.icon className="w-6 h-6 text-neon" />
                  <h3 className="text-xl font-bold text-white">{tech.title}</h3>
                </div>
                <ul className="space-y-3">
                  {tech.items.map((item, j) => (
                    <li key={j} className="text-sm text-gray-400 flex items-start gap-2">
                      <span className="text-neon mt-1">▹</span> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* System Architecture Flow */}
        <div>
          <SectionHeading title="System Architecture Flow" subtitle="This architecture ensures fast processing and secure access to services." />
          
          <div className="mt-16 overflow-x-auto pb-8">
            <div className="flex items-center justify-between min-w-[800px] gap-4">
              {flowSteps.map((step, i) => (
                <React.Fragment key={i}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-1 bg-dark-card border border-neon/30 p-4 rounded-xl text-center relative group hover:border-neon transition-colors"
                  >
                    <div className="absolute inset-0 bg-neon/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 font-mono text-sm text-neon-gradient font-bold">{step}</span>
                  </motion.div>
                  
                  {i < flowSteps.length - 1 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + 0.1 }}
                      className="text-neon/40"
                    >
                      <ArrowRight className="w-6 h-6" />
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
