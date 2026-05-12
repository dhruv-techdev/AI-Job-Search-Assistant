import React from 'react';
import Navbar from './components/Navbar';
import Hero from './sections/Hero';
import Problem from './sections/Problem';
import Features from './sections/Features';
import AIModels from './sections/AIModels';
import DemoTerminal from './sections/DemoTerminal';
import SampleOutput from './sections/SampleOutput';
import Charts from './sections/Charts';
import Architecture from './sections/Architecture';
import Workflow from './sections/Workflow';
import TechStack from './sections/TechStack';
import Reports from './sections/Reports';
import Challenges from './sections/Challenges';
import Footer from './sections/Footer';

function App() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Problem />
      <Features />
      <AIModels />
      <DemoTerminal />
      <SampleOutput />
      <Charts />
      <Architecture />
      <Workflow />
      <TechStack />
      <Reports />
      <Challenges />
      <Footer />
    </div>
  );
}

export default App;
