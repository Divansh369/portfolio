import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  buildDocumentPdf,
  DocumentMode,
  resolveDocumentFileName,
  writeCvPdfToFile,
} from './server/cvPdfGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const jsonPath = path.resolve(__dirname, 'public/data/portfolio.json');

  const readPortfolioJson = () => {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(raw);
  };

  // Direct JSON API endpoint for modular data
  app.get('/api/portfolio', (_req, res) => {
    res.sendFile(jsonPath);
  });

  const streamPdf = (mode: DocumentMode, req: express.Request, res: express.Response) => {
    try {
      const portfolioData = readPortfolioJson();
      const fileName = resolveDocumentFileName(portfolioData, mode);

      const isInline = req.query.view === 'inline';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${isInline ? 'inline' : 'attachment'}; filename="${fileName}"`
      );
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Cache-Control', 'no-cache');

      const doc = buildDocumentPdf(portfolioData, mode);
      doc.pipe(res);
    } catch (err) {
      console.error(`Failed generating ${mode} PDF:`, err);
      res.status(500).json({ error: `Failed to generate ATS ${mode.toUpperCase()} PDF` });
    }
  };

  // Separate endpoints for 1-page Resume vs comprehensive CV
  app.get('/api/resume.pdf', (req, res) => {
    const queryMode = req.query.mode === 'cv' ? 'cv' : 'resume';
    streamPdf(queryMode, req, res);
  });

  app.get('/api/cv.pdf', (req, res) => {
    const queryMode = req.query.mode === 'resume' ? 'resume' : 'cv';
    streamPdf(queryMode, req, res);
  });

  // Dedicated direct file download endpoint using Express res.download()
  app.get(['/api/cv-download', '/api/download-cv', '/api/resume-download'], (req, res) => {
    try {
      const mode: DocumentMode =
        req.path.includes('resume') || req.query.mode === 'resume' ? 'resume' : 'cv';
      const portfolioData = readPortfolioJson();
      const fileName = resolveDocumentFileName(portfolioData, mode);
      const staticPdfPath = path.resolve(__dirname, 'public', fileName);

      res.download(staticPdfPath, fileName, (err) => {
        if (err) {
          console.error('Direct download error:', err);
          try {
            const doc = buildDocumentPdf(portfolioData, mode);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            doc.pipe(res);
          } catch {
            res.status(500).send('Error generating PDF');
          }
        }
      });
    } catch {
      res.status(500).send('Error reading portfolio configuration');
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);

    try {
      const portfolioData = readPortfolioJson();
      const resumeFileName = resolveDocumentFileName(portfolioData, 'resume');
      const cvFileName = resolveDocumentFileName(portfolioData, 'cv');

      Promise.all([
        writeCvPdfToFile(jsonPath, path.resolve(__dirname, 'public', resumeFileName), 'resume'),
        writeCvPdfToFile(jsonPath, path.resolve(__dirname, 'public', cvFileName), 'cv'),
      ])
        .then(() =>
          console.log(`ATS PDFs verified and updated at /${resumeFileName} and /${cvFileName}`)
        )
        .catch((err) => console.warn('Warning: initial PDF generation failed:', err));
    } catch (err) {
      console.warn('Warning: could not read portfolio.json for startup PDF generation:', err);
    }
  });
}

startServer();
