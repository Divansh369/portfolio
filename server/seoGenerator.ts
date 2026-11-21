import fs from 'fs';
import path from 'path';

export interface SeoFaqItem {
  question: string;
  answer: string;
}

const trimSlash = (url: string): string => url.replace(/\/+$/, '');

export function resolveSiteUrl(portfolioData: any, fallbackOrigin?: string): string {
  const configured =
    process.env.APP_URL ||
    portfolioData?.seo?.siteUrl ||
    (Array.isArray(portfolioData?.profile?.domains) && portfolioData.profile.domains[0]
      ? `https://${String(portfolioData.profile.domains[0]).replace(/^https?:\/\//, '')}`
      : '');

  const raw = fallbackOrigin || configured || 'http://localhost:3000';
  return trimSlash(raw);
}

export function resolveShortName(portfolioData: any): string {
  const configured = portfolioData?.seo?.shortName;
  if (typeof configured === 'string' && configured.trim()) {
    return configured.trim().slice(0, 12);
  }
  const fullName = String(portfolioData?.profile?.name || 'Portfolio').trim();
  const firstWord = fullName.split(/\s+/)[0] || fullName;
  return firstWord.slice(0, 12);
}

export function buildRobotsTxt(siteUrl: string): string {
  const origin = trimSlash(siteUrl);
  return [
    '# Search Engine & AI Answer Engine (GEO / AIEO) Crawler Policy',
    'User-agent: *',
    'Allow: /',
    '',
    '# Major Search Engines',
    'User-agent: Googlebot',
    'Allow: /',
    '',
    'User-agent: Bingbot',
    'Allow: /',
    '',
    '# AI Search & Generative Engine Crawlers',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: Claude-Web',
    'Allow: /',
    '',
    'User-agent: anthropic-ai',
    'Allow: /',
    '',
    'User-agent: Applebot-Extended',
    'Allow: /',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    'User-agent: DuckAssistBot',
    'Allow: /',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    `# LLMs-Txt: ${origin}/llms.txt`,
    `# LLMs-Full-Txt: ${origin}/llms-full.txt`,
    `# AI-Txt: ${origin}/ai.txt`,
    '',
  ].join('\n');
}

