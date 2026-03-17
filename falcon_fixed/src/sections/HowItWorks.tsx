import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Cpu, Zap } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';

export const HowItWorks = () => {
  const steps = [
    {
      icon: Mic,
      title: "Step 1: Listen",
      desc: "The system captures the user's voice through a smartphone microphone. Speech-to-text technology converts spoken language into digital text."
    },
    {
      icon: Cpu,
      title: "Step 2: Understand",
      desc: "Artificial Intelligence analyzes the user's intent and determines the requested action. The system checks eligibility or processes transactions securely."
    },
    {
      icon: Zap,
      title: "Step 3: Act",
      desc: "The platform performs the requested task, retrieves the necessary data, and provides confirmation using voice responses and simple visual cues."
    }
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-6">
        <SectionHeading title="How FALCON Works" subtitle="A seamless 3-step process to access any service." />
        
        <div className="relative mt-16 max-w-5xl mx-auto">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-dark-border -translate-y-1/2 z-0" />
          
          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 rounded-full bg-dark-bg border-4 border-neon flex items-center justify-center mb-6 shadow-neon relative">
                  <step.icon className="w-10 h-10 text-neon" />
                  <div className="absolute -bottom-4 -right-2 w-8 h-8 rounded-full bg-neon text-dark-bg font-bold flex items-center justify-center text-sm">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
