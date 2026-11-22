import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar';
import Header from './components/Header';
import About from './components/About';
import Projects, { Project } from './components/Projects';
import Homelab from './components/Homelab';
import Experience from './components/Experience';
import Education from './components/Education';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Modal from './components/Modal';
import Loader from './components/Loader';
import DataConfigModal from './components/DataConfigModal';
import CvModal from './components/CvModal';
import ProgressGalleryModal from './components/ProgressGalleryModal';
import ContourFieldCanvas from './components/motion/ContourFieldCanvas';
import SectionDock from './components/motion/SectionDock';
import { MediaRegistryProvider } from './context/MediaRegistryContext';
import { OfflineIndicator } from './components/common/PWAInstallButton';
import { syncSeoMetadata } from './utils/seoManager';
import {
  DEFAULT_ROLE_ID,
  findRoleProfile,
  listRoleTracks,
  resolvePortfolioForRole,
} from './utils/factBank';
import fetchData, {
  getCachedPortfolioData,
  getRawPortfolioJson,
  transformJsonToData,
} from './constants';
import { Data, ProgressMilestone, SectionsConfig } from './types';

const SpatialMorphViewport = lazy(() => import('./components/three/SpatialMorphViewport'));

export const App: React.FC = () => {
  const cached = getCachedPortfolioData();
  const [data, setData] = useState<Data | null>(cached);
  const [rawJson, setRawJson] = useState<any | null>(getRawPortfolioJson());
  const [loading, setLoading] = useState<boolean>(!cached);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDataConfigOpen, setIsDataConfigOpen] = useState<boolean>(false);
  const [isCvModalOpen, setIsCvModalOpen] = useState<boolean>(false);
  const [activeRoleId, setActiveRoleId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const paramRole = new URLSearchParams(window.location.search).get('role');
      if (paramRole) return paramRole;
    }
    return DEFAULT_ROLE_ID;
  });
  const [galleryTarget, setGalleryTarget] = useState<{
    itemId: string;
    title: string;
    subtitle?: string;
    milestones: ProgressMilestone[];
  } | null>(null);
  const [processedConfig, setProcessedConfig] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const processData = (loadedData: Data) => {
      setData(loadedData);
      const json = getRawPortfolioJson();
      if (json) setRawJson(json);

      const configMap: { [key: string]: string } = {};
      if (loadedData.config) {
        loadedData.config.forEach((item) => {
          configMap[item.key] = item.value;
        });
      }
      setProcessedConfig(configMap);
    };

    if (cached) {
      processData(cached);
    }

    const loadFreshData = async () => {
      try {
        const freshData = await fetchData();
        processData(freshData);
      } catch (e) {
        console.error('Error fetching fresh portfolio data:', e);
        if (!cached) {
          setError('Failed to load portfolio data. Please check connection and refresh.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadFreshData();
  }, []);

  // Keep browser document title, SEO meta tags, OpenGraph, and JSON-LD synchronized with portfolio data
  useEffect(() => {
    syncSeoMetadata(rawJson, processedConfig);
  }, [rawJson, processedConfig]);

  const handleViewProject = (project: Project) => setSelectedProject(project);
  const handleCloseModal = () => setSelectedProject(null);

  const roleTracks = useMemo(() => listRoleTracks(rawJson), [rawJson]);
  const validRoleId = useMemo(() => {
    if (!rawJson) return activeRoleId;
    return findRoleProfile(rawJson, activeRoleId)?.id || DEFAULT_ROLE_ID;
  }, [rawJson, activeRoleId]);

  const roleScopedJson = useMemo(
    () => (rawJson ? resolvePortfolioForRole(rawJson, validRoleId) : null),
    [rawJson, validRoleId]
  );

  const roleScopedData = useMemo(() => {
    if (!roleScopedJson || validRoleId === DEFAULT_ROLE_ID) return data;
    return transformJsonToData(roleScopedJson, import.meta.env.BASE_URL || './');
  }, [roleScopedJson, validRoleId, data]);

  const activeRoleLabel = useMemo(() => {
    if (validRoleId === DEFAULT_ROLE_ID) return undefined;
    return findRoleProfile(rawJson, validRoleId)?.label;
  }, [rawJson, validRoleId]);

  if (loading && !data) {
    return <Loader />;
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-mono text-rose-400 bg-[#040b07] p-4">
        {error}
      </div>
    );
  }

  const effectiveData = roleScopedData || data;

  if (!effectiveData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-mono text-zinc-400 bg-[#040b07]">
        Initializing portfolio...
      </div>
    );
  }

  const {
    about,
    certificates,
    contact,
    education,
    experience,
    projects,
    'real-world_projects': realWorldProjects,
    skills,
    socials,
    homelab,
    vms,
    platforms,
  } = effectiveData;

  const techSkills = skills.filter((s) => s['Skill Category'] === 'Technology');
  const softSkills = skills.filter((s) => s['Skill Category'] === 'Soft Skill');
  const allProjects = [...(realWorldProjects || []), ...(projects || [])];

  const activeRawJson = roleScopedJson || rawJson;
  const sections: SectionsConfig = activeRawJson?.sections || {};
  const profile = activeRawJson?.profile || {};
  const displayName = profile.name || processedConfig.name || 'Developer Portfolio';
  const displayTitle = profile.title || processedConfig.title || 'Software Engineer';
  const displayLocation =
    profile.location || contact[0]?.location || processedConfig.location || '';
  const domains: string[] = Array.isArray(profile.domains)
    ? profile.domains
    : processedConfig.domains
    ? processedConfig.domains.split('|').filter(Boolean)
    : [];

  const showSystems3d = sections.systems3d?.enabled !== false;
  const showHomelab =
    sections.homelab?.enabled !== false &&
    ((homelab && homelab.length > 0) ||
      (vms && vms.length > 0) ||
      Boolean(rawJson?.homelab?.evolution?.length));
  const homelabLabel = sections.homelab?.navLabel || 'Infrastructure';

  const resolvedIconOverrides = effectiveData.iconOverrides || activeRawJson?.media?.icons;
  const resolvedMilestones = effectiveData.progressGallery || [];

  const cvPortfolioPayload =
    rawJson ||
    ({
      profile: {
        name: displayName,
        title: displayTitle,
        location: displayLocation,
        email: contact[0]?.['Contact Email'] || '',
        phone: contact[0]?.['Contact Phone'] || '',
        domains,
        githubUrl: socials?.find((s) => s.name.toLowerCase().includes('github'))?.url || '',
        linkedinUrl: socials?.find((s) => s.name.toLowerCase().includes('linkedin'))?.url || '',
        summary: about.map((a) => a.paragraph).join(' '),
      },
      experience: (experience || []).map((exp) => ({
        id: exp.id,
        role: exp.role,
        company: exp.company,
        location: exp.location,
        duration: exp.duration,
        milestone: exp.milestone,
        bulletPoints: exp.description
          ? exp.description
              .split('|')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        skills: exp.skills
          ? exp.skills
              .split('|')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      })),
      realWorldProjects: realWorldProjects || [],
      skills: {
        categories: [
          {
            name: 'Core Stack',
            desc: '',
            items: techSkills.map((s) => s.skill),
          },
        ],
        languages: ['English (Fluent)'],
      },
      education: education || [],
      certificates: certificates || [],
      about: about.map((a) => a.paragraph),
      cv: {},
    } as any);

  return (
    <MotionConfig reducedMotion="user">
      <MediaRegistryProvider iconOverrides={resolvedIconOverrides}>
        <div className="relative min-h-screen bg-[#040b07] text-zinc-200">
          {/* Living Topographic Contour & Gaussian Halftone Depth Canvas behind the Glass */}
          <ContourFieldCanvas />

          <div className="relative z-10">
            {/* 3-Zone Top Glass Navigation Bar */}
            <Navbar
              brandName={displayName}
              homelabLabel={homelabLabel}
              showHomelab={showHomelab}
              onOpenCvModal={() => setIsCvModalOpen(true)}
            />

          {/* Desktop Wide-Screen Section Index Dock */}
          <SectionDock
            homelabLabel={homelabLabel}
            showSystems3d={showSystems3d}
            showHomelab={showHomelab}
          />

          {/* Main Content Container */}
          <main className="max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-clip">
            {/* Split Hero & Quantitative Proof Row */}
            <Header
              name={displayName}
              title={displayTitle}
              location={displayLocation}
              avatarUrl={processedConfig.avatar_url || ''}
              socials={socials || []}
              kicker={activeRawJson?.hero?.kicker}
              headline={activeRawJson?.hero?.headline}
              lead={activeRawJson?.hero?.lead}
              secondaryAction={activeRawJson?.hero?.secondaryAction}
              dossierSubtitle={activeRawJson?.hero?.dossier?.subtitle}
              dossierRows={activeRawJson?.hero?.dossier?.rows}
              dossierLinks={activeRawJson?.hero?.dossier?.links}
              metrics={activeRawJson?.hero?.metrics}
              roleTracks={roleTracks}
              activeRoleId={validRoleId}
              onSelectRole={setActiveRoleId}
              onOpenCvModal={() => setIsCvModalOpen(true)}
            />

            {/* Interactive WebGL 3D Architecture Morph Explorer */}
            {showSystems3d && (
              <Suspense
                fallback={
                  <section id="systems-3d" className="py-20 border-b border-white/[0.08]">
                    <div className="h-[440px] sm:h-[510px] lg:h-[550px] w-full rounded-2xl border border-white/[0.14] bg-[#040b07] flex items-center justify-center">
                      <span className="text-xs font-mono text-zinc-400">
                        Loading 3D architecture viewport...
                      </span>
                    </div>
                  </section>
                }
              >
                <SpatialMorphViewport config={sections.systems3d} />
              </Suspense>
            )}

            {/* Selected Projects */}
            <Projects
              eyebrow={sections.projects?.eyebrow || 'Selected Works'}
              title={sections.projects?.title || 'Projects & Systems'}
              subtitle={
                sections.projects?.subtitle ||
                'Production software, open-source engineering builds, and technical experiments.'
              }
              activeRoleLabel={activeRoleLabel}
              showArchivedByDefault={sections.projects?.showArchivedByDefault ?? true}
              projects={allProjects}
              progressMilestones={resolvedMilestones}
              onViewDetails={handleViewProject}
              onOpenGallery={setGalleryTarget}
            />

            {/* Infrastructure & Virtualization Lab */}
            {showHomelab && (
              <Homelab
                config={sections.homelab}
                evolution={activeRawJson?.homelab?.evolution}
                devices={homelab || []}
                vms={vms || []}
                platforms={platforms || []}
                consolidationNote={activeRawJson?.homelab?.consolidationNote}
                network={activeRawJson?.homelab?.network}
              />
            )}

            {/* Career History Ledger */}
            <Experience
              eyebrow={sections.experience?.eyebrow}
              title={sections.experience?.title}
              subtitle={sections.experience?.subtitle}
              activeRoleLabel={activeRoleLabel}
              experience={experience || []}
              progressMilestones={resolvedMilestones}
              onOpenGallery={setGalleryTarget}
            />

            {/* Technical Stack & Spoken Languages */}
            <Skills
              eyebrow={sections.skills?.eyebrow}
              title={sections.skills?.title}
              subtitle={sections.skills?.subtitle}
              skills={techSkills}
              softSkills={softSkills}
              iconTiles={(() => {
                const baseTiles = Array.isArray(activeRawJson?.skills?.iconTiles)
                  ? [...activeRawJson.skills.iconTiles]
                  : [];
                const seen = new Set(
                  baseTiles.map((t: any) =>
                    String(t?.label || t?.brandKey || '')
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '')
                  )
                );
                (platforms || []).forEach((p) => {
                  const token = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
                  const pveAlias = token === 'proxmoxve8' && seen.has('proxmoxve');
                  if (!seen.has(token) && !pveAlias) {
                    seen.add(token);
                    baseTiles.push({
                      label: p.name,
                      logoPath: p.logo || undefined,
                      brandKey: p.name,
                      category: 'infra',
                    });
                  }
                });
                return baseTiles;
              })()}
              categories={activeRawJson?.skills?.categories}
              languages={activeRawJson?.skills?.languages}
            />

            {/* Background Narrative */}
            <About
              eyebrow={sections.about?.eyebrow}
              title={sections.about?.title}
              subtitle={sections.about?.subtitle}
              facts={sections.about?.facts}
              bio={about.map((item) => item.paragraph)}
              interests={rawJson?.skills?.interests}
            />

            {/* Academic History & Certificates */}
            <Education
              eyebrow={sections.education?.eyebrow}
              title={sections.education?.title}
              subtitle={sections.education?.subtitle}
              education={education || []}
              certificates={certificates || rawJson?.certificates || []}
            />

            {/* Direct Contact */}
            <Contact
              eyebrow={sections.contact?.eyebrow}
              heading={contact[0]?.heading || 'Get In Touch'}
              message={
                contact[0]?.['Contact Message'] ||
                'Open to software engineering roles and technical collaborations.'
              }
              email={contact[0]?.['Contact Email'] || ''}
              phone={contact[0]?.['Contact Phone'] || ''}
              location={sections.contact?.locationLabel || displayLocation}
              domains={domains}
              socials={socials || []}
            />

            {/* Quiet Editorial Footer */}
            <Footer
              name={displayName}
              domains={domains}
              homelabLabel={homelabLabel}
              showHomelab={showHomelab}
              socials={socials || []}
              onOpenDataModal={() => setIsDataConfigOpen(true)}
              onOpenCvModal={() => setIsCvModalOpen(true)}
            />
          </main>

          {/* Project Details Modal */}
          <AnimatePresence>
            {selectedProject && (
              <Modal
                project={selectedProject}
                loadBalancerDemoConfig={sections.homelab?.loadBalancerDemo}
                progressMilestones={resolvedMilestones}
                onOpenGallery={setGalleryTarget}
                onClose={handleCloseModal}
              />
            )}
          </AnimatePresence>

          {/* Animated Progress Photo & Ideation Gallery Modal */}
          <ProgressGalleryModal
            isOpen={Boolean(galleryTarget)}
            itemId={galleryTarget?.itemId || ''}
            itemTitle={galleryTarget?.title || ''}
            itemSubtitle={galleryTarget?.subtitle}
            milestones={galleryTarget?.milestones || []}
            onClose={() => setGalleryTarget(null)}
          />

          {/* JSON Schema Modal */}
          <DataConfigModal
            isOpen={isDataConfigOpen}
            onClose={() => setIsDataConfigOpen(false)}
          />

          {/* ATS Resume / CV Modal */}
          <CvModal
            isOpen={isCvModalOpen}
            onClose={() => setIsCvModalOpen(false)}
            portfolioData={cvPortfolioPayload}
            activeRoleId={validRoleId}
            onSelectRole={setActiveRoleId}
          />
          </div>
        </div>
        <OfflineIndicator />
      </MediaRegistryProvider>
    </MotionConfig>
  );
};

export default App;