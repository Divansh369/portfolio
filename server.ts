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
import {
  buildAiTxt,
  buildJsonLdGraph,
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemapXml,
  buildWebManifest,
  resolveSiteUrl,
  writeStaticSeoAssets,
} from './server/seoGenerator.ts';

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

  const getRequestOrigin = (req: express.Request, portfolioData: any) => {
    const host = req.get('host');
    const requestUrl = host ? `${req.protocol}://${host}` : undefined;
    return resolveSiteUrl(portfolioData, process.env.APP_URL || requestUrl);
  };

  // Direct JSON API endpoint for modular data
  app.get('/api/portfolio', (_req, res) => {
    res.sendFile(jsonPath);
  });

  // Search Engine & Generative Engine (SEO / GEO / AIEO) dynamic endpoints
  app.get('/robots.txt', (req, res) => {
    try {
      const portfolioData = readPortfolioJson();
      const siteUrl = getRequestOrigin(req, portfolioData);
      res.type('text/plain; charset=utf-8').send(buildRobotsTxt(siteUrl));
    } catch {
      res.type('text/plain; charset=utf-8').send('User-agent: *\nAllow: /\n');
    }
  });

  app.get('/sitemap.xml', (req, res) => {
    try {
      const portfolioData = readPortfolioJson();
      const siteUrl = getRequestOrigin(req, portfolioData);
      res.type('application/xml; charset=utf-8').send(buildSitemapXml(siteUrl, portfolioData));
    } catch {
      res.status(500).send('Failed to generate sitemap');
    }
  });

  app.get(['/llms.txt', '/.well-known/llms.txt'], (req, res) => {
    try {
      const portfolioData = readPortfolioJson();
      const siteUrl = getRequestOrigin(req, portfolioData);
      res.type('text/plain; charset=utf-8').send(buildLlmsTxt(siteUrl, portfolioData));
    } catch {
      res.status(500).send('Failed to generate llms.txt');
    }
  });

  app.get('/llms-full.txt', (req, res) => {
    try {
      const portfolioData = readPortfolioJson();
      const siteUrl = getRequestOrigin(req, portfolioData);
      res.type('text/plain; charset=utf-8').send(buildLlmsFullTxt(siteUrl, portfolioData));
    } catch {
      res.status(500).send('Failed to generate llms-full.txt');
    }
  });

  app.get(['/ai.txt', '/.well-known/ai.txt'], (req, res) => {
    try {
      const portfolioData = readPortfolioJson();
      const siteUrl = getRequestOrigin(req, portfolioData);
      res.type('text/plain; charset=utf-8').send(buildAiTxt(siteUrl, portfolioData));
    } catch {
      res.status(500).send('Failed to generate ai.txt');
    }
  });

  app.get(['/api/schema.jsonld', '/api/ai-context.json'], (req, res) => {
    try {
      const portfolioData = readPortfolioJson();
      const siteUrl = getRequestOrigin(req, portfolioData);
      res
        .setHeader('Content-Type', 'application/ld+json; charset=utf-8')
        .send(JSON.stringify(buildJsonLdGraph(siteUrl, portfolioData), null, 2));
    } catch {
      res.status(500).json({ error: 'Failed to generate structured Schema.org graph' });
    }
  });

  app.get('/manifest.json', (req, res) => {
    try {
      const portfolioData = readPortfolioJson();
      const siteUrl = getRequestOrigin(req, portfolioData);
      res
        .setHeader('Content-Type', 'application/manifest+json; charset=utf-8')
        .send(JSON.stringify(buildWebManifest(siteUrl, portfolioData), null, 2));
    } catch {
      res.status(500).json({ error: 'Failed to generate Web App Manifest' });
    }
  });

  const streamPdf = (mode: DocumentMode, req: express.Request, res: express.Response) => {
    try {
      const portfolioData = readPortfolioJson();
      const roleId = typeof req.query.role === 'string' ? req.query.role.trim() : undefined;
      const fileName = resolveDocumentFileName(portfolioData, mode, roleId);

      const isInline = req.query.view === 'inline';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${isInline ? 'inline' : 'attachment'}; filename="${fileName}"`
      );
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Cache-Control', 'no-cache');

      const doc = buildDocumentPdf(portfolioData, mode, roleId);
      doc.pipe(res);
    } catch (err) {
      console.error(`Failed generating ${mode} PDF:`, err);
      res.status(500).json({ error: `Failed to generate ATS ${mode.toUpperCase()} PDF` });
    }
  };

  // Separate endpoints for 1-page Resume vs comprehensive CV (supports ?role=<roleId>)
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
      const roleId = typeof req.query.role === 'string' ? req.query.role.trim() : undefined;
      const portfolioData = readPortfolioJson();
      const fileName = resolveDocumentFileName(portfolioData, mode, roleId);
      const staticPdfPath = path.resolve(__dirname, 'public', fileName);

      if (roleId && roleId !== 'general') {
        const doc = buildDocumentPdf(portfolioData, mode, roleId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        doc.pipe(res);
        return;
      }

      res.download(staticPdfPath, fileName, (err) => {
        if (err) {
          console.error('Direct download error:', err);
          try {
            const doc = buildDocumentPdf(portfolioData, mode, roleId);
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

      writeStaticSeoAssets(jsonPath, path.resolve(__dirname, 'public'));

      Promise.all([
        writeCvPdfToFile(jsonPath, path.resolve(__dirname, 'public', resumeFileName), 'resume'),
        writeCvPdfToFile(jsonPath, path.resolve(__dirname, 'public', cvFileName), 'cv'),
      ])
        .then(() =>
          console.log(
            `ATS PDFs (${resumeFileName}, ${cvFileName}) & SEO/GEO files verified in /public`
          )
        )
        .catch((err) => console.warn('Warning: initial asset generation failed:', err));
    } catch (err) {
      console.warn('Warning: could not read portfolio.json for startup generation:', err);
    }
  });
}

startServer();
