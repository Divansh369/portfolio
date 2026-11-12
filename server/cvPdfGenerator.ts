import PDFDocument from 'pdfkit';
import fs from 'fs';

export interface GeneratePdfOptions {
  outputPath?: string;
}

/**
 * Builds an ATS-compliant, single-stream vector PDF directly from portfolio JSON data.
 * Designed strictly for recruiter clarity and automated ATS parsing:
 * - Linear single-column flow with Helvetica fonts natively parsed across Workday, Greenhouse, Lever, and Taleo.
 * - Zero consumer PC hardware specs; highlights production work, Udayan Care Play Store app, and Proxmox/Linux evolution.
 * - Dynamically reflects updates from public/data/portfolio.json.
 */
export function buildCvPdf(portfolioData: any): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: 34,
      bottom: 34,
      left: 36,
      right: 36,
    },
    info: {
      Title: `${portfolioData.profile?.name || 'Divansh Prasad'} - Curriculum Vitae`,
      Author: portfolioData.profile?.name || 'Divansh Prasad',
      Subject: 'Software Developer Resume - ATS Compliant',
      Keywords:
        'Software Developer, Databricks, Apache Spark, Python, FastAPI, Flutter, Proxmox VE, Linux, Docker Compose, Kubernetes, K3s',
      Creator: 'Portfolio CV Generator',
    },
    autoFirstPage: true,
  });

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - 72; // 36pt left/right margins
  const bottomLimit = pageHeight - 36;

  const primaryColor = '#111827';
  const headerBlue = '#0f3a68';
  const subtextColor = '#374151';
  const mutedColor = '#4b5563';
  const dividerColor = '#cbd5e1';

  const ensureSpace = (neededHeight: number) => {
    if (doc.y + neededHeight > bottomLimit) {
      doc.addPage();
    }
  };

  // Helper: Section Header
  const renderSectionHeader = (title: string) => {
    ensureSpace(78);
    doc.moveDown(0.35);
    const y = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(headerBlue)
      .text(title.toUpperCase(), 36, y, { characterSpacing: 0.7 });

    const lineY = doc.y + 1.5;
    doc
      .strokeColor(dividerColor)
      .lineWidth(0.75)
      .moveTo(36, lineY)
      .lineTo(36 + contentWidth, lineY)
      .stroke();

    doc.y = lineY + 4;
  };

  // Helper: Non-colliding 2-row header for Experience / Projects / Education
  const renderEntryHeader = (
    leftPrimary: string,
    leftSecondary: string,
    rightSecondary: string,
    rightPrimary: string,
    badge?: string,
    rightPrimaryLink?: string
  ) => {
    ensureSpace(36);
    const startY = doc.y;
    const leftWidth = contentWidth - 145;

    const cleanBadge = badge ? badge.replace('★ ', '').trim() : '';
    const primaryDisplay = cleanBadge ? `${leftPrimary} (${cleanBadge})` : leftPrimary;

    // Row 1 Left
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(primaryColor)
      .text(primaryDisplay, 36, startY, { width: leftWidth });
    const afterRow1LeftY = doc.y;

    // Row 1 Right
    if (rightPrimary) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(8)
        .fillColor(rightPrimaryLink ? '#1d4ed8' : mutedColor)
        .text(rightPrimary, 36, startY, {
          align: 'right',
          width: contentWidth,
          ...(rightPrimaryLink ? { link: rightPrimaryLink } : {}),
        });
    }
    const row2Y = Math.max(afterRow1LeftY, doc.y) + 1;

    // Row 2 Left
    if (leftSecondary) {
      doc
        .font('Helvetica')
        .fontSize(8.2)
        .fillColor(subtextColor)
        .text(leftSecondary, 36, row2Y, { width: leftWidth });
    }
    const afterRow2LeftY = doc.y;

    // Row 2 Right
    if (rightSecondary) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(8)
        .fillColor('#6b7280')
        .text(rightSecondary, 36, row2Y, {
          align: 'right',
          width: contentWidth,
        });
    }

    doc.y = Math.max(afterRow2LeftY, doc.y, row2Y + 9) + 1.5;
  };

  // Helper: Full-width bullet (prevents 1-char vertical column bug)
  const renderBullet = (text: string) => {
    const bulletHeight = doc.heightOfString(text, {
      width: contentWidth - 12,
      lineGap: 1.2,
    });
    ensureSpace(bulletHeight + 4);

    const bulletY = doc.y;
    doc
      .font('Helvetica')
      .fontSize(8.2)
      .fillColor('#1f2937')
      .text('•', 38, bulletY);

    doc
      .font('Helvetica')
      .fontSize(8.2)
      .fillColor('#1f2937')
      .text(text, 48, bulletY, {
        width: contentWidth - 12,
        lineGap: 1.2,
      });

    doc.y += 1.5;
  };

  // ==================== 1. HEADER & CONTACT ====================
  const profile = portfolioData.profile || {};
  const fullName = (profile.name || 'Divansh Prasad').toUpperCase();
  const roleHeadline = 'Software Engineer  |  Data Pipelines & Backend Infrastructure';

  doc
    .font('Helvetica-Bold')
    .fontSize(17)
    .fillColor(primaryColor)
    .text(fullName, { align: 'center', characterSpacing: 1.1 });

  doc.moveDown(0.15);

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(headerBlue)
    .text(roleHeadline, { align: 'center', characterSpacing: 0.35 });

  doc.moveDown(0.2);

  const linkedinDisplay = profile.linkedinUrl
    ? profile.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    : 'linkedin.com/in/divansh-prasad-893b05230';
  const githubDisplay = profile.githubUrl
    ? profile.githubUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    : 'github.com/Divansh369';

  const contactParts: string[] = [];
  if (profile.location) contactParts.push(profile.location);
  if (profile.email) contactParts.push(profile.email);
  if (profile.phone) contactParts.push(profile.phone);
  contactParts.push(githubDisplay);
  contactParts.push(linkedinDisplay);
  contactParts.push('diivvansh.com');

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(mutedColor)
    .text(contactParts.join('  |  '), 36, doc.y, {
      align: 'center',
      width: contentWidth,
    });

  doc.moveDown(0.35);
  const headerBottomY = doc.y;
  doc
    .strokeColor('#d1d5db')
    .lineWidth(0.6)
    .moveTo(36, headerBottomY)
    .lineTo(36 + contentWidth, headerBottomY)
    .stroke();
  doc.y = headerBottomY + 3;

  // ==================== 2. SUMMARY ====================
  renderSectionHeader('Summary');
  const summaryText =
    'Software Engineer at Daimler Truck Innovation Center India (DTICI) working on Databricks ETL pipelines for ~70,000 connected trucks, internal FastAPI and React web apps, and automated Over-The-Air (OTA) fleet data collection scripts validated on test rigs. Lead volunteer developer for Udayan Care NGO, shipping the bilingual FiT-UC mobile app on Google Play Store backed by self-hosted Proxmox LXC containers. Experienced advancing from bare-metal Debian, Kali, and Alpine Linux with Docker Compose to a 3-node Proxmox VE HA cluster with Proxmox Backup Server (PBS) and K3s routing.';

  doc
    .font('Helvetica')
    .fontSize(8.2)
    .fillColor('#1f2937')
    .text(summaryText, 36, doc.y, {
      width: contentWidth,
      lineGap: 1.5,
    });

  // ==================== 3. TECHNICAL SKILLS ====================
  renderSectionHeader('Technical Skills');

  const skillCats: Array<{ name: string; items: string[] }> =
    portfolioData.skills?.categories && portfolioData.skills.categories.length > 0
      ? portfolioData.skills.categories
      : [
          {
            name: 'Languages & Frameworks',
            items: ['Python', 'C++ & CUDA', 'SQL & PostgreSQL', 'Dart & Flutter', 'TypeScript & JavaScript', 'FastAPI & Node.js', 'React', 'Go', 'Java'],
          },
          {
            name: 'Big Data & Analytics',
            items: ['Databricks', 'Apache Spark', 'Delta Lake', 'OTA Fleet Data Collection', 'Pandas & NumPy', 'Scikit-learn & TensorFlow', 'Power BI', 'Apache Superset'],
          },
          {
            name: 'Linux & Infrastructure',
            items: ['Proxmox VE & PBS', 'Debian, Kali, Alpine Linux', 'Docker & Docker Compose', 'Kubernetes (K3s) & NGINX', 'MetalLB & Traefik', 'Tailscale & Cloudflare Tunnels', 'NocoDB, Redis, MinIO', 'Git'],
          },
        ];

  skillCats.forEach((cat) => {
    const cleanItems = cat.items.map((item) => item.replace(/\s*·\s*/g, ', '));
    const lineText = `${cat.name}: ${cleanItems.join(', ')}`;
    ensureSpace(doc.heightOfString(lineText, { width: contentWidth }) + 3);
    const y = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(8.2)
      .fillColor(primaryColor)
      .text(`${cat.name}: `, 36, y, { continued: true, width: contentWidth });

    doc
      .font('Helvetica')
      .fontSize(8.2)
      .fillColor(subtextColor)
      .text(cleanItems.join(', '), { width: contentWidth });

    doc.y += 1.5;
  });

  if (portfolioData.skills?.languages && portfolioData.skills.languages.length > 0) {
    const langY = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(8.2)
      .fillColor(primaryColor)
      .text('Spoken Languages: ', 36, langY, { continued: true, width: contentWidth });
    doc
      .font('Helvetica')
      .fontSize(8.2)
      .fillColor(subtextColor)
      .text(portfolioData.skills.languages.join(', '), { width: contentWidth });
    doc.y += 1.5;
  }

  // ==================== 4. PROFESSIONAL EXPERIENCE ====================
  renderSectionHeader('Experience');

  const experiences = portfolioData.experience || [];
  experiences.forEach((exp: any) => {
    ensureSpace(48);
    renderEntryHeader(
      exp.role,
      exp.company,
      exp.location || 'India',
      exp.duration,
      exp.milestone
    );

    const bullets: string[] = exp.bulletPoints || [];
    bullets.forEach((bullet: string) => {
      renderBullet(bullet);
    });

    if (exp.skills && exp.skills.length > 0) {
      const stackText = `Tools: ${exp.skills.join(', ')}`;
      ensureSpace(14);
      doc
        .font('Helvetica-Oblique')
        .fontSize(7.5)
        .fillColor('#6b7280')
        .text(stackText, 48, doc.y, { width: contentWidth - 12 });
      doc.y += 2.5;
    } else {
      doc.y += 2;
    }
  });

  // ==================== 5. SELECTED PROJECTS & PROXMOX ARCHITECTURE ====================
  renderSectionHeader('Selected Projects & Virtualization');

  const realProjects = portfolioData.realWorldProjects || [];
  realProjects.slice(0, 4).forEach((proj: any) => {
    ensureSpace(44);
    const cleanUrl = proj.url && proj.url !== '#' ? proj.url.replace(/^https?:\/\//, '') : '';
    renderEntryHeader(
      proj.name,
      proj.category || 'Engineering Project',
      '',
      cleanUrl,
      proj.badge,
      proj.url && proj.url !== '#' ? proj.url : undefined
    );

    if (proj.details) {
      proj.details.split('|').forEach((pt: string) => {
        if (pt.trim()) renderBullet(pt.trim());
      });
    } else if (proj.description) {
      renderBullet(proj.description);
    }

    if (proj.stack) {
      const stackStr = proj.stack.split('|').join(', ');
      ensureSpace(12);
      doc
        .font('Helvetica-Oblique')
        .fontSize(7.5)
        .fillColor('#6b7280')
        .text(`Stack: ${stackStr}`, 48, doc.y, { width: contentWidth - 12 });
      doc.y += 2.5;
    }
  });

  // Include Proxmox VE & Bare-Metal Linux progression context directly if evolution exists
  const evolutionStages = portfolioData.homelab?.evolution || [];
  if (evolutionStages.length > 0) {
    ensureSpace(42);
    renderEntryHeader(
      'Proxmox VE HA Cluster & Linux Infrastructure',
      'Bare-Metal Linux -> Proxmox VE + PBS -> Consolidated PVE 8 & K3s',
      '',
      'pve.diivvansh.com',
      'Self-Hosted',
      portfolioData.profile?.pveConsoleUrl
    );
    renderBullet(
      'Started bare-metal on Debian, Kali, and Alpine Linux across spare laptops managed with Docker and Docker Compose.'
    );
    renderBullet(
      'Upgraded into a 3-node High-Availability (HA) Proxmox VE cluster with Corosync quorum plus a 4th laptop dedicated to Proxmox Backup Server (PBS) incremental snapshots.'
    );
    renderBullet(
      'Consolidated onto a primary Proxmox VE 8 server running production Udayan Care LXCs and a nested 6-node K3s cluster behind Tailscale and Cloudflare Tunnels.'
    );
  }

  // ==================== 6. EDUCATION ====================
  renderSectionHeader('Education');

  const educationList = portfolioData.education || [];
  educationList.forEach((edu: any) => {
    ensureSpace(26);
    renderEntryHeader(
      edu.degree,
      edu.institution,
      edu.gpa || '',
      edu.duration
    );
  });

  // ==================== 7. CERTIFICATIONS & INTERESTS ====================
  const certs = portfolioData.certificates || [];
  const interests = portfolioData.skills?.interests || [];
  if (certs.length > 0 || interests.length > 0) {
    renderSectionHeader('Certifications & Interests');

    if (certs.length > 0) {
      const certLine = certs.map((c: any) => `${c.name} (${c.date})`).join('  •  ');
      const y = doc.y;
      ensureSpace(doc.heightOfString(`Certifications: ${certLine}`, { width: contentWidth }) + 4);
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(primaryColor)
        .text('Certifications: ', 36, y, { continued: true, width: contentWidth });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(subtextColor)
        .text(certLine, { width: contentWidth, lineGap: 1.2 });
      doc.y += 2;
    }

    if (interests.length > 0) {
      const interestLine = interests.join(', ');
      const y = doc.y;
      ensureSpace(doc.heightOfString(`Interests: ${interestLine}`, { width: contentWidth }) + 4);
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(primaryColor)
        .text('Interests: ', 36, y, { continued: true, width: contentWidth });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(subtextColor)
        .text(interestLine, { width: contentWidth });
    }
  }

  doc.end();
  return doc;
}

/**
 * Generates and saves the PDF file to disk.
 */
export async function writeCvPdfToFile(portfolioJsonPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const raw = fs.readFileSync(portfolioJsonPath, 'utf8');
      const data = JSON.parse(raw);
      const doc = buildCvPdf(data);

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      writeStream.on('finish', () => {
        resolve(outputPath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}
