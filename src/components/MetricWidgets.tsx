'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

// Use same cyberpunk colors as HexagonBloomBackground
const cyberpunkColors = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#00ff00', // Green
  '#ffff00', // Yellow
  '#ff0080', // Pink
  '#0080ff', // Blue
  '#80ff00', // Lime
  '#ff8000', // Orange
];

// Generate random sparkline data
const generateSparklineData = (points: number = 20): number[] => {
  const data: number[] = [];
  let value = Math.random() * 50 + 25;
  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.5) * 15;
    value = Math.max(5, Math.min(95, value));
    data.push(value);
  }
  return data;
};

// Sparkline chart component
function Sparkline({ data, color, width = 80, height = 24, isFocused = false }: { 
  data: number[]; 
  color: string; 
  width?: number; 
  height?: number;
  isFocused?: boolean;
}) {
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (value / 100) * height;
    return `${x},${y}`;
  }).join(' ');

  const opacity = isFocused ? 0.85 : 0.35;
  const glowSize = isFocused ? 4 : 1;

  return (
    <svg width={width} height={height} style={{ opacity, transition: 'opacity 0.5s ease' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        className="drop-shadow-sm"
        style={{ filter: `drop-shadow(0 0 ${glowSize}px ${color})`, transition: 'filter 0.5s ease' }}
      />
    </svg>
  );
}

// Mini bar chart component
function MiniBarChart({ values, color, width = 60, height = 20, isFocused = false }: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
  isFocused?: boolean;
}) {
  const barWidth = (width / values.length) - 2;
  const baseOpacity = isFocused ? 0.85 : 0.35;
  const glowSize = isFocused ? 4 : 1;
  
  return (
    <svg width={width} height={height} style={{ opacity: baseOpacity, transition: 'opacity 0.5s ease' }}>
      {values.map((value, index) => {
        const barHeight = (value / 100) * height;
        const x = index * (barWidth + 2);
        const y = height - barHeight;
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={color}
            opacity={0.7 + (value / 100) * 0.3}
            style={{ filter: `drop-shadow(0 0 ${glowSize}px ${color})`, transition: 'filter 0.5s ease' }}
          />
        );
      })}
    </svg>
  );
}

