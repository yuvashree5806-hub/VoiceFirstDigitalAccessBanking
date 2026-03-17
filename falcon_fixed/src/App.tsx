import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './sections/Hero';
import { ProblemSolution } from './sections/ProblemSolution';
import { HowItWorks } from './sections/HowItWorks';
import { VoiceDemoSection } from './sections/VoiceDemoSection';
import { FeaturesUsers } from './sections/FeaturesUsers';
import { ArchitectureFlow } from './sections/ArchitectureFlow';
import { ImpactFuture } from './sections/ImpactFuture';
import { InvestorDefense } from './sections/InvestorDefense';
import { TeamCTA } from './sections/TeamCTA';
import { Dashboard } from './pages/Dashboard';

const LandingPage = () => (
  <>
    <Hero />
    <ProblemSolution />
    <HowItWorks />
    <VoiceDemoSection />
    <FeaturesUsers />
    <ArchitectureFlow />
    <ImpactFuture />
    <InvestorDefense />
    <TeamCTA />
  </>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-gray-300 selection:bg-neon selection:text-dark-bg">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin" element={<Dashboard />} />
          </Routes>
        </main>

        <footer className="bg-dark-bg border-t border-dark-border py-8 text-center text-gray-500 text-sm">
          <p>© 2025 FALCON – Voice-First Digital Access for Financial Inclusion. All rights reserved.</p>
          <p className="mt-2 text-gray-600 text-xs">SRM Institute of Technology, Kattankulathur</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
