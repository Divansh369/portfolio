import path from 'path';
import { fileURLToPath } from 'url';
import { writeStaticSeoAssets } from '../server/seoGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../public/data/portfolio.json');
const publicDir = path.resolve(__dirname, '../public');

writeStaticSeoAssets(jsonPath, publicDir);
console.log('Generated static SEO / GEO / AIEO assets in public/: robots.txt, sitemap.xml, llms.txt, llms-full.txt');
