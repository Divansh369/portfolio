import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Copy, Globe, Mail, Phone } from 'lucide-react';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';
import FloodButton from './motion/FloodButton';
import TextScramble from './motion/TextScramble';

interface ContactProps {
  heading: string;
  message: string;
  email: string;
  phone: string;
}

export const Contact: React.FC<ContactProps> = ({ heading, message, email, phone }) => {
  const [copied, setCopied] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contact" className="py-24">
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mx-auto text-center"
      >
        <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
          <Mail className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Direct Contact</span>
        </span>
        <SplitText
          as="h2"
          text={heading}
          align="center"
          stagger={0.04}
          className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mb-4"
        />
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto mb-10">
          {message}
        </p>

        <GlassCard tilt={true} spotlight={true} brackets={true} chamfer={true} className="p-8 sm:p-10">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <FloodButton
                href={`mailto:${email}`}
                variant="primary"
                chamfer={true}
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] text-sm"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>{email}</span>
              </FloodButton>

              <FloodButton
                onClick={handleCopy}
                variant="glass"
                className="w-full sm:w-auto px-5 py-3 min-h-[44px] font-mono text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                    <span className="text-cyan-300">Copied Email</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                    <span>Copy Email</span>
                  </>
                )}
              </FloodButton>
            </div>

            <div className="pt-6 border-t border-white/[0.08] text-xs font-mono text-zinc-400 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {phone && (
                <>
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors tabular-nums"
                  >
                    <Phone className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                    <TextScramble text={phone} trigger="hover" durationMs={340} />
                  </a>
                  <span className="text-zinc-600" aria-hidden="true">
                    ·
                  </span>
                </>
              )}
              <span>Bengaluru, India</span>
              <span className="text-zinc-600" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                <span>diivvansh.com · fiorejoy.com</span>
              </span>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </section>
  );
};

export default Contact;