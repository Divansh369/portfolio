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
      logos: social.logos ? `${baseUrl}images/socials/${social.logos.split('/').pop()}` : social.logos // Add check
    }));
  }

  // Config (for avatar_url)
  if (data.config) {
    const configMap = new Map(data.config.map(item => [item.key, item.value]));
    if (configMap.has('avatar_url')) {
      const avatarUrl = configMap.get('avatar_url');
      configMap.set('avatar_url', avatarUrl ? `${baseUrl}images/${avatarUrl.split('/').pop()}` : avatarUrl); // Add check
    }
    data.config = Array.from(configMap.entries()).map(([key, value]) => ({ key, value }));
  }

  // Experience (for logos)
  if (data.experience) {
    data.experience = data.experience.map(job => ({
      ...job,
      logo: (job.logo && job.logo.includes('/')) ? `${baseUrl}images/${job.logo.split('/').pop()}` : job.logo // Add check and process
    }));
  }

  // Projects and Real-World Projects
  const projectTypes = ['projects', 'real-world_projects'];
  for (const type of projectTypes) {
    if (data[type]) {
      data[type] = data[type].map(project => ({
        ...project,
        logo: project.logo ? `${baseUrl}images/${project.logo.split('/').pop()}` : project.logo // Corrected to use project.logo
      }));
    }
  }

  // Skills (for logos)
  if (data.skills) {
    data.skills = data.skills.map(skill => ({
      ...skill,
      logo: (skill.logo && skill.logo.includes('/')) ? `${baseUrl}images/logos/${skill.logo.split('/').pop()}` : skill.logo // Add check and process
    }));
  }


  return data as unknown as Data;
};

export default fetchData;
