'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Lazy load the heavy canvas animation component
const HexagonServiceNetwork = dynamic(
    () => import('@/components/HexagonServiceNetwork'),
    { ssr: false }
);

/**
 * Defers loading of the background animation until after initial paint.
 * This prevents the animation from blocking the main thread during page load,
 * improving Total Blocking Time (TBT) and other Core Web Vitals.
 */
export default function DeferredBackground() {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Wait for the browser to be idle before loading the animation
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

    return <HexagonServiceNetwork />;
}
