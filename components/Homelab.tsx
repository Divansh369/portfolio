import React from 'react';
import { motion } from 'framer-motion';
import Section from './Section';
import { HomelabDevice, VM, Platform } from '../types';

interface HomelabProps {
  devices: HomelabDevice[];
  vms: VM[];
  platforms: Platform[];
}

// SVG Icons for specs
const CpuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3M5.636 5.636l-1.414-1.414m15.152 15.152l-1.414-1.414M18.364 5.636l-1.414 1.414m-12.728 12.728l-1.414 1.414" /></svg>;
const RamIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4h14V3M5 11h14M5 19v-4h14v4H5z" /></svg>;
const GpuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const StorageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>;


const Homelab: React.FC<HomelabProps> = ({ devices, vms, platforms }) => {
  const serverNodes = devices.filter(d => ['PVE Node', 'PBS'].includes(d.type));
  const personalMachines = devices.filter(d => d.type === 'Personal Laptop');

  return (
    <Section title="My Homelab" emoji="🔧">
      <motion.div
        className="max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-lg text-[var(--color-text-muted)] mb-10">
          I run a modest yet powerful homelab using repurposed laptops, forming a Proxmox cluster for virtualization and containerization. This setup is my playground for exploring self-hosting, networking, and automation, giving me hands-on experience with real-world infrastructure challenges.
        </p>
      </motion.div>

      {/* Server Cluster */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-6 text-[var(--color-text-base)] text-center">Proxmox Server Cluster</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {serverNodes.map((device, index) => (
            <motion.div
              key={device.hostname}
              className="p-6 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] interactive-glow flex flex-col"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h4 className="text-xl font-bold text-[var(--color-accent-400)] text-center">{device.hostname}</h4>
              <p className="text-center text-sm text-[var(--color-text-muted)] mb-4">{device.type}</p>
              <div className="space-y-3 text-sm flex-grow">
                <div className="flex items-start gap-3"><CpuIcon /><span className="text-[var(--color-text-base)]">{device.cpu}</span></div>
                <div className="flex items-start gap-3"><RamIcon /><span className="text-[var(--color-text-base)]">{device.ram}</span></div>
                <div className="flex items-start gap-3"><GpuIcon /><span className="text-[var(--color-text-base)]">{device.gpu}</span></div>
                <div className="flex items-start gap-3"><StorageIcon /><span className="text-[var(--color-text-base)]">{device.storage}</span></div>
              </div>
              {device.url && (
                <a 
                    href={`${device.url}?username=viewer@pve`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-4 text-center text-sm project-button project-button-visit w-full justify-center"
                >
                  Access Panel
                </a>
              )}
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-6 p-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg">
          <p className="text-[var(--color-text-base)]">The links above pre-fill the read-only username.</p>
          <p className="text-[var(--color-text-base)]">The username is 'viewer' and realm to be selected is 'Proxmox VE authentication server'</p>
          <p className="text-sm text-[var(--color-text-muted)]">Just enter the password: <code className="bg-[var(--color-border)] px-1 rounded">readonly</code></p>
        </div>
      </div>

      {/* Other Machines */}
      <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-[var(--color-text-base)] text-center">Personal Powerhouse</h3>
          <div className="max-w-2xl mx-auto">
              {personalMachines.map((device, index) => (
                  <motion.div
                      key={device.hostname}
                      className="p-6 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] interactive-glow"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                      <h4 className="text-xl font-bold text-[var(--color-accent-400)]">{device.hostname}</h4>
                      <p className="text-sm text-[var(--color-text-muted)] mb-4">{device.notes}</p>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-3"><CpuIcon /><span className="text-[var(--color-text-base)]">{device.cpu}</span></div>
                          <div className="flex items-center gap-3"><RamIcon /><span className="text-[var(--color-text-base)]">{device.ram}</span></div>
                          <div className="flex items-center gap-3"><GpuIcon /><span className="text-[var(--color-text-base)]">{device.gpu}</span></div>
                          <div className="flex items-center gap-3"><StorageIcon /><span className="text-[var(--color-text-base)]">{device.storage}</span></div>
                      </div>
                  </motion.div>
              ))}
          </div>
      </div>


      {/* Infrastructure & Management */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h3 className="text-2xl font-semibold mb-4 text-[var(--color-text-base)]">Networking & Deployment</h3>
          <ul className="space-y-3 list-disc list-inside text-[var(--color-text-muted)]">
            <li><strong>Tailscale:</strong> Creates a secure mesh network connecting all my devices, allowing seamless and safe communication regardless of their physical location.</li>
            <li><strong>Cloudflare Tunnels:</strong> Exposes my self-hosted services to the internet securely without opening any ports on my firewall, managed through my domains.</li>
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h3 className="text-2xl font-semibold mb-4 text-[var(--color-text-base)]">Monitoring & Automation</h3>
          <ul className="space-y-3 list-disc list-inside text-[var(--color-text-muted)]">
            <li><strong>Beszel Monitoring:</strong> A custom monitoring solution to keep an eye on system health, resource usage, and performance across the cluster.</li>
            <li><strong>Home Assistant:</strong> Manages the battery charge cycles of the server laptops, preventing overcharging and extending their battery lifespan.</li>
          </ul>
        </motion.div>
      </div>
      
      {/* Platforms & Orchestration */}
       <div>
          <h3 className="text-2xl font-bold mb-6 text-[var(--color-text-base)] text-center">Platforms & Orchestration</h3>
          <p className="text-center text-[var(--color-text-muted)] mb-8 max-w-3xl mx-auto">
              I actively experiment with and host various platforms for container management, PaaS, and home automation to streamline development and deployment.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 text-center">
            {platforms.map((platform, index) => (
                <motion.div
                key={index}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] interactive-glow"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.1, y: -5 }}
                >
                <img
                    src={platform.logo.includes('/') ? platform.logo : `https://cdn.simpleicons.org/${platform.logo}/FFFFFF`}
                    alt={`${platform.name} logo`}
                    className="h-10 w-10 md:h-12 md:w-12 object-contain mb-2"
                />
                <p className="text-xs md:text-sm font-medium text-[var(--color-text-muted)]">{platform.name}</p>
                </motion.div>
            ))}
        </div>
      </div>
    </Section>
  );
};

export default Homelab;