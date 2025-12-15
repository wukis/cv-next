'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hexagon Service Network Background
 * A 3D rotating cluster of interconnected services as hexagons
 * with connection establishment and data packets traveling between them.
 */

interface ServiceNode {
    id: number;
    // 3D coordinates
    x: number;
    y: number;
    z: number;
    // Screen coordinates (projected)
    screenX: number;
    screenY: number;
    screenScale: number;
    size: number;
    pulse: number;
    pulseSpeed: number;
    isActive: boolean;
    label: string;
    color: string;
}

interface Connection {
    id: number;
    fromNode: ServiceNode;
    toNode: ServiceNode;
    establishProgress: number; // 0-1, how much of the line is drawn
    isEstablished: boolean;
    establishSpeed: number;
    opacity: number;
    lastPacketTime: number;
    packetInterval: number; // Time between packets
}

interface DataPacket {
    id: number;
    connection: Connection;
    progress: number;
    speed: number;
    type: 'tcp' | 'udp';
    size: number;
    direction: 1 | -1; // 1 = from->to, -1 = to->from
}

interface StatusIndicator {
    id: number;
    x: number;
    y: number;
    type: 'success' | 'warning' | 'failure';
    opacity: number;
    scale: number;
    startTime: number;
    duration: number;
}

// Service names for the hexagon nodes (AWS/Cloud inspired, kept short for display)
const SERVICE_NAMES = [
    'EC2', 'RDS', 'Redis', 'Lambda', 'SQS', 'S3', 'SNS', 'ECS',
    'ALB', 'API GW', 'Kafka', 'Nginx', 'K8s', 'Mongo', 'Elastic', 'Docker'
];

// Site color palette
const COLORS = {
    emerald: { main: 'rgba(16, 185, 129, VAL)', glow: 'rgba(52, 211, 153, VAL)' },
    sky: { main: 'rgba(14, 165, 233, VAL)', glow: 'rgba(56, 189, 248, VAL)' },
    violet: { main: 'rgba(139, 92, 246, VAL)', glow: 'rgba(167, 139, 250, VAL)' },
    amber: { main: 'rgba(245, 158, 11, VAL)', glow: 'rgba(251, 191, 36, VAL)' },
};

const COLOR_KEYS = Object.keys(COLORS) as (keyof typeof COLORS)[];

