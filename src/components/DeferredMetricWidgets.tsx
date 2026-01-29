'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Lazy load the metric widgets component
const MetricWidgets = dynamic(
    () => import('@/components/MetricWidgets'),
    { ssr: false }
);

/**
 * Defers loading of the metric widgets until after initial paint.
 * This prevents the widgets from blocking the main thread during page load,
 * improving Total Blocking Time (TBT) and other Core Web Vitals.
 */
export default function DeferredMetricWidgets() {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Wait for the browser to be idle before loading the widgets
        // This ensures the main content is painted first
        if ('requestIdleCallback' in window) {
            const id = requestIdleCallback(
                () => setShouldRender(true),
                { timeout: 2000 } // Fallback timeout of 2 seconds
            );
            return () => cancelIdleCallback(id);
        } else {
            // Fallback for browsers without requestIdleCallback (Safari)
            const timer = setTimeout(() => setShouldRender(true), 300);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!shouldRender) {
        return null;
    }

    return <MetricWidgets />;
}