// Circular gauge component
function CircularGauge({ value, color, size = 32, isFocused = false }: {
  value: number;
  color: string;
  size?: number;
  isFocused?: boolean;
}) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const opacity = isFocused ? 0.85 : 0.35;
  const glowSize = isFocused ? 5 : 1;

  return (
    <svg width={size} height={size} className="-rotate-90" style={{ opacity, transition: 'opacity 0.5s ease' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.2}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 ${glowSize}px ${color})`, transition: 'filter 0.5s ease' }}
      />
    </svg>
  );
}

// Emergency state type
type EmergencyState = 'normal' | 'emergency' | 'recovery';

// Individual metric widget
interface MetricWidgetProps {
  type: 'sparkline' | 'bars' | 'gauge' | 'counter' | 'status';
  label: string;
  color: string;
  delay?: number;
  isFocused?: boolean;
  emergencyState?: EmergencyState;
}

const EMERGENCY_RED = '#ff3333';
const RECOVERY_GREEN = '#33ff66';

function MetricWidget({ type, label, color, delay = 0, isFocused = false, emergencyState = 'normal' }: MetricWidgetProps) {
  const [data, setData] = useState<number[]>(() => generateSparklineData());
  const [value, setValue] = useState(() => Math.floor(Math.random() * 80) + 10);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Stagger appearance
    const appearTimeout = setTimeout(() => setVisible(true), delay);

    // Update data periodically
    intervalRef.current = setInterval(() => {
      if (type === 'sparkline') {
        setData(prev => {
          const newData = [...prev.slice(1)];
          let newValue = prev[prev.length - 1] + (Math.random() - 0.5) * 20;
          newValue = Math.max(5, Math.min(95, newValue));
          newData.push(newValue);
          return newData;
        });
      } else if (type === 'bars') {
        setData(Array.from({ length: 6 }, () => Math.random() * 80 + 10));
      } else if (type === 'gauge' || type === 'counter') {
        setValue(prev => {
          const change = (Math.random() - 0.5) * 10;
          return Math.max(0, Math.min(100, prev + change));
        });
      }
    }, 1500 + Math.random() * 1000);

    return () => {
      clearTimeout(appearTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [delay, type]);

  // Determine effective color based on emergency state
  const effectiveColor = emergencyState === 'emergency' ? EMERGENCY_RED : 
                         emergencyState === 'recovery' ? RECOVERY_GREEN : color;

  // Muted vs focused styling - emergency always shows at full intensity
  const isActive = isFocused || emergencyState !== 'normal';
  const containerOpacity = isActive ? 1 : 0.4;
  const textOpacity = isActive ? 0.7 : 0.4;

  // Emergency border styling
  const borderColor = emergencyState === 'emergency' ? 'border-red-500/50' : 
                      emergencyState === 'recovery' ? 'border-green-500/50' : 'border-neutral-700/20';
  const bgColor = emergencyState === 'emergency' ? 'bg-red-950/40' : 
                  emergencyState === 'recovery' ? 'bg-green-950/40' : 'bg-neutral-900/30';

  return (
    <div 
      className={`
        flex flex-col gap-1 p-2 rounded-md
        backdrop-blur-sm border
        transition-all duration-300 ease-out
        ${visible ? 'translate-y-0' : 'opacity-0 translate-y-2'}
        ${borderColor} ${bgColor}
        ${emergencyState === 'emergency' ? 'animate-pulse' : ''}
      `}
      style={{ 
        minWidth: type === 'sparkline' ? 100 : 70,
        opacity: visible ? containerOpacity : 0,
        transition: 'opacity 0.3s ease, transform 0.5s ease, background-color 0.3s ease, border-color 0.3s ease'
      }}
    >
      <span 
        className="text-[9px] font-mono uppercase tracking-wider truncate transition-all duration-300"
        style={{ 
          opacity: textOpacity,
          color: emergencyState === 'emergency' ? EMERGENCY_RED : 
                 emergencyState === 'recovery' ? RECOVERY_GREEN : undefined
        }}
      >
        {emergencyState === 'emergency' ? '⚠ ' + label : label}
      </span>
      
      {type === 'sparkline' && (
        <Sparkline data={data} color={effectiveColor} width={80} height={20} isFocused={isActive} />
      )}
      
      {type === 'bars' && (
        <MiniBarChart values={data.slice(0, 6)} color={effectiveColor} width={56} height={18} isFocused={isActive} />
      )}
      
      {type === 'gauge' && (
        <div className="flex items-center gap-2">
          <CircularGauge value={value} color={effectiveColor} size={28} isFocused={isActive} />
          <span 
            className="text-[10px] font-mono transition-all duration-300"
            style={{ 
              color: effectiveColor, 
              textShadow: isActive ? `0 0 6px ${effectiveColor}` : 'none',
              opacity: isActive ? 1 : 0.5
            }}
          >
            {emergencyState === 'emergency' ? 'CRIT' : Math.round(value) + '%'}
          </span>
        </div>
      )}
      
      {type === 'counter' && (
        <span 
          className="text-sm font-mono font-medium transition-all duration-300"
          style={{ 
            color: effectiveColor, 
            textShadow: isActive ? `0 0 6px ${effectiveColor}` : 'none',
            opacity: isActive ? 1 : 0.5
          }}
        >
          {emergencyState === 'emergency' ? '!ERR' : value.toFixed(1) + 'k'}
        </span>
      )}
      
      {type === 'status' && (
        <div className="flex items-center gap-1.5">
          <span 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${emergencyState === 'emergency' || isActive ? 'animate-pulse' : ''}`}
            style={{ 
              backgroundColor: effectiveColor, 
              boxShadow: isActive ? `0 0 8px ${effectiveColor}` : `0 0 2px ${effectiveColor}`,
              opacity: isActive ? 1 : 0.5
            }}
          />
          <span 
            className="text-[10px] font-mono transition-all duration-300"
            style={{ 
              opacity: isActive ? 0.8 : 0.4,
              color: emergencyState === 'emergency' ? EMERGENCY_RED : 
                     emergencyState === 'recovery' ? RECOVERY_GREEN : undefined
            }}
          >
            {emergencyState === 'emergency' ? 'ALERT!' : 
             emergencyState === 'recovery' ? 'OK' : 
             (value > 50 ? 'healthy' : 'degraded')}
          </span>
        </div>
      )}
    </div>
  );
}

