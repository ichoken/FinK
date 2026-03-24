// src/ProphetPortal.tsx
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

type ProphetPortalProps = {
    children: ReactNode;
    containerId?: string;
};

export function ProphetPortal({ children, containerId = 'prophet-portal' }: ProphetPortalProps) {
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        // body 直下に置く（祖先の transform 等の影響を受けない）
        document.body.appendChild(container);
    }
    return createPortal(children, container);
}