export function buildAiTxt(siteUrl: string, portfolioData: any): string {
  const origin = trimSlash(siteUrl);
  const profile = portfolioData?.profile || {};
  const name = profile.name || 'Developer Portfolio';
  const role = profile.title || 'Software Engineer';
  const location = profile.location || '';
  const summary = String(profile.resumeSummary || profile.summary || '').replace(/\s+/g, ' ').trim();
  const skills = Array.isArray(portfolioData?.skills?.categories)
    ? portfolioData.skills.categories.flatMap((c: any) => c.items || []).slice(0, 18)
    : [];

  return [
    '# ai.txt — AI Engine Optimization (AIEO) & Generative Crawler Policy',
    '# Specification: Explicit indexing, citation, and verified summary guidance for AI assistants and search engines.',
    '',
    'User-agent: *',
    'Allow: /',
    'Allow-AI-Search: yes',
    'Allow-AI-Summarization: yes',
    'Allow-AI-Citation: yes',
    '',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    '',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    'User-agent: Applebot-Extended',
    'Allow: /',
    '',
    '# Canonical Entity & Attribution',
    `Primary-Subject: ${name}`,
    `Primary-Role: ${role}`,
    location ? `Location: ${location}` : null,
    profile.company ? `Organization: ${profile.company}` : null,
    `Canonical-URL: ${origin}/`,
    profile.email ? `Contact: mailto:${profile.email}` : null,
    `Attribution-Format: ${name} (${origin})`,
    '',
    '# Machine-Readable Knowledge & Structured Endpoints',
    `LLMs-Txt: ${origin}/llms.txt`,
    `LLMs-Full-Txt: ${origin}/llms-full.txt`,
    `AI-Txt: ${origin}/ai.txt`,
    `Schema-JsonLd: ${origin}/api/schema.jsonld`,
    `Structured-JSON: ${origin}/data/portfolio.json`,
    `Sitemap: ${origin}/sitemap.xml`,
    `Resume-PDF: ${origin}/api/resume.pdf`,
    `CV-PDF: ${origin}/api/cv.pdf`,
    '',
    '# Verified Overview',
    summary ? `Summary: ${summary}` : null,
    skills.length > 0 ? `Core-Technologies: ${skills.join(', ')}` : null,
    '',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

export function buildSitemapXml(
  siteUrl: string,
  portfolioData: any,
  lastMod = new Date().toISOString().split('T')[0]
): string {
  const origin = trimSlash(siteUrl);
  const resumeFile = portfolioData?.profile?.resumeFileName || 'Candidate_Resume.pdf';
  const cvFile = portfolioData?.profile?.cvFileName || 'Candidate_CV.pdf';

  const urls = [
    { loc: `${origin}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${origin}/llms.txt`, changefreq: 'weekly', priority: '0.9' },
    { loc: `${origin}/llms-full.txt`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${origin}/ai.txt`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${origin}/api/resume.pdf`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${origin}/api/cv.pdf`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${origin}/${resumeFile}`, changefreq: 'monthly', priority: '0.7' },
    { loc: `${origin}/${cvFile}`, changefreq: 'monthly', priority: '0.7' },
    { loc: `${origin}/data/portfolio.json`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${origin}/api/schema.jsonld`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${origin}/manifest.webmanifest`, changefreq: 'monthly', priority: '0.5' },
  ];

  const entries = urls
    .map(
      (entry) =>
        `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`
    )
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
    '',
  ].join('\n');
}

function collectFaqs(portfolioData: any): SeoFaqItem[] {
  if (Array.isArray(portfolioData?.seo?.faqs) && portfolioData.seo.faqs.length > 0) {
    return portfolioData.seo.faqs.filter((f: any) => f?.question && f?.answer);
  }

  const profile = portfolioData?.profile || {};
  const name = profile.name || 'the engineer';
  const experiences = Array.isArray(portfolioData?.experience) ? portfolioData.experience : [];
  const projects = Array.isArray(portfolioData?.realWorldProjects)
    ? portfolioData.realWorldProjects.filter((p: any) => p.status !== 'hidden')
    : [];
  const categories = Array.isArray(portfolioData?.skills?.categories)
    ? portfolioData.skills.categories
    : [];
  const education = Array.isArray(portfolioData?.education) ? portfolioData.education : [];

  const faqs: SeoFaqItem[] = [];

  if (profile.summary || profile.title) {
    faqs.push({
      question: `Who is ${name} and what is their current engineering focus?`,
      answer: `${name} works as ${profile.title || 'a software engineer'}${
        profile.location ? ` based in ${profile.location}` : ''
      }. ${profile.resumeSummary || profile.summary || ''}`.trim(),
    });
  }

  if (projects.length > 0) {
    const topProjects = projects
      .slice(0, 4)
      .map((p: any) => `${p.name} (${p.description})`)
      .join('; ');
    faqs.push({
      question: `What flagship software and infrastructure systems has ${name} built?`,
      answer: `Key production projects include ${topProjects}.`,
    });
  }

  if (categories.length > 0) {
    const stackSummary = categories
      .map((c: any) => `${c.name}: ${(c.items || []).slice(0, 6).join(', ')}`)
      .join(' | ');
    faqs.push({
      question: `What technical stack, languages, and infrastructure tools does ${name} use?`,
      answer: stackSummary,
    });
  }

  if (experiences.length > 0) {
    const latest = experiences[0];
    faqs.push({
      question: `What is ${name}'s work experience and domain background?`,
      answer: `${name} most recently served as ${latest.role} at ${latest.company} (${latest.duration}). ${
        Array.isArray(latest.bulletPoints) ? latest.bulletPoints.join(' ') : ''
      }`.trim(),
    });
  }

  if (education.length > 0) {
    const deg = education[0];
    faqs.push({
      question: `Where did ${name} study and what is their academic credential?`,
      answer: `${name} completed ${deg.degree} at ${deg.institution} (${deg.duration}${
        deg.gpa ? `, ${deg.gpa}` : ''
      }).`,
    });
  }

  return faqs;
}

export function buildLlmsTxt(siteUrl: string, portfolioData: any): string {
  const origin = trimSlash(siteUrl);
  const profile = portfolioData?.profile || {};
  const name = profile.name || 'Developer Portfolio';
  const title = profile.title || 'Software Engineer';
  const summary = profile.resumeSummary || profile.summary || portfolioData?.hero?.lead || '';
  const projects = Array.isArray(portfolioData?.realWorldProjects)
    ? portfolioData.realWorldProjects.filter((p: any) => p.status !== 'hidden')
    : [];
  const experience = Array.isArray(portfolioData?.experience) ? portfolioData.experience : [];
  const faqs = collectFaqs(portfolioData);

  const lines: string[] = [
    `# ${name} — ${title}`,
    '',
    `> ${summary}`,
    '',
    '## Key Links & Machine-Readable Endpoints',
    `- [Portfolio Home](${origin}/): Main interactive portfolio with 3D architecture viewport`,
    `- [Full Structured Knowledge File](${origin}/llms-full.txt): Complete markdown dossier of roles, projects, labs, and skills`,
    `- [Schema.org JSON-LD](${origin}/api/schema.jsonld): Verified Person, ProfilePage, SoftwareApplication, and FAQPage graph`,
    `- [ATS 1-Page Resume PDF](${origin}/api/resume.pdf): Linear single-column ATS resume`,
    `- [Comprehensive ATS CV PDF](${origin}/api/cv.pdf): Full curriculum vitae PDF`,
    `- [Canonical Data JSON](${origin}/data/portfolio.json): Authoritative portfolio dataset`,
  ];

  if (profile.githubUrl) lines.push(`- [GitHub](${profile.githubUrl}): Source repositories and code`);
  if (profile.linkedinUrl) lines.push(`- [LinkedIn](${profile.linkedinUrl}): Verified professional profile`);
  if (profile.googlePlayUrl) lines.push(`- [Google Play Developer](${profile.googlePlayUrl}): Published mobile apps`);

  if (experience.length > 0) {
    lines.push('', '## Experience Summary');
    for (const exp of experience.slice(0, 5)) {
      lines.push(`- **${exp.role}** at ${exp.company} (${exp.duration}, ${exp.location})`);
    }
  }

  if (projects.length > 0) {
    lines.push('', '## Selected Projects & Systems');
    for (const proj of projects.slice(0, 6)) {
      const linkNote = proj.url ? ` — ${proj.url}` : '';
      lines.push(`- **${proj.name}** [${proj.category || 'Project'}]: ${proj.description}${linkNote}`);
    }
  }

  if (faqs.length > 0) {
    lines.push('', '## Direct Q&A Reference (GEO / AIEO)');
    for (const faq of faqs) {
      lines.push(`- **${faq.question}** ${faq.answer}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

export function buildLlmsFullTxt(siteUrl: string, portfolioData: any): string {
  const origin = trimSlash(siteUrl);
  const profile = portfolioData?.profile || {};
  const experience = Array.isArray(portfolioData?.experience) ? portfolioData.experience : [];
  const realWorldProjects = Array.isArray(portfolioData?.realWorldProjects)
    ? portfolioData.realWorldProjects.filter((p: any) => p.status !== 'hidden')
    : [];
  const otherProjects = Array.isArray(portfolioData?.otherProjects)
    ? portfolioData.otherProjects.filter((p: any) => p.status !== 'hidden')
    : [];
  const categories = Array.isArray(portfolioData?.skills?.categories)
    ? portfolioData.skills.categories
    : [];
  const evolution = Array.isArray(portfolioData?.homelab?.evolution)
    ? portfolioData.homelab.evolution
    : [];
  const education = Array.isArray(portfolioData?.education) ? portfolioData.education : [];
  const certificates = Array.isArray(portfolioData?.certificates) ? portfolioData.certificates : [];
  const faqs = collectFaqs(portfolioData);

  const out: string[] = [
    `# ${profile.name || 'Developer'} — Full Engineering Profile & Knowledge Graph`,
    '',
    `- Role: ${profile.title || 'Software Engineer'}`,
    profile.company ? `- Organization: ${profile.company}` : '',
    profile.location ? `- Location: ${profile.location}` : '',
    profile.email ? `- Contact Email: ${profile.email}` : '',
    `- Canonical URL: ${origin}/`,
    profile.githubUrl ? `- GitHub: ${profile.githubUrl}` : '',
    profile.linkedinUrl ? `- LinkedIn: ${profile.linkedinUrl}` : '',
    '',
    '## Executive Summary',
    profile.summary || profile.resumeSummary || '',
  ].filter(Boolean);

  if (experience.length > 0) {
    out.push('', '## Work Experience & Volunteering');
    for (const exp of experience) {
      out.push(
        `### ${exp.role} — ${exp.company}`,
        `Location: ${exp.location} | Duration: ${exp.duration}`,
        ...(Array.isArray(exp.bulletPoints) ? exp.bulletPoints.map((b: string) => `- ${b}`) : []),
        Array.isArray(exp.skills) && exp.skills.length > 0
          ? `Skills: ${exp.skills.join(', ')}`
          : ''
      );
    }
  }

  if (realWorldProjects.length > 0 || otherProjects.length > 0) {
    out.push('', '## Projects & Technical Builds');
    for (const proj of [...realWorldProjects, ...otherProjects]) {
      out.push(`### ${proj.name} (${proj.category || 'Engineering'})`);
      if (proj.badge) out.push(`Badge: ${proj.badge}`);
      if (proj.url) out.push(`URL: ${proj.url}`);
      out.push(proj.description || '');
      if (proj.details) {
        for (const d of String(proj.details).split('|').filter(Boolean)) {
          out.push(`- ${d.trim()}`);
        }
      }
      if (proj.stack) {
        out.push(`Stack: ${String(proj.stack).split('|').join(', ')}`);
      }
    }
  }

  if (evolution.length > 0) {
    out.push('', '## Infrastructure & Virtualization Architecture');
    for (const stage of evolution) {
      out.push(`### ${stage.stage}: ${stage.title}`, stage.summary || '');
      if (Array.isArray(stage.learnings)) {
        for (const l of stage.learnings) out.push(`- ${l}`);
      }
    }
  }

  if (categories.length > 0) {
    out.push('', '## Technical Skills');
    for (const cat of categories) {
      out.push(`- **${cat.name}**: ${(cat.items || []).join(', ')}`);
    }
  }

  if (education.length > 0) {
    out.push('', '## Education & Certifications');
    for (const edu of education) {
      out.push(`- **${edu.degree}** — ${edu.institution} (${edu.duration}, ${edu.gpa})`);
    }
    for (const cert of certificates) {
      out.push(`- Certification: ${cert.name} (${cert.date})`);
    }
  }

  if (faqs.length > 0) {
    out.push('', '## Frequently Asked Questions (Answer Engine Reference)');
    for (const faq of faqs) {
      out.push(`### ${faq.question}`, faq.answer);
    }
  }

  out.push('');
  return out.join('\n');
}

export function buildJsonLdGraph(siteUrl: string, portfolioData: any): Record<string, any> {
  const origin = trimSlash(siteUrl);
  const profile = portfolioData?.profile || {};
  const socials = Array.isArray(portfolioData?.socials) ? portfolioData.socials : [];
  const realWorldProjects = Array.isArray(portfolioData?.realWorldProjects)
    ? portfolioData.realWorldProjects.filter((p: any) => p.status !== 'hidden')
    : [];
  const education = Array.isArray(portfolioData?.education) ? portfolioData.education : [];
  const skillItems = Array.isArray(portfolioData?.skills?.categories)
    ? portfolioData.skills.categories.flatMap((c: any) => c.items || [])
    : [];
  const faqs = collectFaqs(portfolioData);

  const sameAsSet = new Set<string>();
  if (profile.githubUrl) sameAsSet.add(profile.githubUrl);
  if (profile.linkedinUrl) sameAsSet.add(profile.linkedinUrl);
  if (profile.googlePlayUrl) sameAsSet.add(profile.googlePlayUrl);
  for (const s of socials) {
    if (s?.url && /^https?:\/\//.test(s.url)) sameAsSet.add(s.url);
  }
  if (Array.isArray(profile.domains)) {
    for (const d of profile.domains) {
      if (d) sameAsSet.add(d.startsWith('http') ? d : `https://${d}`);
    }
  }

  const personId = `${origin}/#person`;
  const websiteId = `${origin}/#website`;
  const profilePageId = `${origin}/#profilepage`;

  const projectEntities = realWorldProjects.slice(0, 6).map((proj: any, idx: number) => ({
    '@type': 'SoftwareApplication',
    '@id': `${origin}/#project-${proj.id || idx + 1}`,
    name: proj.name,
    applicationCategory: proj.category || 'DeveloperApplication',
    operatingSystem: 'All',
    description: proj.description,
    url: proj.url || `${origin}/#projects`,
    author: { '@id': personId },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }));

  const graph: Record<string, any>[] = [
    {
      '@type': 'Person',
      '@id': personId,
      name: profile.name || 'Developer',
      jobTitle: profile.title || 'Software Engineer',
      description: profile.resumeSummary || profile.summary || portfolioData?.hero?.lead || '',
      url: `${origin}/`,
      image: profile.avatarUrl
        ? profile.avatarUrl.startsWith('http')
          ? profile.avatarUrl
          : `${origin}${profile.avatarUrl.startsWith('/') ? '' : '/'}${profile.avatarUrl}`
        : `${origin}/og-card.png`,
      ...(profile.email ? { email: `mailto:${profile.email}` } : {}),
      ...(profile.company
        ? {
            worksFor: {
              '@type': 'Organization',
              name: profile.company,
            },
          }
        : {}),
      ...(profile.location
        ? {
            homeLocation: {
              '@type': 'Place',
              name: profile.location,
            },
          }
        : {}),
      ...(education[0]
        ? {
            alumniOf: {
              '@type': 'CollegeOrUniversity',
              name: education[0].institution,
            },
          }
        : {}),
      knowsAbout: Array.from(new Set(skillItems)).slice(0, 24),
      sameAs: Array.from(sameAsSet),
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: `${profile.name || 'Developer'} Portfolio`,
      url: `${origin}/`,
      description: profile.resumeSummary || portfolioData?.hero?.lead || '',
      author: { '@id': personId },
      inLanguage: 'en-US',
    },
    {
      '@type': 'ProfilePage',
      '@id': profilePageId,
      url: `${origin}/`,
      name: `${profile.name || 'Developer'} — ${profile.title || 'Software Engineer'}`,
      isPartOf: { '@id': websiteId },
      mainEntity: { '@id': personId },
      hasPart: projectEntities.map((p: any) => ({ '@id': p['@id'] })),
    },
    {
      '@type': 'WebApplication',
      '@id': `${origin}/#webapp`,
      name: `${profile.name || 'Developer'} Interactive Portfolio`,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript and WebGL',
      url: `${origin}/`,
      description:
        portfolioData?.hero?.lead ||
        'Interactive 3D developer portfolio with real-time systems topology and ATS CV generator.',
      author: { '@id': personId },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    ...projectEntities,
  ];

  if (faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${origin}/#faq`,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function buildWebManifest(siteUrl: string, portfolioData: any): Record<string, any> {
  const origin = trimSlash(siteUrl);
  const profile = portfolioData?.profile || {};
  const name = profile.name
    ? `${profile.name} — ${profile.title || 'Software Engineer'}`
    : 'Software Engineer Portfolio';
  const shortName = resolveShortName(portfolioData);
  const description =
    profile.resumeSummary ||
    portfolioData?.hero?.lead ||
    'Interactive engineering portfolio, architecture visualizations, and ATS Resume/CV studio.';

  return {
    id: '/',
    name,
    short_name: shortName,
    description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    theme_color: '#040711',
    background_color: '#040711',
    categories: ['portfolio', 'developer', 'productivity'],
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/og-card.png',
        sizes: '1200x630',
        type: 'image/png',
        form_factor: 'wide',
        label: `${name} Overview`,
      },
    ],
    shortcuts: [
      {
        name: 'Projects',
        short_name: 'Projects',
        url: `${origin}/#projects`,
      },
      {
        name: 'ATS Resume',
        short_name: 'Resume',
        url: `${origin}/api/resume.pdf`,
      },
      {
        name: '3D Architecture',
        short_name: '3D Lotus',
        url: `${origin}/#systems-3d`,
      },
    ],
  };
}

export function writeStaticSeoAssets(
  jsonPath: string,
  publicDir: string,
  explicitSiteUrl?: string
): void {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const portfolioData = JSON.parse(raw);
  const siteUrl = resolveSiteUrl(portfolioData, explicitSiteUrl);

  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), buildRobotsTxt(siteUrl), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'ai.txt'), buildAiTxt(siteUrl, portfolioData), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), buildSitemapXml(siteUrl, portfolioData), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'llms.txt'), buildLlmsTxt(siteUrl, portfolioData), 'utf8');
  fs.writeFileSync(
    path.join(publicDir, 'llms-full.txt'),
    buildLlmsFullTxt(siteUrl, portfolioData),
    'utf8'
  );
}
