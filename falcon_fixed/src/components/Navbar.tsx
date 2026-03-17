import React, { useState, useEffect } from 'react';
import { Mic, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home',         href: '#home' },
    { name: 'Problem',      href: '#problem-solution' },
    { name: 'Solution',     href: '#solution' },
    { name: 'Features',     href: '#features' },
    { name: 'Architecture', href: '#architecture' },
    { name: 'Impact',       href: '#impact' },
    { name: 'Team',         href: '#team' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-dark-bg/90 backdrop-blur-md border-b border-dark-border py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-neon rounded-lg flex items-center justify-center group-hover:shadow-neon transition-all">
            <Mic className="text-dark-bg w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white tracking-wider">FALCON</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-sm font-medium text-gray-300 hover:text-neon transition-colors">
              {link.name}
            </a>
          ))}
          <a href="#how-it-works" className="px-5 py-2.5 bg-neon/10 text-neon border border-neon/30 rounded-lg hover:bg-neon hover:text-dark-bg transition-all text-sm font-bold">
            Get Started
          </a>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>

      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-dark-bg border-b border-dark-border py-4 px-6 flex flex-col gap-4 shadow-2xl">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-gray-300 hover:text-neon py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};
