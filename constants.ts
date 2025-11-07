import Papa from "papaparse";
import { Data } from "./types";

const fetchData = async () => {
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
    "platforms"
  ];
  const data: { [key: string]: any[] } = {};

  for (const file of files) {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/${file}.csv`);
      if (!response.ok) {
        console.warn(`Could not fetch ${file}.csv, skipping.`);
        data[file] = [];
        continue;
      }
      const csv = await response.text();
      data[file] = Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
    } catch (error) {
      console.error(`Error processing ${file}.csv:`, error);
      data[file] = [];
    }
  }

  // Process image paths
  const baseUrl = import.meta.env.BASE_URL;

  // Socials
  if (data.socials) {
    data.socials = data.socials.map(social => ({
      ...social,
      logos: social.logos ? `${baseUrl}images/socials/${social.logos.split('/').pop()}` : social.logos
    }));
  }

  // Config (for avatar_url)
  if (data.config) {
    const configMap = new Map(data.config.map(item => [item.key, item.value]));
    if (configMap.has('avatar_url')) {
      const avatarUrl = configMap.get('avatar_url');
      configMap.set('avatar_url', avatarUrl ? `${baseUrl}images/${avatarUrl.split('/').pop()}` : avatarUrl);
    }
    data.config = Array.from(configMap.entries()).map(([key, value]) => ({ key, value }));
  }

  // Experience (for logos)
  if (data.experience) {
    data.experience = data.experience.map(job => ({
      ...job,
      logo: (job.logo && job.logo.includes('/')) ? `${baseUrl}images/${job.logo.split('/').pop()}` : job.logo
    }));
  }

  // Projects and Real-World Projects
  const projectTypes = ['projects', 'real-world_projects'];
  for (const type of projectTypes) {
    if (data[type]) {
      data[type] = data[type].map(project => ({
        ...project,
        logo: project.logo ? `${baseUrl}images/${project.logo.split('/').pop()}` : project.logo
      }));
    }
  }

  // Skills and Platforms (for logos)
  const iconSections = ['skills', 'platforms'];
  for (const section of iconSections) {
    if (data[section]) {
      data[section] = data[section].map(item => ({
        ...item,
        logo: (item.logo && item.logo.includes('/')) ? `${baseUrl}images/logos/${item.logo.split('/').pop()}` : item.logo
      }));
    }
  }

  return data as unknown as Data;
};

export default fetchData;