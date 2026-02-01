'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';

type EmergencyState = 'normal' | 'emergency' | 'recovery';

// Operational logs - mixed with occasional warnings, errors, and successes
const logs = [
  'INFO  HttpServer request completed path=/api/health status=200 duration_ms=12',
  'DEBUG ConnectionPool acquired connection pool_size=8 active=3',
  'INFO  CacheManager cache hit key=user_session_abc hit_rate=94.2%',
  'WARN  RateLimiter approaching threshold client=api-key-123 usage=78%',
  'DEBUG MetricsCollector flushed batch size=150 endpoint=prometheus',
  'INFO  LoadBalancer routed request backend=node-3 latency_ms=8',
  'OK    HealthCheck all services healthy count=12 region=us-east-1',
  'INFO  HttpServer request completed path=/api/users status=200 duration_ms=23',
  'ERROR RetryHandler request failed path=/api/webhook attempt=1 max=3',
  'DEBUG ConnectionPool released connection pool_size=8 active=2',
  'INFO  CacheManager cache hit key=config_cache hit_rate=96.1%',
  'OK    RetryHandler request succeeded path=/api/webhook attempt=2',
  'DEBUG TaskScheduler executed job=cleanup_sessions duration_ms=45',
  'WARN  MemoryAlert heap usage elevated used=72.3% threshold=80%',
  'INFO  HttpServer request completed path=/api/metrics status=200 duration_ms=5',
  'INFO  LoadBalancer health check passed backend=node-1 latency_ms=3',
  'OK    CircuitBreaker CLOSED service=email-api healthy_calls=50',
  'DEBUG MetricsCollector flushed batch size=178 endpoint=prometheus',
  'ERROR DatabaseConnection query slow query=SELECT duration_ms=2340 threshold=1000',
  'INFO  CacheManager cache miss key=new_user_xyz hit_rate=94.0%',
  'OK    DatabaseConnection query optimized cached=true duration_ms=12',
  'WARN  DiskAlert usage elevated partition=/logs used=68.5% threshold=70%',
  'INFO  HttpServer request completed path=/api/config status=200 duration_ms=8',
  'DEBUG ConnectionPool acquired connection pool_size=8 active=4',
  'OK    GarbageCollector completed freed_mb=256 pause_ms=12',
  'INFO  LoadBalancer routed request backend=node-2 latency_ms=6',
];

// Base timestamp computed once at module load - keeps timestamps current without runtime overhead
const baseTimestamp = Date.now();

// Generate timestamp for log entries (offsets from base to simulate sequential logs)
const generateTimestamp = (index: number): string => {
  return new Date(baseTimestamp - (30 - index) * 54).toISOString();
};

// Format log entry with timestamp
const formatLogEntry = (log: string, index: number): string => {
  return `${generateTimestamp(index)} ${log}`;
};

