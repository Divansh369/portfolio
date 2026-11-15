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
}

const ACTION_VERB_SYNONYMS: Record<string, string[]> = {
  automated: ['orchestrated', 'streamlined', 'scripted', 'scheduled'],
  automating: ['orchestrating', 'streamlining', 'scripting', 'scheduling'],
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
  'code', 'flow', 'user', 'users', 'work', 'system', 'systems', 'server',
]);

const HAS_QUANTIFIER_REGEX =
  /(\d|%|~?\d+k|\bmulti-million\b|\bmillion\b|\bthousand\b|\bconcurrent\b|\bdaily\b.*\b\d+|\bmaus?\b|\blayer-\d\b)/i;

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

  activeExperiences.forEach((exp) => {
    const bullets: string[] = Array.isArray(exp.bulletPoints) ? exp.bulletPoints : [];
    const list = mode === 'resume' ? bullets.slice(0, 2) : bullets;
    list.forEach((b) => {
      const clean = b.trim();
      if (!clean) return;
      allBullets.push(clean);
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
    mode === 'resume' && activeExperiences.length <= 5 && activeProjects.length <= 3 && wordCount <= 560;

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
  };
}
