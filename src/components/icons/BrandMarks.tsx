import React from 'react';
import RepoImage from '../common/RepoImage';
import { useMediaRegistry } from '../../context/MediaRegistryContext';

export type BrandKey =
  | 'asus'
  | 'amd'
  | 'intel'
  | 'nvidia'
  | 'ram'
  | 'nvme'
  | 'proxmox'
  | 'docker'
  | 'kubernetes'
  | 'rancher'
  | 'talos'
  | 'casaos'
  | 'easypanel'
  | 'coolify'
  | 'homeassistant'
  | 'nginx'
  | 'traefik'
  | 'metallb'
  | 'tailscale'
  | 'cloudflare'
  | 'nocodb'
  | 'gotify'
  | 'linux'
  | 'debian'
  | 'kali'
  | 'alpine'
  | 'python'
  | 'apache'
  | 'spark'
  | 'databricks'
  | 'fastapi'
  | 'flutter'
  | 'dart'
  | 'react'
  | 'nodejs'
  | 'typescript'
  | 'javascript'
  | 'postgresql'
  | 'powerbi'
  | 'cpp'
  | 'cuda'
  | 'java'
  | 'html5'
  | 'css3'
  | 'bash'
  | 'git'
  | 'tensorflow'
  | 'pytorch'
  | 'scikit'
  | 'pandas'
  | 'numpy'
  | 'raspberrypi'
  | 'aws'
  | 'go'
  | 'godot'
  | 'redis'
  | 'minio'
  | 'ms'
  | 'github'
  | 'linkedin'
  | 'gmail'
  | 'instagram'
  | 'googleplay'
  | 'automotive'
  | 'ngo'
  | 'semiconductor'
  | 'analytics'
  | 'university'
  | 'school'
  | 'generic';

interface BrandMarkProps {
  brand: BrandKey | string;
  className?: string;
}

export const normalizeBrandKey = (raw: string): BrandKey => {
  const s = raw.toLowerCase().trim();
  if (s.includes('asus') || s.includes('rog')) return 'asus';
  if (s.includes('amd') || s.includes('ryzen')) return 'amd';
  if (s.includes('intel')) return 'intel';
  if (s.includes('nvidia') || s.includes('geforce') || s.includes('rtx')) return 'nvidia';
  if (s.includes('ddr') || s.includes('ram') || s.includes('memory')) return 'ram';
  if (s.includes('nvme') || s.includes('ssd') || s.includes('storage')) return 'nvme';

  if (s.includes('proxmox') || s.includes('pve') || s.includes('pbs')) return 'proxmox';
  if (s.includes('docker')) return 'docker';
  if (s.includes('k3s') || s.includes('kubernetes') || s.includes('k8s')) return 'kubernetes';
  if (s.includes('rancher')) return 'rancher';
  if (s.includes('talos')) return 'talos';
  if (s.includes('casaos') || s.includes('casa')) return 'casaos';
  if (s.includes('easypanel')) return 'easypanel';
  if (s.includes('coolify')) return 'coolify';
  if (s.includes('home assistant')) return 'homeassistant';
  if (s.includes('nginx')) return 'nginx';
  if (s.includes('traefik')) return 'traefik';
  if (s.includes('metallb')) return 'metallb';
  if (s.includes('tailscale') || s.includes('wireguard')) return 'tailscale';
  if (s.includes('cloudflare')) return 'cloudflare';
  if (s.includes('nocodb')) return 'nocodb';
  if (s.includes('gotify')) return 'gotify';
  if (s.includes('debian')) return 'debian';
  if (s.includes('kali')) return 'kali';
  if (s.includes('alpine')) return 'alpine';
  if (s.includes('linux')) return 'linux';

  if (s.includes('databricks')) return 'databricks';
  if (s.includes('spark')) return 'spark';
  if (s.includes('apache')) return 'apache';
  if (s.includes('fastapi')) return 'fastapi';
  if (s.includes('flutter')) return 'flutter';
  if (s.includes('dart')) return 'dart';
  if (s.includes('python')) return 'python';
  if (s.includes('cuda')) return 'cuda';
  if (s.includes('c++') || s.includes('cpp')) return 'cpp';
  if (s.includes('postgres') || s === 'sql' || s.includes('sql ')) return 'postgresql';
  if (s.includes('power bi') || s.includes('powerbi')) return 'powerbi';
  if (s.includes('typescript')) return 'typescript';
  if (s.includes('javascript') || s === 'js') return 'javascript';
  if (s.includes('react')) return 'react';
  if (s.includes('node')) return 'nodejs';
  if (s.includes('java')) return 'java';
  if (s.includes('html')) return 'html5';
  if (s.includes('css')) return 'css3';
  if (s.includes('bash') || s.includes('shell')) return 'bash';
  if (s === 'git' || s.includes('git ')) return 'git';
  if (s.includes('tensorflow') || s.includes('keras')) return 'tensorflow';
  if (s.includes('pytorch')) return 'pytorch';
  if (s.includes('scikit')) return 'scikit';
  if (s.includes('pandas')) return 'pandas';
  if (s.includes('numpy')) return 'numpy';
  if (s.includes('raspberry')) return 'raspberrypi';
  if (s.includes('aws')) return 'aws';
  if (s.includes('godot')) return 'godot';
  if (s === 'go' || s.startsWith('go ')) return 'go';
  if (s.includes('redis')) return 'redis';
  if (s.includes('minio')) return 'minio';
  if (s.includes('microsoft') || s.includes('office') || s.includes('excel')) return 'ms';

  if (s.includes('github')) return 'github';
  if (s.includes('linkedin')) return 'linkedin';
  if (s.includes('gmail') || s === 'email' || s === 'mail') return 'gmail';
  if (s.includes('instagram')) return 'instagram';
  if (s.includes('play')) return 'googleplay';

  if (s.includes('automotive') || s.includes('truck') || s.includes('vehicle') || s.includes('mobility')) return 'automotive';
  if (s.includes('ngo') || s.includes('volunteer') || s.includes('foundation') || s.includes('nonprofit')) return 'ngo';
  if (s.includes('semiconductor') || s.includes('silicon') || s.includes('chip')) return 'semiconductor';
  if (s.includes('analytics') || s.includes('research') || s.includes('data science')) return 'analytics';
  if (s.includes('university') || s.includes('institute') || s.includes('college') || s.includes('b.tech') || s.includes('b.s')) return 'university';
  if (s.includes('school') || s.includes('academy') || s.includes('high school')) return 'school';

  return 'generic';
};

