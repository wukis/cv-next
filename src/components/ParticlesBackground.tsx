'use client';
import React, { useEffect, useRef, useState, useCallback } from "react";

// Tron-inspired hexagon network background
// Features: Pulsing hexagon grid, network traffic lines, wave effects

interface Hexagon {
    x: number;
    y: number;
    pulse: number;
    pulseSpeed: number;
    active: boolean;
}

interface Packet {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    progress: number;
    speed: number;
    color: string;
}

const HexagonNetworkBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const hexagonsRef = useRef<Hexagon[]>([]);
    const packetsRef = useRef<Packet[]>([]);
    const timeRef = useRef(0);
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);

    // Hexagon configuration
    const HEX_SIZE = 40;
    const HEX_SPACING = 8;

    const getHexPoints = useCallback((cx: number, cy: number, size: number): [number, number][] => {
        const points: [number, number][] = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            points.push([
                cx + size * Math.cos(angle),
                cy + size * Math.sin(angle)
            ]);
        }
        return points;
    }, []);

    const initHexagons = useCallback((width: number, height: number) => {
        const hexagons: Hexagon[] = [];
        const hexWidth = HEX_SIZE * 2;
        const hexHeight = HEX_SIZE * Math.sqrt(3);
        const cols = Math.ceil(width / (hexWidth * 0.75)) + 2;
        const rows = Math.ceil(height / hexHeight) + 2;

        for (let row = -1; row < rows; row++) {
            for (let col = -1; col < cols; col++) {
                const x = col * (hexWidth * 0.75);
                const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
                hexagons.push({
                    x,
                    y,
                    pulse: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.01 + Math.random() * 0.02,
                    active: Math.random() > 0.7, // 30% chance to be an "active" node
                });
            }
        }
        return hexagons;
    }, [HEX_SIZE]);

    const createPacket = useCallback((hexagons: Hexagon[]): Packet | null => {
        const activeHexagons = hexagons.filter(h => h.active);
        if (activeHexagons.length < 2) return null;

        const from = activeHexagons[Math.floor(Math.random() * activeHexagons.length)];
        let to = activeHexagons[Math.floor(Math.random() * activeHexagons.length)];
        
        // Make sure we don't pick the same hexagon
        let attempts = 0;
        while (to === from && attempts < 10) {
            to = activeHexagons[Math.floor(Math.random() * activeHexagons.length)];
            attempts++;
        }

        const colors = [
            'rgba(16, 185, 129, 0.8)',  // emerald
            'rgba(14, 165, 233, 0.8)',  // sky
            'rgba(139, 92, 246, 0.8)',  // violet
            'rgba(245, 158, 11, 0.8)',  // amber
        ];

        return {
            fromX: from.x,
            fromY: from.y,
            toX: to.x,
            toY: to.y,
            progress: 0,
            speed: 0.005 + Math.random() * 0.01,
            color: colors[Math.floor(Math.random() * colors.length)],
        };
    }, []);

    useEffect(() => {
        setMounted(true);
        
        // Check dark mode
        const checkDarkMode = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
            hexagonsRef.current = initHexagons(window.innerWidth, window.innerHeight);
        };

        resize();
        window.addEventListener('resize', resize);

        // Animation loop
        const animate = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            ctx.clearRect(0, 0, width, height);
            
            timeRef.current += 0.016; // ~60fps
            
            // Wave effect origin (moves slowly)
            const waveX = width / 2 + Math.sin(timeRef.current * 0.2) * width * 0.3;
            const waveY = height / 2 + Math.cos(timeRef.current * 0.15) * height * 0.3;
            const waveRadius = (timeRef.current * 50) % (Math.max(width, height) * 1.5);
            
            // Colors based on theme
            const baseColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
            const activeColor = isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)';
            const pulseColor = isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.2)';
            const lineColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
            
            // Draw hexagons
            hexagonsRef.current.forEach((hex) => {
                hex.pulse += hex.pulseSpeed;
                
                const points = getHexPoints(hex.x, hex.y, HEX_SIZE - HEX_SPACING);
                
                // Calculate distance from wave origin
                const distFromWave = Math.sqrt(
                    Math.pow(hex.x - waveX, 2) + Math.pow(hex.y - waveY, 2)
                );
                
                // Wave intensity (sharp ring)
                const waveIntensity = Math.max(0, 1 - Math.abs(distFromWave - waveRadius) / 100);
                
                // Base pulse
                const basePulse = (Math.sin(hex.pulse) + 1) / 2;
                
                // Combined opacity
                let opacity = 0.02 + basePulse * 0.03;
                if (hex.active) {
                    opacity += 0.05;
                }
                opacity += waveIntensity * 0.15;
                
                // Draw hexagon outline
                ctx.beginPath();
                ctx.moveTo(points[0][0], points[0][1]);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i][0], points[i][1]);
                }
                ctx.closePath();
                
                // Fill with gradient for active hexagons
                if (hex.active || waveIntensity > 0.1) {
                    const gradient = ctx.createRadialGradient(
                        hex.x, hex.y, 0,
                        hex.x, hex.y, HEX_SIZE
                    );
                    
                    if (waveIntensity > 0.1) {
                        gradient.addColorStop(0, pulseColor);
                        gradient.addColorStop(1, 'transparent');
                    } else {
                        gradient.addColorStop(0, activeColor);
                        gradient.addColorStop(1, 'transparent');
                    }
                    
                    ctx.fillStyle = gradient;
                    ctx.fill();
                }
                
                // Stroke
                ctx.strokeStyle = hex.active 
                    ? (isDark ? `rgba(52, 211, 153, ${0.1 + basePulse * 0.1})` : `rgba(16, 185, 129, ${0.08 + basePulse * 0.08})`)
                    : (isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`);
                ctx.lineWidth = waveIntensity > 0.1 ? 1.5 : 0.5;
                ctx.stroke();
            });
            
            // Manage packets (network traffic)
            if (Math.random() < 0.02 && packetsRef.current.length < 5) {
                const newPacket = createPacket(hexagonsRef.current);
                if (newPacket) {
                    packetsRef.current.push(newPacket);
                }
            }
            
            // Draw and update packets
            packetsRef.current = packetsRef.current.filter(packet => {
                packet.progress += packet.speed;
                
                if (packet.progress >= 1) {
                    return false; // Remove completed packets
                }
                
                // Calculate current position
                const currentX = packet.fromX + (packet.toX - packet.fromX) * packet.progress;
                const currentY = packet.fromY + (packet.toY - packet.fromY) * packet.progress;
                
                // Draw the line trail
                const trailLength = 0.15;
                const trailStart = Math.max(0, packet.progress - trailLength);
                const startX = packet.fromX + (packet.toX - packet.fromX) * trailStart;
                const startY = packet.fromY + (packet.toY - packet.fromY) * trailStart;
                
                const gradient = ctx.createLinearGradient(startX, startY, currentX, currentY);
                gradient.addColorStop(0, 'transparent');
                gradient.addColorStop(1, packet.color);
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(currentX, currentY);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw the packet head (glowing dot)
                ctx.beginPath();
                ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
                ctx.fillStyle = packet.color;
                ctx.fill();
                
                // Glow effect
                ctx.beginPath();
                ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
                const glowGradient = ctx.createRadialGradient(
                    currentX, currentY, 0,
                    currentX, currentY, 8
                );
                glowGradient.addColorStop(0, packet.color);
                glowGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = glowGradient;
                ctx.fill();
                
                return true;
            });
            
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [mounted, isDark, getHexPoints, initHexagons, createPacket, HEX_SIZE, HEX_SPACING]);

    if (!mounted) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{ opacity: 0.8 }}
        />
    );
};

export default HexagonNetworkBackground;
