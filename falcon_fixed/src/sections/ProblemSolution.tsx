import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, FileWarning, Mic, CheckCircle2, MessageSquare } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';

export const ProblemSolution = () => {
  return (
    <section id="problem-solution" className="py-24 bg-dark-card/30">
      <div className="container mx-auto px-6">
        
        {/* Problem Statement */}
        <div className="mb-32">
          <SectionHeading 
            title="The Digital Divide in Financial Services" 
            subtitle="Millions are left behind due to complex interfaces and literacy barriers."
          />
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              { icon: FileWarning, title: "Literacy Barriers", desc: "Modern platforms rely heavily on reading, writing, and typing passwords or PINs." },
              { icon: AlertTriangle, title: "Complex Interfaces", desc: "For elderly citizens and visually impaired users, navigating complicated menus is extremely difficult." },
              { icon: ShieldAlert, title: "Middlemen Exploitation", desc: "Dependence on intermediaries leads to fraud, exploitation, and missed opportunities." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 hover:border-neon/30 transition-colors"
              >
                <item.icon className="w-12 h-12 text-red-400 mb-6" />
                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center p-6 bg-red-500/10 border border-red-500/20 rounded-xl max-w-3xl mx-auto"
          >
            <p className="text-red-200 text-lg">There is an urgent need for a system that allows everyone to access essential financial services independently and safely.</p>
          </motion.div>
        </div>

        {/* The Solution */}
        <div id="solution">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Introducing <span className="text-neon">VaaniAccess</span>
              </h2>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                VaaniAccess is a voice-first financial inclusion platform that enables users to securely access banking services and government welfare programs using natural speech in their native language.
              </p>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Instead of navigating complicated apps, users simply speak commands, and the system processes their request.
              </p>
              
              <div className="space-y-4">
                {[
                  "Check my pension status",
                  "Send ₹500 to Ramesh",
                  "Am I eligible for a government welfare scheme?"
                ].map((cmd, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-neon-muted flex items-center justify-center">
                      <Mic className="w-5 h-5 text-neon" />
                    </div>
                    <span className="text-white font-medium">"{cmd}"</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 w-full"
            >
              <div className="glass-panel p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon/10 blur-[80px] rounded-full" />
                
                <div className="space-y-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
                    <div className="bg-dark-bg border border-dark-border p-4 rounded-2xl rounded-tl-none text-gray-300">
                      "Send ₹500 to Ramesh"
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-neon flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-dark-bg" />
                    </div>
                    <div className="bg-neon-muted border border-neon/30 p-4 rounded-2xl rounded-tr-none text-neon">
                      Processing transfer of ₹500 to Ramesh. Please confirm with your voice pin.
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
                    <div className="bg-dark-bg border border-dark-border p-4 rounded-2xl rounded-tl-none text-gray-300">
                      "My pin is 1 2 3 4"
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-neon flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-dark-bg" />
                    </div>
                    <div className="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-2xl rounded-tr-none text-emerald-400">
                      Transaction successful. ₹500 sent to Ramesh.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
};