const BrandSvgFallback: React.FC<{ brandKey: BrandKey; className: string }> = ({
  brandKey: key,
  className,
}) => {
  switch (key) {
    /* -------------------- HARDWARE BRANDS -------------------- */
    case 'asus':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M2.5 14.5L9.5 6.5H15L11.5 10.5H21.5L15 17.5H9.2L12.6 13.8H6.8L4.2 17.5H2L2.5 14.5Z"
            fill="#F43F5E"
          />
          <path d="M13 6.5L18.8 6.5L21.5 9.2H15.6L13 6.5Z" fill="#FB7185" />
        </svg>
      );
    case 'amd':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M3 4H20V21L15 16V9H8L3 4Z" fill="#EF4444" />
          <path d="M3 12.2L8.2 7V15.8H17L11.8 21H3V12.2Z" fill="#FCA5A5" opacity="0.85" />
        </svg>
      );
    case 'intel':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="2.5" y="5.5" width="19" height="13" rx="3" stroke="#38BDF8" strokeWidth="1.7" />
          <circle cx="6.8" cy="9.2" r="1.1" fill="#38BDF8" />
          <rect x="6" y="11.4" width="1.6" height="4.4" rx="0.5" fill="#E0F2FE" />
          <path
            d="M10.2 15.8V11.4H11.8V12.1C12.2 11.6 12.8 11.3 13.5 11.3C14.7 11.3 15.4 12.1 15.4 13.4V15.8H13.8V13.6C13.8 12.9 13.4 12.5 12.8 12.5C12.2 12.5 11.8 12.9 11.8 13.6V15.8H10.2ZM17 9.4H18.6V15.8H17V9.4Z"
            fill="#E0F2FE"
          />
        </svg>
      );
    case 'nvidia':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M3 12.2C5.4 8.5 9.1 6.7 13.2 7.2C16.7 7.6 19.6 9.8 21 12.2C19.2 15 16 17.2 12.3 17.2C8.9 17.2 6.2 15.2 4.7 12.6C6.4 10.6 9.1 9.4 12.1 9.6C14.8 9.8 16.9 11.2 18.1 12.6C16.7 14.3 14.5 15.3 12.1 15.1C9.9 14.9 8.2 13.6 7.4 12.2C8.5 11.1 10.1 10.5 11.8 10.7C13.3 10.9 14.4 11.7 15 12.5"
            stroke="#76B900"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="11.8" cy="12.4" r="1.4" fill="#A3E635" />
        </svg>
      );
    case 'ram':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="2.5" y="7" width="19" height="8" rx="1.5" stroke="#38BDF8" strokeWidth="1.6" />
          <rect x="5" y="9.2" width="3" height="3.6" rx="0.4" fill="#7DD3FC" />
          <rect x="10.5" y="9.2" width="3" height="3.6" rx="0.4" fill="#7DD3FC" />
          <rect x="16" y="9.2" width="3" height="3.6" rx="0.4" fill="#7DD3FC" />
          <path d="M5 15V17.5M8.5 15V17.5M12 15V17.5M15.5 15V17.5M19 15V17.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'nvme':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="6.5" width="18" height="11" rx="1.5" stroke="#22D3EE" strokeWidth="1.6" />
          <rect x="6" y="9.2" width="4.5" height="5.5" rx="0.5" fill="#38BDF8" />
          <rect x="12" y="9.2" width="6" height="5.5" rx="0.5" stroke="#94A3B8" strokeWidth="1.2" />
          <path d="M3 10.5H1.5M3 13.5H1.5" stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    /* -------------------- FOSS & INFRASTRUCTURE -------------------- */
    case 'proxmox':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4 6L12 12L4 18" stroke="#F97316" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 6L12 12L20 18" stroke="#F97316" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 4L12 8L16.5 4" stroke="#E2E8F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 20L12 16L16.5 20" stroke="#E2E8F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'docker':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4 13.5H18.5C19.6 13.5 20.5 12.7 21 11.6C20.2 11 19.1 11.1 18.5 11.5C18.3 10.3 17.5 9.4 16.5 9C16.1 10.1 16.2 11.2 16.6 12H4V13.5ZM4 13.5C3.5 16.8 6.2 19 10.6 19C15.5 19 19 16.4 19.8 13.5"
            stroke="#38BDF8"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <rect x="6" y="10" width="2.4" height="2" fill="#38BDF8" />
          <rect x="9.3" y="10" width="2.4" height="2" fill="#38BDF8" />
          <rect x="12.6" y="10" width="2.4" height="2" fill="#38BDF8" />
          <rect x="9.3" y="7.2" width="2.4" height="2" fill="#7DD3FC" />
          <rect x="12.6" y="7.2" width="2.4" height="2" fill="#7DD3FC" />
        </svg>
      );
    case 'kubernetes':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon
            points="12,2.5 19.6,6.2 21.4,14.4 16.2,20.8 7.8,20.8 2.6,14.4 4.4,6.2"
            stroke="#3B82F6"
            strokeWidth="1.6"
            fill="#1E3A8A"
            fillOpacity="0.35"
          />
          <circle cx="12" cy="12" r="3" stroke="#E0F2FE" strokeWidth="1.5" />
          <path
            d="M12 5.2V9M12 15V18.8M6.2 8.7L9.4 10.6M14.6 13.4L17.8 15.3M17.8 8.7L14.6 10.6M9.4 13.4L6.2 15.3"
            stroke="#E0F2FE"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'rancher':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4 9C4 7.5 5.2 6.5 6.5 7.5L8.2 9.5H15.8L17.5 7.5C18.8 6.5 20 7.5 20 9V11.5L17.5 13.5V17.5H6.5V13.5L4 11.5V9Z"
            fill="#0284C7"
            stroke="#7DD3FC"
            strokeWidth="1.3"
          />
          <circle cx="9.5" cy="13" r="1" fill="#F8FAFC" />
          <circle cx="14.5" cy="13" r="1" fill="#F8FAFC" />
        </svg>
      );
    case 'talos':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon points="12,3 20.5,8 20.5,16 12,21 3.5,16 3.5,8" stroke="#FB923C" strokeWidth="1.7" fill="#FB923C" fillOpacity="0.14" />
          <path d="M7.5 9.5H16.5M12 9.5V17" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'casaos':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4 11L12 4.5L20 11V19C20 19.6 19.6 20 19 20H5C4.4 20 4 19.6 4 19V11Z" stroke="#38BDF8" strokeWidth="1.7" fill="#0EA5E9" fillOpacity="0.16" />
          <circle cx="12" cy="13.5" r="2.8" stroke="#F8FAFC" strokeWidth="1.6" />
        </svg>
      );
    case 'easypanel':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="16" height="4.5" rx="1.2" fill="#10B981" />
          <rect x="4" y="9.8" width="10.5" height="4.5" rx="1.2" fill="#34D399" />
          <rect x="4" y="15.5" width="16" height="4.5" rx="1.2" fill="#059669" />
        </svg>
      );
    case 'coolify':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="#A78BFA" strokeWidth="1.7" fill="#7C3AED" fillOpacity="0.2" />
          <path d="M14.5 9.2C13.8 8.7 13 8.5 12 8.5C9.8 8.5 8.5 10 8.5 12C8.5 14 9.8 15.5 12 15.5C13 15.5 13.8 15.3 14.5 14.8" stroke="#F5F3FF" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case 'homeassistant':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M3.5 11.5L12 4L20.5 11.5V19.5H3.5V11.5Z" fill="#0EA5E9" fillOpacity="0.22" stroke="#38BDF8" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12 19.5V11M12 15.5L9 13M12 13.5L15 11.5" stroke="#E0F2FE" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="10.2" r="1.1" fill="#E0F2FE" />
          <circle cx="8.8" cy="12.8" r="1.1" fill="#E0F2FE" />
          <circle cx="15.2" cy="11.2" r="1.1" fill="#E0F2FE" />
        </svg>
      );
    case 'nginx':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon points="12,2.5 20.5,7.2 20.5,16.8 12,21.5 3.5,16.8 3.5,7.2" fill="#16A34A" fillOpacity="0.22" stroke="#22C55E" strokeWidth="1.6" />
          <path d="M8.5 16V8L15.5 16V8" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'traefik':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3.5L20 8V16L12 20.5L4 16V8L12 3.5Z" stroke="#22D3EE" strokeWidth="1.6" fill="#0891B2" fillOpacity="0.2" />
          <path d="M7.5 10.5H16.5M12 10.5V16.5M9.5 14L12 16.5L14.5 14" stroke="#E0F2FE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'metallb':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="6" r="2.2" fill="#38BDF8" />
          <circle cx="6.5" cy="17" r="2.2" fill="#60A5FA" />
          <circle cx="17.5" cy="17" r="2.2" fill="#22D3EE" />
          <path d="M12 8.2V12M12 12L7.5 15M12 12L16.5 15" stroke="#BAE6FD" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'tailscale':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="6" cy="6.5" r="1.8" fill="#64748B" />
          <circle cx="12" cy="6.5" r="1.8" fill="#64748B" />
          <circle cx="18" cy="6.5" r="1.8" fill="#64748B" />
          <circle cx="6" cy="12" r="1.8" fill="#E2E8F0" />
          <circle cx="12" cy="12" r="1.8" fill="#E2E8F0" />
          <circle cx="18" cy="12" r="1.8" fill="#E2E8F0" />
          <circle cx="6" cy="17.5" r="1.8" fill="#64748B" />
          <circle cx="12" cy="17.5" r="1.8" fill="#E2E8F0" />
          <circle cx="18" cy="17.5" r="1.8" fill="#64748B" />
        </svg>
      );
    case 'cloudflare':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M6.5 17.5H18C19.9 17.5 21.5 16 21.5 14.1C21.5 12.4 20.3 11 18.7 10.7C18.2 7.9 15.8 5.8 12.8 5.8C9.9 5.8 7.5 7.9 7 10.7C4.8 10.9 3 12.6 3 14.8C3 16.3 4.5 17.5 6.5 17.5Z"
            fill="#F97316"
            fillOpacity="0.22"
            stroke="#FB923C"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'nocodb':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4.5" width="16" height="15" rx="2" stroke="#60A5FA" strokeWidth="1.6" />
          <path d="M4 9.5H20M9.5 9.5V19.5M14.5 9.5V19.5M4 14.5H20" stroke="#93C5FD" strokeWidth="1.3" />
        </svg>
      );
    case 'gotify':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 4C8.7 4 6 6.7 6 10V14.5L4.5 16.5H19.5L18 14.5V10C18 6.7 15.3 4 12 4Z" stroke="#38BDF8" strokeWidth="1.6" fill="#0284C7" fillOpacity="0.2" />
          <path d="M10 17.5C10.4 18.7 11.1 19.3 12 19.3C12.9 19.3 13.6 18.7 14 17.5" stroke="#7DD3FC" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'linux':
    case 'debian':
    case 'kali':
    case 'alpine':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3.5C9.5 3.5 8 5.5 8 8.3C8 9.6 8.3 10.6 7.5 12C6.4 13.8 5.8 15.8 6.6 17.8C7.4 19.6 9.5 20.5 12 20.5C14.5 20.5 16.6 19.6 17.4 17.8C18.2 15.8 17.6 13.8 16.5 12C15.7 10.6 16 9.6 16 8.3C16 5.5 14.5 3.5 12 3.5Z" stroke="#FBBF24" strokeWidth="1.5" fill="#F59E0B" fillOpacity="0.14" />
          <circle cx="10.2" cy="7.2" r="0.9" fill="#F8FAFC" />
          <circle cx="13.8" cy="7.2" r="0.9" fill="#F8FAFC" />
          <path d="M10.3 9.2L12 10.3L13.7 9.2" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    /* -------------------- LANGUAGES, DATA & ML -------------------- */
    case 'python':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M11.9 3C8.5 3 8.8 4.5 8.8 4.5V6.8H12.1V7.5H6.9C6.9 7.5 4.2 7.2 4.2 10.7C4.2 14.2 6.5 14 6.5 14H7.9V12C7.9 12 7.8 9.7 10.1 9.7H13.9C13.9 9.7 16 9.7 16 7.6V4.8C16 4.8 16.3 3 11.9 3Z" fill="#3B82F6" />
          <path d="M12.1 21C15.5 21 15.2 19.5 15.2 19.5V17.2H11.9V16.5H17.1C17.1 16.5 19.8 16.8 19.8 13.3C19.8 9.8 17.5 10 17.5 10H16.1V12C16.1 12 16.2 14.3 13.9 14.3H10.1C10.1 14.3 8 14.3 8 16.4V19.2C8 19.2 7.7 21 12.1 21Z" fill="#FACC15" />
        </svg>
      );
    case 'databricks':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3.5L20 7.8L12 12L4 7.8L12 3.5Z" stroke="#EF4444" strokeWidth="1.7" fill="#EF4444" fillOpacity="0.22" />
          <path d="M4 12L12 16.2L20 12" stroke="#F87171" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16.2L12 20.5L20 16.2" stroke="#FCA5A5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'spark':
    case 'apache':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3L14.4 9.2L21 9.7L15.8 13.8L17.5 20.5L12 16.7L6.5 20.5L8.2 13.8L3 9.7L9.6 9.2L12 3Z" fill="#FB923C" fillOpacity="0.25" stroke="#F97316" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case 'fastapi':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="#059669" fillOpacity="0.25" stroke="#10B981" strokeWidth="1.6" />
          <path d="M13 6.5L8.5 13H12L11 17.5L15.5 11H12L13 6.5Z" fill="#6EE7B7" />
        </svg>
      );
    case 'flutter':
    case 'dart':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M13.5 3.5L5.5 11.5L8 14L18.5 3.5H13.5Z" fill="#38BDF8" />
          <path d="M13.5 11.2L9.3 15.4L13.5 19.6H18.5L14.3 15.4L18.5 11.2H13.5Z" fill="#0284C7" />
        </svg>
      );
    case 'react':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="2" fill="#22D3EE" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#22D3EE" strokeWidth="1.4" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#22D3EE" strokeWidth="1.4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#22D3EE" strokeWidth="1.4" transform="rotate(120 12 12)" />
        </svg>
      );
    case 'nodejs':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon points="12,3 19.5,7.3 19.5,16.7 12,21 4.5,16.7 4.5,7.3" stroke="#22C55E" strokeWidth="1.6" fill="#16A34A" fillOpacity="0.2" />
          <text x="12" y="14.5" textAnchor="middle" fill="#86EFAC" fontSize="7" fontWeight="700" fontFamily="monospace">JS</text>
        </svg>
      );
    case 'typescript':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" fill="#2563EB" />
          <text x="12" y="15.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="700" fontFamily="sans-serif">TS</text>
        </svg>
      );
    case 'javascript':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" fill="#EAB308" />
          <text x="12" y="15.5" textAnchor="middle" fill="#0F172A" fontSize="8.5" fontWeight="800" fontFamily="sans-serif">JS</text>
        </svg>
      );
    case 'postgresql':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <ellipse cx="12" cy="7" rx="7" ry="3" stroke="#60A5FA" strokeWidth="1.6" fill="#2563EB" fillOpacity="0.2" />
          <path d="M5 7V17C5 18.7 8.1 20 12 20C15.9 20 19 18.7 19 17V7" stroke="#60A5FA" strokeWidth="1.6" />
          <path d="M5 12C5 13.7 8.1 15 12 15C15.9 15 19 13.7 19 12" stroke="#93C5FD" strokeWidth="1.3" />
        </svg>
      );
    case 'powerbi':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="13" width="4" height="7" rx="1" fill="#F59E0B" />
          <rect x="10" y="9" width="4" height="11" rx="1" fill="#FBBF24" />
          <rect x="16" y="4.5" width="4" height="15.5" rx="1" fill="#FDE047" />
        </svg>
      );
    case 'cpp':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon points="12,3 19.5,7.3 19.5,16.7 12,21 4.5,16.7 4.5,7.3" fill="#2563EB" fillOpacity="0.28" stroke="#60A5FA" strokeWidth="1.5" />
          <text x="12" y="14.5" textAnchor="middle" fill="#DBEAFE" fontSize="7.2" fontWeight="700" fontFamily="monospace">C++</text>
        </svg>
      );
    case 'cuda':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" stroke="#84CC16" strokeWidth="1.6" fill="#4D7C0F" fillOpacity="0.22" />
          <path d="M8 9.5H16M8 12H16M8 14.5H13" stroke="#BEF264" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'java':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M7 11.5H16C16 14.8 14 17 11.5 17C9 17 7 14.8 7 11.5Z" stroke="#FB923C" strokeWidth="1.6" fill="#EA580C" fillOpacity="0.2" />
          <path d="M16 12.2H17.5C18.3 12.2 19 12.8 19 13.6C19 14.4 18.3 15 17.5 15H15.5" stroke="#FB923C" strokeWidth="1.4" />
          <path d="M6 19.2H17M10 8.5C9.5 7.3 10.8 6.5 10.3 5.2M13 8.5C12.5 7.3 13.8 6.5 13.3 5.2" stroke="#38BDF8" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'html5':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4.5 4H19.5L18.1 18.3L12 20.2L5.9 18.3L4.5 4Z" fill="#EA580C" fillOpacity="0.25" stroke="#F97316" strokeWidth="1.5" />
          <path d="M8 8.5H16M8.2 12H15.5L15 15.5L12 16.5L9 15.5" stroke="#FFEDD5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'css3':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4.5 4H19.5L18.1 18.3L12 20.2L5.9 18.3L4.5 4Z" fill="#2563EB" fillOpacity="0.25" stroke="#3B82F6" strokeWidth="1.5" />
          <path d="M8 8.5H16L15.4 12H9M15.4 12L14.9 15.6L12 16.5L9.1 15.6" stroke="#DBEAFE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'bash':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="#22C55E" strokeWidth="1.6" fill="#15803D" fillOpacity="0.2" />
          <path d="M7.5 10L10.5 12L7.5 14M12 14.5H16" stroke="#86EFAC" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'git':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="5" y="5" width="14" height="14" rx="2" transform="rotate(45 12 12)" fill="#F97316" fillOpacity="0.22" stroke="#F97316" strokeWidth="1.6" />
          <circle cx="12" cy="8.5" r="1.3" fill="#FFEDD5" />
          <circle cx="12" cy="15.5" r="1.3" fill="#FFEDD5" />
          <circle cx="15" cy="11.5" r="1.3" fill="#FFEDD5" />
          <path d="M12 9.8V14.2M12 9.8L14.2 11.1" stroke="#FFEDD5" strokeWidth="1.3" />
        </svg>
      );
    case 'tensorflow':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3.5L20 8V11.2L15 8.5V11.5L17.5 12.9V15.8L15 14.4V19.5L12 21V3.5Z" fill="#F97316" />
          <path d="M12 3.5L4 8V11.2L9 8.5V21L12 19.5V3.5Z" fill="#FB923C" opacity="0.82" />
        </svg>
      );
    case 'pytorch':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M15.8 7.6C18.3 10.1 18.3 14.1 15.8 16.6C13.3 19.1 9.3 19.1 6.8 16.6C4.3 14.1 4.3 10.1 6.8 7.6L11.3 3.1V6.8L8.6 9.5C7.1 11 7.1 13.4 8.6 14.9C10.1 16.4 12.5 16.4 14 14.9C15.5 13.4 15.5 11 14 9.5L15.8 7.6Z" fill="#EF4444" />
          <circle cx="14.2" cy="5.5" r="1.2" fill="#FCA5A5" />
        </svg>
      );
    case 'scikit':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="13.5" cy="13.5" r="6" fill="#F59E0B" fillOpacity="0.25" stroke="#FBBF24" strokeWidth="1.6" />
          <circle cx="7.5" cy="8" r="3" fill="#38BDF8" fillOpacity="0.3" stroke="#38BDF8" strokeWidth="1.5" />
        </svg>
      );
    case 'pandas':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="6" y="4" width="2.5" height="6" rx="0.6" fill="#818CF8" />
          <rect x="6" y="13.5" width="2.5" height="6" rx="0.6" fill="#818CF8" />
          <rect x="6" y="10.8" width="2.5" height="2" rx="0.5" fill="#FBBF24" />
          <rect x="11" y="7" width="2.5" height="10" rx="0.6" fill="#A5B4FC" />
          <rect x="16" y="4" width="2.5" height="6" rx="0.6" fill="#818CF8" />
          <rect x="16" y="13.5" width="2.5" height="6" rx="0.6" fill="#818CF8" />
          <rect x="16" y="10.8" width="2.5" height="2" rx="0.5" fill="#EC4899" />
        </svg>
      );
    case 'numpy':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" fill="#0EA5E9" fillOpacity="0.2" stroke="#38BDF8" strokeWidth="1.6" />
          <path d="M12 3V12M12 12L20 7.5M12 12L4 7.5M12 12V21" stroke="#7DD3FC" strokeWidth="1.2" />
        </svg>
      );
    case 'raspberrypi':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M9.5 6.5C10.2 5 11.4 4.2 12 5.4C12.6 4.2 13.8 5 14.5 6.5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="7" y="7" width="10" height="12" rx="4.5" fill="#E11D48" fillOpacity="0.25" stroke="#F43F5E" strokeWidth="1.6" />
          <circle cx="10" cy="11" r="1" fill="#FDA4AF" />
          <circle cx="14" cy="11" r="1" fill="#FDA4AF" />
          <circle cx="12" cy="14.5" r="1.2" fill="#FDA4AF" />
        </svg>
      );
    case 'aws':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M5.5 14.5C9.5 17.5 14.5 17.5 18.5 14.5" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16.8 14L19 14.3L18.4 16.5" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <text x="12" y="12" textAnchor="middle" fill="#FDE68A" fontSize="6.8" fontWeight="700" fontFamily="monospace">AWS</text>
        </svg>
      );
    case 'go':
    case 'godot':
    case 'redis':
    case 'minio':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" stroke="#22D3EE" strokeWidth="1.6" fill="#0891B2" fillOpacity="0.18" />
          <path d="M8 12H16M12 8V16" stroke="#A5F3FC" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'ms':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="7.2" height="7.2" fill="#EF4444" />
          <rect x="12.8" y="4" width="7.2" height="7.2" fill="#22C55E" />
          <rect x="4" y="12.8" width="7.2" height="7.2" fill="#3B82F6" />
          <rect x="12.8" y="12.8" width="7.2" height="7.2" fill="#FACC15" />
        </svg>
      );

    /* -------------------- SOCIALS -------------------- */
    case 'github':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2.5C6.75 2.5 2.5 6.75 2.5 12C2.5 16.2 5.22 19.76 9 21.02C9.48 21.11 9.65 20.81 9.65 20.56V18.92C7.01 19.49 6.45 17.65 6.45 17.65C6.02 16.56 5.4 16.27 5.4 16.27C4.54 15.68 5.47 15.69 5.47 15.69C6.42 15.76 6.92 16.67 6.92 16.67C7.77 18.12 9.14 17.7 9.68 17.46C9.77 16.85 10.01 16.43 10.28 16.2C8.17 15.96 5.95 15.14 5.95 11.49C5.95 10.45 6.32 9.6 6.94 8.93C6.84 8.69 6.51 7.7 7.03 6.37C7.03 6.37 7.83 6.11 9.65 7.34C10.41 7.13 11.23 7.02 12.04 7.02C12.85 7.02 13.67 7.13 14.43 7.34C16.25 6.11 17.05 6.37 17.05 6.37C17.57 7.7 17.24 8.69 17.14 8.93C17.76 9.6 18.13 10.45 18.13 11.49C18.13 15.15 15.9 15.96 13.79 16.19C14.13 16.48 14.43 17.06 14.43 17.95V20.56C14.43 20.82 14.6 21.12 15.09 21.02C18.87 19.75 21.5 16.2 21.5 12C21.5 6.75 17.25 2.5 12 2.5Z"
          />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3.5" fill="#0A66C2" />
          <path d="M7.5 10.5V17M7.5 7.5V7.6" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M11.5 17V10.5M11.5 12.8C11.5 11.3 12.6 10.5 14 10.5C15.6 10.5 16.5 11.5 16.5 13.2V17" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'gmail':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="#E2E8F0" strokeWidth="1.4" fill="#0F172A" />
          <path d="M3.5 7L12 13.2L20.5 7" stroke="#EF4444" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="#EC4899" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="3.8" stroke="#F472B6" strokeWidth="1.7" />
          <circle cx="16.8" cy="7.2" r="1.1" fill="#F472B6" />
        </svg>
      );
    case 'googleplay':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M5.2 3.8L18.8 11.4C19.5 11.8 19.5 12.2 18.8 12.6L5.2 20.2C4.6 20.5 4 20.1 4 19.4V4.6C4 3.9 4.6 3.5 5.2 3.8Z" fill="#10B981" fillOpacity="0.25" stroke="#34D399" strokeWidth="1.6" />
        </svg>
      );

    /* -------------------- GENERIC SECTORS & INSTITUTIONS -------------------- */
    case 'semiconductor':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2" fill="#0284C7" fillOpacity="0.25" stroke="#38BDF8" strokeWidth="1.6" />
          <path d="M9 3V6M15 3V6M9 18V21M15 18V21M3 9H6M3 15H6M18 9H21M18 15H21" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'automotive':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" stroke="#CBD5E1" strokeWidth="1.6" fill="#0F172A" />
          <path d="M12 4.5V12M12 12L5.6 15.8M12 12L18.4 15.8" stroke="#F8FAFC" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'ngo':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="#10B981" fillOpacity="0.2" stroke="#34D399" strokeWidth="1.6" />
          <path d="M12 8V16M8 12H16" stroke="#A7F3D0" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'analytics':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="#6366F1" fillOpacity="0.24" stroke="#818CF8" strokeWidth="1.6" />
          <path d="M7.5 15.5L10.5 11.5L13.5 13.5L16.5 8.5" stroke="#C7D2FE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'university':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3L19.5 6.5V12.5C19.5 16.8 16.3 19.8 12 21.2C7.7 19.8 4.5 16.8 4.5 12.5V6.5L12 3Z" fill="#B45309" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="1.6" />
          <path d="M8.5 11.5H15.5M12 8.5V15.5" stroke="#FDE68A" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'school':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3.5L20 7.5L12 11.5L4 7.5L12 3.5Z" fill="#38BDF8" fillOpacity="0.25" stroke="#38BDF8" strokeWidth="1.5" />
          <path d="M7 9.5V15.5C7 17.2 9.2 18.5 12 18.5C14.8 18.5 17 17.2 17 15.5V9.5" stroke="#BAE6FD" strokeWidth="1.5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon points="12,3.5 19.5,7.8 19.5,16.2 12,20.5 4.5,16.2 4.5,7.8" stroke="#38BDF8" strokeWidth="1.6" fill="#0EA5E9" fillOpacity="0.16" />
          <circle cx="12" cy="12" r="2.2" fill="#7DD3FC" />
        </svg>
      );
  }
};

export const BrandMark: React.FC<BrandMarkProps> = ({ brand, className = 'w-5 h-5' }) => {
  const { resolveIconOverride } = useMediaRegistry();
  const key = normalizeBrandKey(String(brand));
  const overrideUrl = resolveIconOverride(String(brand), key);

  if (overrideUrl) {
    return (
      <RepoImage
        src={overrideUrl}
        alt={String(brand)}
        className={`${className} rounded-[3px]`}
        imgClassName="w-full h-full object-contain"
        fallback={<BrandSvgFallback brandKey={key} className={className} />}
      />
    );
  }

  return <BrandSvgFallback brandKey={key} className={className} />;
};

export default BrandMark;
