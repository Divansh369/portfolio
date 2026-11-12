import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { buildCvPdf, writeCvPdfToFile } from './server/cvPdfGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Direct JSON API endpoint for modular data
  app.get('/api/portfolio', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public/data/portfolio.json'));
  });

  // Dynamic ATS-Compliant CV PDF endpoint (Always fresh from portfolio.json)
  app.get(['/api/cv.pdf', '/api/resume.pdf'], (req, res) => {
    try {
      const jsonPath = path.resolve(__dirname, 'public/data/portfolio.json');
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const portfolioData = JSON.parse(raw);

      const isInline = req.query.view === 'inline';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${isInline ? 'inline' : 'attachment'}; filename="Divansh_Prasad_CV.pdf"`
      );
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Cache-Control', 'no-cache');

      const doc = buildCvPdf(portfolioData);
      doc.pipe(res);
    } catch (err) {
      console.error('Failed generating CV PDF:', err);
      res.status(500).json({ error: 'Failed to generate ATS CV PDF' });
    }
  });

  // Dedicated direct file download endpoint using Express res.download()
  app.get(['/api/cv-download', '/api/download-cv'], (_req, res) => {
    const staticPdfPath = path.resolve(__dirname, 'public/Divansh_Prasad_CV.pdf');
    res.download(staticPdfPath, 'Divansh_Prasad_CV.pdf', (err) => {
      if (err) {
        console.error('Direct download error:', err);
        // Fallback: generate and pipe
        try {
          const jsonPath = path.resolve(__dirname, 'public/data/portfolio.json');
          const raw = fs.readFileSync(jsonPath, 'utf8');
          const doc = buildCvPdf(JSON.parse(raw));
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename="Divansh_Prasad_CV.pdf"');
          doc.pipe(res);
        } catch (pipeErr) {
          res.status(500).send('Error generating CV PDF');
        }
      }
    });
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
    
    // Automatically generate/refresh static ATS CV PDF from portfolio.json on startup
    const jsonPath = path.resolve(__dirname, 'public/data/portfolio.json');
    const staticPdfPath = path.resolve(__dirname, 'public/Divansh_Prasad_CV.pdf');
    writeCvPdfToFile(jsonPath, staticPdfPath)
      .then(() => console.log('ATS CV PDF verified and updated at /Divansh_Prasad_CV.pdf'))
      .catch((err) => console.warn('Warning: initial CV PDF generation failed:', err));
  });
}

startServer();
