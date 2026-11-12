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
import ContourFieldCanvas from './components/motion/ContourFieldCanvas';
import SectionDock from './components/motion/SectionDock';
import fetchData, { getCachedPortfolioData, getRawPortfolioJson } from './constants';
import { Data } from './types';

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

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-[#040711] text-zinc-200">
        {/* Living Topographic Contour & Gaussian Halftone Depth Canvas behind the Glass */}
        <ContourFieldCanvas />

        <div className="relative z-10">
          {/* 3-Zone Top Glass Navigation Bar */}
          <Navbar onOpenCvModal={() => setIsCvModalOpen(true)} />

          {/* Desktop Wide-Screen Section Index Dock */}
          <SectionDock />

          {/* Main Content Container */}
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Split Hero & Quantitative Proof Row */}
            <Header
              name={processedConfig.name || 'Divansh Prasad'}
              title={processedConfig.title || 'Software Engineer · Daimler Truck (DTICI)'}
              socials={socials || []}
              kicker={rawJson?.hero?.kicker}
              headline={rawJson?.hero?.headline}
              lead={rawJson?.hero?.lead}
              metrics={rawJson?.hero?.metrics}
              onOpenCvModal={() => setIsCvModalOpen(true)}
            />

            {/* Interactive WebGL 3D Architecture Morph Explorer */}
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
              <SpatialMorphViewport />
            </Suspense>

            {/* Selected Projects */}
            <Projects
              title="Projects & Production Systems"
              subtitle="Databricks big data workflows, Google Play volunteer software for Udayan Care, self-hosted services, and K3s infrastructure."
              projects={allProjects}
              onViewDetails={handleViewProject}
            />

            {/* Proxmox Evolution, Linux Progression & K3s Lab */}
            <Homelab
              evolution={rawJson?.homelab?.evolution}
              devices={homelab || []}
              vms={vms || []}
              platforms={platforms || []}
              consolidationNote={rawJson?.homelab?.consolidationNote}
              network={rawJson?.homelab?.network}
            />

            {/* Career History Ledger */}
            <Experience experience={experience || []} />

            {/* Technical Stack & Spoken Languages */}
            <Skills
              skills={techSkills}
              softSkills={softSkills}
              categories={rawJson?.skills?.categories}
              languages={rawJson?.skills?.languages}
            />

            {/* Background Narrative */}
            <About
              bio={about.map((item) => item.paragraph)}
              interests={rawJson?.skills?.interests}
            />

            {/* Academic History & Certificates */}
            <Education
              education={education || []}
              certificates={certificates || rawJson?.certificates || []}
            />

            {/* Direct Contact */}
            <Contact
              heading={contact[0]?.heading || 'Get In Touch'}
              message={
                contact[0]?.['Contact Message'] ||
                'Open to software engineering roles, distributed data infrastructure discussions, and collaborative open-source or impact builds.'
              }
              email={contact[0]?.['Contact Email'] || 'divanshthebest@gmail.com'}
              phone={contact[0]?.['Contact Phone'] || ''}
            />

            {/* Quiet Editorial Footer */}
            <Footer
              name={processedConfig.name || 'Divansh Prasad'}
              onOpenDataModal={() => setIsDataConfigOpen(true)}
              onOpenCvModal={() => setIsCvModalOpen(true)}
            />
          </main>

          {/* Project Details Modal */}
          <AnimatePresence>
            {selectedProject && <Modal project={selectedProject} onClose={handleCloseModal} />}
          </AnimatePresence>

          {/* JSON Schema Modal */}
          <DataConfigModal
            isOpen={isDataConfigOpen}
            onClose={() => setIsDataConfigOpen(false)}
          />

          {/* ATS CV Modal */}
          <CvModal
            isOpen={isCvModalOpen}
            onClose={() => setIsCvModalOpen(false)}
            portfolioData={rawJson}
          />
        </div>
      </div>
    </MotionConfig>
  );
};

export default App;