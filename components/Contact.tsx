

import React from 'react';
import Section from './Section';

interface ContactProps {
  heading: string;
  message: string;
  email: string;
  phone: string;
}

const Contact: React.FC<ContactProps> = ({ heading, message, email, phone }) => {
  return (
    <Section title={heading} emoji="📨">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-lg text-[var(--color-text-muted)] mb-8">{message}</p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-12 mb-10 text-lg">
          <a href={`mailto:${email}`} className="flex items-center gap-3 text-[var(--color-text-muted)] hover:text-[var(--color-accent-400)] transition-colors duration-300 group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-accent-500)] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{email}</span>
          </a>
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-[var(--color-text-muted)] hover:text-[var(--color-accent-400)] transition-colors duration-300 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-accent-500)] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{phone}</span>
            </a>
          )}
        </div>
      </div>
    </Section>
  );
};

export default Contact;