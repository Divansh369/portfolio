export type DocumentMode = 'resume' | 'cv';

export interface RepeatedWordIssue {
  word: string;
  count: number;
  suggestions: string[];
}

export interface UnquantifiedBulletIssue {
  section: string;
  title: string;
  bullet: string;
}

export interface AtsContactCheck {
  label: string;
  present: boolean;
  value?: string;
}

export interface SixSecondCheck {
  id: string;
  label: string;
  category: 'Identity' | 'Impact' | 'Structure' | 'Brevity';
  passed: boolean;
  metricValue: string;
  guidance: string;
}

export interface SixSecondAuditReport {
  score: number;
  passedCount: number;
  totalCount: number;
  xyzCompliancePct: number;
  avgBulletWords: number;
  overlongBulletCount: number;
  summaryWordCount: number;
  checks: SixSecondCheck[];
}

export interface AtsAuditReport {
  mode: DocumentMode;
  totalBullets: number;
  quantifiedBullets: number;
  unquantifiedBullets: UnquantifiedBulletIssue[];
  repeatedWords: RepeatedWordIssue[];
  contactChecks: AtsContactCheck[];
  essentialSections: Array<{ label: string; present: boolean }>;
  estimatedSinglePageFit: boolean;
  wordCount: number;
  sixSecondAudit: SixSecondAuditReport;
}

export interface TextSegment {
  text: string;
  highlight: boolean;
}

const ACTION_VERB_SYNONYMS: Record<string, string[]> = {
  automated: ['coordinated', 'streamlined', 'scripted', 'scheduled'],
  automating: ['coordinating', 'streamlining', 'scripting', 'scheduling'],
  built: ['engineered', 'developed', 'architected', 'delivered'],
  created: ['designed', 'authored', 'launched', 'implemented'],
  managed: ['administered', 'operated', 'coordinated', 'maintained'],
  worked: ['collaborated', 'partnered', 'contributed', 'engineered'],
  validated: ['verified', 'benchmarked', 'tested', 'audited'],
  deployed: ['shipped', 'provisioned', 'rolled out', 'published'],
  processed: ['ingested', 'transformed', 'aggregated', 'computed'],
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'across', 'over', 'this', 'that',
  'using', 'via', 'inside', 'alongside', 'prior', 'before', 'after', 'through',
  'data', 'app', 'apps', 'daily', 'self', 'hosted', 'team', 'internal', 'live',
  'code', 'flow', 'user', 'users', 'work', 'system', 'systems', 'server', 'servers',
  'connected', 'fleet', 'project', 'projects', 'dashboards', 'dashboard', 'scripts',
  'power', 'apache', 'trucks', 'proxmox', 'fastapi', 'react', 'python', 'software',
  'hardware', 'node', 'capacity', 'databricks', 'spark', 'delta', 'flutter', 'docker',
  'linux', 'cloud', 'model', 'models', 'views', 'time', 'cleanly', 'single', 'based',
  'vehicle', 'vehicles', 'tables', 'multi', 'million', 'queries', 'query', 'pipeline',
  'pipelines', 'spend', 'hours', 'hour', 'month', 'monthly', 'coordinators', 'laptops',
]);

export const HAS_QUANTIFIER_REGEX =
  /(₹|\$|\d+\s*%|~?\d+(?:[–-]\d+)?x\b|\b24\/7\b|~?\d[\d,]*(?:[–-]\d[\d,]*)?\+?\s+(?:[a-zA-Z0-9.+/-]+\s+){0,2}(?:k\b|L\+?\b|trucks|vehicles|users|MAU|coordinators|hour|hours|hrs|projects|nodes|replicas|workflows|modules|algorithms|solutions|semesters|dashboards?|laptops|vms|instances?|clusters?|databases?|servers?|domains?|ports?|solvers?)\b|\bmulti-million\b|\bmillion\b|\bthousand\b|\bconcurrent\b|\blayer-\d\b)/i;

const METRIC_HIGHLIGHT_REGEX =
  /(~?₹[\d,]+(?:[–-][\d,]+)?\+?(?:\/[a-zA-Z]+)?|~?\$[\d,.]+[kKmMbB]?(?:[–-]\$?[\d,.]+[kKmMbB]?)?\+?(?:\/[a-zA-Z]+)?|\b24\/7\b|~?\d+(?:[.,–-]\d+)?\s*(?:%|x)\+?(?=\s|[.,);:/]|$)|~?\d[\d,]*(?:[–-]\d[\d,]*)?\+?\s+(?:connected\s+|live\s+|standalone\s+|unified\s+|civic analytics\s+|core\s+|worker\s+|end-to-end\s+)?(?:trucks|vehicles|vehicle|MAU|monthly active(?: Care Leavers| users)?|field coordinators|coordinators|workflows?|modules?|replicas?|masters?|workers?|nodes?|K3s VMs|laptops|projects?|hour(?:s)?\/day|hrs?\/day|algorithms?|solutions?|semesters?|dashboards?|days?|open(?: router)? ports?|custom domains?|domains?|PostgreSQL(?:\s*\+\s*Apache AGE)?\s+instance)\b|\bmulti-million-row\b|\bsole end-to-end ownership\b)/gi;