const HexagonServiceNetwork: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const nodesRef = useRef<ServiceNode[]>([]);
    const connectionsRef = useRef<Connection[]>([]);
    const packetsRef = useRef<DataPacket[]>([]);
    const statusIndicatorsRef = useRef<StatusIndicator[]>([]);
    const timeRef = useRef(0);
    const packetIdRef = useRef(0);
    const connectionIdRef = useRef(0);
    const statusIdRef = useRef(0);
    const rotationRef = useRef({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);

    // Configuration
    const BASE_HEX_SIZE = 24;
    const MIN_NODES = 10;
    const MAX_NODES = 14;
    const CLUSTER_RADIUS = 250; // 3D cluster radius
    const PERSPECTIVE = 800; // Perspective depth
    const ROTATION_SPEED = 0.0003; // Very slow rotation

    // Project 3D point to 2D screen
    const project3D = useCallback((
        x: number, y: number, z: number,
        centerX: number, centerY: number,
        rotX: number, rotY: number
    ): { screenX: number; screenY: number; scale: number; z: number } => {
        // Rotate around Y axis
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;

        // Rotate around X axis
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Perspective projection
        const scale = PERSPECTIVE / (PERSPECTIVE + z2);
        const screenX = centerX + x1 * scale;
        const screenY = centerY + y1 * scale;

        return { screenX, screenY, scale, z: z2 };
    }, []);

    // Get hexagon points for drawing
    const getHexPoints = useCallback((cx: number, cy: number, size: number): [number, number][] => {
        const points: [number, number][] = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            points.push([
                cx + size * Math.cos(angle),
                cy + size * Math.sin(angle)
            ]);
        }
        return points;
    }, []);

    // Draw a hexagon
    const drawHexagon = useCallback((
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        size: number,
        strokeColor: string,
        fillColor: string | null,
        lineWidth: number = 1
    ) => {
        const points = getHexPoints(cx, cy, size);
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }, [getHexPoints]);

    // Initialize service nodes in 3D space
    const initNodes = useCallback((width: number, height: number) => {
        const nodes: ServiceNode[] = [];
        const numNodes = Math.min(MAX_NODES, Math.max(MIN_NODES, Math.floor((width * height) / 100000)));
        const usedNames = new Set<string>();

        // Distribute nodes in a 3D sphere/cluster
        for (let i = 0; i < numNodes; i++) {
            // Use fibonacci sphere distribution for even spacing
            const phi = Math.acos(1 - 2 * (i + 0.5) / numNodes);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
            
            // Add some randomness to break perfect symmetry
            const radiusVariation = 0.7 + Math.random() * 0.6;
            const radius = CLUSTER_RADIUS * radiusVariation;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            // Get unique label
            let label: string;
            do {
                label = SERVICE_NAMES[Math.floor(Math.random() * SERVICE_NAMES.length)];
            } while (usedNames.has(label) && usedNames.size < SERVICE_NAMES.length);
            usedNames.add(label);

            const colorKey = COLOR_KEYS[i % COLOR_KEYS.length];

            nodes.push({
                id: i,
                x,
                y,
                z,
                screenX: 0,
                screenY: 0,
                screenScale: 1,
                size: BASE_HEX_SIZE + Math.random() * 6,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.015 + Math.random() * 0.015,
                isActive: Math.random() > 0.2,
                label,
                color: colorKey,
            });
        }

        return nodes;
    }, []);

    // Try to establish a new connection
    const tryEstablishConnection = useCallback((nodes: ServiceNode[], connections: Connection[]): Connection | null => {
        const activeNodes = nodes.filter(n => n.isActive);
        if (activeNodes.length < 2) return null;

        // Pick two random nodes
        const fromNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
        let toNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];

        let attempts = 0;
        while (toNode.id === fromNode.id && attempts < 10) {
            toNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
            attempts++;
        }

        if (toNode.id === fromNode.id) return null;

        // Check if connection already exists
        const exists = connections.some(c =>
            (c.fromNode.id === fromNode.id && c.toNode.id === toNode.id) ||
            (c.fromNode.id === toNode.id && c.toNode.id === fromNode.id)
        );

        if (exists) return null;

        // Check 3D distance
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const dz = toNode.z - fromNode.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Only connect relatively close nodes
        if (dist > CLUSTER_RADIUS * 1.2) return null;

        return {
            id: connectionIdRef.current++,
            fromNode,
            toNode,
            establishProgress: 0,
            isEstablished: false,
            establishSpeed: 0.008 + Math.random() * 0.012, // Slow connection establishment
            opacity: 0,
            lastPacketTime: timeRef.current,
            packetInterval: 3 + Math.random() * 4, // 3-7 seconds between packets
        };
    }, []);

    // Create a new data packet on an established connection
    const createPacket = useCallback((connection: Connection): DataPacket => {
        return {
            id: packetIdRef.current++,
            connection,
            progress: 0,
            speed: 0.003 + Math.random() * 0.004, // Very slow packets
            type: Math.random() > 0.3 ? 'tcp' : 'udp',
            size: 2 + Math.random() * 2,
            direction: Math.random() > 0.5 ? 1 : -1,
        };
    }, []);

    // Create status indicator when packet arrives
    const createStatusIndicator = useCallback((x: number, y: number): StatusIndicator => {
        const rand = Math.random();
        const type = rand < 0.7 ? 'success' : rand < 0.9 ? 'warning' : 'failure';

        return {
            id: statusIdRef.current++,
            x,
            y,
            type,
            opacity: 1,
            scale: 0,
            startTime: timeRef.current,
            duration: 2 + Math.random() * 0.5,
        };
    }, []);

    // Draw status indicator
    const drawStatusIndicator = useCallback((
        ctx: CanvasRenderingContext2D,
        indicator: StatusIndicator,
        isDark: boolean
    ) => {
        const age = timeRef.current - indicator.startTime;
        const progress = age / indicator.duration;

        if (progress >= 1) return false;

        const scaleIn = Math.min(1, age * 6);
        const fadeOut = progress > 0.5 ? 1 - ((progress - 0.5) / 0.5) : 1;

        indicator.scale = scaleIn;
        indicator.opacity = fadeOut;

        const size = 7 * indicator.scale;
        const baseOpacity = indicator.opacity * (isDark ? 0.7 : 0.5);

        ctx.save();
        ctx.translate(indicator.x, indicator.y - 18);
        ctx.globalAlpha = baseOpacity;

        if (indicator.type === 'success') {
            ctx.strokeStyle = isDark ? 'rgba(52, 211, 153, 1)' : 'rgba(16, 185, 129, 1)';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(-size * 0.5, 0);
            ctx.lineTo(-size * 0.1, size * 0.4);
            ctx.lineTo(size * 0.5, -size * 0.3);
            ctx.stroke();
        } else if (indicator.type === 'warning') {
            ctx.strokeStyle = isDark ? 'rgba(251, 191, 36, 1)' : 'rgba(245, 158, 11, 1)';
            ctx.fillStyle = ctx.strokeStyle;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.5);
            ctx.lineTo(-size * 0.45, size * 0.35);
            ctx.lineTo(size * 0.45, size * 0.35);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.1);
            ctx.lineTo(0, size * 0.08);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, size * 0.2, 1, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = isDark ? 'rgba(248, 113, 113, 1)' : 'rgba(239, 68, 68, 1)';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-size * 0.3, -size * 0.3);
            ctx.lineTo(size * 0.3, size * 0.3);
            ctx.moveTo(size * 0.3, -size * 0.3);
            ctx.lineTo(-size * 0.3, size * 0.3);
            ctx.stroke();
        }

        ctx.restore();
        return true;
    }, []);

    useEffect(() => {
        setMounted(true);

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

        let width = window.innerWidth;
        let height = window.innerHeight;
        let centerX = width / 2;
        let centerY = height / 2;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            centerX = width / 2;
            centerY = height / 2;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpr, dpr);
            nodesRef.current = initNodes(width, height);
            connectionsRef.current = [];
            packetsRef.current = [];
        };

        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            timeRef.current += 0.016;

            // Slowly rotate the cluster
            rotationRef.current.y += ROTATION_SPEED;
            rotationRef.current.x = Math.sin(timeRef.current * 0.1) * 0.15; // Gentle tilt

            const rotX = rotationRef.current.x;
            const rotY = rotationRef.current.y;

            // Update node screen positions
            nodesRef.current.forEach(node => {
                node.pulse += node.pulseSpeed;
                const projected = project3D(node.x, node.y, node.z, centerX, centerY, rotX, rotY);
                node.screenX = projected.screenX;
                node.screenY = projected.screenY;
                node.screenScale = projected.scale;
            });

            // Sort nodes by z-depth for proper rendering (back to front)
            const sortedNodes = [...nodesRef.current].sort((a, b) => {
                const projA = project3D(a.x, a.y, a.z, centerX, centerY, rotX, rotY);
                const projB = project3D(b.x, b.y, b.z, centerX, centerY, rotX, rotY);
                return projA.z - projB.z; // Back to front
            });

            // Try to establish new connections occasionally
            if (Math.random() < 0.008 && connectionsRef.current.length < 8) {
                const newConn = tryEstablishConnection(nodesRef.current, connectionsRef.current);
                if (newConn) {
                    connectionsRef.current.push(newConn);
                }
            }

            // Update and draw connections
            connectionsRef.current = connectionsRef.current.filter(conn => {
                // Animate connection establishment
                if (!conn.isEstablished) {
                    conn.establishProgress += conn.establishSpeed;
                    conn.opacity = Math.min(conn.establishProgress, 1) * (isDark ? 0.25 : 0.18);

                    if (conn.establishProgress >= 1) {
                        conn.isEstablished = true;
                        conn.establishProgress = 1;
                    }
                }

                // Get projected positions
                const from = project3D(conn.fromNode.x, conn.fromNode.y, conn.fromNode.z, centerX, centerY, rotX, rotY);
                const to = project3D(conn.toNode.x, conn.toNode.y, conn.toNode.z, centerX, centerY, rotX, rotY);

                // Draw establishing/established connection line with dashed effect
                const lineProgress = conn.establishProgress;
                const currentX = from.screenX + (to.screenX - from.screenX) * lineProgress;
                const currentY = from.screenY + (to.screenY - from.screenY) * lineProgress;

                // Depth-based opacity
                const avgZ = (from.z + to.z) / 2;
                const depthFade = Math.max(0.3, Math.min(1, (PERSPECTIVE + avgZ) / (PERSPECTIVE * 2)));
                const finalOpacity = conn.opacity * depthFade;

                // Main connection line
                ctx.strokeStyle = isDark
                    ? `rgba(255, 255, 255, ${finalOpacity})`
                    : `rgba(0, 0, 0, ${finalOpacity * 0.7})`;
                ctx.lineWidth = 0.8;
                
                // Dashed line for established connections to show data flow direction
                if (conn.isEstablished) {
                    const dashOffset = (timeRef.current * 15) % 20;
                    ctx.setLineDash([4, 8]);
                    ctx.lineDashOffset = -dashOffset;
                }
                
                ctx.beginPath();
                ctx.moveTo(from.screenX, from.screenY);
                ctx.lineTo(currentX, currentY);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Add subtle glow to connection during establishment
                if (!conn.isEstablished && depthFade > 0.4) {
                    const glowOpacity = finalOpacity * 0.3 * (1 - lineProgress);
                    ctx.strokeStyle = isDark
                        ? `rgba(52, 211, 153, ${glowOpacity})`
                        : `rgba(16, 185, 129, ${glowOpacity})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(from.screenX, from.screenY);
                    ctx.lineTo(currentX, currentY);
                    ctx.stroke();
                }

                // Spawn packets on established connections
                if (conn.isEstablished && timeRef.current - conn.lastPacketTime > conn.packetInterval) {
                    packetsRef.current.push(createPacket(conn));
                    conn.lastPacketTime = timeRef.current;
                    conn.packetInterval = 4 + Math.random() * 5; // Random next interval
                }

                // Connection lifetime (fade out after a while)
                if (conn.isEstablished && timeRef.current - conn.lastPacketTime > 15) {
                    conn.opacity -= 0.005;
                    if (conn.opacity <= 0) return false;
                }

                return true;
            });

            // Update and draw packets
            packetsRef.current = packetsRef.current.filter(packet => {
                packet.progress += packet.speed;

                if (packet.progress >= 1) {
                    // Packet arrived
                    const targetNode = packet.direction === 1 ? packet.connection.toNode : packet.connection.fromNode;
                    statusIndicatorsRef.current.push(
                        createStatusIndicator(targetNode.screenX, targetNode.screenY)
                    );
                    return false;
                }

                const conn = packet.connection;
                const from = project3D(conn.fromNode.x, conn.fromNode.y, conn.fromNode.z, centerX, centerY, rotX, rotY);
                const to = project3D(conn.toNode.x, conn.toNode.y, conn.toNode.z, centerX, centerY, rotX, rotY);

                // Calculate position based on direction
                let startX, startY, endX, endY;
                if (packet.direction === 1) {
                    startX = from.screenX; startY = from.screenY;
                    endX = to.screenX; endY = to.screenY;
                } else {
                    startX = to.screenX; startY = to.screenY;
                    endX = from.screenX; endY = from.screenY;
                }

                const x = startX + (endX - startX) * packet.progress;
                const y = startY + (endY - startY) * packet.progress;

                // Get color from target node
                const targetNode = packet.direction === 1 ? conn.toNode : conn.fromNode;
                const colors = COLORS[targetNode.color as keyof typeof COLORS];

                // Depth-based opacity
                const packetZ = from.z + (to.z - from.z) * packet.progress;
                const depthFade = Math.max(0.4, Math.min(1, (PERSPECTIVE + packetZ) / (PERSPECTIVE * 2)));

                // Trail
                const trailLength = packet.type === 'tcp' ? 0.15 : 0.1;
                const trailStart = Math.max(0, packet.progress - trailLength);
                const trailX = startX + (endX - startX) * trailStart;
                const trailY = startY + (endY - startY) * trailStart;

                const trailOpacity = (isDark ? 0.2 : 0.12) * depthFade;
                const gradient = ctx.createLinearGradient(trailX, trailY, x, y);
                gradient.addColorStop(0, 'transparent');
                gradient.addColorStop(1, colors.main.replace('VAL', String(trailOpacity)));

                ctx.beginPath();
                ctx.moveTo(trailX, trailY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = packet.type === 'tcp' ? 2 : 1.5;
                if (packet.type === 'udp') {
                    ctx.setLineDash([4, 4]);
                }
                ctx.stroke();
                ctx.setLineDash([]);

                // Packet head with pulsing effect
                const pulsePhase = Math.sin(timeRef.current * 8 + packet.progress * Math.PI * 2) * 0.3 + 1;
                const headOpacity = (isDark ? 0.75 : 0.55) * depthFade;
                const size = packet.size * depthFade * pulsePhase;
                ctx.fillStyle = colors.main.replace('VAL', String(headOpacity));

                if (packet.type === 'tcp') {
                    // Diamond shape for TCP packets
                    ctx.beginPath();
                    ctx.moveTo(x, y - size);
                    ctx.lineTo(x + size, y);
                    ctx.lineTo(x, y + size);
                    ctx.lineTo(x - size, y);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Inner diamond outline
                    ctx.strokeStyle = colors.glow.replace('VAL', String(headOpacity * 0.6));
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(x, y - size * 0.5);
                    ctx.lineTo(x + size * 0.5, y);
                    ctx.lineTo(x, y + size * 0.5);
                    ctx.lineTo(x - size * 0.5, y);
                    ctx.closePath();
                    ctx.stroke();
                } else {
                    // Circle for UDP packets
                    ctx.beginPath();
                    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Glow effect
                const glowOpacity = (isDark ? 0.3 : 0.18) * depthFade * pulsePhase;
                const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
                glow.addColorStop(0, colors.glow.replace('VAL', String(glowOpacity)));
                glow.addColorStop(0.5, colors.glow.replace('VAL', String(glowOpacity * 0.3)));
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(x, y, size * 4, 0, Math.PI * 2);
                ctx.fill();

                return true;
            });

            // Draw nodes (sorted by depth)
            sortedNodes.forEach(node => {
                const scale = node.screenScale;
                const currentSize = node.size * scale;
                const depthFade = Math.max(0.3, Math.min(1, scale));

                const colors = COLORS[node.color as keyof typeof COLORS];
                const baseOpacity = isDark ? 0.15 : 0.1;
                const activeOpacity = node.isActive ? (isDark ? 0.25 : 0.18) : baseOpacity;
                const pulseOpacity = (activeOpacity + Math.sin(node.pulse) * 0.05) * depthFade;

                // Outer glow for active nodes
                if (node.isActive && depthFade > 0.5) {
                    const glowSize = currentSize * 1.5;
                    const glow = ctx.createRadialGradient(
                        node.screenX, node.screenY, currentSize * 0.5,
                        node.screenX, node.screenY, glowSize
                    );
                    glow.addColorStop(0, colors.glow.replace('VAL', String((isDark ? 0.1 : 0.06) * depthFade)));
                    glow.addColorStop(1, 'transparent');
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(node.screenX, node.screenY, glowSize, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Main hexagon with subtle double-line effect
                const fillColor = colors.main.replace('VAL', String(pulseOpacity * 0.25));
                const strokeColor = colors.main.replace('VAL', String(pulseOpacity));

                // Outer hexagon (slightly larger, more transparent)
                if (node.isActive && depthFade > 0.5) {
                    drawHexagon(
                        ctx,
                        node.screenX,
                        node.screenY,
                        currentSize * 1.15,
                        colors.main.replace('VAL', String(pulseOpacity * 0.3)),
                        null,
                        0.5 * depthFade
                    );
                }

                drawHexagon(ctx, node.screenX, node.screenY, currentSize, strokeColor, fillColor, 1.2 * depthFade);

                // Inner hexagon detail - smaller decorative element
                if (depthFade > 0.4) {
                    drawHexagon(
                        ctx,
                        node.screenX,
                        node.screenY,
                        currentSize * 0.4,
                        colors.main.replace('VAL', String(pulseOpacity * 0.4)),
                        null,
                        0.5 * depthFade
                    );
                }
                
                // Center dot for active nodes
                if (node.isActive && depthFade > 0.5) {
                    const dotSize = 2 * depthFade;
                    ctx.fillStyle = colors.glow.replace('VAL', String(pulseOpacity * 0.8));
                    ctx.beginPath();
                    ctx.arc(node.screenX, node.screenY, dotSize, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Service label (only for foreground nodes)
                if (depthFade > 0.6) {
                    const labelOpacity = (isDark ? 0.45 : 0.35) * depthFade;
                    // Adjust font size based on label length
                    const baseFontSize = node.label.length > 5 ? 6 : 7;
                    ctx.font = `bold ${Math.round(baseFontSize * depthFade)}px ui-monospace, monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = isDark
                        ? `rgba(255, 255, 255, ${labelOpacity})`
                        : `rgba(0, 0, 0, ${labelOpacity})`;
                    ctx.fillText(node.label, node.screenX, node.screenY);
                }
            });

            // Draw status indicators (always on top)
            statusIndicatorsRef.current = statusIndicatorsRef.current.filter(indicator => {
                return drawStatusIndicator(ctx, indicator, isDark);
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
    }, [mounted, isDark, initNodes, project3D, tryEstablishConnection, createPacket, createStatusIndicator, drawHexagon, drawStatusIndicator]);

    if (!mounted) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{ opacity: 0.75 }}
            aria-hidden="true"
        />
    );
};

export default HexagonServiceNetwork;
