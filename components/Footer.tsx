import React from 'react';

interface FooterProps {
  name: string;
}

const Footer: React.FC<FooterProps> = ({ name }) => {
  return (
    <footer className="py-8 text-center text-[var(--color-text-dark)]">
      <p>&copy; {new Date().getFullYear()} {name}. All rights reserved.</p>
    </footer>
  );
};

export default Footer;