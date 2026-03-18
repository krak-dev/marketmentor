import { useEffect, useState } from 'react';

export default function Cursor() {
  const [position, setPosition] = useState({ left: -100, top: -100 });

  useEffect(() => {
    const updatePosition = (e) => {
      setPosition({ left: e.clientX, top: e.clientY });
    };
    window.addEventListener('mousemove', updatePosition);
    return () => window.removeEventListener('mousemove', updatePosition);
  }, []);

  return (
    <div
      id="cursor"
      style={{
        position: 'fixed',
        width: '18px',
        height: '18px',
        background: '#111',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 999999,
        left: position.left,
        top: position.top,
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
      }}
    />
  );
}
