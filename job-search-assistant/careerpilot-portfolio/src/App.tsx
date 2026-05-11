import React from 'react';
import Navbar from './components/Navbar';
import Hero from './sections/Hero';
import Features from './sections/Features';
import DemoTerminal from './sections/DemoTerminal';
import Charts from './sections/Charts';
import Architecture from './sections/Architecture';
import Workflow from './sections/Workflow';
import TechStack from './sections/TechStack';
import Reports from './sections/Reports';
import Footer from './sections/Footer';

function App() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Features />
      <DemoTerminal />
      <Charts />
      <Architecture />
      <Workflow />
      <TechStack />
      <Reports />
      <Footer />
    </div>
  );
}

export default App;
