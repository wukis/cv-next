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
    console.log("ParticlesBackground RENDERED");
    const [init, setInit] = useState(false);

    useEffect(() => {
        console.log("ParticlesBackground EFFECT tsParticlesEngineInit - START");
        tsParticlesEngineInit(async (engine) => { // Using the renamed import
            console.log("ParticlesBackground tsParticlesEngineInit - engine CREATED");
            await loadAll(engine);
            console.log("ParticlesBackground tsParticlesEngineInit - loadAll COMPLETE");
        }).then(() => {
            console.log("ParticlesBackground tsParticlesEngineInit - .then() - SETTING INIT TRUE");
            setInit(true);
        });
    }, []);

    const particlesLoaded = useCallback(async (container?: Container): Promise<void> => {
        console.log("ParticlesBackground particlesLoaded CALLBACK", container);
    }, []);

    const options: ISourceOptions = useMemo(() => {
        console.log("ParticlesBackground useMemo FOR OPTIONS CALLED");
        return {
            particles: {
                color: { value: "#2563eb", animation: { enable: true, speed: 10 } },
                effect: { type: "trail", options: { trail: { length: 50, minWidth: 4 } } },
                move: {
                    direction: "none", enable: true, outModes: { default: "destroy" },
                    path: { clamp: false, enable: true, delay: { value: 0 }, generator: "polygonPathGenerator", options: { sides: 6, turnSteps: 120, angle: 120 } },
                    random: false, speed: 3, straight: false
                },
                number: { value: 0 },
                opacity: { value: 0.3 },
                shape: { type: "circle" },
                size: { value: 2 }
            },
            fullScreen: { zIndex: -1 },
            emitters: {
                direction: "none", rate: { quantity: 1, delay: 0.5 },
                size: { width: 0, height: 0 }, position: { x: 20, y: 20 }
            }
        };
    }, []);

    console.log("ParticlesBackground rendering, init state:", init);

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
