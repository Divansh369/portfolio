export type ProjectStatus =
  | 'live'
  | 'active'
  | 'wip'
  | 'archived'
  | 'unmaintained'
  | 'hidden';

export interface Theme {
  name: string;
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface About {
  paragraph: string;
}

export interface Certificate {
  name: string;
  date: string;
  logo?: string;
  url?: string;
}

export interface Config {
  key: string;
  value: string;
}

export interface Contact {
  heading?: string;
  'Contact Email': string;
  'Contact Phone': string;
  'Contact Message': string;
  location?: string;
}

export interface Education {
  institution: string;
  degree: string;
  duration: string;
  gpa: string;
  logo?: string;
}

export interface Experience {
  id?: string;
  role: string;
  company: string;
  location: string;
  duration: string;
  milestone?: string;
  description: string;
  skills: string;
  logo?: string;
}

export interface Project {
  id?: string;
  name: string;
  category?: string;
  filterGroup?: string;
  badge?: string;
  status?: ProjectStatus;
  priority?: number;
  featured?: boolean;
  cardStyle?: 'banner' | 'compact';
  description: string;
  url?: string;
  stack?: string;
  details?: string;
  logo?: string;
}

export interface ProgressMilestone {
  id: string;
  itemId: string;
  itemType: 'project' | 'experience';
  date: string;
  phase: string;
  title: string;
  ideaNote: string;
  outcome?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'link';
  caption?: string;
  order?: number;
}

export interface Skill {
  skill: string;
  logo?: string;
  'Skill Category': string;
}

export interface SkillIconTile {
  label: string;
  logoPath?: string;
  brandKey: string;
  category?: 'infra' | 'languages' | 'data' | 'apps';
  summary?: string;
  websiteUrl?: string;
  githubUrl?: string;
  connections?: string[];
  isFoss?: boolean;
}

export interface Social {
  name: string;
  url: string;
  logos: string;
}

export interface HomelabEvolutionStage {
  stage: string;
  title: string;
  summary: string;
  learnings: string[];
  stack: string;
}

export interface HomelabLesson {
  topic: string;
  icon?: string;
  detail: string;
}

export interface ArchitectureTraceNodeConfig {
  id: string;
  step: string;
  label: string;
  shortTitle: string;
  endpoint: string;
  summary: string;
  stack: string;
  icon?: string;
}

export interface ArchitectureTraceModeConfig {
  id: string;
  label: string;
  headline: string;
  nodes: ArchitectureTraceNodeConfig[];
}

export interface LoadBalancerDemoConfig {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  vipAddress?: string;
  protocol?: string;
  controller?: string;
  endpointPath?: string;
  pods?: Array<{
    id: string;
    name: string;
    internalIp: string;
    node: string;
  }>;
}

export interface HomelabDevice {
  hostname: string;
  type: string;
  cpu: string;
  ram: string;
  gpu: string;
  storage: string;
  url?: string;
  notes?: string;
  logo?: string;
}

export interface VM {
  os: string;
  description: string;
}

export interface Platform {
  name: string;
  logo: string;
}

export interface DossierRow {
  label: string;
  value: string;
  icon?: string;
  countTo?: number;
  countPrefix?: string;
  countSuffix?: string;
}

export interface DossierLink {
  label: string;
  url: string;
}

export interface Systems3DModeConfig {
  id: 'core' | 'stream' | 'cluster' | 'mesh';
  shortLabel: string;
  title: string;
  domain: string;
  caption: string;
  stack: string;
}

export interface SectionsConfig {
  systems3d?: {
    enabled?: boolean;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    modes?: Systems3DModeConfig[];
  };
  projects?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    showArchivedByDefault?: boolean;
  };
  homelab?: {
    enabled?: boolean;
    navLabel?: string;
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    workloadsTitle?: string;
    workloadsSubtitle?: string;
    workloadsBadge?: string;
    consolidationTitle?: string;
    consolidationUrl?: string;
    hardwareTitle?: string;
    hardwareSubtitle?: string;
    platformsTitle?: string;
    platformsSubtitle?: string;
    lessons?: HomelabLesson[];
    architectureTraces?: ArchitectureTraceModeConfig[];
    loadBalancerDemo?: LoadBalancerDemoConfig;
  };
  experience?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
  };
  skills?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
  };
  about?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    facts?: Array<{
      label: string;
      value: string;
      icon?: string;
    }>;
  };
  education?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
  };
  contact?: {
    eyebrow?: string;
    locationLabel?: string;
  };
}

export interface Data {
  about: About[];
  certificates: Certificate[];
  config: Config[];
  contact: Contact[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  'real-world_projects': Project[];
  skills: Skill[];
  socials: Social[];
  themes?: Theme[];
  homelab: HomelabDevice[];
  vms: VM[];
  platforms: Platform[];
  progressGallery?: ProgressMilestone[];
  iconOverrides?: Record<string, string>;
}

export interface PortfolioData {
  profile: {
    name: string;
    title: string;
    company?: string;
    location: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    summary?: string;
    resumeSummary?: string;
    resumeHeadline?: string;
    resumeFileName?: string;
    cvFileName?: string;
    domains?: string[];
    primaryConsoleUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  };
  media?: {
    icons?: Record<string, string>;
  };
  hero: {
    kicker: string[];
    headline: string;
    lead: string;
    secondaryAction?: {
      label: string;
      href: string;
    };
    dossier?: {
      subtitle?: string;
      rows?: DossierRow[];
      links?: DossierLink[];
    };
    metrics: Array<{
      value: string;
      label: string;
      color?: string;
      countTo?: number;
      countSuffix?: string;
    }>;
  };
  sections?: SectionsConfig;
  about: string[];
  experience: Array<{
    id?: string;
    role: string;
    company: string;
    location: string;
    duration: string;
    milestone?: string;
    logo?: string;
    bulletPoints: string[];
    skills: string[];
  }>;
  realWorldProjects: Project[];
  otherProjects: Project[];
  progressGallery?: ProgressMilestone[];
  homelab: {
    evolution?: HomelabEvolutionStage[];
    nodes: HomelabDevice[];
    consolidationNote?: string;
    k3sTopology?: VM[];
    network?: {
      domains?: string[];
      overlay?: string;
      ingress?: string;
      loadBalancer?: string;
    };
    tooling?: string[];
  };
  skills: {
    iconTiles?: SkillIconTile[];
    categories: Array<{
      name: string;
      desc: string;
      items: string[];
    }>;
    principles: string[];
    languages?: string[];
    interests?: string[];
  };
  education: Education[];
  certificates?: Certificate[];
  socials: Social[];
  contact: {
    heading: string;
    message: string;
    email: string;
    phone?: string;
    location?: string;
  };
  cv?: {
    projectsSectionTitle?: string;
    maxProjectsInCv?: number;
    maxProjectsInResume?: number;
    maxExperiencesInResume?: number;
    includeHomelabInCv?: boolean;
    includeHomelabInResume?: boolean;
    includeCertsInResume?: boolean;
    includeInterestsInResume?: boolean;
    homelabCvTitle?: string;
    homelabCvSubtitle?: string;
    homelabCvLink?: string;
    homelabCvBullets?: string[];
    keywords?: string;
  };
  seo?: {
    siteUrl?: string;
    shortName?: string;
    ogImage?: string;
    keywords?: string[];
    faqs?: Array<{
      question: string;
      answer: string;
    }>;
  };
}