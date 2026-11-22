import { FactBankConfig, RoleProfileConfig } from '../types.ts';
import { resolveItemId } from './itemId.ts';

export const DEFAULT_ROLE_ID = 'general';

export interface RoleTrackSummary {
  id: string;
  label: string;
  shortLabel: string;
}

const cloneShallow = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return [...obj] as unknown as T;
  return { ...(obj as Record<string, unknown>) } as T;
};

/**
 * Returns selectable role tracks declared in portfolio.json -> factBank.roles.
 * Returns only the default General track if no factBank is configured (100% clone-safe).
 */
export function listRoleTracks(portfolioData: any): RoleTrackSummary[] {
  const factBank: FactBankConfig | undefined = portfolioData?.factBank;
  const base: RoleTrackSummary[] = [
    {
      id: DEFAULT_ROLE_ID,
      label: 'All-Rounder (Core)',
      shortLabel: 'Core Profile',
    },
  ];

  if (!factBank || !Array.isArray(factBank.roles) || factBank.roles.length === 0) {
    return base;
  }

  return [
    ...base,
    ...factBank.roles
      .filter((r) => Boolean(r?.id && r?.label))
      .map((r) => ({
        id: r.id,
        label: r.label,
        shortLabel: r.shortLabel || r.label,
      })),
  ];
}

export function findRoleProfile(portfolioData: any, roleId?: string): RoleProfileConfig | null {
  if (!roleId || roleId === DEFAULT_ROLE_ID) return null;
  const roles: RoleProfileConfig[] = portfolioData?.factBank?.roles || [];
  return roles.find((r) => r.id.toLowerCase() === roleId.toLowerCase().trim()) || null;
}

/**
 * Resolves a role-tailored view of portfolioData without mutating the source JSON.
 * Used symmetrically by the website UI, the ATS/CV modal preview, and PDFKit export.
 */
