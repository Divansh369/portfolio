import Papa from "papaparse";
import { Data } from "./types";

const CACHE_KEY = "divansh_portfolio_data_v9";
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes cache validity

export interface CachedDataPayload {
  timestamp: number;
  data: Data;
  rawJson?: any;
}

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
    console.warn("Failed reading portfolio cache:", err);
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

/**
 * Save fresh data to client cache
 */
export const setCachedPortfolioData = (data: Data, rawJson?: any): void => {
  try {
    const payload: CachedDataPayload = {
      timestamp: Date.now(),
      data,
      rawJson,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed writing portfolio cache:", err);
  }
};

/**
 * Convert modular portfolio.json into standard Data structures
 */
const transformJsonToData = (json: any, baseUrl: string): Data => {
  const profile = json.profile || {};
  const hero = json.hero || {};
  const contact = json.contact || {};

  const config = [
    { key: "name", value: profile.name || "Divansh Prasad" },
    { key: "title", value: profile.title || "Software Engineer · Daimler Truck (DTICI)" },
    { key: "avatar_url", value: profile.avatarUrl || "" },
    { key: "company", value: profile.company || "Daimler Truck" },
    { key: "location", value: profile.location || "Bengaluru, India" },
  ];

  const about = (json.about || []).map((p: string) => ({ paragraph: p }));

  const experience = (json.experience || []).map((exp: any) => ({
    role: exp.role,
    company: exp.company,
    location: exp.location,
    duration: exp.duration,
    milestone: exp.milestone || "",
    description: Array.isArray(exp.bulletPoints) ? exp.bulletPoints.join("|") : exp.description || "",
    skills: Array.isArray(exp.skills) ? exp.skills.join("|") : exp.skills || "",
    logo: exp.logo ? (exp.logo.startsWith("http") ? exp.logo : `${baseUrl}images/${exp.logo.split("/").pop()}`) : undefined,
  }));

  const realWorldProjects = (json.realWorldProjects || []).map((proj: any) => ({
    name: proj.name,
    category: proj.category || "",
    badge: proj.badge || "",
    description: proj.description,
    url: proj.url || "#",
    stack: proj.stack || "",
    details: proj.details || "",
    logo: proj.logo ? (proj.logo.startsWith("http") ? proj.logo : `${baseUrl}images/${proj.logo.split("/").pop()}`) : undefined,
  }));

  const otherProjects = (json.otherProjects || []).map((proj: any) => ({
    name: proj.name,
    category: proj.category || "Open Source & ML",
    badge: proj.badge || "",
    description: proj.description,
    url: proj.url || "#",
    stack: proj.stack || "",
    details: proj.details || "",
    logo: proj.logo ? (proj.logo.startsWith("http") ? proj.logo : `${baseUrl}images/${proj.logo.split("/").pop()}`) : undefined,
  }));

  const homelabDevices = (json.homelab?.nodes || []).map((node: any) => ({
    hostname: node.hostname,
    type: node.type,
    cpu: node.cpu,
    ram: node.ram,
    gpu: node.gpu,
    storage: node.storage,
    url: node.url || "",
    notes: node.notes || "",
  }));

  const vms = (json.homelab?.k3sTopology || []).map((item: any) => ({
    os: item.os,
    description: item.description,
  }));

  const platforms = (json.homelab?.tooling || []).map((tool: string) => ({
    name: tool,
    logo: "",
  }));

  // Skills
  const skillsList: Array<{ skill: string; "Skill Category": string }> = [];
  (json.skills?.categories || []).forEach((cat: any) => {
    (cat.items || []).forEach((item: string) => {
      skillsList.push({ skill: item, "Skill Category": "Technology" });
    });
  });
  (json.skills?.principles || []).forEach((principle: string) => {
    skillsList.push({ skill: principle, "Skill Category": "Soft Skill" });
  });

  const socials = (json.socials || []).map((soc: any) => ({
    name: soc.name,
    url: soc.url,
    logos: soc.logos ? (soc.logos.startsWith("http") ? soc.logos : `${baseUrl}images/logos/${soc.logos.split("/").pop()}`) : soc.logos,
  }));

  const education = (json.education || []).map((edu: any) => ({
    institution: edu.institution,
    degree: edu.degree,
    duration: edu.duration,
    gpa: edu.gpa,
  }));

  const contactList = [
    {
      heading: contact.heading || "Get In Touch",
      "Contact Email": contact.email || profile.email || "divanshthebest@gmail.com",
      "Contact Phone": contact.phone || profile.phone || "",
      "Contact Message": contact.message || "Open to technical discussions.",
    },
  ];

  const certificates = (json.certificates || []).map((c: any) => ({
    name: c.name,
    date: c.date,
  }));

  return {
    about,
    certificates,
    config,
    contact: contactList,
    education,
    experience,
    projects: otherProjects,
    "real-world_projects": realWorldProjects,
    skills: skillsList,
    socials,
    themes: [],
    homelab: homelabDevices,
    vms,
    platforms,
  };
};

/**
 * Parallelized fetch with Stale-While-Revalidate support
 * Prioritizes modular portfolio.json, falling back to CSVs if unavailable.
 */
export const fetchData = async (): Promise<Data> => {
  const baseUrl = import.meta.env.BASE_URL || "/";

  // Step 1: Attempt to fetch modular portfolio.json first
  try {
    const jsonRes = await fetch(`${baseUrl}data/portfolio.json?v=3.0`);
    if (jsonRes.ok) {
      const jsonData = await jsonRes.json();
      const transformed = transformJsonToData(jsonData, baseUrl);
      setCachedPortfolioData(transformed, jsonData);
      return transformed;
    }
  } catch (jsonErr) {
    console.warn("Could not load portfolio.json, attempting CSV fallback:", jsonErr);
  }

  // Step 2: Fallback to individual CSVs if portfolio.json is missing
  const files = [
    "about",
    "certificates",
    "config",
    "contact",
    "education",
    "experience",
    "projects",
    "real-world_projects",
    "skills",
    "socials",
    "themes",
    "homelab",
    "vms",
    "platforms",
  ];

  const fetchPromises = files.map(async (file) => {
    try {
      const response = await fetch(`${baseUrl}data/${file}.csv?v=2.0`);
      if (!response.ok) {
        return { file, data: [] };
      }
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
      logos: social.logos
        ? social.logos.startsWith("http")
          ? social.logos
          : `${baseUrl}images/socials/${social.logos.split("/").pop()}`
        : social.logos,
    }));
  }

  if (data.config) {
    const configMap = new Map(data.config.map((item) => [item.key, item.value]));
    if (configMap.has("avatar_url")) {
      const avatarUrl = configMap.get("avatar_url");
      configMap.set(
        "avatar_url",
        avatarUrl && !avatarUrl.startsWith("http")
          ? `${baseUrl}images/${avatarUrl.split("/").pop()}`
          : avatarUrl
      );
    }
    data.config = Array.from(configMap.entries()).map(([key, value]) => ({ key, value }));
  }

  const finalData = data as unknown as Data;
  setCachedPortfolioData(finalData);
  return finalData;
};

export default fetchData;