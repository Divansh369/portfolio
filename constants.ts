import Papa from "papaparse";
import { Data } from "./types";

const fetchData = async () => {
  const files = ["about", "certificates", "config", "contact", "education", "experience", "projects", "real-world_projects", "skills", "socials", "themes"];
  const data: { [key: string]: any[] } = {};

  for (const file of files) {
    const response = await fetch(`/data/${file}.csv`);
    const csv = await response.text();
    data[file] = Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
  }

  return data as unknown as Data;
};

export default fetchData;
