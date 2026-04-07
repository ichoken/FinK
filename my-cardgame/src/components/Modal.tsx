import React from 'react';

interface ModalProps {
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
    width?: string;
}

export function Modal({ title, children, onClose, width = 'min(600px, 90%)' }: ModalProps) {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 200,
            }}
        >
            <div
                style={{
                    background: 'rgba(20,20,40,0.95)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    width,
                    color: '#fff',
                    textShadow: '0 3px 10px rgba(0,0,0,0.8)',
                }}
            >
                {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}

                <div style={{ marginTop: '1rem' }}>{children}</div>

                {onClose && (
                    <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                        <button onClick={onClose}>閉じる</button>
                    </div>
                )}
            </div>
        </div>
    );
}