'use client';
import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { initParticlesEngine } from "@tsparticles/react";
import { loadAll } from "@tsparticles/all";
import { type Container, type ISourceOptions } from "@tsparticles/engine";

const Particles = lazy(() => import("@tsparticles/react").then(module => ({ default: module.Particles })));

const ParticlesBackground = ({ children }: { children: React.ReactNode }) => {
    const [init, setInit] = useState(false);

    useEffect(() => {
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
                            turnSteps: 90,
                            angle: 90
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
                    value: 0.6
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
                <Suspense fallback={<div className="fixed inset-0 z-0"></div>}>
                    <Particles
                        id="tsparticles"
                        options={options}
                        particlesLoaded={particlesLoaded}
                        className="fixed inset-0 z-0"
                    />
                </Suspense>
            )}
            {children}
        </>
    );
}

export default ParticlesBackground;