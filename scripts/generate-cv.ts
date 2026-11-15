import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveDocumentFileName, writeCvPdfToFile } from '../server/cvPdfGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const jsonPath = path.resolve(__dirname, '../public/data/portfolio.json');
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const portfolioData = JSON.parse(raw);

  const resumeFileName = resolveDocumentFileName(portfolioData, 'resume');
  const cvFileName = resolveDocumentFileName(portfolioData, 'cv');
  const resumeOutputPath = path.resolve(__dirname, '../public', resumeFileName);
  const cvOutputPath = path.resolve(__dirname, '../public', cvFileName);

  console.log(`Generating ATS Resume & CV PDFs from: ${jsonPath}`);
  await Promise.all([
    writeCvPdfToFile(jsonPath, resumeOutputPath, 'resume'),
    writeCvPdfToFile(jsonPath, cvOutputPath, 'cv'),
  ]);
  console.log(`Successfully generated 1-Page Resume at: ${resumeOutputPath}`);
  console.log(`Successfully generated Full CV at: ${cvOutputPath}`);
}

main().catch((err) => {
  console.error('Failed to generate ATS PDFs:', err);
  process.exit(1);
});
