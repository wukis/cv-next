'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ConsoleEasterEgg = dynamic(
    () => import('@/components/ConsoleEasterEgg').then(mod => ({ default: mod.ConsoleEasterEgg })),
    { ssr: false }
);

export default function DeferredConsoleEasterEgg() {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if ('requestIdleCallback' in window) {
            const id = requestIdleCallback(
                () => setShouldRender(true),
                { timeout: 3000 }
            );
            return () => cancelIdleCallback(id);
        } else {
            const timer = setTimeout(() => setShouldRender(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!shouldRender) {
        return null;
    }

    return <ConsoleEasterEgg />;
}
