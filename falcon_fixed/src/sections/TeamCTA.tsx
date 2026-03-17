import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';

export const TeamCTA = () => {
  const team = [
    { name: "M Yuvashree",       role: "Lead Frontend Developer", initials: "MY", color: "bg-neon/20 text-neon border-neon/30" },
    { name: "Tejeshwar P",        role: "Database Developer",      initials: "TP", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { name: "JayaChandra Ruttala", role: "Backend Developer",      initials: "JR", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  ];

  return (
    <>
      <section id="team" className="py-24">
        <div className="container mx-auto px-6">
          <SectionHeading title="Meet the Team" />
          
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 text-center hover:border-neon/30 transition-colors group"
              >
                <div className={`w-24 h-24 mx-auto border-2 rounded-full flex items-center justify-center mb-6 text-2xl font-bold font-display transition-all group-hover:scale-105 ${member.color}`}>
                  {member.initials}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-neon text-sm font-mono">{member.role}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center flex items-center justify-center gap-3 text-gray-400"
          >
            <GraduationCap className="w-6 h-6" />
            <span>SRM Institute of Technology, Kattankulathur</span>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-transparent to-neon/5 border-t border-dark-border relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-neon to-transparent opacity-50" />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Building a Voice-Powered Future</h2>
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              Technology should be accessible to everyone. FALCON is a step toward a future where financial services are inclusive, simple, and available to all through the power of voice.
            </p>
            
            <a href="#problem-solution" className="px-10 py-5 bg-neon text-dark-bg text-lg font-bold rounded-xl hover:bg-neon-dark transition-all shadow-neon-strong flex items-center gap-3 mx-auto hover:scale-105">
              Learn More <ArrowRight className="w-6 h-6" />
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
};
