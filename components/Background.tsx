import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-50 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[var(--color-bg)]" />
      <div
        className="aurora-bg"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '150vw',
          height: '150vh',
        }}
      >
        <div className="aurora-shape-1" />
        <div className="aurora-shape-2" />
        <div className="aurora-shape-3" />
      </div>
    </div>
  );
};

export default Background;
