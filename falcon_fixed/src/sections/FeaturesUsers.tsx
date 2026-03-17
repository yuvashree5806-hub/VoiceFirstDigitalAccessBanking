import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Globe, ShieldCheck, Volume2, Network, Users, Building, HeartHandshake } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';

export const FeaturesUsers = () => {
  const features = [
    { icon: Mic, title: "Voice-Based Financial Access", desc: "Users interact with the system entirely through voice commands." },
    { icon: Globe, title: "Multilingual Support", desc: "Supports regional languages to remove literacy barriers." },
    { icon: ShieldCheck, title: "Secure Voice Confirmation", desc: "Transactions are verified through voice-based confirmation and identity checks." },
    { icon: Volume2, title: "Audio Feedback", desc: "Users receive spoken responses, making it easier for non-literate users to understand results." },
    { icon: Network, title: "Integration with Systems", desc: "The platform connects with banking APIs and government welfare databases." },
  ];

  return (
    <section id="features" className="py-24 bg-dark-card/30">
      <div className="container mx-auto px-6">
        
        {/* Core Features */}
        <div className="mb-32">
          <SectionHeading title="Core Features" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-6 hover:border-neon/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-neon-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-neon" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Target Users */}
        <div>
          <SectionHeading title="Who Benefits from FALCON?" />
          <div className="grid md:grid-cols-2 gap-12 mt-12">
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-panel p-8 border-l-4 border-l-neon"
            >
              <div className="flex items-center gap-4 mb-6">
                <Users className="w-8 h-8 text-neon" />
                <h3 className="text-2xl font-bold text-white">Primary Users</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Elderly individuals who struggle with smartphones",
                  "People with disabilities such as visual impairments",
                  "Illiterate or semi-literate users",
                  "Rural populations with limited digital literacy"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-neon mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-panel p-8 border-l-4 border-l-blue-500"
            >
              <div className="flex items-center gap-4 mb-6">
                <Building className="w-8 h-8 text-blue-500" />
                <h3 className="text-2xl font-bold text-white">Stakeholders</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Government welfare departments",
                  "Banks and financial institutions",
                  "NGOs and social organizations",
                  "Policymakers and administrators"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-gradient-to-r from-neon-dark/20 to-transparent p-8 rounded-2xl border border-neon/20 flex items-center gap-6"
          >
            <HeartHandshake className="w-12 h-12 text-neon flex-shrink-0" />
            <div>
              <h4 className="text-xl font-bold text-white mb-2">The Impact</h4>
              <p className="text-gray-300 text-lg">Users gain independence, reduce reliance on intermediaries, and gain safe access to financial services.</p>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};
