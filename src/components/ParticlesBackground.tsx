'use client';
import React, { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from 'next/dynamic';
// import { Particles } from "@tsparticles/react";
import { initParticlesEngine } from "@tsparticles/react";
import { loadAll } from "@tsparticles/all";
import { type Container, type ISourceOptions } from "@tsparticles/engine";
import ErrorBoundary from '@/components/ErrorBoundary';

// Dynamically import Particles component with SSR turned off
const DynamicParticles = dynamic(() =>
    import('@tsparticles/react').then((module) => module.Particles),
    { ssr: false }
);

const ParticlesBackground = () => {
    console.log("ParticlesBackground RENDERED");
    const [init, setInit] = useState(false);

    useEffect(() => {
        console.log("ParticlesBackground EFFECT initParticlesEngine - START");
        initParticlesEngine(async (engine) => {
            console.log("ParticlesBackground initParticlesEngine - engine CREATED");
            await loadAll(engine);
            console.log("ParticlesBackground initParticlesEngine - loadAll COMPLETE");
        }).then(() => {
            console.log("ParticlesBackground initParticlesEngine - .then() - SETTING INIT TRUE");
            setInit(true);
        });
        return () => {
            console.log("ParticlesBackground EFFECT CLEANUP");
        }
    }, []);

    // Memoize particlesLoaded with useCallback
    const particlesLoaded = useCallback(async (container?: Container): Promise<void> => {
        console.log("ParticlesBackground particlesLoaded CALLBACK", container);
    }, []); // Empty dependency array means this function reference is stable

    const options: ISourceOptions = useMemo(() => {
        console.log("ParticlesBackground useMemo FOR OPTIONS CALLED");
        return {
            particles: {
                color: {
                    value: "#2563eb",
                    animation: {
                        enable: true,
                        speed: 10
                    }
                },
                effect: {
                    type: "trail",
                    options: {
                        trail: {
                            length: 50,
                            minWidth: 4
                        }
                    }
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: {
                        default: "destroy"
                    },
                    path: {
                        clamp: false,
                        enable: true,
                        delay: {
                            value: 0
                        },
                        generator: "polygonPathGenerator",
                        options: {
                            sides: 6,
                            turnSteps: 120,
                            angle: 120
                        }
                    },
                    random: false,
                    speed: 3,
                    straight: false
                },
                number: {
                    value: 0
                },
                opacity: {
                    value: 0.3
                },
                shape: {
                    type: "circle"
                },
                size: {
                    value: 2
                }
            },
            fullScreen: {
                zIndex: -1
            },
            emitters: {
                direction: "none",
                rate: {
                    quantity: 1,
                    delay: 0.5
                },
                size: {
                    width: 0,
                    height: 0
                },
                position: {
                    x: 20,
                    y: 20
                }
            }
        };
    }, []);

    console.log("ParticlesBackground rendering, init state:", init);

    return (
        <>
            {init && (
                <ErrorBoundary>
                    <DynamicParticles
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