// Widget configuration for left and right panels
const leftWidgets: MetricWidgetProps[] = [
  { type: 'sparkline', label: 'req/sec', color: cyberpunkColors[0] },
  { type: 'gauge', label: 'cpu', color: cyberpunkColors[2] },
  { type: 'bars', label: 'throughput', color: cyberpunkColors[1] },
  { type: 'status', label: 'api-gw', color: cyberpunkColors[2] },
  { type: 'counter', label: 'events', color: cyberpunkColors[5] },
  { type: 'sparkline', label: 'latency', color: cyberpunkColors[4] },
  { type: 'gauge', label: 'memory', color: cyberpunkColors[6] },
  { type: 'status', label: 'redis', color: cyberpunkColors[2] },
];

const rightWidgets: MetricWidgetProps[] = [
  { type: 'gauge', label: 'uptime', color: cyberpunkColors[2] },
  { type: 'sparkline', label: 'errors', color: cyberpunkColors[4] },
  { type: 'status', label: 'postgres', color: cyberpunkColors[2] },
  { type: 'counter', label: 'users', color: cyberpunkColors[0] },
  { type: 'bars', label: 'queue', color: cyberpunkColors[7] },
  { type: 'sparkline', label: 'io/sec', color: cyberpunkColors[3] },
  { type: 'status', label: 'k8s', color: cyberpunkColors[2] },
  { type: 'gauge', label: 'disk', color: cyberpunkColors[5] },
];

export default function MetricWidgets() {
  const [shouldRender, setShouldRender] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [emergencyState, setEmergencyState] = useState<EmergencyState>('normal');
  
  const checkScreenSize = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Only render on wide screens (aspect ratio > 1.4 and width > 1200px)
    // This excludes mobile, tablets, and square-ish monitors
    const isWideScreen = width > 1200 && (width / height) > 1.4;
    setShouldRender(isWideScreen);
  }, []);

  useEffect(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [checkScreenSize]);

  // Listen for animation-focus class on document element (same as HexagonServiceNetwork)
  useEffect(() => {
    const checkFocusClass = () => {
      setIsFocused(document.documentElement.classList.contains('animation-focus'));
    };
    
    checkFocusClass();
    
    // Watch for class changes on the document element
    const observer = new MutationObserver(checkFocusClass);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Listen for emergency events from HexagonServiceNetwork
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

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Left panel */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 max-h-[80vh] overflow-hidden">
        {leftWidgets.map((widget, index) => (
          <MetricWidget
            key={`left-${index}`}
            {...widget}
            delay={index * 150}
            isFocused={isFocused}
            emergencyState={emergencyState}
          />
        ))}
      </div>

      {/* Right panel */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 max-h-[80vh] overflow-hidden">
        {rightWidgets.map((widget, index) => (
          <MetricWidget
            key={`right-${index}`}
            {...widget}
            delay={index * 150 + 100}
            isFocused={isFocused}
            emergencyState={emergencyState}
          />
        ))}
      </div>
    </div>
  );
}