export function resolvePortfolioForRole(portfolioData: any, roleId?: string): any {
  if (!portfolioData) return portfolioData;
  const role = findRoleProfile(portfolioData, roleId);
  if (!role) {
    return {
      ...portfolioData,
      _activeRole: { id: DEFAULT_ROLE_ID, label: 'All-Rounder (Core)', isDefault: true },
    };
  }

  const baseProfile = cloneShallow(portfolioData.profile || {});
  const baseHero = cloneShallow(portfolioData.hero || {});
  const baseSkills = cloneShallow(portfolioData.skills || {});
  const baseCv = cloneShallow(portfolioData.cv || {});

  // Tailored profile headlines, summaries, and role-scoped PDF filenames
  const fileSlug = (role.fileSlug || role.id)
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const withRoleSuffix = (fileName: string | undefined, fallbackPrefix: string): string | undefined => {
    if (!fileName) return undefined;
    const stem = fileName.replace(/\.pdf$/i, '');
    return `${stem}_${fileSlug || fallbackPrefix}.pdf`;
  };

  const resolvedProfile = {
    ...baseProfile,
    resumeHeadline: role.resumeHeadline || baseProfile.resumeHeadline,
    resumeSummary: role.resumeSummary || baseProfile.resumeSummary,
    summary: role.summary || role.resumeSummary || baseProfile.summary,
    resumeFileName: withRoleSuffix(baseProfile.resumeFileName, 'Role') || baseProfile.resumeFileName,
    cvFileName: withRoleSuffix(baseProfile.cvFileName, 'Role') || baseProfile.cvFileName,
  };

  // Tailored Hero framing for above-the-fold 6-second clarity
  const resolvedHero = {
    ...baseHero,
    kicker: Array.isArray(role.heroKicker) && role.heroKicker.length > 0 ? role.heroKicker : baseHero.kicker,
    headline: role.heroHeadline || baseHero.headline,
    lead: role.heroLead || baseHero.lead,
    metrics:
      Array.isArray(role.heroMetrics) && role.heroMetrics.length > 0
        ? role.heroMetrics
        : baseHero.metrics,
  };

  // Reorder skill categories so most relevant stack comes first during a 6-second scan
  let resolvedCategories = Array.isArray(baseSkills.categories) ? [...baseSkills.categories] : [];
  if (Array.isArray(role.skillCategoryOrder) && role.skillCategoryOrder.length > 0) {
    const rankMap = new Map<string, number>();
    role.skillCategoryOrder.forEach((name, idx) => rankMap.set(name.toLowerCase().trim(), idx));
    resolvedCategories = resolvedCategories
      .map((cat, idx) => ({
        cat,
        rank: rankMap.get(String(cat?.name || '').toLowerCase().trim()) ?? 100 + idx,
      }))
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => entry.cat);
  }

  // Apply Role Fact Bank bullet & order overrides across experience entries
  const expOverrides = role.experienceOverrides || {};
  const rawExperience: any[] = Array.isArray(portfolioData.experience)
    ? portfolioData.experience
    : [];

  const resolvedExperience = rawExperience
    .map((exp, originalIdx) => {
      const expId = resolveItemId(exp.id, exp.role, exp.company);
      const override = expOverrides[expId] || (exp.id ? expOverrides[exp.id] : undefined);
      if (!override) {
        return { exp, priority: 100 + originalIdx, originalIdx };
      }
      return {
        exp: {
          ...exp,
          role: override.roleLabel || exp.role,
          bulletPoints:
            Array.isArray(override.bulletPoints) && override.bulletPoints.length > 0
              ? override.bulletPoints
              : exp.bulletPoints,
          skills:
            Array.isArray(override.skills) && override.skills.length > 0
              ? override.skills
              : exp.skills,
        },
        priority: typeof override.priority === 'number' ? override.priority : originalIdx,
        originalIdx,
      };
    })
    .sort((a, b) => (a.priority !== b.priority ? a.priority - b.priority : a.originalIdx - b.originalIdx))
    .map((entry) => entry.exp);

  // Apply Role Fact Bank project prioritization & spotlight overrides
  const projOrder = Array.isArray(role.projectOrder) ? role.projectOrder : [];
  const projOrderMap = new Map<string, number>();
  projOrder.forEach((id, idx) => projOrderMap.set(id.toLowerCase().trim(), idx));
  const projOverrides = role.projectOverrides || {};

  const applyProjTransform = (list: any[]) =>
    list
      .map((proj, originalIdx) => {
        const pid = resolveItemId(proj.id, proj.name).toLowerCase();
        const override = projOverrides[pid] || (proj.id ? projOverrides[proj.id] : undefined);
        const orderRank =
          projOrderMap.get(pid) ??
          (proj.id ? projOrderMap.get(String(proj.id).toLowerCase()) : undefined);

        const nextProj = override
          ? {
              ...proj,
              description: override.description || proj.description,
              details: Array.isArray(override.details)
                ? override.details.join('|')
                : override.details || proj.details,
              badge: override.badge || proj.badge,
            }
          : proj;

        const isRoleTop = orderRank === 0;
        const patchedPriority = orderRank !== undefined ? orderRank + 1 : proj.priority;

        return {
          proj:
            orderRank !== undefined
              ? {
                  ...nextProj,
                  priority: patchedPriority,
                  featured: isRoleTop ? true : projOrder.length > 0 ? false : nextProj.featured,
                }
              : nextProj,
          rank: orderRank !== undefined ? orderRank : 100 + originalIdx,
          originalIdx,
        };
      })
      .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.originalIdx - b.originalIdx))
      .map((entry) => entry.proj);

  const resolvedRealWorldProjects = applyProjTransform(
    Array.isArray(portfolioData.realWorldProjects) ? portfolioData.realWorldProjects : []
  );

  const resolvedCv = {
    ...baseCv,
    ...(role.keywords ? { keywords: role.keywords } : {}),
    ...(typeof role.includeHomelabInResume === 'boolean'
      ? { includeHomelabInResume: role.includeHomelabInResume }
      : {}),
    ...(typeof role.includeHomelabInCv === 'boolean'
      ? { includeHomelabInCv: role.includeHomelabInCv }
      : {}),
    ...(typeof role.maxExperiencesInResume === 'number'
      ? { maxExperiencesInResume: role.maxExperiencesInResume }
      : {}),
    ...(typeof role.maxProjectsInResume === 'number'
      ? { maxProjectsInResume: role.maxProjectsInResume }
      : {}),
  };

  return {
    ...portfolioData,
    profile: resolvedProfile,
    hero: resolvedHero,
    skills: {
      ...baseSkills,
      categories: resolvedCategories,
    },
    experience: resolvedExperience,
    realWorldProjects: resolvedRealWorldProjects,
    cv: resolvedCv,
    _activeRole: {
      id: role.id,
      label: role.label,
      isDefault: false,
    },
  };
}
