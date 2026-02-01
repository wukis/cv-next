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

// Service names for the hexagon nodes (AWS/Cloud inspired, production-like clusters)
const SERVICE_NAMES = [
    // Application tier (multiple instances)
    'App-1', 'App-2', 'App-3',
    // API layer
    'API-1', 'API-2', 'API GW',
    // Data stores
    'RDS-P', 'RDS-R', 'Redis-1', 'Redis-2',
    // Message queues
    'SQS', 'Kafka', 'SNS',
    // Storage & CDN
    'S3', 'CloudFront',
    // Compute
    'Lambda', 'ECS-1', 'ECS-2',
    // Infrastructure
    'ALB', 'Nginx', 'K8s',
    // Monitoring & Search
    'Elastic', 'Grafana', 'Logs',
    // Database replicas
    'Mongo-P', 'Mongo-R', 'DynamoDB'
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
    const [isFocused, setIsFocused] = useState(false);
    const isFocusedRef = useRef(isFocused); // Ref to track focus state without restarting animation
    const focusTransitionRef = useRef(0); // 0 = normal, 1 = fully focused (for smooth transitions)
    const frameSkipRef = useRef(0); // Frame skipping counter for performance when not focused
    
    // Emergency event system
    const emergencyRef = useRef<{
        isActive: boolean;
        isRecovery: boolean;
        startTime: number;
        duration: number;
        recoveryStartTime: number;
        recoveryDuration: number;
        lastEmergencyTime: number;
        nextEmergencyInterval: number;
        hasTriggeredFirstEmergency: boolean;
        hasEverFocused: boolean;
        accumulatedFocusTime: number;
        firstEmergencyDelay: number;
    }>({
        isActive: false,
        isRecovery: false,
        startTime: 0,
        duration: 12, // Emergency lasts 12 seconds (3x longer)
        recoveryStartTime: 0,
        recoveryDuration: 5, // Recovery message lasts 5 seconds (slower fade)
        lastEmergencyTime: 0,
        nextEmergencyInterval: 30, // Random interval after first emergency
        hasTriggeredFirstEmergency: false,
        hasEverFocused: false,
        accumulatedFocusTime: 0,
        firstEmergencyDelay: 2 + Math.random(), // 2-3 seconds
    });

    // Configuration
    const BASE_HEX_SIZE = 22;
    const CLUSTER_RADIUS = 280; // 3D cluster radius
    const PERSPECTIVE = 800; // Perspective depth
    
    // Speed multipliers based on focus state
    const ROTATION_SPEED_NORMAL = 0.00015; // Slower when content is visible
    const ROTATION_SPEED_FOCUSED = 0.0006; // Faster when animation is focused

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

    // Initialize service nodes in 3D space with even distribution, spread horizontally
    const initNodes = useCallback((width: number, height: number) => {
        const nodes: ServiceNode[] = [];
        
        // Calculate aspect ratio to spread nodes horizontally
        const aspectRatio = width / height;
        const horizontalSpread = Math.max(1.2, Math.min(2.0, aspectRatio)); // Spread more on wider screens
        
        // Responsive node count based on screen width - more nodes to fill sides
        let numNodes: number;
        if (width < 640) {
            // Mobile: fewer nodes
            numNodes = 10;
        } else if (width < 1024) {
            // Tablet: medium nodes
            numNodes = 16;
        } else {
            // Desktop: more nodes to fill horizontal space
            numNodes = 26;
        }
        
        const usedNames = new Set<string>();
        const minDistance = CLUSTER_RADIUS * 0.35; // Slightly reduced for more nodes

        // Use fibonacci sphere distribution for even spacing, with collision avoidance
        const placedPositions: { x: number; y: number; z: number }[] = [];
        let attempts = 0;
        const maxAttempts = numNodes * 80;
        
        for (let i = 0; i < numNodes && attempts < maxAttempts; attempts++) {
            // Use fibonacci sphere as base distribution
            const baseIndex = i + attempts * 0.1; // Slight offset on retries
            const phi = Math.acos(1 - 2 * (baseIndex + 0.5) / numNodes);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (baseIndex + 0.5);
            
            // Add controlled randomness
            const radiusVariation = 0.7 + Math.random() * 0.6;
            const radius = CLUSTER_RADIUS * radiusVariation;
            
            // Add slight angular randomness
            const phiOffset = (Math.random() - 0.5) * 0.4;
            const thetaOffset = (Math.random() - 0.5) * 0.6;

            // Apply horizontal spread to X coordinate
            let x = radius * Math.sin(phi + phiOffset) * Math.cos(theta + thetaOffset) * horizontalSpread;
            const y = radius * Math.sin(phi + phiOffset) * Math.sin(theta + thetaOffset) * 0.85; // Slightly compress vertically
            const z = radius * Math.cos(phi + phiOffset);

            // Check distance from all placed nodes
            let tooClose = false;
            for (const pos of placedPositions) {
                const dx = x - pos.x;
                const dy = y - pos.y;
                const dz = z - pos.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < minDistance) {
                    tooClose = true;
                    break;
                }
            }
            
            if (tooClose) continue; // Try again with different position
            
            placedPositions.push({ x, y, z });

            // Get label - allow duplicates with numbers for "cluster" effect
            let label: string;
            const baseName = SERVICE_NAMES[Math.floor(Math.random() * SERVICE_NAMES.length)];
            if (usedNames.has(baseName)) {
                // Add instance number for duplicate services (simulating clusters)
                let instanceNum = 2;
                while (usedNames.has(`${baseName}-${instanceNum}`)) {
                    instanceNum++;
                }
                label = `${baseName}-${instanceNum}`;
            } else {
                label = baseName;
            }
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
                isActive: true, // All nodes are active and can participate in connections
                label,
                color: colorKey,
            });
            
            i++; // Only increment when successfully placed
        }

        return nodes;
    }, [BASE_HEX_SIZE, CLUSTER_RADIUS]);

    // Try to establish a new connection, prioritizing nodes with fewer connections
    const tryEstablishConnection = useCallback((nodes: ServiceNode[], connections: Connection[]): Connection | null => {
        const activeNodes = nodes.filter(n => n.isActive);
        if (activeNodes.length < 2) return null;

        // Count connections per node
        const connectionCounts = new Map<number, number>();
        activeNodes.forEach(n => connectionCounts.set(n.id, 0));
        connections.forEach(c => {
            connectionCounts.set(c.fromNode.id, (connectionCounts.get(c.fromNode.id) || 0) + 1);
            connectionCounts.set(c.toNode.id, (connectionCounts.get(c.toNode.id) || 0) + 1);
        });

        // Sort nodes by connection count (least connections first)
        const sortedNodes = [...activeNodes].sort((a, b) => {
            const countA = connectionCounts.get(a.id) || 0;
            const countB = connectionCounts.get(b.id) || 0;
            return countA - countB;
        });

        // 70% chance to pick from least-connected nodes, 30% random
        let fromNode: ServiceNode;
        if (Math.random() < 0.7 && sortedNodes.length > 0) {
            // Pick from the least connected third of nodes
            const leastConnectedCount = Math.max(1, Math.floor(sortedNodes.length / 3));
            fromNode = sortedNodes[Math.floor(Math.random() * leastConnectedCount)];
        } else {
            fromNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
        }

        // Find potential target nodes (sorted by distance, preferring closer + less connected)
        const potentialTargets = activeNodes
            .filter(n => n.id !== fromNode.id)
            .map(n => {
                const dx = n.x - fromNode.x;
                const dy = n.y - fromNode.y;
                const dz = n.z - fromNode.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const connCount = connectionCounts.get(n.id) || 0;
                return { node: n, dist, connCount };
            })
            .filter(({ dist }) => dist <= CLUSTER_RADIUS * 2) // Increased distance limit
            .sort((a, b) => {
                // Prioritize: less connected + reasonable distance
                const scoreA = a.connCount * 100 + a.dist;
                const scoreB = b.connCount * 100 + b.dist;
                return scoreA - scoreB;
            });

        if (potentialTargets.length === 0) return null;

        // Pick from top candidates with some randomness
        const topCount = Math.min(3, potentialTargets.length);
        const toNode = potentialTargets[Math.floor(Math.random() * topCount)].node;

        // Check if connection already exists
        const exists = connections.some(c =>
            (c.fromNode.id === fromNode.id && c.toNode.id === toNode.id) ||
            (c.fromNode.id === toNode.id && c.toNode.id === fromNode.id)
        );

        if (exists) return null;

        return {
            id: connectionIdRef.current++,
            fromNode,
            toNode,
            establishProgress: 0,
            isEstablished: false,
            establishSpeed: 0.012 + Math.random() * 0.015, // Faster connection establishment
            opacity: 0,
            lastPacketTime: timeRef.current,
            packetInterval: 1.5 + Math.random() * 2.5, // 1.5-4 seconds between packets (more frequent)
        };
    }, []);

    // Create a new data packet on an established connection
    const createPacket = useCallback((connection: Connection): DataPacket => {
        return {
            id: packetIdRef.current++,
            connection,
            progress: 0,
            speed: 0.005 + Math.random() * 0.006, // Slightly faster packets
            type: Math.random() > 0.3 ? 'tcp' : 'udp',
            size: 2 + Math.random() * 2,
            direction: Math.random() > 0.5 ? 1 : -1,
        };
    }, []);

    // Create status indicator when packet arrives
    const createStatusIndicator = useCallback((x: number, y: number, forcedType?: 'success' | 'warning' | 'failure'): StatusIndicator => {
        let type: 'success' | 'warning' | 'failure';
        if (forcedType) {
            type = forcedType;
        } else {
            const rand = Math.random();
            type = rand < 0.7 ? 'success' : rand < 0.9 ? 'warning' : 'failure';
        }

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

        const checkClasses = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
            setIsFocused(document.documentElement.classList.contains('animation-focus'));
        };
        checkClasses();

        const observer = new MutationObserver(checkClasses);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    // Keep the focus ref in sync with state (without restarting animation)
    useEffect(() => {
        isFocusedRef.current = isFocused;
    }, [isFocused]);

    // Listen for manual emergency trigger from click
    useEffect(() => {
        const handleTriggerEmergency = () => {
            const emergency = emergencyRef.current;
            // Only trigger if not already in emergency or recovery
            if (!emergency.isActive && !emergency.isRecovery) {
                emergency.isActive = true;
                emergency.startTime = timeRef.current;
                emergency.hasTriggeredFirstEmergency = true;
                // Note: lastEmergencyTime and nextEmergencyInterval are set when recovery ENDS
                
                // Dispatch event for MetricWidgets
                window.dispatchEvent(new CustomEvent('network-emergency', { detail: { type: 'start' } }));
            }
        };

        window.addEventListener('trigger-emergency', handleTriggerEmergency);
        return () => window.removeEventListener('trigger-emergency', handleTriggerEmergency);
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
            // Throttle rendering when not focused: skip every other frame (30fps instead of 60fps)
            // This significantly reduces rendering time and improves performance
            if (!isFocusedRef.current && frameSkipRef.current % 2 === 0) {
                frameSkipRef.current++;
                // Still update time for smooth animations, but skip rendering
                timeRef.current += 0.016;
                animationRef.current = requestAnimationFrame(animate);
                return;
            }
            frameSkipRef.current++;
            
            ctx.clearRect(0, 0, width, height);

            timeRef.current += 0.016;
            
            // Smoothly transition focus state
            const targetFocus = isFocusedRef.current ? 1 : 0;
            focusTransitionRef.current += (targetFocus - focusTransitionRef.current) * 0.05;
            const focusLevel = focusTransitionRef.current;
            
            // Calculate dynamic speeds based on focus level
            const rotationSpeed = ROTATION_SPEED_NORMAL + (ROTATION_SPEED_FOCUSED - ROTATION_SPEED_NORMAL) * focusLevel;
            const connectionChance = 0.015 + focusLevel * 0.03; // More connections when focused
            const maxConnections = 12 + Math.floor(focusLevel * 12); // More connections to handle more nodes
            const packetSpeedMultiplier = 0.6 + focusLevel * 0.8; // Slower normally, faster when focused

            // Slowly rotate the cluster
            rotationRef.current.y += rotationSpeed;
            rotationRef.current.x = Math.sin(timeRef.current * 0.1) * 0.15; // Gentle tilt

            const rotX = rotationRef.current.x;
            const rotY = rotationRef.current.y;

            // Update node screen positions
            nodesRef.current.forEach(node => {
                node.pulse += node.pulseSpeed * (0.7 + focusLevel * 0.6); // Slower pulse normally
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

            // Try to establish new connections (frequency based on focus)
            if (Math.random() < connectionChance && connectionsRef.current.length < maxConnections) {
                const newConn = tryEstablishConnection(nodesRef.current, connectionsRef.current);
                if (newConn) {
                    connectionsRef.current.push(newConn);
                }
            }

            // Update and draw connections
            const establishSpeedMultiplier = 0.6 + focusLevel * 0.8; // Slower normally, faster when focused
            connectionsRef.current = connectionsRef.current.filter(conn => {
                // Animate connection establishment (speed based on focus)
                if (!conn.isEstablished) {
                    conn.establishProgress += conn.establishSpeed * establishSpeedMultiplier;
                    conn.opacity = Math.min(conn.establishProgress, 1) * (isDark ? 0.4 : 0.45);

                    if (conn.establishProgress >= 1) {
                        conn.isEstablished = true;
                        conn.establishProgress = 1;
                    }
                }

                // Validate connection nodes
                if (!conn.fromNode || !conn.toNode) return false;
                if (!isFinite(conn.fromNode.x) || !isFinite(conn.fromNode.y) || !isFinite(conn.fromNode.z)) return false;
                if (!isFinite(conn.toNode.x) || !isFinite(conn.toNode.y) || !isFinite(conn.toNode.z)) return false;
                
                // Get projected positions
                const from = project3D(conn.fromNode.x, conn.fromNode.y, conn.fromNode.z, centerX, centerY, rotX, rotY);
                const to = project3D(conn.toNode.x, conn.toNode.y, conn.toNode.z, centerX, centerY, rotX, rotY);
                
                // Validate projected positions
                if (!isFinite(from.screenX) || !isFinite(from.screenY) || !isFinite(to.screenX) || !isFinite(to.screenY)) {
                    return false;
                }

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
                    : `rgba(50, 50, 80, ${finalOpacity * 1.5})`;
                ctx.lineWidth = isDark ? 0.8 : 1.2;
                
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

                // Spawn packets on established connections (frequency based on focus)
                const packetIntervalMultiplier = 1.5 - focusLevel * 0.8; // Longer intervals normally, shorter when focused
                if (conn.isEstablished && timeRef.current - conn.lastPacketTime > conn.packetInterval * packetIntervalMultiplier) {
                    packetsRef.current.push(createPacket(conn));
                    conn.lastPacketTime = timeRef.current;
                    conn.packetInterval = 1.5 + Math.random() * 3;
                    
                    // More bidirectional traffic when focused
                    const bidirectionalChance = 0.2 + focusLevel * 0.3; // 20% normally, up to 50% when focused
                    if (Math.random() < bidirectionalChance) {
                        const returnPacket = createPacket(conn);
                        returnPacket.direction = returnPacket.direction === 1 ? -1 : 1;
                        packetsRef.current.push(returnPacket);
                    }
                }

                // Connection lifetime (fade out after longer period)
                if (conn.isEstablished && timeRef.current - conn.lastPacketTime > 20) {
                    conn.opacity -= 0.003;
                    if (conn.opacity <= 0) return false;
                }

                return true;
            });

            // Update and draw packets
            packetsRef.current = packetsRef.current.filter(packet => {
                packet.progress += packet.speed * packetSpeedMultiplier;

                if (packet.progress >= 1) {
                    // Packet arrived - status depends on emergency state
                    const targetNode = packet.direction === 1 ? packet.connection.toNode : packet.connection.fromNode;
                    if (isFinite(targetNode.screenX) && isFinite(targetNode.screenY)) {
                        // During emergency: all packets fail
                        // During recovery: all packets succeed
                        // Normal: random status
                        const emergency = emergencyRef.current;
                        let statusType: 'success' | 'warning' | 'failure' | undefined;
                        if (emergency.isActive) {
                            statusType = 'failure';
                        } else if (emergency.isRecovery) {
                            statusType = 'success';
                        }
                        statusIndicatorsRef.current.push(
                            createStatusIndicator(targetNode.screenX, targetNode.screenY, statusType)
                        );
                    }
                    return false;
                }

                const conn = packet.connection;
                
                // Validate connection nodes exist and have valid coordinates
                if (!conn.fromNode || !conn.toNode) return false;
                if (!isFinite(conn.fromNode.x) || !isFinite(conn.fromNode.y) || !isFinite(conn.fromNode.z)) return false;
                if (!isFinite(conn.toNode.x) || !isFinite(conn.toNode.y) || !isFinite(conn.toNode.z)) return false;
                
                const from = project3D(conn.fromNode.x, conn.fromNode.y, conn.fromNode.z, centerX, centerY, rotX, rotY);
                const to = project3D(conn.toNode.x, conn.toNode.y, conn.toNode.z, centerX, centerY, rotX, rotY);
                
                // Validate projected positions
                if (!isFinite(from.screenX) || !isFinite(from.screenY) || !isFinite(to.screenX) || !isFinite(to.screenY)) {
                    return false;
                }

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
                if (!colors) return false;

                // Depth-based opacity
                const packetZ = from.z + (to.z - from.z) * packet.progress;
                const depthFade = Math.max(0.4, Math.min(1, (PERSPECTIVE + packetZ) / (PERSPECTIVE * 2)));

                // Trail
                const trailLength = packet.type === 'tcp' ? 0.15 : 0.1;
                const trailStart = Math.max(0, packet.progress - trailLength);
                const trailX = startX + (endX - startX) * trailStart;
                const trailY = startY + (endY - startY) * trailStart;

                const trailOpacity = (isDark ? 0.3 : 0.35) * depthFade;
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
                const headOpacity = (isDark ? 0.85 : 0.9) * depthFade;
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
                const glowOpacity = (isDark ? 0.3 : 0.4) * depthFade * pulsePhase;
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
                const baseOpacity = isDark ? 0.25 : 0.3;
                const activeOpacity = node.isActive ? (isDark ? 0.4 : 0.5) : baseOpacity;
                const pulseOpacity = (activeOpacity + Math.sin(node.pulse) * 0.05) * depthFade;

                // Outer glow for active nodes
                if (node.isActive && depthFade > 0.5) {
                    const glowSize = currentSize * 1.5;
                    const glow = ctx.createRadialGradient(
                        node.screenX, node.screenY, currentSize * 0.5,
                        node.screenX, node.screenY, glowSize
                    );
                    glow.addColorStop(0, colors.glow.replace('VAL', String((isDark ? 0.12 : 0.15) * depthFade)));
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
                    const labelOpacity = (isDark ? 0.6 : 0.7) * depthFade;
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

            // Emergency event system
            const emergency = emergencyRef.current;
            const timeSinceLastEmergency = timeRef.current - emergency.lastEmergencyTime;
            
            // Track focus state and accumulate focus time
            if (isFocusedRef.current) {
                if (!emergency.hasEverFocused) {
                    emergency.hasEverFocused = true;
                }
                // Accumulate focus time (~0.016 seconds per frame at 60fps)
                emergency.accumulatedFocusTime += 0.016;
            }
            
            // Determine if we should trigger emergency
            let shouldTriggerEmergency = false;
            
            if (emergency.hasEverFocused && !emergency.hasTriggeredFirstEmergency && !emergency.isActive && !emergency.isRecovery) {
                // First emergency: trigger after accumulated focus time reaches threshold
                // This persists even if user unfocuses and refocuses
                if (emergency.accumulatedFocusTime > emergency.firstEmergencyDelay) {
                    shouldTriggerEmergency = true;
                    emergency.hasTriggeredFirstEmergency = true;
                }
            } else if (emergency.hasTriggeredFirstEmergency && !emergency.isActive && !emergency.isRecovery) {
                // After first emergency: check if enough time has passed
                // The interval is set when recovery ends, but we check dynamically
                // to handle focus state changes
                if (timeSinceLastEmergency > emergency.nextEmergencyInterval) {
                    shouldTriggerEmergency = true;
                }
            }
            
            // Trigger emergency
            if (shouldTriggerEmergency) {
                emergency.isActive = true;
                emergency.startTime = timeRef.current;
                // Note: lastEmergencyTime and nextEmergencyInterval are set when recovery ENDS
                
                // Dispatch event for MetricWidgets
                window.dispatchEvent(new CustomEvent('network-emergency', { detail: { type: 'start' } }));
            }
            
            // Handle active emergency
            if (emergency.isActive) {
                const emergencyAge = timeRef.current - emergency.startTime;
                
                if (emergencyAge < emergency.duration) {
                    // Draw emergency alert - slower blinking, not affected by focus
                    const blinkRate = 0.8; // Blinks per second (slower blinking)
                    const blinkOn = Math.sin(emergencyAge * blinkRate * Math.PI * 2) > 0;
                    
                    if (blinkOn) {
                        // Red overlay flash
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.08)';
                        ctx.fillRect(0, 0, width, height);
                    }
                    
                    // Draw EMERGENCY text
                    const textScale = Math.min(1, emergencyAge * 3); // Scale in quickly
                    const textOpacity = blinkOn ? 1 : 0.3;
                    
                    ctx.save();
                    ctx.font = `bold ${Math.round(48 * textScale)}px ui-monospace, monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Glow effect
                    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = `rgba(255, 50, 50, ${textOpacity})`;
                    ctx.fillText('⚠ EMERGENCY ⚠', centerX, centerY);
                    
                    // Subtitle
                    ctx.font = `${Math.round(14 * textScale)}px ui-monospace, monospace`;
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = `rgba(255, 100, 100, ${textOpacity * 0.8})`;
                    ctx.fillText('CRITICAL SYSTEM ALERT', centerX, centerY + 35);
                    
                    ctx.restore();
                } else {
                    // Transition to recovery
                    emergency.isActive = false;
                    emergency.isRecovery = true;
                    emergency.recoveryStartTime = timeRef.current;
                    
                    // Dispatch recovery event
                    window.dispatchEvent(new CustomEvent('network-emergency', { detail: { type: 'recovery' } }));
                }
            }
            
            // Handle recovery phase
            if (emergency.isRecovery) {
                const recoveryAge = timeRef.current - emergency.recoveryStartTime;
                
                if (recoveryAge < emergency.recoveryDuration) {
                    const fadeOut = 1 - (recoveryAge / emergency.recoveryDuration);
                    const textOpacity = fadeOut;
                    
                    // Green overlay
                    ctx.fillStyle = `rgba(0, 255, 100, ${0.05 * fadeOut})`;
                    ctx.fillRect(0, 0, width, height);
                    
                    // Draw RECOVERY text
                    ctx.save();
                    ctx.font = 'bold 48px ui-monospace, monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Glow effect
                    ctx.shadowColor = 'rgba(0, 255, 100, 0.8)';
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = `rgba(50, 255, 100, ${textOpacity})`;
                    ctx.fillText('✓ RECOVERED', centerX, centerY);
                    
                    // Subtitle
                    ctx.font = '14px ui-monospace, monospace';
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = `rgba(100, 255, 150, ${textOpacity * 0.8})`;
                    ctx.fillText('ALL SYSTEMS NOMINAL', centerX, centerY + 35);
                    
                    ctx.restore();
                } else {
                    // Recovery complete - reset timer for next emergency
                    // Frequency depends on focus state:
                    // When focused: every 1 minute (60 seconds)
                    // When not focused: every 1-3 minutes (60-180 seconds)
                    emergency.isRecovery = false;
                    emergency.lastEmergencyTime = timeRef.current; // Reset timer NOW when recovery ends
                    emergency.nextEmergencyInterval = isFocusedRef.current ? 60 : (60 + Math.random() * 120);

                    // Dispatch end event
                    window.dispatchEvent(new CustomEvent('network-emergency', { detail: { type: 'end' } }));
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [mounted, isDark, initNodes, project3D, tryEstablishConnection, createPacket, createStatusIndicator, drawHexagon, drawStatusIndicator, ROTATION_SPEED_NORMAL, ROTATION_SPEED_FOCUSED]);

    if (!mounted) return null;

    // Dynamic opacity: muted when reading content, vivid when animation is focused
    const canvasOpacity = isFocused ? 0.9 : 0.35;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 pointer-events-none transition-opacity duration-500"
            style={{ opacity: canvasOpacity }}
            aria-hidden="true"
        />
    );
};

export default HexagonServiceNetwork;
