import Papa from "papaparse";
import { Data } from "./types";

const fetchData = async () => {
  const files = ["about", "certificates", "config", "contact", "education", "experience", "projects", "real-world_projects", "skills", "socials", "themes"];
  const data: { [key: string]: any[] } = {};

  for (const file of files) {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${file}.csv`);
    const csv = await response.text();
    data[file] = Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
  }

  // Process image paths
  const baseUrl = import.meta.env.BASE_URL;

  // Socials
  if (data.socials) {
    data.socials = data.socials.map(social => ({
      ...social,
      logos: `${baseUrl}images/socials/${social.logos.split('/').pop()}` // Assuming logos are like "images/socials/linkedin.webp"
    }));
  }

  // Config (for avatar_url) - assuming config has a key-value structure
  if (data.config) {
    const configMap = new Map(data.config.map(item => [item.key, item.value]));
    if (configMap.has('avatar_url')) {
      configMap.set('avatar_url', `${baseUrl}images/${configMap.get('avatar_url').split('/').pop()}`);
    }
    // Convert back to array if needed, or access directly from map later
    // For now, let's assume config is used as a map
    data.config = Array.from(configMap.entries()).map(([key, value]) => ({ key, value }));
  }

  // Projects and Real-World Projects
  const projectTypes = ['projects', 'real-world_projects'];
  for (const type of projectTypes) {
    if (data[type]) {
      data[type] = data[type].map(project => ({
        ...project,
        image: `${baseUrl}images/${project.image.split('/').pop()}` // Assuming images are like "images/project.webp"
      }));
    }
  }

  // Skills (for logos)
  if (data.skills) {
    data.skills = data.skills.map(skill => ({
      ...skill,
      logo: `${baseUrl}images/logos/${skill.logo.split('/').pop()}` // Assuming logos are like "images/logos/react.svg"
    }));
  }


  return data as unknown as Data;
};

export default fetchData;
