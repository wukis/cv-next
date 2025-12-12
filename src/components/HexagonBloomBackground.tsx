'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

// Import post-processing effects
// Note: These need to be imported from three/examples/jsm
// We'll use dynamic imports to handle SSR

interface HexagonBloomBackgroundProps {
  className?: string;
}

const HexagonBloomBackground: React.FC<HexagonBloomBackgroundProps> = ({ className = '' }) => {
  // Always call hooks, but handle SSR case
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<any>(null);
  const hexagonsRef = useRef<THREE.Group[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const cleanupRef = useRef<(() => void) | null>(null);
  const themeRef = useRef<string | undefined>(resolvedTheme || undefined);

  // Update theme ref when theme changes
  useEffect(() => {
    themeRef.current = resolvedTheme || undefined;
  }, [resolvedTheme]);

  useEffect(() => {
    // Check screen width - only render on larger screens
    if (typeof window === 'undefined' || window.innerWidth <= 768) {
      return;
    }

    if (!containerRef.current) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let composer: any;
    let hexagons: THREE.Group[] = [];
    let connections: Array<{
      line: THREE.Line;
      hex1Index: number;
      hex2Index: number;
      pulseProgress: number;
      pulseSpeed: number;
      lastPulseTime: number;
      pulseInterval: number;
    }> = [];
    let handleResize: (() => void) | null = null;

    const init = async () => {
      // Import post-processing modules dynamically
      const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
      const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
      const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');
      const { OutputPass } = await import('three/examples/jsm/postprocessing/OutputPass.js');

      // Scene setup
      scene = new THREE.Scene();
      scene.background = null; // Transparent background

      // Camera setup - use perspective camera to show 3D cubes properly
      const width = containerRef.current!.clientWidth;
      const height = containerRef.current!.clientHeight;
      const viewSize = Math.max(width, height); // Used for 3D space calculations
      camera = new THREE.PerspectiveCamera(
        75, // Field of view
        width / height, // Aspect ratio
        0.1, // Near plane
        10000 // Far plane
      );
      camera.position.set(0, 0, 1000); // Position camera to view the scene
      camera.lookAt(0, 0, 0);

      // Renderer setup
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      containerRef.current!.appendChild(renderer.domElement);

      // Create hexagon pattern
      const hexagonGroup = new THREE.Group();
      scene.add(hexagonGroup);

      // Service box size - 2 times smaller (was 200, now 100)
      const boxSize = 100;
      const services: THREE.Group[] = [];
      const servicePositions: Array<{ x: number; y: number; z: number; group: THREE.Group }> = [];

      // Cyberpunk color palette - neon colors
      const cyberpunkColors = [
        0x00ffff, // Cyan
        0xff00ff, // Magenta
        0x00ff00, // Green
        0xffff00, // Yellow
        0xff0080, // Pink
        0x0080ff, // Blue
        0x80ff00, // Lime
        0xff8000, // Orange
      ];

      // Calculate 3D space bounds - centered and visible
      const depthRange = viewSize * 0.4; // Z depth range - reduced for better centering
      const numServices = 8; // Fixed to 8 boxes
      const minDistance = boxSize * 1.5; // Minimum distance between boxes
      const positions: Array<{ x: number; y: number; z: number }> = [];
      
      // Reduced spread to keep boxes centered and visible on screen
      const spreadRange = viewSize * 0.4; // 40% of view size for better centering

      // Create service boxes at random 3D positions with minimum spacing
      let attempts = 0;
      const maxAttempts = numServices * 20; // More attempts since we have fewer boxes
      
      for (let i = 0; i < numServices && attempts < maxAttempts; attempts++) {
        // Random positions in 3D space - centered around origin
        const x = (Math.random() - 0.5) * spreadRange; // Centered spread
        const y = (Math.random() - 0.5) * spreadRange; // Centered spread
        const z = (Math.random() - 0.5) * depthRange; // Centered depth
        
        // Check if this position is too close to existing positions
        let tooClose = false;
        for (const existingPos of positions) {
          const dx = x - existingPos.x;
          const dy = y - existingPos.y;
          const dz = z - existingPos.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (distance < minDistance) {
            tooClose = true;
            break;
          }
        }
        
        // If position is good, add the service
        if (!tooClose) {
          positions.push({ x, y, z });
          
          // Random start time for each service (0-15 seconds)
          const startTime = Math.random() * 15;
          
          // Pick random cyberpunk color
          const randomColor = cyberpunkColors[Math.floor(Math.random() * cyberpunkColors.length)];

          // Create 3D service box at random position
          const service = createServiceBox(boxSize, x, y, z, randomColor, startTime);
          hexagonGroup.add(service);
          services.push(service);
          servicePositions.push({ x, y, z, group: service });
          i++; // Only increment when we successfully place a box
        }
      }

      // Create service connections group
      const connectionGroup = new THREE.Group();
      scene.add(connectionGroup);
      
      // Create separate group for status symbols so they can persist independently
      const statusSymbolGroup = new THREE.Group();
      scene.add(statusSymbolGroup);
      const connections: Array<{
        line: THREE.Line;
        service1Index: number;
        service2Index: number;
        pulseProgress: number;
        pulseSpeed: number;
        isActive: boolean;
        connectionStartTime: number;
        connectionDuration: number;
        statusSymbol?: THREE.Group; // 3D status indicator (checkmark, X, warning) - first box
        statusSymbol2?: THREE.Group; // 3D status indicator for second box
        statusType?: 'success' | 'failure' | 'warning';
        symbolProgress?: number; // Animation progress for symbol (deprecated, using symbolStartTime instead)
        symbolStartTime: number; // When symbol started
        symbolDuration: number; // How long symbol should last
        lineRemoved?: boolean; // Track if connection line has been removed
        packets?: THREE.Group[]; // Animated data packets traveling along the line
        packetPositions?: number[]; // Progress of each packet (0-1)
        packetSizes?: number[]; // Size of each packet (for pulsing effect)
        pos1?: { x: number; y: number; z: number }; // Start position
        pos2?: { x: number; y: number; z: number }; // End position
      }> = [];

      // Store services, connections, and boxSize for animation
      hexagonsRef.current = services;
      const boxSizeRef = boxSize; // Store for use in connection logic
      // connections is already in outer scope

      // Post-processing setup
      const renderScene = new RenderPass(scene, camera);
      
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        2.0, // strength
        0.5, // radius
        0.0 // threshold - lower threshold means more bloom
      );

      const outputPass = new OutputPass();

      composer = new EffectComposer(renderer);
      composer.addPass(renderScene);
      composer.addPass(bloomPass);
      composer.addPass(outputPass);

      // Store refs
      sceneRef.current = scene;
      rendererRef.current = renderer;
      composerRef.current = composer;
      hexagonsRef.current = hexagons;

      // Animation loop
      const clock = new THREE.Clock();
      clockRef.current = clock;

      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // Update service animations
        services.forEach((service, index) => {
          const serviceData = service.userData;
          if (!serviceData) return;

          const timeSinceStart = elapsed - serviceData.startTime;
          const drawCompleteTime = 6; // Time to draw service (6 seconds - slower)
          
          // Animate service drawing
          if (timeSinceStart > 0 && serviceData.drawProgress < 1) {
            serviceData.drawProgress += delta * 0.17; // Slower drawing speed (was 0.5)
            serviceData.drawProgress = Math.min(serviceData.drawProgress, 1);
            updateServiceBox(service, serviceData.drawProgress);
            
            // Fade in as drawing progresses
            serviceData.opacity = serviceData.drawProgress;
            updateServiceOpacity(service, serviceData.opacity);
          } else if (serviceData.drawProgress >= 1 && serviceData.opacity < 1) {
            serviceData.opacity = 1;
            updateServiceOpacity(service, 1);
            serviceData.isDrawn = true;
          }

          // Service is ready to connect when fully drawn
          if (serviceData.drawProgress >= 1 && !serviceData.isConnecting && !serviceData.isFading) {
            serviceData.isDrawn = true;
            serviceData.isReady = true;
          } else if (serviceData.isConnecting || serviceData.isFading) {
            serviceData.isReady = false;
          }

          // Handle service fading (after connection) - slower
          if (serviceData.isFading) {
            serviceData.fadeProgress += delta * 0.15; // Slower fade (was 0.3)
            if (serviceData.fadeProgress >= 1) {
              // Service faded out, reset it
              serviceData.drawProgress = 0;
              serviceData.opacity = 0;
              serviceData.isDrawn = false;
              serviceData.isFading = false;
              serviceData.isConnecting = false;
              serviceData.isReady = false;
              serviceData.fadeProgress = 0;
              serviceData.connectionCount = 0; // Reset connection count
              serviceData.maxConnections = Math.floor(Math.random() * 5) + 1; // New random limit (1-5)
              serviceData.startTime = elapsed + Math.random() * 5; // Random restart (0-5 seconds)
              // Clear all edges
              if (serviceData.edgesGroup) {
                while (serviceData.edgesGroup.children.length > 0) {
                  const child = serviceData.edgesGroup.children[0];
                  serviceData.edgesGroup.remove(child);
                  if (child instanceof THREE.Line) {
                    child.geometry.dispose();
                  }
                }
              }
              serviceData.edgeLines = [];
              updateServiceBox(service, 0);
              updateServiceOpacity(service, 0);
            } else {
              serviceData.opacity = 1 - serviceData.fadeProgress;
              updateServiceOpacity(service, serviceData.opacity);
            }
          }

          // Rotate slowly - minimal rotation for infrastructure diagram look
          service.rotation.y += delta * 0.02; // Very slow rotation
          service.rotation.x += delta * 0.01;
        });

        // Handle service connections - create connections when two services are ready
        const readyServices = services
          .map((s, i) => ({ service: s, index: i, data: s.userData }))
          .filter(({ data }) => data && data.isReady && !data.isConnecting && !data.isFading);

        // Try to create new connections - more frequent
        if (readyServices.length >= 2 && Math.random() < 0.3) { // 30% chance per frame
          // Pick two random ready services
          const idx1 = Math.floor(Math.random() * readyServices.length);
          let idx2 = Math.floor(Math.random() * readyServices.length);
          while (idx2 === idx1) {
            idx2 = Math.floor(Math.random() * readyServices.length);
          }

          const service1 = readyServices[idx1];
          const service2 = readyServices[idx2];
          
          // Check distance in 3D space
          const pos1 = servicePositions[service1.index];
          const pos2 = servicePositions[service2.index];
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const dz = pos2.z - pos1.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const maxConnectionDistance = boxSizeRef * 4; // Connection distance based on box size

          if (distance < maxConnectionDistance) {
            // Check if these services are already connected
            const alreadyConnected = connections.some(conn => 
              (conn.service1Index === service1.index && conn.service2Index === service2.index) ||
              (conn.service1Index === service2.index && conn.service2Index === service1.index)
            );
            
            if (!alreadyConnected) {
              // Randomly assign connection status (60% success, 25% warning, 15% failure)
              const statusRand = Math.random();
              const statusType: 'success' | 'failure' | 'warning' = 
                statusRand < 0.6 ? 'success' : 
                statusRand < 0.85 ? 'warning' : 'failure';
              
              // Set connection color based on status (will change when status is determined)
              const connectionColor = statusType === 'success' ? 0x00ff00 : 
                                     statusType === 'failure' ? 0xff0000 : 0xffff00;
              
              // Create connection in 3D space with status-based color
              const connection = createServiceConnection(
                pos1.x, pos1.y, pos1.z,
                pos2.x, pos2.y, pos2.z,
                connectionColor
              );
              connectionGroup.add(connection);
              
              // Create animated data packets
              const numPackets = 3; // Number of packets traveling along the line
              const packets: THREE.Group[] = [];
              const packetPositions: number[] = [];
              const packetSizes: number[] = [];
              
              for (let p = 0; p < numPackets; p++) {
                const packet = createDataPacket(connectionColor);
                connectionGroup.add(packet);
                packets.push(packet);
                packetPositions.push(Math.random()); // Random starting position
                packetSizes.push(0.5 + Math.random() * 0.5); // Random initial size
              }

              // Create status symbols at the center of both services (cube centers)
              const statusSymbol1 = createStatusSymbol(statusType, pos1.x, pos1.y, pos1.z, camera.position);
              const statusSymbol2 = createStatusSymbol(statusType, pos2.x, pos2.y, pos2.z, camera.position);
              statusSymbolGroup.add(statusSymbol1);
              statusSymbolGroup.add(statusSymbol2);

              // Mark services as connecting
              service1.data.isConnecting = true;
              service1.data.isReady = false;
              service2.data.isConnecting = true;
              service2.data.isReady = false;

              connections.push({
                line: connection,
                service1Index: service1.index,
                service2Index: service2.index,
                pulseProgress: 0,
                pulseSpeed: 0.5 + Math.random() * 0.5, // Slower pulse (was 1.0-2.0, now 0.5-1.0)
                isActive: true,
                connectionStartTime: elapsed,
                connectionDuration: 3 + Math.random() * 4, // Connection lasts 3-7 seconds (slower)
                statusSymbol: statusSymbol1, // First box symbol
                statusSymbol2: statusSymbol2, // Second box symbol
                statusType: statusType,
                symbolProgress: 0,
                symbolStartTime: elapsed, // Track when symbol started
                symbolDuration: 5 + Math.random() * 3, // Symbol lasts 5-8 seconds (longer than connection)
                packets: packets,
                packetPositions: packetPositions,
                packetSizes: packetSizes,
                pos1: { x: pos1.x, y: pos1.y, z: pos1.z },
                pos2: { x: pos2.x, y: pos2.y, z: pos2.z },
              });
            }
          }
        }

        // Animate service connections - pulsing data signals
        if (connections && connections.length > 0) {
          // Process connections in reverse to allow safe removal
          for (let i = connections.length - 1; i >= 0; i--) {
            const conn = connections[i];
            const connectionAge = elapsed - conn.connectionStartTime;
            
            // Update pulse progress - pulse continuously while connection is active
            if (conn.isActive) {
              conn.pulseProgress += delta * conn.pulseSpeed;
              if (conn.pulseProgress > 1) {
                conn.pulseProgress = conn.pulseProgress % 1; // Loop the pulse
              }
              
              // Update connection line color and opacity based on status
              const connectionMaterial = conn.line.material as THREE.LineBasicMaterial;
              const pulseIntensity = Math.sin(conn.pulseProgress * Math.PI);
              
              // Set color based on status type
              if (conn.statusType === 'success') {
                connectionMaterial.color.setHex(0x00ff00); // Green
              } else if (conn.statusType === 'failure') {
                connectionMaterial.color.setHex(0xff0000); // Red
              } else if (conn.statusType === 'warning') {
                connectionMaterial.color.setHex(0xffff00); // Yellow
              }
              
              connectionMaterial.opacity = 0.3 + pulseIntensity * 0.4;
              
              // Animate data packets traveling along the connection line
              if (conn.packets && conn.packetPositions && conn.packetSizes && conn.pos1 && conn.pos2) {
                const packetSpeed = 1.5; // Speed of packet travel
                
                conn.packets.forEach((packet, index) => {
                  // Update packet position
                  conn.packetPositions![index] += delta * packetSpeed;
                  
                  // Reset packet when it reaches the end
                  if (conn.packetPositions![index] > 1) {
                    conn.packetPositions![index] = 0;
                    conn.packetSizes![index] = 0.5 + Math.random() * 0.5; // Random new size
                  }
                  
                  // Update packet size (pulsing effect - grows and shrinks)
                  const baseSize = 0.8;
                  const pulseAmplitude = 0.4;
                  const pulseSpeed = 4.0;
                  const sizePulse = Math.sin(elapsed * pulseSpeed + index * 2) * pulseAmplitude + baseSize;
                  conn.packetSizes![index] = sizePulse;
                  
                  // Calculate packet position along the line
                  const progress = conn.packetPositions![index];
                  const packetX = conn.pos1!.x + (conn.pos2!.x - conn.pos1!.x) * progress;
                  const packetY = conn.pos1!.y + (conn.pos2!.y - conn.pos1!.y) * progress;
                  const packetZ = conn.pos1!.z + (conn.pos2!.z - conn.pos1!.z) * progress;
                  
                  packet.position.set(packetX, packetY, packetZ);
                  packet.scale.set(conn.packetSizes![index], conn.packetSizes![index], conn.packetSizes![index]);
                  
                  // Make packet face camera
                  const packetWorldPos = new THREE.Vector3();
                  packet.getWorldPosition(packetWorldPos);
                  const packetDirection = new THREE.Vector3().subVectors(camera.position, packetWorldPos);
                  const packetTarget = new THREE.Vector3().addVectors(packetWorldPos, packetDirection);
                  packet.lookAt(packetTarget);
                  
                  // Update packet opacity based on pulse
                  packet.traverse((child) => {
                    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
                      const packetMaterial = child.material as THREE.MeshBasicMaterial | THREE.LineBasicMaterial;
                      if (packetMaterial && packetMaterial.transparent !== undefined) {
                        packetMaterial.opacity = 0.6 + pulseIntensity * 0.4;
                      }
                    }
                  });
                });
              }
            }

            // Animate status symbols (appear quickly, stay longer, fade out slowly)
            // Helper function to animate a single symbol
            const animateSymbol = (symbol: THREE.Group | undefined, statusType: 'success' | 'failure' | 'warning' | undefined) => {
              if (!symbol || conn.symbolStartTime === undefined || conn.symbolDuration === undefined) return;
              
              const symbolAge = elapsed - conn.symbolStartTime;
              
              // Scale in quickly (0-0.3s), hold for most of duration, fade out at the end (last 1.5s)
              const scaleInDuration = 0.3;
              const fadeOutDuration = 1.5;
              const holdDuration = conn.symbolDuration - scaleInDuration - fadeOutDuration;
              
              let scale = 0;
              let opacity = 0;
              
              if (symbolAge < scaleInDuration) {
                // Scale in
                scale = symbolAge / scaleInDuration;
                opacity = 1;
              } else if (symbolAge < scaleInDuration + holdDuration) {
                // Hold - stay fully visible
                scale = 1;
                opacity = 1;
              } else if (symbolAge < conn.symbolDuration) {
                // Fade out
                scale = 1;
                const fadeProgress = (symbolAge - scaleInDuration - holdDuration) / fadeOutDuration;
                opacity = 1 - fadeProgress;
              } else {
                // Fully faded
                scale = 1;
                opacity = 0;
              }
              
              symbol.scale.set(scale, scale, scale);
              
              // Make symbol always face the camera (billboard effect)
              // Reset rotation first to avoid accumulation
              symbol.rotation.set(0, 0, 0);
              
              // Get symbol's world position
              const symbolWorldPos = new THREE.Vector3();
              symbol.getWorldPosition(symbolWorldPos);
              
              // Calculate direction from symbol to camera
              const direction = new THREE.Vector3().subVectors(camera.position, symbolWorldPos);
              
              // Create target point in front of symbol
              const target = new THREE.Vector3().addVectors(symbolWorldPos, direction);
              
              // Use lookAt to face camera
              symbol.lookAt(target);
              
              // Note: Checkmark geometry is already inverted in Y to appear correct when facing camera
              // No additional rotation needed
              
              // Update opacity of all materials in the symbol
              symbol.traverse((child) => {
                if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
                  const material = child.material as THREE.MeshBasicMaterial | THREE.LineBasicMaterial;
                  if (material && material.transparent !== undefined) {
                    material.opacity = opacity;
                  }
                }
              });
            };
            
            // Animate both symbols with status type
            animateSymbol(conn.statusSymbol, conn.statusType);
            animateSymbol(conn.statusSymbol2, conn.statusType);

            // Check if connection line should be removed (symbol persists longer)
            if (!conn.lineRemoved && connectionAge > conn.connectionDuration) {
              const service1 = services[conn.service1Index];
              const service2 = services[conn.service2Index];
              const service1Data = service1.userData;
              const service2Data = service2.userData;

              // Increment connection count for both services
              if (service1Data) {
                service1Data.connectionCount = (service1Data.connectionCount || 0) + 1;
                service1Data.isConnecting = false;
              }
              if (service2Data) {
                service2Data.connectionCount = (service2Data.connectionCount || 0) + 1;
                service2Data.isConnecting = false;
              }

              // Check if services should fade based on their connection limit
              if (service1Data && service1Data.connectionCount >= service1Data.maxConnections) {
                service1Data.isFading = true;
                service1Data.isReady = false;
                service1Data.fadeProgress = 0;
              } else if (service1Data) {
                // Still has connections left, make it ready again
                service1Data.isReady = true;
              }

              if (service2Data && service2Data.connectionCount >= service2Data.maxConnections) {
                service2Data.isFading = true;
                service2Data.isReady = false;
                service2Data.fadeProgress = 0;
              } else if (service2Data) {
                // Still has connections left, make it ready again
                service2Data.isReady = true;
              }

              // Remove connection line and packets (symbol will persist longer)
              connectionGroup.remove(conn.line);
              conn.line.geometry.dispose();
              (conn.line.material as THREE.Material).dispose();
              
              // Remove data packets
              if (conn.packets) {
                conn.packets.forEach((packet) => {
                  connectionGroup.remove(packet);
                  packet.traverse((child) => {
                    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
                      if (child.geometry) child.geometry.dispose();
                      if (child.material) {
                        if (Array.isArray(child.material)) {
                          child.material.forEach((mat) => mat.dispose());
                        } else {
                          child.material.dispose();
                        }
                      }
                    }
                  });
                });
              }
              
              conn.lineRemoved = true;
            }
            
            // Check if symbols should be removed (after connection line is gone)
            if (conn.lineRemoved && conn.symbolStartTime !== undefined && conn.symbolDuration !== undefined) {
              const symbolAge = elapsed - conn.symbolStartTime;
              if (symbolAge >= conn.symbolDuration) {
                // Helper function to remove a symbol
                const removeSymbol = (symbol: THREE.Group | undefined) => {
                  if (!symbol) return;
                  statusSymbolGroup.remove(symbol);
                  symbol.traverse((child) => {
                    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
                      if (child.geometry) child.geometry.dispose();
                      if (child.material) {
                        if (Array.isArray(child.material)) {
                          child.material.forEach((mat) => mat.dispose());
                        } else {
                          child.material.dispose();
                        }
                      }
                    }
                  });
                };
                
                // Remove both symbols after their duration expires
                removeSymbol(conn.statusSymbol);
                removeSymbol(conn.statusSymbol2);
                
                // Remove connection entry when symbols expire
                connections.splice(i, 1);
              }
            }
          }
        }

        composer.render();
      };

      animate();

      // Handle window resize
      handleResize = () => {
        if (!containerRef.current) return;
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
        composer.setSize(newWidth, newHeight);
        bloomPass.setSize(newWidth, newHeight);
      };

      window.addEventListener('resize', handleResize);

      // Store cleanup function
      cleanupRef.current = () => {
        if (handleResize) {
          window.removeEventListener('resize', handleResize);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (renderer) {
          renderer.dispose();
        }
        if (composer) {
          composer.dispose();
        }
        if (containerRef.current && renderer.domElement) {
          try {
            containerRef.current.removeChild(renderer.domElement);
          } catch (e) {
            // Element might already be removed
          }
        }
      };
    };

    init();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Note: Colors are now random cyberpunk colors, so theme changes don't affect them
  // But we could adjust opacity/intensity based on theme if needed

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-0 ${className}`}
      style={{ background: 'transparent' }}
    />
  );
};

// Helper function to create a 3D status symbol (checkmark, X, or warning)
function createStatusSymbol(type: 'success' | 'failure' | 'warning', x: number, y: number, z: number, cameraPosition: THREE.Vector3): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  
  const size = 50; // Symbol size (increased from 30 for better visibility)
  const material = new THREE.LineBasicMaterial({
    color: type === 'success' ? 0x00ff00 : type === 'failure' ? 0xff0000 : 0xffff00, // Green, Red, Yellow
    transparent: true,
    opacity: 1,
    linewidth: 3,
  });
  
  // Create circle around symbol (for success and failure only)
  if (type === 'success' || type === 'failure') {
    const circleRadius = size * 0.5;
    const circleSegments = 32;
    const circlePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= circleSegments; i++) {
      const angle = (i / circleSegments) * Math.PI * 2;
      circlePoints.push(new THREE.Vector3(
        Math.cos(angle) * circleRadius,
        Math.sin(angle) * circleRadius,
        0
      ));
    }
    const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
    const circle = new THREE.Line(circleGeometry, material);
    group.add(circle);
  }
  
  if (type === 'success') {
    // Create checkmark (✓) - proper checkmark shape: starts bottom-left, curves up-right, ends bottom-right
    // Geometry is inverted in Y to account for billboard rotation
    // Made smaller (0.25 instead of 0.35) to ensure it doesn't touch the circle (radius is 0.5)
    const checkmarkGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-size * 0.25, size * 0.15, 0),   // Start (inverted Y, smaller to avoid circle)
      new THREE.Vector3(-size * 0.08, -size * 0.08, 0), // Middle (inverted Y, smaller)
      new THREE.Vector3(size * 0.25, size * 0.18, 0),   // End (inverted Y, smaller to avoid circle)
    ]);
    const checkmark = new THREE.Line(checkmarkGeometry, material);
    group.add(checkmark);
  } else if (type === 'failure') {
    // Create X mark - made smaller to ensure it doesn't touch the circle
    const xSize = size * 0.25; // Smaller X to avoid touching circle (circle radius is 0.5)
    const xGeometry1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-xSize, -xSize, 0),
      new THREE.Vector3(xSize, xSize, 0),
    ]);
    const xGeometry2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xSize, -xSize, 0),
      new THREE.Vector3(-xSize, xSize, 0),
    ]);
    const x1 = new THREE.Line(xGeometry1, material);
    const x2 = new THREE.Line(xGeometry2, material);
    group.add(x1);
    group.add(x2);
  } else {
    // Create warning triangle with exclamation mark
    // Triangle
    const triangleGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, size * 0.4, 0),
      new THREE.Vector3(-size * 0.35, -size * 0.3, 0),
      new THREE.Vector3(size * 0.35, -size * 0.3, 0),
      new THREE.Vector3(0, size * 0.4, 0), // Close triangle
    ]);
    const triangle = new THREE.Line(triangleGeometry, material);
    group.add(triangle);
    
    // Exclamation mark
    const exclamationGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, size * 0.15, 0),
      new THREE.Vector3(0, -size * 0.1, 0),
      new THREE.Vector3(0, -size * 0.15, 0),
      new THREE.Vector3(0, -size * 0.2, 0),
    ]);
    const exclamation = new THREE.Line(exclamationGeometry, material);
    group.add(exclamation);
  }
  
  // Initial orientation - will be updated every frame to face camera
  // Don't set initial rotation here, it will be handled in the animation loop
  
  return group;
}

// Helper function to create an animated data packet
function createDataPacket(color: number): THREE.Group {
  const group = new THREE.Group();
  
  const packetSize = 8; // Base size of the packet
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.8,
  });
  
  // Create a small diamond/square shape for the packet
  const packetGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -packetSize, 0),      // Bottom
    new THREE.Vector3(packetSize, 0, 0),        // Right
    new THREE.Vector3(0, packetSize, 0),       // Top
    new THREE.Vector3(-packetSize, 0, 0),      // Left
    new THREE.Vector3(0, -packetSize, 0),       // Close shape
  ]);
  
  const packet = new THREE.Line(packetGeometry, material);
  group.add(packet);
  
  return group;
}

// Helper function to create a service connection line in 3D (infrastructure diagram style)
function createServiceConnection(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color: number): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x1, y1, z1),
    new THREE.Vector3(x2, y2, z2)
  ]);
  
  // Infrastructure diagram style: cleaner, more visible connections
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.2, // Start dim, will pulse brighter
  });
  
  return new THREE.Line(geometry, material);
}

// Helper function to create a simple 3D box (cube) with animated edge drawing
function createServiceBox(
  size: number,
  x: number,
  y: number,
  z: number,
  color: number = 0x2563eb,
  startTime: number = 0
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Simple box (cube): A shape with 6 square faces
  // Scale factor for the shape
  const halfSize = size / 2;
  
  const vertices: THREE.Vector3[] = [];
  
  // Create all 8 vertices of a cube
  // Bottom face (z = -halfSize)
  vertices.push(new THREE.Vector3(-halfSize, -halfSize, -halfSize));  // 0: bottom-left-back
  vertices.push(new THREE.Vector3(halfSize, -halfSize, -halfSize));   // 1: bottom-right-back
  vertices.push(new THREE.Vector3(halfSize, halfSize, -halfSize));    // 2: top-right-back
  vertices.push(new THREE.Vector3(-halfSize, halfSize, -halfSize));   // 3: top-left-back
  
  // Top face (z = halfSize)
  vertices.push(new THREE.Vector3(-halfSize, -halfSize, halfSize));  // 4: bottom-left-front
  vertices.push(new THREE.Vector3(halfSize, -halfSize, halfSize));   // 5: bottom-right-front
  vertices.push(new THREE.Vector3(halfSize, halfSize, halfSize));     // 6: top-right-front
  vertices.push(new THREE.Vector3(-halfSize, halfSize, halfSize));    // 7: top-left-front

  // Define all 12 edges of the cube
  const edges: number[][] = [];
  
  // Bottom face (4 edges)
  edges.push([0, 1], [1, 2], [2, 3], [3, 0]);
  
  // Top face (4 edges)
  edges.push([4, 5], [5, 6], [6, 7], [7, 4]);
  
  // Vertical edges connecting bottom to top (4 edges)
  edges.push([0, 4], [1, 5], [2, 6], [3, 7]);

  // Create material for edges - infrastructure diagram style
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0,
  });

  // Create a group to hold all edge lines
  const edgesGroup = new THREE.Group();
  group.add(edgesGroup);

  // Random number of connections before fading (1-5)
  const maxConnections = Math.floor(Math.random() * 5) + 1;

  // Store animation data
  group.userData = {
    drawProgress: 0,
    opacity: 0,
    startTime: startTime,
    isDrawn: false,
    isReady: false,
    isConnecting: false,
    isFading: false,
    fadeProgress: 0,
    connectionCount: 0, // Track how many connections this service has made
    maxConnections: maxConnections, // Random limit (1-5)
    vertices: vertices,
    edges: edges,
    edgesGroup: edgesGroup,
    material: material,
    edgeLines: [], // Will store individual edge line objects
  };

  return group;
}

// Update service box drawing - all edges draw simultaneously
function updateServiceBox(service: THREE.Group, progress: number) {
  const serviceData = service.userData;
  if (!serviceData || !serviceData.vertices || !serviceData.edges) return;

  const vertices = serviceData.vertices;
  const edges = serviceData.edges;
  const edgesGroup = serviceData.edgesGroup;
  const material = serviceData.material;
  
  // Ensure edgeLines array exists
  if (!serviceData.edgeLines) {
    serviceData.edgeLines = [];
  }

  // Initialize all edges if needed
  if (serviceData.edgeLines.length === 0) {
    edges.forEach(() => {
      const geometry = new THREE.BufferGeometry();
      const line = new THREE.Line(geometry, material.clone());
      edgesGroup.add(line);
      serviceData.edgeLines.push(line);
    });
  }

  // Draw all edges simultaneously based on progress
  edges.forEach((edge: number[], index: number) => {
    const v1 = vertices[edge[0]];
    const v2 = vertices[edge[1]];
    
    // Interpolate between vertices based on overall progress
    const currentPoint = new THREE.Vector3().lerpVectors(v1, v2, progress);
    
    // Update edge geometry
    const line = serviceData.edgeLines[index];
    const geometry = line.geometry as THREE.BufferGeometry;
    geometry.setFromPoints([v1, currentPoint]);
    geometry.attributes.position.needsUpdate = true;
  });
}

// Update service opacity
function updateServiceOpacity(service: THREE.Group, opacity: number) {
  const serviceData = service.userData;
  if (!serviceData || !serviceData.material) return;

  // Update material opacity for all edges
  serviceData.material.opacity = opacity;
  
  // Also update individual edge lines if they exist
  if (serviceData.edgeLines) {
    serviceData.edgeLines.forEach((line: THREE.Line) => {
      if (line.material instanceof THREE.LineBasicMaterial) {
        line.material.opacity = opacity;
      }
    });
  }
}

export default HexagonBloomBackground;

