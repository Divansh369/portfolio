import React from 'react';
import Section from './Section';

interface Certificate {
    name: string;
    date: string;
}

interface CertificatesProps {
  certificates: Certificate[];
}

const Certificates: React.FC<CertificatesProps> = ({ certificates }) => {
  return (
    <Section title="Certificates" emoji="📜">
      <div className="p-6 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
        <ul className="space-y-3">
          {certificates.map((cert, index) => (
            <li key={index} className="flex justify-between items-center text-[var(--color-text-base)]">
              <span>{cert.name}</span>
              <span className="text-[var(--color-text-muted)] text-sm">{cert.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
};

export default Certificates;