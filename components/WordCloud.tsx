import React, { useMemo } from 'react';

interface WordCloudProps {
  words: string[];
}

const WordCloud: React.FC<WordCloudProps> = ({ words }) => {
  const radius = 150;

  const tags = useMemo(() => {
    return words.map((word, i) => {
      const phi = Math.acos(-1 + (2 * i + 1) / words.length);
      const theta = Math.sqrt(words.length * Math.PI) * phi;
      
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      // Depth-based styling for a more pronounced 3D effect
      const scale = (z + radius) / (2 * radius) * 0.5 + 0.75; // Scale from 0.75 to 1.25
      const opacity = (z + radius) / (2 * radius) * 0.5 + 0.5; // Opacity from 0.5 to 1.0
      
      return {
        word,
        transform: `translate3d(-50%, -50%, 0) translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`,
        opacity,
      };
    });
  }, [words]);

  return (
    <div className="relative flex justify-center items-center w-full min-h-[350px] md:min-h-[400px]">
      <style>
        {`
          .word-cloud-sphere {
            transform-style: preserve-3d;
            animation: float-sphere 20s ease-in-out infinite;
          }
          @keyframes float-sphere {
            0% { transform: rotateY(0deg) rotateX(0deg) translate(0px, 0px); }
            25% { transform: rotateY(8deg) rotateX(-8deg) translate(8px, -15px); }
            50% { transform: rotateY(-8deg) rotateX(8deg) translate(-8px, 15px); }
            75% { transform: rotateY(8deg) rotateX(8deg) translate(15px, 8px); }
            100% { transform: rotateY(0deg) rotateX(0deg) translate(0px, 0px); }
          }
          .word-cloud-tag {
            transition: all 0.2s ease-in-out;
            will-change: transform, color, background-color, opacity;
          }
          .word-cloud-sphere:hover {
            animation-play-state: paused;
          }
          .word-cloud-sphere:hover .word-cloud-tag {
            opacity: 0.5 !important;
            background-color: var(--color-card);
            color: var(--color-text-muted);
          }
          .word-cloud-sphere:hover .word-cloud-tag:hover {
             opacity: 1 !important;
             color: var(--color-text-base) !important;
             background-color: var(--color-accent-600) !important;
          }
        `}
      </style>
      <div className="word-cloud-sphere w-[1px] h-[1px]">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="absolute top-1/2 left-1/2 bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-sm font-medium px-4 py-2 rounded-lg cursor-default word-cloud-tag whitespace-nowrap"
            style={{ 
              transform: tag.transform,
              opacity: tag.opacity,
            }}
          >
            {tag.word}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WordCloud;