export default function LogTerminal() {
  const [shouldRender, setShouldRender] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [emergencyState, setEmergencyState] = useState<EmergencyState>('normal');
  const [isDark, setIsDark] = useState(true);

  // Refs for JS-based scrolling animation
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const scrollStateRef = useRef({
    currentOffset: 0,     // Current scroll position in %
    currentSpeed: 0,      // Current speed (% per frame)
    targetSpeed: 0,       // Target speed based on state
    lastTime: 0,          // For consistent timing
  });

  const checkScreenSize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Only render on wide screens (same as MetricWidgets)
    const isWideScreen = width > 1200 && (width / height) > 1.4;
    setShouldRender(isWideScreen);
  }, []);

  useEffect(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [checkScreenSize]);

  // Listen for dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Listen for animation-focus class
  useEffect(() => {
    const checkFocusClass = () => {
      setIsFocused(document.documentElement.classList.contains('animation-focus'));
    };

    checkFocusClass();

    const observer = new MutationObserver(checkFocusClass);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Listen for emergency events
  useEffect(() => {
    const handleEmergency = (event: Event) => {
      const customEvent = event as CustomEvent<{ type: string }>;
      const eventType = customEvent.detail?.type;

      if (eventType === 'start') {
        setEmergencyState('emergency');
      } else if (eventType === 'recovery') {
        setEmergencyState('recovery');
      } else if (eventType === 'end') {
        setEmergencyState('normal');
      }
    };

    window.addEventListener('network-emergency', handleEmergency);
    return () => window.removeEventListener('network-emergency', handleEmergency);
  }, []);

  // Calculate target scroll speed based on state (% per millisecond)
  const getTargetScrollSpeed = useCallback(() => {
    // Duration in ms for scrolling 50% (one full copy)
    // These match the original CSS animation durations
    const durationMs = emergencyState === 'emergency'
      ? (isFocused ? 12000 : 35000)
      : (isFocused ? 18000 : 60000);

    // Speed = 50% / duration in ms
    return 50 / durationMs;
  }, [emergencyState, isFocused]);

  // Update target speed when state changes (without restarting animation)
  useEffect(() => {
    scrollStateRef.current.targetSpeed = getTargetScrollSpeed();
  }, [getTargetScrollSpeed]);

  // Main animation loop using requestAnimationFrame
  useEffect(() => {
    if (!shouldRender) return;

    const state = scrollStateRef.current;
    state.targetSpeed = getTargetScrollSpeed();
    state.currentSpeed = state.targetSpeed; // Initialize to target
    state.lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - state.lastTime;
      state.lastTime = currentTime;

      // Smoothly interpolate speed toward target (lerp factor ~0.02 per 16ms)
      const lerpFactor = Math.min(1, 0.02 * (deltaTime / 16));
      state.currentSpeed += (state.targetSpeed - state.currentSpeed) * lerpFactor;

      // Update offset based on current speed
      state.currentOffset -= state.currentSpeed * deltaTime;

      // Wrap at -50% for seamless infinite loop
      if (state.currentOffset <= -50) {
        state.currentOffset += 50;
      }

      // Apply transform
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.transform = `translateY(${state.currentOffset}%)`;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shouldRender, getTargetScrollSpeed]);

  if (!shouldRender) return null;

  // Format logs with timestamps - only styling changes based on emergency state
  const formattedLogs = logs.map((log, i) => formatLogEntry(log, i));

  // Color configuration
  const emergencyRedDark = '#ff3333';
  const emergencyRedLight = '#cc0000';
  const recoveryGreenDark = '#33ff66';
  const recoveryGreenLight = '#009933';

  const getLogColor = (log: string): string => {
    if (emergencyState === 'emergency') {
      return isDark ? emergencyRedDark : emergencyRedLight;
    }
    if (emergencyState === 'recovery') {
      return isDark ? recoveryGreenDark : recoveryGreenLight;
    }
    // Normal state - color based on log level
    if (log.includes(' ERROR ')) return isDark ? '#ff6666' : '#cc0000';
    if (log.includes(' WARN ')) return isDark ? '#ffaa00' : '#aa6600';
    if (log.includes(' OK ')) return isDark ? '#33ff66' : '#009933';
    if (log.includes(' DEBUG ')) return isDark ? '#888888' : '#666666';
    // INFO - cyan/green accent
    return isDark ? '#00cccc' : '#008888';
  };

  // Styling based on state - more subtle when not focused
  const containerOpacity = isFocused ? 1 : (isDark ? 0.15 : 0.2);
  const bgColor = isDark ? 'rgba(17, 17, 17, 0.8)' : 'rgba(255, 255, 255, 0.85)';
  const borderColor = emergencyState === 'emergency'
    ? (isDark ? 'rgba(255, 51, 51, 0.5)' : 'rgba(204, 0, 0, 0.6)')
    : emergencyState === 'recovery'
      ? (isDark ? 'rgba(51, 255, 102, 0.5)' : 'rgba(0, 153, 51, 0.6)')
      : (isDark ? 'rgba(64, 64, 64, 0.3)' : 'rgba(180, 180, 180, 0.5)');

  const headerDotColor = isDark ? '#555' : '#ccc';

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-end justify-center pb-4">
      <div
        className="rounded-lg overflow-hidden"
        style={{
          width: '700px',
          height: '180px',
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          opacity: containerOpacity,
          transition: isFocused ? 'opacity 0.3s ease-in' : 'opacity 0.5s ease-out',
          boxShadow: emergencyState === 'emergency' && isFocused
            ? `0 0 20px ${isDark ? 'rgba(255, 51, 51, 0.3)' : 'rgba(204, 0, 0, 0.2)'}`
            : emergencyState === 'recovery' && isFocused
              ? `0 0 20px ${isDark ? 'rgba(51, 255, 102, 0.3)' : 'rgba(0, 153, 51, 0.2)'}`
              : 'none',
        }}
      >
        {/* macOS-style header with dots */}
        <div
          className="flex items-center gap-1.5 px-3 py-2"
          style={{
            borderBottom: `1px solid ${isDark ? 'rgba(64, 64, 64, 0.3)' : 'rgba(180, 180, 180, 0.5)'}`,
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: emergencyState === 'emergency' ? (isDark ? emergencyRedDark : emergencyRedLight) : headerDotColor }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: emergencyState === 'recovery' ? (isDark ? recoveryGreenDark : recoveryGreenLight) : headerDotColor }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: headerDotColor }}
          />
        </div>

        {/* Log content area */}
        <div
          className="relative overflow-hidden"
          style={{ height: 'calc(100% - 33px)' }}
        >
          {/* Scrolling log content */}
          <div
            ref={scrollContainerRef}
            className="font-mono text-[0.7rem] px-3"
            style={{
              willChange: 'transform',
            }}
          >
            {/* First copy */}
            <div style={{ lineHeight: '18px' }}>
              {formattedLogs.map((log, index) => (
                <div
                  key={`a-${index}`}
                  className="whitespace-nowrap"
                  style={{
                    color: getLogColor(log),
                    textShadow: isFocused && isDark && emergencyState !== 'normal'
                      ? `0 0 4px ${emergencyState === 'emergency' ? emergencyRedDark : recoveryGreenDark}`
                      : 'none',
                  }}
                >
                  {log}
                </div>
              ))}
            </div>
            {/* Second copy (identical) */}
            <div style={{ lineHeight: '18px' }}>
              {formattedLogs.map((log, index) => (
                <div
                  key={`b-${index}`}
                  className="whitespace-nowrap"
                  style={{
                    color: getLogColor(log),
                    textShadow: isFocused && isDark && emergencyState !== 'normal'
                      ? `0 0 4px ${emergencyState === 'emergency' ? emergencyRedDark : recoveryGreenDark}`
                      : 'none',
                  }}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
            style={{
              background: isDark
                ? 'linear-gradient(to top, rgba(17, 17, 17, 1) 0%, rgba(17, 17, 17, 0) 100%)'
                : 'linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
