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
  themes: Theme[];
}

export interface Theme {
  name: string;
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface About {
  "Full Name": string;
  "Short Description": string;
  "Long Description": string;
  "Profile Picture": string;
  "Resume Link": string;
  "Github Link": string;
}

export interface Certificate {
  Title: string;
  "Issue Date": string;
  "Issuing Organization": string;
  "Credential ID": string;
  "Credential URL": string;
  "Skills/Topics Covered": string;
  "Certificate Image": string;
}

export interface Config {
  key: string;
  value: string;
}

export interface Contact {
  "Contact Email": string;
  "Contact Phone": string;
  "Contact Message": string;
}

export interface Education {
  "Institution Name": string;
  "Degree Name": string;
  "Start Date": string;
  "End Date": string;
  "Courses Taken": string;
  "Institution Logo": string;
}

export interface Experience {
  "Company Name": string;
  "Job Title": string;
  "Start Date": string;
  "End Date": string;
  "Job Description": string;
  "Company Logo": string;
}

export interface Project {
  "Project Name": string;
  "Project Description": string;
  "Project Image": string;
  "Project Link": string;
  "Github Link": string;
  "Tech Stack": string;
}

export interface Skill {
  "Skill Name": string;
  "Skill Level": string;
  "Skill Category": string;
  "Skill Logo": string;
}

export interface Social {
  "Platform Name": string;
  "Profile URL": string;
  "Platform Logo": string;
}
