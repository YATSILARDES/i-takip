import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  isSpeaking: boolean; // Is AI speaking
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, isSpeaking }) => {
  return (
    <div className="flex items-center justify-center h-12 w-full gap-1">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full transition-all duration-300 ease-in-out ${
            isActive 
              ? isSpeaking 
                ? 'bg-blue-400 animate-pulse-fast' 
                : 'bg-green-400 animate-pulse'
              : 'bg-slate-700 h-2'
          }`}
          style={{
            height: isActive ? `${Math.random() * 24 + 12}px` : '4px',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

export default Visualizer;