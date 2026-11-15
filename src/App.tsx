import React, { useState, useEffect, Suspense, lazy } from 'react';
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
import fetchData, { getCachedPortfolioData, getRawPortfolioJson } from './constants';
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

  // Keep browser document title & meta description synchronized with portfolio data
  useEffect(() => {
    const profileName = rawJson?.profile?.name || processedConfig.name;
    const profileTitle = rawJson?.profile?.title || processedConfig.title;
    const heroLead = rawJson?.hero?.lead;

    if (profileName) {
      document.title = profileTitle ? `${profileName} — ${profileTitle}` : profileName;
    }
    if (heroLead) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', heroLead);
    }
  }, [rawJson, processedConfig]);

  const handleViewProject = (project: Project) => setSelectedProject(project);
  const handleCloseModal = () => setSelectedProject(null);

  if (loading && !data) {
    return <Loader />;
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-mono text-rose-400 bg-[#040711] p-4">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-mono text-zinc-400 bg-[#040711]">
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
  } = data;

  const techSkills = skills.filter((s) => s['Skill Category'] === 'Technology');
  const softSkills = skills.filter((s) => s['Skill Category'] === 'Soft Skill');
  const allProjects = [...(realWorldProjects || []), ...(projects || [])];

  const sections: SectionsConfig = rawJson?.sections || {};
  const profile = rawJson?.profile || {};
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

  const resolvedIconOverrides = data.iconOverrides || rawJson?.media?.icons;
  const resolvedMilestones = data.progressGallery || [];

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
        <div className="relative min-h-screen bg-[#040711] text-zinc-200">
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
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Split Hero & Quantitative Proof Row */}
            <Header
              name={displayName}
              title={displayTitle}
              location={displayLocation}
              avatarUrl={processedConfig.avatar_url || './images/profile.jpg'}
              socials={socials || []}
              kicker={rawJson?.hero?.kicker}
              headline={rawJson?.hero?.headline}
              lead={rawJson?.hero?.lead}
              secondaryAction={rawJson?.hero?.secondaryAction}
              dossierSubtitle={rawJson?.hero?.dossier?.subtitle}
              dossierRows={rawJson?.hero?.dossier?.rows}
              dossierLinks={rawJson?.hero?.dossier?.links}
              metrics={rawJson?.hero?.metrics}
              onOpenCvModal={() => setIsCvModalOpen(true)}
            />

            {/* Interactive WebGL 3D Architecture Morph Explorer */}
            {showSystems3d && (
              <Suspense
                fallback={
                  <section id="systems-3d" className="py-20 border-b border-white/[0.08]">
                    <div className="h-[440px] sm:h-[510px] lg:h-[550px] w-full rounded-2xl border border-white/[0.14] bg-[#040711] flex items-center justify-center">
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
                evolution={rawJson?.homelab?.evolution}
                devices={homelab || []}
                vms={vms || []}
                platforms={platforms || []}
                consolidationNote={rawJson?.homelab?.consolidationNote}
                network={rawJson?.homelab?.network}
              />
            )}

            {/* Career History Ledger */}
            <Experience
              eyebrow={sections.experience?.eyebrow}
              title={sections.experience?.title}
              subtitle={sections.experience?.subtitle}
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
              iconTiles={rawJson?.skills?.iconTiles}
              categories={rawJson?.skills?.categories}
              languages={rawJson?.skills?.languages}
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
          />
          </div>
        </div>
      </MediaRegistryProvider>
    </MotionConfig>
  );
};

export default App;