/**
 * Splits a Google XYZ bullet sentence into normal text and highlighted metric spans
 * so 6-second eye-tracking scans lock onto quantifiable [Y] outcomes immediately.
 */
export function splitQuantifiedSegments(text: string): TextSegment[] {
  if (!text) return [];
  const regex = new RegExp(METRIC_HIGHLIGHT_REGEX.source, 'gi');
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), highlight: false });
    }
    segments.push({ text: match[0], highlight: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlight: false });
  }

  return segments.length > 0 ? segments : [{ text, highlight: false }];
}

export function analyzeAtsReadiness(portfolioData: any, mode: DocumentMode): AtsAuditReport {
  const profile = portfolioData?.profile || {};
  const cvConfig = portfolioData?.cv || {};
  const experiences: any[] = portfolioData?.experience || [];
  const rawProjects: any[] = portfolioData?.realWorldProjects || [];
  const education: any[] = portfolioData?.education || [];
  const skillsCats: any[] = portfolioData?.skills?.categories || [];

  const maxExp =
    mode === 'resume'
      ? typeof cvConfig.maxExperiencesInResume === 'number'
        ? cvConfig.maxExperiencesInResume
        : 5
      : experiences.length;

  const activeExperiences = experiences.slice(0, maxExp);

  const maxProjects =
    mode === 'resume'
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
    .map((item) => item.p)
    .slice(0, maxProjects);

  const unquantifiedBullets: UnquantifiedBulletIssue[] = [];
  const allBullets: string[] = [];
  const topFoldBullets: string[] = [];

  activeExperiences.forEach((exp, expIdx) => {
    const bullets: string[] = Array.isArray(exp.bulletPoints) ? exp.bulletPoints : [];
    const list = mode === 'resume' ? bullets.slice(0, 2) : bullets;
    list.forEach((b) => {
      const clean = b.trim();
      if (!clean) return;
      allBullets.push(clean);
      if (expIdx < 2) topFoldBullets.push(clean);
      if (!HAS_QUANTIFIER_REGEX.test(clean)) {
        unquantifiedBullets.push({
          section: 'Experience',
          title: `${exp.role} · ${exp.company}`,
          bullet: clean,
        });
      }
    });
  });

  activeProjects.forEach((proj) => {
    const pts: string[] = proj.details
      ? String(proj.details)
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean)
      : proj.description
      ? [String(proj.description).trim()]
      : [];
    const list = mode === 'resume' ? pts.slice(0, 2) : pts;
    list.forEach((b) => {
      allBullets.push(b);
      if (!HAS_QUANTIFIER_REGEX.test(b)) {
        unquantifiedBullets.push({
          section: 'Projects',
          title: proj.name,
          bullet: b,
        });
      }
    });
  });

  const summaryText =
    mode === 'resume'
      ? profile.resumeSummary || profile.summary || ''
      : profile.summary || (Array.isArray(portfolioData?.about) ? portfolioData.about.join(' ') : '');

  const combinedText = [summaryText, ...allBullets].join(' ');
  const tokens = combinedText
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  const counts = new Map<string, number>();
  tokens.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));

  const repeatedWords: RepeatedWordIssue[] = Array.from(counts.entries())
    .filter(([word, count]) => count >= 3 && (ACTION_VERB_SYNONYMS[word] || count >= 4))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word, count]) => ({
      word,
      count,
      suggestions: ACTION_VERB_SYNONYMS[word] || ['vary phrasing with domain-specific action verbs'],
    }));

  const domains: string[] = Array.isArray(profile.domains) ? profile.domains : [];

  const contactChecks: AtsContactCheck[] = [
    { label: 'Email', present: Boolean(profile.email), value: profile.email },
    { label: 'Phone', present: Boolean(profile.phone), value: profile.phone },
    { label: 'LinkedIn URL', present: Boolean(profile.linkedinUrl), value: profile.linkedinUrl },
    { label: 'GitHub URL', present: Boolean(profile.githubUrl), value: profile.githubUrl },
    { label: 'Portfolio Domain', present: Boolean(domains[0]), value: domains[0] },
  ];

  const essentialSections = [
    { label: 'Summary', present: Boolean(summaryText) },
    { label: 'Skills', present: skillsCats.length > 0 },
    { label: 'Experience', present: activeExperiences.length > 0 },
    { label: 'Projects', present: activeProjects.length > 0 },
    { label: 'Education', present: education.length > 0 },
  ];

  const wordCount = combinedText.trim().split(/\s+/).filter(Boolean).length;
  const quantifiedBullets = allBullets.length - unquantifiedBullets.length;
  const estimatedSinglePageFit =
    mode === 'resume' ? activeExperiences.length <= 5 && activeProjects.length <= 3 && wordCount <= 580 : true;

  // ==================== 6-SECOND RECRUITER AUDIT ====================
  const summaryWordCount = summaryText.trim().split(/\s+/).filter(Boolean).length;
  const bulletWordCounts = allBullets.map((b) => b.split(/\s+/).filter(Boolean).length);
  const avgBulletWords =
    bulletWordCounts.length > 0
      ? Math.round(bulletWordCounts.reduce((a, b) => a + b, 0) / bulletWordCounts.length)
      : 0;
  const overlongBulletCount = bulletWordCounts.filter((c) => c > 38).length;
  const xyzCompliancePct =
    allBullets.length > 0 ? Math.round((quantifiedBullets / allBullets.length) * 100) : 100;

  const topFoldQuantified = topFoldBullets.filter((b) => HAS_QUANTIFIER_REGEX.test(b)).length;
  const hasTopFoldIdentity = Boolean(
    (profile.resumeHeadline || profile.title) && profile.email && profile.linkedinUrl && profile.githubUrl
  );
  const maxSummaryWords = mode === 'resume' ? 68 : 105;

  const sixSecondChecks: SixSecondCheck[] = [
    {
      id: 'top-identity',
      label: 'Top-Fold Role Identity & Links',
      category: 'Identity',
      passed: hasTopFoldIdentity,
      metricValue: hasTopFoldIdentity ? 'All Verified' : 'Missing Link',
      guidance: 'Name, targeted role headline, email, LinkedIn, and GitHub appear immediately in header.',
    },
    {
      id: 'summary-brevity',
      label: 'Executive Summary Brevity',
      category: 'Brevity',
      passed: summaryWordCount > 0 && summaryWordCount <= maxSummaryWords,
      metricValue: `${summaryWordCount}w / <=${maxSummaryWords}w`,
      guidance: 'Keep opening summary crisp so hiring managers parse role fit in under 2 seconds.',
    },
    {
      id: 'first-fold-impact',
      label: 'Above-the-Fold Quantified Impact',
      category: 'Impact',
      passed: topFoldBullets.length > 0 && topFoldQuantified >= Math.min(2, topFoldBullets.length),
      metricValue: `${topFoldQuantified}/${topFoldBullets.length} top bullets`,
      guidance: 'Most recent 2 roles front-load verifiable numeric scale, latency, or cost impact.',
    },
    {
      id: 'xyz-coverage',
      label: 'Google XYZ Bullet Coverage',
      category: 'Impact',
      passed: xyzCompliancePct >= 80,
      metricValue: `${xyzCompliancePct}% XYZ`,
      guidance: 'Standardized "[X] accomplished, [Y] measured by, [Z] by doing" across roles & projects.',
    },
    {
      id: 'bullet-scan',
      label: 'Scannable Bullet Length',
      category: 'Brevity',
      passed: avgBulletWords <= 30 && overlongBulletCount <= 2,
      metricValue: `${avgBulletWords}w avg`,
      guidance: 'Concise 1–2.5 line bullets with bolded numbers prevent wall-of-text fatigue.',
    },
    {
      id: 'page-density',
      label: mode === 'resume' ? '1-Page Recruiter Fit' : 'Role-Ordered Stack Density',
      category: 'Structure',
      passed: skillsCats.length > 0 && (mode === 'resume' ? estimatedSinglePageFit : wordCount <= 1150),
      metricValue: `${wordCount} words`,
      guidance: 'Skills front-loaded above experience and total density calibrated cleanly.',
    },
  ];

  const passedCount = sixSecondChecks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / sixSecondChecks.length) * 100);

  return {
    mode,
    totalBullets: allBullets.length,
    quantifiedBullets,
    unquantifiedBullets,
    repeatedWords,
    contactChecks,
    essentialSections,
    estimatedSinglePageFit,
    wordCount,
    sixSecondAudit: {
      score,
      passedCount,
      totalCount: sixSecondChecks.length,
      xyzCompliancePct,
      avgBulletWords,
      overlongBulletCount,
      summaryWordCount,
      checks: sixSecondChecks,
    },
  };
}
