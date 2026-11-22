import Papa from 'papaparse';
import { Data, ProgressMilestone, Project, ProjectStatus } from './types';
import { resolveItemId, slugifyItemId } from './utils/itemId';

const CACHE_KEY = 'modular_portfolio_data_v2';

export interface CachedDataPayload {
  timestamp: number;
  data: Data;
  rawJson?: any;
}

const VALID_STATUSES: ReadonlySet<string> = new Set([
  'live',
  'active',
  'wip',
  'archived',
  'unmaintained',
  'hidden',
]);

const normalizeStatus = (raw?: string): ProjectStatus | undefined => {
  if (!raw) return undefined;
  const clean = raw.toLowerCase().trim();
  if (VALID_STATUSES.has(clean)) return clean as ProjectStatus;
  if (clean === 'in progress' || clean === 'in-progress') return 'wip';
  if (clean === 'not maintained' || clean === 'deprecated') return 'unmaintained';
  return undefined;
};

const parseBool = (val: unknown): boolean | undefined => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
  }
  return undefined;
};

const parseNumber = (val: unknown): number | undefined => {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const num = Number(val);
    if (!Number.isNaN(num)) return num;
  }
  return undefined;
};

export const toAssetPath = (rawPath: string | undefined, baseUrl: string): string | undefined => {
  if (!rawPath) return undefined;
  if (/^https?:\/\//i.test(rawPath) || rawPath.startsWith('data:')) return rawPath;
  const cleaned = rawPath.replace(/^\/+/, '');
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${cleaned}`;
};

const normalizeProject = (proj: any, baseUrl: string, defaultCategory = 'Project'): Project => ({
  id: resolveItemId(proj.id, proj.name),
  name: proj.name,
  category: proj.category || defaultCategory,
  filterGroup: proj.filterGroup || proj.category || defaultCategory,
  badge: proj.badge || '',
  status: normalizeStatus(proj.status),
  priority: parseNumber(proj.priority),
  featured: parseBool(proj.featured),
  cardStyle:
    proj.cardStyle === 'banner' || proj.cardStyle === 'compact' ? proj.cardStyle : undefined,
  description: proj.description || '',
  url: proj.url || '#',
  stack: proj.stack || '',
  details: proj.details || '',
  logo: toAssetPath(proj.logo, baseUrl),
});

const normalizeMilestone = (
  entry: any,
  idx: number,
  baseUrl: string
): ProgressMilestone => ({
  id: String(entry.id || `milestone-${idx + 1}`),
  itemId: slugifyItemId(String(entry.itemId || '')),
  itemType:
    String(entry.itemType || '').toLowerCase() === 'experience' ? 'experience' : 'project',
  date: String(entry.date || 'TBD'),
  phase: String(entry.phase || 'Iteration'),
  title: String(entry.title || 'Project Milestone'),
  ideaNote: String(entry.ideaNote || entry.idea || ''),
  outcome: entry.outcome ? String(entry.outcome) : '',
  mediaUrl: entry.mediaUrl ? toAssetPath(String(entry.mediaUrl).trim(), baseUrl) : '',
  mediaType: String(entry.mediaType || '').toLowerCase() === 'link' ? 'link' : 'image',
  caption: entry.caption ? String(entry.caption) : '',
  order: parseNumber(entry.order) ?? idx + 1,
});

/**
 * Retrieve cached data from localStorage for instant 0ms first render (Stale-While-Revalidate)
 */
export const getCachedPortfolioData = (): Data | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedDataPayload = JSON.parse(raw);
    if (parsed && parsed.data) {
      return parsed.data;
    }
  } catch (err) {
    console.warn('Failed reading portfolio cache:', err);
  }
  return null;
};

export const getRawPortfolioJson = (): any | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedDataPayload = JSON.parse(raw);
    return parsed.rawJson || null;
  } catch {
    return null;
  }
};

export const setCachedPortfolioData = (data: Data, rawJson?: any): void => {
  try {
    const payload: CachedDataPayload = {
      timestamp: Date.now(),
      data,
      rawJson,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed writing portfolio cache:', err);
  }
};

/**
 * Convert modular portfolio.json into normalized Data structures
 */
export const transformJsonToData = (json: any, baseUrl: string): Data => {
  const profile = json.profile || {};
  const contact = json.contact || {};

  const config = [
    { key: 'name', value: profile.name || 'Portfolio' },
    { key: 'title', value: profile.title || 'Software Engineer' },
    { key: 'avatar_url', value: toAssetPath(profile.avatarUrl, baseUrl) || '' },
    { key: 'company', value: profile.company || '' },
    { key: 'location', value: profile.location || '' },
  ];

  const about = (json.about || []).map((p: string) => ({ paragraph: p }));

  const experience = (json.experience || []).map((exp: any) => ({
    id: resolveItemId(exp.id, exp.role, exp.company),
    role: exp.role,
    company: exp.company,
    location: exp.location,
    duration: exp.duration,
    milestone: exp.milestone || '',
    description: Array.isArray(exp.bulletPoints)
      ? exp.bulletPoints.join('|')
      : exp.description || '',
    skills: Array.isArray(exp.skills) ? exp.skills.join('|') : exp.skills || '',
    logo: toAssetPath(exp.logo, baseUrl),
  }));

  const realWorldProjects = (json.realWorldProjects || []).map((proj: any) =>
    normalizeProject(proj, baseUrl, 'Featured')
  );

  const otherProjects = (json.otherProjects || []).map((proj: any) =>
    normalizeProject(proj, baseUrl, 'Open Source & Labs')
  );

  const homelabDevices = (json.homelab?.nodes || []).map((node: any) => ({
    hostname: node.hostname,
    type: node.type,
    cpu: node.cpu,
    ram: node.ram,
    gpu: node.gpu,
    storage: node.storage,
    url: node.url || '',
    notes: node.notes || '',
    logo: toAssetPath(node.logo, baseUrl),
  }));

  const vms = (json.homelab?.k3sTopology || []).map((item: any) => ({
    os: item.os,
    description: item.description,
  }));

  const platforms = (json.homelab?.tooling || []).map((tool: any) =>
    typeof tool === 'string'
      ? { name: tool, logo: '' }
      : { name: tool.name || String(tool), logo: toAssetPath(tool.logo, baseUrl) || '' }
  );

  const skillsList: Array<{ skill: string; logo?: string; 'Skill Category': string }> = [];
  if (Array.isArray(json.skills?.iconTiles)) {
    json.skills.iconTiles.forEach((tile: any) => {
      skillsList.push({
        skill: tile.label,
        logo: toAssetPath(tile.logoPath, baseUrl),
        'Skill Category': 'Technology',
      });
    });
  } else {
    (json.skills?.categories || []).forEach((cat: any) => {
      (cat.items || []).forEach((item: string) => {
        skillsList.push({ skill: item, 'Skill Category': 'Technology' });
      });
    });
  }
  (json.skills?.principles || []).forEach((principle: string) => {
    skillsList.push({ skill: principle, 'Skill Category': 'Soft Skill' });
  });

  const socials = (json.socials || []).map((soc: any) => ({
    name: soc.name,
    url: soc.url,
    logos: toAssetPath(soc.logos, baseUrl) || soc.logos || '',
  }));

  const education = (json.education || []).map((edu: any) => ({
    institution: edu.institution,
    degree: edu.degree,
    duration: edu.duration,
    gpa: edu.gpa,
    logo: toAssetPath(edu.logo, baseUrl),
  }));

  const contactList = [
    {
      heading: contact.heading || 'Get In Touch',
      'Contact Email': contact.email || profile.email || '',
      'Contact Phone': contact.phone || profile.phone || '',
      'Contact Message': contact.message || 'Open to technical discussions and collaboration.',
      location: contact.location || profile.location || '',
    },
  ];

  const certificates = (json.certificates || []).map((c: any) => ({
    name: c.name,
    date: c.date,
    logo: toAssetPath(c.logo, baseUrl),
    url: c.url,
  }));

  const progressGallery = Array.isArray(json.progressGallery)
    ? json.progressGallery
        .map((entry: any, idx: number) => normalizeMilestone(entry, idx, baseUrl))
        .filter((m: ProgressMilestone) => Boolean(m.itemId))
    : [];

  const iconOverrides: Record<string, string> = {};
  if (json.media?.icons && typeof json.media.icons === 'object') {
    Object.entries(json.media.icons).forEach(([k, v]) => {
      if (k && typeof v === 'string' && v.trim()) {
        iconOverrides[k] = toAssetPath(v.trim(), baseUrl) || v.trim();
      }
    });
  }

  return {
    about,
    certificates,
    config,
    contact: contactList,
    education,
    experience,
    projects: otherProjects,
    'real-world_projects': realWorldProjects,
    skills: skillsList,
    socials,
    themes: [],
    homelab: homelabDevices,
    vms,
    platforms,
    progressGallery,
    iconOverrides,
  };
};

/**
 * Parallelized fetch with Stale-While-Revalidate support.
 * Prioritizes modular public/data/portfolio.json, falling back cleanly to public/data/*.csv.
 */
export const fetchData = async (): Promise<Data> => {
  const baseUrl = import.meta.env.BASE_URL || './';

  try {
    const jsonRes = await fetch(`${baseUrl}data/portfolio.json?v=4.0`);
    if (jsonRes.ok) {
      const jsonData = await jsonRes.json();
      const transformed = transformJsonToData(jsonData, baseUrl);
      setCachedPortfolioData(transformed, jsonData);
      return transformed;
    }
  } catch (jsonErr) {
    console.warn('Could not load portfolio.json, attempting CSV fallback:', jsonErr);
  }

  const files = [
    'about',
    'certificates',
    'config',
    'contact',
    'education',
    'experience',
    'projects',
    'real-world_projects',
    'skills',
    'socials',
    'themes',
    'homelab',
    'vms',
    'platforms',
    'progress_gallery',
    'icon_overrides',
  ];

  const fetchPromises = files.map(async (file) => {
    try {
      const response = await fetch(`${baseUrl}data/${file}.csv?v=3.0`);
      if (!response.ok) return { file, data: [] };
      const csv = await response.text();
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
      return { file, data: parsed };
    } catch {
      return { file, data: [] };
    }
  });

  const results = await Promise.all(fetchPromises);
  const data: { [key: string]: any[] } = {};

  for (const { file, data: parsed } of results) {
    data[file] = parsed;
  }

  if (data.socials) {
    data.socials = data.socials.map((social) => ({
      ...social,
      logos: toAssetPath(social.logos, baseUrl) || social.logos || '',
    }));
  }

  if (data['real-world_projects']) {
    data['real-world_projects'] = data['real-world_projects'].map((p) =>
      normalizeProject(p, baseUrl, 'Featured')
    );
  }

  if (data.projects) {
    data.projects = data.projects.map((p) =>
      normalizeProject(p, baseUrl, 'Open Source & Labs')
    );
  }

  if (data.experience) {
    data.experience = data.experience.map((exp) => ({
      ...exp,
      id: resolveItemId(exp.id, exp.role, exp.company),
      logo: toAssetPath(exp.logo, baseUrl),
    }));
  }

  if (data.education) {
    data.education = data.education.map((edu) => ({
      ...edu,
      logo: toAssetPath(edu.logo, baseUrl),
    }));
  }

  if (data.skills) {
    data.skills = data.skills.map((sk) => ({
      ...sk,
      logo: sk.logo && (sk.logo.includes('/') || sk.logo.includes('.'))
        ? toAssetPath(sk.logo, baseUrl)
        : sk.logo,
    }));
  }

  if (data.config) {
    const configMap = new Map(data.config.map((item) => [item.key, item.value]));
    if (configMap.has('avatar_url')) {
      const avatarUrl = configMap.get('avatar_url');
      configMap.set('avatar_url', toAssetPath(avatarUrl, baseUrl) || '');
    }
    data.config = Array.from(configMap.entries()).map(([key, value]) => ({ key, value }));
  }

  const progressGallery = Array.isArray(data.progress_gallery)
    ? data.progress_gallery
        .map((entry, idx) => normalizeMilestone(entry, idx, baseUrl))
        .filter((m) => Boolean(m.itemId))
    : [];

  const iconOverrides: Record<string, string> = {};
  if (Array.isArray(data.icon_overrides)) {
    data.icon_overrides.forEach((row: any) => {
      if (row?.key && row?.url) {
        iconOverrides[String(row.key).trim()] =
          toAssetPath(String(row.url).trim(), baseUrl) || String(row.url).trim();
      }
    });
  }

  const finalData = {
    ...data,
    progressGallery,
    iconOverrides,
  } as unknown as Data;
  setCachedPortfolioData(finalData);
  return finalData;
};

export default fetchData;