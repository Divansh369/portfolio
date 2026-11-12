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
}

export interface Config {
  key: string;
  value: string;
}

export interface Contact {
  heading?: string;
  "Contact Email": string;
  "Contact Phone": string;
  "Contact Message": string;
}

export interface Education {
  institution: string;
  degree: string;
  duration: string;
  gpa: string;
}

export interface Experience {
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
  name: string;
  category?: string;
  badge?: string;
  description: string;
  url?: string;
  stack?: string;
  details?: string;
  logo?: string;
}

export interface Skill {
  skill: string;
  logo?: string;
  "Skill Category": string;
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

export interface HomelabDevice {
  hostname: string;
  type: 'PVE Node' | 'PBS' | 'Personal Laptop' | 'Personal Powerhouse' | 'PVE Node (Archived)' | string;
  cpu: string;
  ram: string;
  gpu: string;
  storage: string;
  url?: string;
  notes?: string;
}

export interface VM {
  os: string;
  description: string;
}

export interface Platform {
  name: string;
  logo: string;
}

export interface Data {
  about: About[];
  certificates: Certificate[];
  config: Config[];
  contact: Contact[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  "real-world_projects": Project[];
  skills: Skill[];
  socials: Social[];
  themes?: Theme[];
  homelab: HomelabDevice[];
  vms: VM[];
  platforms: Platform[];
}

export interface PortfolioData {
  profile: {
    name: string;
    title: string;
    company: string;
    location: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    domains: string[];
    pveConsoleUrl: string;
    udayanAuthUrl: string;
    googlePlayUrl: string;
    githubUrl: string;
    linkedinUrl?: string;
  };
  hero: {
    kicker: string[];
    headline: string;
    lead: string;
    metrics: Array<{
      value: string;
      label: string;
      color?: string;
    }>;
  };
  about: string[];
  experience: Array<{
    role: string;
    company: string;
    location: string;
    duration: string;
    milestone?: string;
    logo?: string;
    bulletPoints: string[];
    skills: string[];
  }>;
  realWorldProjects: Array<{
    name: string;
    category?: string;
    description: string;
    url?: string;
    logo?: string;
    badge?: string;
    stack: string;
    details: string;
  }>;
  otherProjects: Array<{
    name: string;
    description: string;
    url?: string;
    logo?: string;
    stack: string;
    details: string;
  }>;
  homelab: {
    evolution?: HomelabEvolutionStage[];
    nodes: Array<{
      hostname: string;
      type: string;
      cpu: string;
      ram: string;
      gpu: string;
      storage: string;
      url?: string;
      notes?: string;
    }>;
    consolidationNote: string;
    k3sTopology: Array<{
      os: string;
      description: string;
    }>;
    network: {
      domains: string[];
      overlay: string;
      ingress: string;
      loadBalancer: string;
    };
    tooling: string[];
  };
  skills: {
    categories: Array<{
      name: string;
      desc: string;
      items: string[];
    }>;
    principles: string[];
    languages?: string[];
    interests?: string[];
  };
  education: Array<{
    institution: string;
    degree: string;
    duration: string;
    gpa: string;
  }>;
  certificates?: Certificate[];
  socials: Array<{
    name: string;
    url: string;
    logos: string;
  }>;
  contact: {
    heading: string;
    message: string;
    email: string;
    phone?: string;
  };
}