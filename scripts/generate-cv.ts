import path from 'path';
import { fileURLToPath } from 'url';
import { writeCvPdfToFile } from '../server/cvPdfGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const jsonPath = path.resolve(__dirname, '../public/data/portfolio.json');
  const outputPath = path.resolve(__dirname, '../public/Divansh_Prasad_CV.pdf');

  console.log(`Generating ATS CV PDF from: ${jsonPath}`);
  await writeCvPdfToFile(jsonPath, outputPath);
  console.log(`Successfully generated ATS-compliant CV at: ${outputPath}`);
}

main().catch((err) => {
  console.error('Failed to generate CV PDF:', err);
  process.exit(1);
});
