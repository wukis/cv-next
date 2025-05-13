'use client';
import React, { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from 'next/dynamic';
// Renamed to avoid conflict: tsParticlesEngineInit
import { initParticlesEngine as tsParticlesEngineInit } from "@tsparticles/react"; 
import { loadAll } from "@tsparticles/all";
import { type Container, type ISourceOptions } from "@tsparticles/engine";
import ErrorBoundary from '@/components/ErrorBoundary';

// Dynamically import and memoize the Particles component
const DynamicMemoizedParticles = dynamic(() =>
    import('@tsparticles/react').then((module) => {
        // module.Particles is the actual component from the library
        // We wrap it with React.memo
        // A simple check to ensure module.Particles is a component-like structure
        if (typeof module.Particles === 'function' || 
            (typeof module.Particles === 'object' && module.Particles !== null)) {
            return React.memo(module.Particles);
        }
        // Fallback, though module.Particles should always be a component
        return module.Particles; 
    }),
    { ssr: false }
);

const ParticlesBackground = () => {
    const [init, setInit] = useState(false);

    useEffect(() => {
        tsParticlesEngineInit(async (engine) => {
            await loadAll(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = useCallback(async (container?: Container): Promise<void> => {
        // Placeholder for any future logic on particles loaded
    }, []);

    const options: ISourceOptions = useMemo(() => {
        return {
            particles: {
                color: { value: "#2563eb", animation: { enable: true, speed: 10 } },
                effect: { type: "trail", options: { trail: { length: 50, minWidth: 4 } } },
                move: {
                    direction: "none", // Particles will initially move based on emitter settings or attract
                    enable: true,
                    outModes: { default: "destroy" },
                    path: { clamp: false, enable: true, delay: { value: 0 }, generator: "polygonPathGenerator", options: { sides: 6, turnSteps: 120, angle: 120 } }, // Re-enabled path for honeycomb shape
                    random: false,
                    speed: 3, // Speed of general movement, can be adjusted
                    straight: false,
                    attract: { // Added attract feature
                        enable: true,
                        rotateX: 600, // Example values, can be tuned
                        rotateY: 1200, // Example values, can be tuned
                        distance: 150, // Attraction distance, particles closer than this will attract
                    }
                },
                number: { value: 0 }, // Emitters will control the number of particles
                opacity: {
                    value: 0.15, // Target opacity
                    animation: {
                        enable: true,
                        speed: 0.1, // Lower speed = slower fade-in. Particle takes 0.15/0.1 = 1.5s to reach full opacity.
                        minimumValue: 0, // Start completely transparent
                        startValue: "min", // Ensures it starts at minimumValue (0)
                        destroy: "none" // Opacity animation doesn't destroy the particle
                    }
                },
                shape: { type: "circle" },
                size: { value: 2 } // Default size
            },
            fullScreen: { enable: false, zIndex: -1 }, // Disable tsparticles fullScreen handling globally
            emitters: [
                {
                    direction: "bottom-right", // Aim particles generally towards bottom-right
                    rate: { quantity: 1, delay: 0.1 }, // Default rate
                    size: { width: 0, height: 0 }, // Point emitter
                    position: { x: 5, y: 5 } // Slightly offset from the very corner for visibility
                },
                {
                    direction: "top-left", // Aim particles generally towards top-left
                    rate: { quantity: 1, delay: 0.1 }, // Default rate
                    size: { width: 0, height: 0 }, // Point emitter
                    position: { x: 95, y: 95 } // Slightly offset from the very corner for visibility
                }
            ],
            responsive: [
                {
                    maxWidth: 768, // Breakpoint for mobile devices
                    options: {
                        fullScreen: { enable: false, zIndex: -1 }, // Disable tsparticles fullScreen handling on mobile
                        particles: {
                            size: { value: 1.5 }, // Smaller particle size for mobile
                            move: {
                                attract: {
                                    distance: 100 // Reduce attraction distance on mobile
                                }
                            }
                        },
                        emitters: [
                            {
                                direction: "top-left",
                                rate: { quantity: 1, delay: 0.2 }, // Slower emission rate on mobile
                                size: { width: 0, height: 0 },
                                position: { x: 95, y: 95 }
                            }
                        ]
                    }
                }
            ]
        };
    }, []);

    return (
        <>
            {init && (
                <ErrorBoundary>
                    <DynamicMemoizedParticles
                        id="tsparticles"
                        options={options}
                        particlesLoaded={particlesLoaded}
                        className="fixed inset-0 z-0"
                    />
                </ErrorBoundary>
            )}
        </>
    );
}

export default ParticlesBackground;
