'use client';
import React, { createContext, useContext, useRef } from 'react';
import { type Container } from "@tsparticles/engine";

type ParticlesContextType = {
  container: Container | null;
  setContainer: (container: Container | null) => void;
};

const ParticlesContext = createContext<ParticlesContextType | null>(null);

export function ParticlesProvider({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = React.useState<Container | null>(null);

  return (
    <ParticlesContext.Provider value={{ container, setContainer }}>
      {children}
    </ParticlesContext.Provider>
  );
}

export function useParticles() {
  const context = useContext(ParticlesContext);
  if (!context) {
    throw new Error('useParticles must be used within a ParticlesProvider');
  }
  return context;
}
