import PDFDocument from 'pdfkit';
import fs from 'fs';

export type DocumentMode = 'resume' | 'cv';

export interface GeneratePdfOptions {
  outputPath?: string;
  mode?: DocumentMode;
}

/**
 * Resolves a safe PDF filename for CV mode from profile.cvFileName or profile.name.
 */
export function resolveCvFileName(portfolioData: any): string {
  const profile = portfolioData?.profile || {};
  if (profile.cvFileName && typeof profile.cvFileName === 'string') {
    return profile.cvFileName.endsWith('.pdf')
      ? profile.cvFileName
      : `${profile.cvFileName}.pdf`;
  }
  const cleanName = String(profile.name || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleanName ? `${cleanName}_CV.pdf` : 'Candidate_CV.pdf';
}

/**
 * Resolves a safe PDF filename for 1-page Resume mode from profile.resumeFileName or profile.name.
 */
export function resolveResumeFileName(portfolioData: any): string {
  const profile = portfolioData?.profile || {};
  if (profile.resumeFileName && typeof profile.resumeFileName === 'string') {
    return profile.resumeFileName.endsWith('.pdf')
      ? profile.resumeFileName
      : `${profile.resumeFileName}.pdf`;
  }
  const cleanName = String(profile.name || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleanName ? `${cleanName}_Resume.pdf` : 'Candidate_Resume.pdf';
}

export function resolveDocumentFileName(portfolioData: any, mode: DocumentMode): string {
  return mode === 'resume'
    ? resolveResumeFileName(portfolioData)
    : resolveCvFileName(portfolioData);
}

/**
 * Builds an ATS-compliant, single-column linear vector PDF from portfolio.json.
 * Supports two distinct modes:
 * - 'resume': Tight, high-impact 1-page US Letter executive resume tuned for automated ATS extraction.
 * - 'cv': Comprehensive multi-page academic & technical curriculum vitae including full history, infrastructure lab, and credentials.
 *
 * ATS Formatting Guarantees:
 * - Strictly sequential left-to-right text stream (zero overlapping right-aligned columns sharing Y baselines).
 * - Unified bullet strings (`•  ...`) emitted in single text calls so parsers never drop bullet associations.
 * - Explicit labeled contact rows with clickable mailto/https annotations for LinkedIn, GitHub, and portfolio links.
 */
export function buildDocumentPdf(
  portfolioData: any,
  mode: DocumentMode = 'cv'
): PDFKit.PDFDocument {
  const profile = portfolioData?.profile || {};
  const cvConfig = portfolioData?.cv || {};
  const authorName = profile.name || 'Candidate';
  const isResume = mode === 'resume';

  const marginX = isResume ? 32 : 36;
  const marginY = isResume ? 24 : 34;

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: marginY,
      bottom: marginY,
      left: marginX,
      right: marginX,
    },
    info: {
      Title: `${authorName} - ${isResume ? 'Resume' : 'Curriculum Vitae'}`,
      Author: authorName,
      Subject: `${profile.resumeHeadline || profile.title || 'Software Engineer'} - ATS Compliant ${
        isResume ? 'Resume' : 'CV'
      }`,
      Keywords:
        cvConfig.keywords ||
        'Software Engineer, Backend, Data Pipelines, Cloud Infrastructure, Full-Stack',
      Creator: 'Modular Portfolio ATS Document Engine',
    },
    autoFirstPage: true,
  });

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - marginY;

  const primaryColor = '#111827';
  const headerBlue = '#0f3a68';
  const linkBlue = '#1d4ed8';
  const subtextColor = '#374151';
  const mutedColor = '#4b5563';
  const dividerColor = '#cbd5e1';

  const bodySize = isResume ? 7.6 : 8.2;
  const subSize = isResume ? 7.4 : 7.9;
  const metaSize = isResume ? 7.1 : 7.6;
  const entryTitleSize = isResume ? 8.3 : 9.0;
  const sectionTitleSize = isResume ? 8.6 : 9.5;
  const bulletLineGap = isResume ? 0.6 : 1.2;

  const ensureSpace = (neededHeight: number) => {
    if (isResume) return; // Single-page resume fits cleanly on 1 Letter page
    if (doc.y + neededHeight > bottomLimit) {
      doc.addPage();
    }
  };

  // Helper: Standard uppercase ATS section header with subtle horizontal rule
  const renderSectionHeader = (title: string) => {
    ensureSpace(isResume ? 36 : 72);
    doc.moveDown(isResume ? 0.2 : 0.35);
    const y = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(sectionTitleSize)
      .fillColor(headerBlue)
      .text(title.toUpperCase(), marginX, y, { characterSpacing: 0.65 });

    const lineY = doc.y + (isResume ? 1 : 1.5);
    doc
      .strokeColor(dividerColor)
      .lineWidth(0.75)
      .moveTo(marginX, lineY)
      .lineTo(marginX + contentWidth, lineY)
      .stroke();

    doc.y = lineY + (isResume ? 2.5 : 4);
  };

  // Helper: Strictly linear single-column entry header (Zero overlapping right-aligned X coordinates)
  const renderLinearEntryHeader = (options: {
    primary: string;
    secondary?: string;
    location?: string;
    dateOrLink?: string;
    dateOrLinkUrl?: string;
    badge?: string;
  }) => {
    ensureSpace(isResume ? 26 : 44);
    const cleanBadge = options.badge ? options.badge.replace('★ ', '').trim() : '';
    const primaryLine = cleanBadge ? `${options.primary} (${cleanBadge})` : options.primary;

    // Row 1: Primary Role/Title + Badge (left-to-right linear)
    doc
      .font('Helvetica-Bold')
      .fontSize(entryTitleSize)
      .fillColor(primaryColor)
      .text(primaryLine, marginX, doc.y, {
        width: contentWidth,
      });

    // Row 2: Organization · Location | Duration/Link (strictly inline left-to-right for 100% ATS stream fidelity)
    const metaSegments: string[] = [];
    if (options.secondary) metaSegments.push(options.secondary);
    if (options.location) metaSegments.push(options.location);

    const hasInlineMeta = metaSegments.length > 0 || Boolean(options.dateOrLink);
    if (hasInlineMeta) {
      const prefixStr = metaSegments.join('  ·  ');
      const y = doc.y + 0.5;
      if (prefixStr && options.dateOrLink) {
        doc
          .font('Helvetica')
          .fontSize(subSize)
          .fillColor(subtextColor)
          .text(`${prefixStr}  |  `, marginX, y, { continued: true, width: contentWidth });
        doc
          .font('Helvetica-Oblique')
          .fontSize(subSize)
          .fillColor(options.dateOrLinkUrl ? linkBlue : mutedColor)
          .text(options.dateOrLink, {
            width: contentWidth,
            ...(options.dateOrLinkUrl ? { link: options.dateOrLinkUrl } : {}),
          });
      } else if (prefixStr) {
        doc
          .font('Helvetica')
          .fontSize(subSize)
          .fillColor(subtextColor)
          .text(prefixStr, marginX, y, { width: contentWidth });
      } else if (options.dateOrLink) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(subSize)
          .fillColor(options.dateOrLinkUrl ? linkBlue : mutedColor)
          .text(options.dateOrLink, marginX, y, {
            width: contentWidth,
            ...(options.dateOrLinkUrl ? { link: options.dateOrLinkUrl } : {}),
          });
      }
    }

    doc.y += isResume ? 1.2 : 2;
  };

  // Helper: Unified single-stream bullet point
  const renderBullet = (text: string) => {
    const bulletStr = `•  ${text}`;
    const bulletHeight = doc.heightOfString(bulletStr, {
      width: contentWidth - 8,
      lineGap: bulletLineGap,
    });
    ensureSpace(bulletHeight + 3);

    doc
      .font('Helvetica')
      .fontSize(bodySize)
      .fillColor('#1f2937')
      .text(bulletStr, marginX + 6, doc.y, {
        width: contentWidth - 8,
        lineGap: bulletLineGap,
      });

    doc.y += isResume ? 0.6 : 1.4;
  };

  // ==================== 1. HEADER & EXPLICIT CONTACT ROWS ====================
  const fullName = authorName.toUpperCase();
  const roleHeadline = profile.resumeHeadline || profile.title || 'Software Engineer';

  doc
    .font('Helvetica-Bold')
    .fontSize(isResume ? 15 : 17)
    .fillColor(primaryColor)
    .text(fullName, marginX, doc.y, {
      align: 'center',
      width: contentWidth,
      characterSpacing: 1.0,
    });

  doc.moveDown(0.08);

  doc
    .font('Helvetica-Bold')
    .fontSize(isResume ? 8.3 : 9.0)
    .fillColor(headerBlue)
    .text(roleHeadline, marginX, doc.y, {
      align: 'center',
      width: contentWidth,
      characterSpacing: 0.3,
    });

  doc.moveDown(0.14);

  const primaryDomain =
    Array.isArray(profile.domains) && profile.domains.length > 0 ? profile.domains[0] : '';
  const linkedinHref = profile.linkedinUrl ? String(profile.linkedinUrl).trim() : '';
  const linkedinDisplay = linkedinHref
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '');
  const githubHref = profile.githubUrl ? String(profile.githubUrl).trim() : '';
  const githubDisplay = githubHref.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  // Row A: Location | Email | Phone (explicit readable contact line)
  const contactRowA: Array<{ text: string; link?: string }> = [];
  if (profile.location) contactRowA.push({ text: profile.location });
  if (profile.email) contactRowA.push({ text: profile.email, link: `mailto:${profile.email}` });
  if (profile.phone) contactRowA.push({ text: profile.phone });

  if (contactRowA.length > 0) {
    doc.font('Helvetica').fontSize(metaSize).fillColor(mutedColor);
    const totalLine = contactRowA.map((c) => c.text).join('  |  ');
    const approxWidth = doc.widthOfString(totalLine);
    const startX = Math.max(marginX, marginX + (contentWidth - approxWidth) / 2);
    const rowY = doc.y;

    let cursorWritten = false;
    contactRowA.forEach((part, idx) => {
      const suffix = idx < contactRowA.length - 1 ? '  |  ' : '';
      const opts: PDFKit.Mixins.TextOptions = {
        continued: idx < contactRowA.length - 1 || Boolean(suffix),
        ...(part.link ? { link: part.link } : {}),
      };
      if (!cursorWritten) {
        doc.fillColor(part.link ? linkBlue : mutedColor).text(part.text, startX, rowY, opts);
        cursorWritten = true;
      } else {
        doc.fillColor(part.link ? linkBlue : mutedColor).text(part.text, opts);
      }
      if (suffix) {
        doc.fillColor(mutedColor).text(suffix, { continued: idx < contactRowA.length - 1 });
      }
    });
    doc.y += isResume ? 0.5 : 1;
  }

  // Row B: Explicit LinkedIn, GitHub & Web Links (ensures ATS parsers never miss LinkedIn)
  const contactRowB: Array<{ label: string; text: string; link?: string }> = [];
  if (linkedinDisplay) {
    contactRowB.push({
      label: 'LinkedIn: ',
      text: linkedinDisplay,
      link: linkedinHref.startsWith('http') ? linkedinHref : `https://${linkedinDisplay}`,
    });
  }
  if (githubDisplay) {
    contactRowB.push({
      label: 'GitHub: ',
      text: githubDisplay,
      link: githubHref.startsWith('http') ? githubHref : `https://${githubDisplay}`,
    });
  }
  if (primaryDomain) {
    contactRowB.push({
      label: 'Portfolio: ',
      text: primaryDomain,
      link: primaryDomain.startsWith('http') ? primaryDomain : `https://${primaryDomain}`,
    });
  }

  if (contactRowB.length > 0) {
    doc.font('Helvetica').fontSize(metaSize);
    const fullRowB = contactRowB.map((c) => `${c.label}${c.text}`).join('  |  ');
    const approxWidth = doc.widthOfString(fullRowB);
    const startX = Math.max(marginX, marginX + (contentWidth - approxWidth) / 2);
    const rowY = doc.y;

    contactRowB.forEach((item, idx) => {
      const isLast = idx === contactRowB.length - 1;
      if (idx === 0) {
        doc.fillColor(mutedColor).text(item.label, startX, rowY, { continued: true });
      } else {
        doc.fillColor(mutedColor).text(item.label, { continued: true });
      }
      doc.fillColor(linkBlue).text(item.text, {
        continued: !isLast,
        ...(item.link ? { link: item.link } : {}),
      });
      if (!isLast) {
        doc.fillColor(mutedColor).text('  |  ', { continued: true });
      }
    });
  }

  doc.moveDown(isResume ? 0.2 : 0.35);
  const headerBottomY = doc.y;
  doc
    .strokeColor(dividerColor)
    .lineWidth(0.6)
    .moveTo(marginX, headerBottomY)
    .lineTo(marginX + contentWidth, headerBottomY)
    .stroke();
  doc.y = headerBottomY + (isResume ? 2 : 3);

  // ==================== 2. SUMMARY ====================
  const rawSummary: string = isResume
    ? profile.resumeSummary || profile.summary || ''
    : profile.summary || (Array.isArray(portfolioData.about) ? portfolioData.about.join(' ') : '');

  if (rawSummary) {
    renderSectionHeader('Summary');
    doc
      .font('Helvetica')
      .fontSize(bodySize)
      .fillColor('#1f2937')
      .text(rawSummary, marginX, doc.y, {
        width: contentWidth,
        lineGap: isResume ? 0.7 : 1.4,
      });
  }

  // ==================== 3. TECHNICAL SKILLS ====================
  const skillCats: Array<{ name: string; items: string[] }> =
    portfolioData.skills?.categories || [];

  if (skillCats.length > 0) {
    renderSectionHeader('Skills');

    skillCats.forEach((cat) => {
      const cleanItems = (cat.items || []).map((item) => item.replace(/\s*·\s*/g, ', '));
      const lineText = `${cat.name}: ${cleanItems.join(', ')}`;
      ensureSpace(doc.heightOfString(lineText, { width: contentWidth }) + 3);
      const y = doc.y;
      doc
        .font('Helvetica-Bold')
        .fontSize(bodySize)
        .fillColor(primaryColor)
        .text(`${cat.name}: `, marginX, y, { continued: true, width: contentWidth });

      doc
        .font('Helvetica')
        .fontSize(bodySize)
        .fillColor(subtextColor)
        .text(cleanItems.join(', '), { width: contentWidth });

      doc.y += isResume ? 0.6 : 1.4;
    });

    if (!isResume && portfolioData.skills?.languages && portfolioData.skills.languages.length > 0) {
      const langY = doc.y;
      doc
        .font('Helvetica-Bold')
        .fontSize(bodySize)
        .fillColor(primaryColor)
        .text('Spoken Languages: ', marginX, langY, { continued: true, width: contentWidth });
      doc
        .font('Helvetica')
        .fontSize(bodySize)
        .fillColor(subtextColor)
        .text(portfolioData.skills.languages.join(', '), { width: contentWidth });
      doc.y += 1.4;
    }
  }

  // ==================== 4. PROFESSIONAL EXPERIENCE ====================
  const allExperiences: any[] = portfolioData.experience || [];
  const maxExperiences = isResume
    ? typeof cvConfig.maxExperiencesInResume === 'number'
      ? cvConfig.maxExperiencesInResume
      : 5
    : allExperiences.length;
  const experiences = allExperiences.slice(0, maxExperiences);

  if (experiences.length > 0) {
    renderSectionHeader('Experience');

    experiences.forEach((exp: any) => {
      ensureSpace(isResume ? 30 : 48);
      renderLinearEntryHeader({
        primary: exp.role,
        secondary: exp.company,
        location: exp.location || '',
        dateOrLink: exp.duration,
        badge: exp.milestone,
      });

      const bullets: string[] = Array.isArray(exp.bulletPoints) ? exp.bulletPoints : [];
      const shownBullets = isResume ? bullets.slice(0, 2) : bullets;
      shownBullets.forEach((bullet: string) => {
        renderBullet(bullet);
      });

      if (exp.skills && exp.skills.length > 0) {
        const shownSkills = isResume ? exp.skills.slice(0, 6) : exp.skills;
        const stackText = `Tools: ${shownSkills.join(', ')}`;
        ensureSpace(12);
        doc
          .font('Helvetica-Oblique')
          .fontSize(metaSize)
          .fillColor('#6b7280')
          .text(stackText, marginX + 6, doc.y, { width: contentWidth - 8 });
        doc.y += isResume ? 1.4 : 2.5;
      } else {
        doc.y += isResume ? 1.2 : 2;
      }
    });
  }

  // ==================== 5. SELECTED PROJECTS & INFRASTRUCTURE ====================
  const rawProjects: any[] = portfolioData.realWorldProjects || [];
  const maxProjects = isResume
    ? typeof cvConfig.maxProjectsInResume === 'number'
      ? cvConfig.maxProjectsInResume
      : 3
    : typeof cvConfig.maxProjectsInCv === 'number'
    ? cvConfig.maxProjectsInCv
    : 4;

  const activeProjects = rawProjects
    .filter(
      (p) => p.status !== 'hidden' && p.status !== 'archived' && p.status !== 'unmaintained'
    )
    .map((p, idx) => ({ p, idx }))
    .sort((a, b) => {
      const aFeat = a.p.featured ? 0 : 1;
      const bFeat = b.p.featured ? 0 : 1;
      if (aFeat !== bFeat) return aFeat - bFeat;
      const aPrio = typeof a.p.priority === 'number' ? a.p.priority : a.idx + 100;
      const bPrio = typeof b.p.priority === 'number' ? b.p.priority : b.idx + 100;
      if (aPrio !== bPrio) return aPrio - bPrio;
      return a.idx - b.idx;
    })
    .map((entry) => entry.p)
    .slice(0, maxProjects);

  const evolutionStages = portfolioData.homelab?.evolution || [];
  const includeHomelab = isResume
    ? cvConfig.includeHomelabInResume === true && evolutionStages.length > 0
    : cvConfig.includeHomelabInCv !== false && evolutionStages.length > 0;

  if (activeProjects.length > 0 || includeHomelab) {
    renderSectionHeader(
      isResume
        ? 'Key Projects'
        : cvConfig.projectsSectionTitle || 'Selected Projects & Infrastructure'
    );

    activeProjects.forEach((proj: any) => {
      ensureSpace(isResume ? 26 : 44);
      const cleanUrl = proj.url && proj.url !== '#' ? proj.url.replace(/^https?:\/\//, '') : '';
      renderLinearEntryHeader({
        primary: proj.name,
        secondary: proj.category || 'Engineering Project',
        dateOrLink: cleanUrl,
        dateOrLinkUrl: proj.url && proj.url !== '#' ? proj.url : undefined,
        badge: proj.badge,
      });

      if (proj.details) {
        const pts = String(proj.details)
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean);
        const shownPts = isResume ? pts.slice(0, 2) : pts;
        shownPts.forEach((pt: string) => renderBullet(pt));
      } else if (proj.description) {
        renderBullet(proj.description);
      }

      if (proj.stack) {
        const stackItems = String(proj.stack)
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean);
        const shownStack = isResume ? stackItems.slice(0, 5) : stackItems;
        ensureSpace(12);
        doc
          .font('Helvetica-Oblique')
          .fontSize(metaSize)
          .fillColor('#6b7280')
          .text(`Stack: ${shownStack.join(', ')}`, marginX + 6, doc.y, {
            width: contentWidth - 8,
          });
        doc.y += isResume ? 1.2 : 2.5;
      }
    });

    if (includeHomelab) {
      ensureSpace(42);
      const homelabTitle =
        cvConfig.homelabCvTitle || 'Self-Hosted Infrastructure & Virtualization';
      const homelabSubtitle =
        cvConfig.homelabCvSubtitle ||
        evolutionStages.map((s: any) => s.title).slice(0, 3).join(' -> ');
      const homelabLinkUrl =
        profile.primaryConsoleUrl ||
        (cvConfig.homelabCvLink ? `https://${cvConfig.homelabCvLink}` : '');
      const homelabDisplay =
        cvConfig.homelabCvLink ||
        (homelabLinkUrl ? String(homelabLinkUrl).replace(/^https?:\/\//, '') : '');

      renderLinearEntryHeader({
        primary: homelabTitle,
        secondary: homelabSubtitle,
        dateOrLink: homelabDisplay,
        dateOrLinkUrl: homelabLinkUrl || undefined,
        badge: 'Self-Hosted',
      });

      const bullets: string[] =
        Array.isArray(cvConfig.homelabCvBullets) && cvConfig.homelabCvBullets.length > 0
          ? cvConfig.homelabCvBullets
          : evolutionStages.map((s: any) => `${s.stage}: ${s.summary}`);

      (isResume ? bullets.slice(0, 2) : bullets).forEach((bullet: string) => renderBullet(bullet));
    }
  }

  // ==================== 6. EDUCATION ====================
  const allEducation: any[] = portfolioData.education || [];
  const shownEducation = isResume ? allEducation.slice(0, 1) : allEducation;
  if (shownEducation.length > 0) {
    renderSectionHeader('Education');

    shownEducation.forEach((edu: any) => {
      ensureSpace(24);
      renderLinearEntryHeader({
        primary: edu.degree,
        secondary: `${edu.institution}${edu.gpa ? `  ·  ${edu.gpa}` : ''}`,
        dateOrLink: edu.duration,
      });
    });
  }

  // ==================== 7. CERTIFICATIONS & INTERESTS ====================
  const certs = portfolioData.certificates || [];
  const interests = portfolioData.skills?.interests || [];
  const showCerts = isResume ? cvConfig.includeCertsInResume !== false && certs.length > 0 : certs.length > 0;
  const showInterests = isResume ? cvConfig.includeInterestsInResume === true && interests.length > 0 : interests.length > 0;

  if (showCerts || showInterests) {
    renderSectionHeader(showInterests ? 'Certifications & Interests' : 'Certifications');

    if (showCerts) {
      const certLine = certs.map((c: any) => `${c.name} (${c.date})`).join('  •  ');
      const y = doc.y;
      ensureSpace(doc.heightOfString(`Certifications: ${certLine}`, { width: contentWidth }) + 4);
      doc
        .font('Helvetica-Bold')
        .fontSize(bodySize)
        .fillColor(primaryColor)
        .text('Certifications: ', marginX, y, { continued: true, width: contentWidth });
      doc
        .font('Helvetica')
        .fontSize(bodySize)
        .fillColor(subtextColor)
        .text(certLine, { width: contentWidth, lineGap: 1.0 });
      doc.y += 1.5;
    }

    if (showInterests) {
      const interestLine = interests.join(', ');
      const y = doc.y;
      ensureSpace(doc.heightOfString(`Interests: ${interestLine}`, { width: contentWidth }) + 4);
      doc
        .font('Helvetica-Bold')
        .fontSize(bodySize)
        .fillColor(primaryColor)
        .text('Interests: ', marginX, y, { continued: true, width: contentWidth });
      doc
        .font('Helvetica')
        .fontSize(bodySize)
        .fillColor(subtextColor)
        .text(interestLine, { width: contentWidth });
    }
  }

  doc.end();
  return doc;
}

/**
 * Backwards-compatible alias that builds full Curriculum Vitae PDF.
 */
export function buildCvPdf(portfolioData: any): PDFKit.PDFDocument {
  return buildDocumentPdf(portfolioData, 'cv');
}

/**
 * Generates and saves the PDF file to disk.
 */
export async function writeCvPdfToFile(
  portfolioJsonPath: string,
  outputPath?: string,
  mode: DocumentMode = 'cv'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const raw = fs.readFileSync(portfolioJsonPath, 'utf8');
      const data = JSON.parse(raw);
      const targetPath = outputPath || `public/${resolveDocumentFileName(data, mode)}`;
      const doc = buildDocumentPdf(data, mode);

      const writeStream = fs.createWriteStream(targetPath);
      doc.pipe(writeStream);

      writeStream.on('finish', () => {
        resolve(targetPath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}
