'use client';

import React, { useEffect, useState, useCallback } from 'react';

type EmergencyState = 'normal' | 'emergency' | 'recovery';

// Normal operational logs - mixed with occasional warnings, errors, and successes
const normalLogs = [
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

// Emergency error logs
const emergencyLogs = [
  'ERROR DatabaseConnection connection refused host=db-primary-1 retries=3',
  'ERROR CircuitBreaker OPEN service=payment-api failures=15 threshold=10',
  'WARN  HealthCheck degraded service=auth-service latency_ms=2847',
  'ERROR RequestHandler timeout path=/api/checkout timeout_ms=30000',
  'ERROR MessageQueue consumer lag critical lag=45000 partition=3',
  'WARN  MemoryAlert heap usage critical used=94.7% threshold=90%',
  'ERROR SSLHandshake certificate verification failed host=api.vendor.io',
  'ERROR DatabaseConnection query timeout query=SELECT duration_ms=30000',
  'ERROR CircuitBreaker OPEN service=inventory-api failures=12 threshold=10',
  'WARN  CPUAlert load average critical load=8.7 threshold=4.0',
  'ERROR RequestHandler connection reset path=/api/orders client=10.0.0.45',
  'ERROR ReplicationLag primary-replica lag exceeded lag_ms=15000 max=5000',
  'WARN  DiskAlert usage critical partition=/data used=97.2% threshold=90%',
  'ERROR ConnectionPool exhausted pool_size=100 waiting=47',
  'ERROR ServiceMesh endpoint unhealthy service=recommendation failures=8',
  'WARN  RateLimiter threshold exceeded client=api-key-xyz requests=1500',
];

// Recovery success logs
const recoveryLogs = [
  'INFO  CircuitBreaker CLOSED service=payment-api recovery_time_ms=12400',
  'INFO  DatabaseConnection reconnected host=db-primary-1 pool_restored=true',
  'INFO  HealthCheck healthy service=auth-service latency_ms=45',
  'INFO  RequestHandler backlog cleared pending=0 processed=847',
  'INFO  MessageQueue consumer caught up lag=0 partition=3',
  'INFO  MemoryAlert resolved used=67.2% gc_freed_mb=1240',
  'INFO  ServiceMesh all endpoints healthy count=24 region=us-east-1',
  'INFO  CircuitBreaker CLOSED service=inventory-api recovery_time_ms=8200',
  'INFO  CPUAlert resolved load=1.2 processes_terminated=3',
  'INFO  ReplicationLag resolved lag_ms=120 sync_complete=true',
  'INFO  DiskAlert resolved partition=/data used=72.1% cleaned_gb=45',
  'INFO  ConnectionPool restored pool_size=100 active=12',
  'INFO  SSLHandshake certificate renewed host=api.vendor.io valid_days=365',
  'INFO  RateLimiter reset client=api-key-xyz quota_restored=true',
  'INFO  CacheManager warmed key_count=15000 duration_ms=2340',
  'INFO  LoadBalancer all backends healthy count=5 region=us-east-1',
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

  if (!shouldRender) return null;

  // Select logs based on emergency state
  const logs = emergencyState === 'emergency' ? emergencyLogs :
               emergencyState === 'recovery' ? recoveryLogs : normalLogs;

  // Duplicate logs for seamless scrolling
  const formattedLogs = logs.map((log, i) => formatLogEntry(log, i));
  const duplicatedLogs = [...formattedLogs, ...formattedLogs];

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
            className="font-mono text-[0.7rem] px-3"
            style={{
              animation: `scrollLogs ${
                emergencyState === 'emergency'
                  ? (isFocused ? '12s' : '35s')
                  : (isFocused ? '18s' : '60s')
              } linear infinite`,
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
