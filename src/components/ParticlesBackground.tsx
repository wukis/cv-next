'use client';
import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Particles } from "@tsparticles/react";
import { initParticlesEngine } from "@tsparticles/react";
import { loadAll } from "@tsparticles/all";
import { type Container, type ISourceOptions } from "@tsparticles/engine";
import ErrorBoundary from '@/components/ErrorBoundary';

const ParticlesBackground = () => {
    const [init, setInit] = useState(false);

    useEffect(() => {
        // Preload the Particles chunk - REMOVED

        initParticlesEngine(async (engine) => {
            await loadAll(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = async (container?: Container): Promise<void> => {};

    const options: ISourceOptions = useMemo(
        () => ({
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

        }),
        []
    );

    return (
        <>
            {init && (
                <ErrorBoundary>
                    <Particles
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
