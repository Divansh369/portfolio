import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Education from './components/Education';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Modal from './components/Modal';
import Navbar from './components/Navbar';
import Homelab from './components/Homelab';
import Loader from './components/Loader';
import Cursor from './components/Cursor';
import fetchData from './constants';
import { Data, Theme } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [processedConfig, setProcessedConfig] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme.name.toLowerCase());
      document.documentElement.style.setProperty('--color-bg', theme.backgroundColor);
      document.documentElement.style.setProperty('--color-text', theme.textColor);
      document.documentElement.style.setProperty('--color-primary', theme.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', theme.secondaryColor);
    }
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate loading for a better initial experience
        await new Promise(res => setTimeout(res, 1000));
        const fetchedData = await fetchData();
        setData(fetchedData);

        const configMap: { [key: string]: string } = {};
        if (fetchedData.config) {
          fetchedData.config.forEach(item => {
            configMap[item.key] = item.value;
          });
        }
        setProcessedConfig(configMap);

        if (fetchedData.themes && fetchedData.themes.length > 0) {
          setTheme(fetchedData.themes[0]);
        }
      } catch (e) {
        console.error('Error loading data:', e);
        setError('Failed to load portfolio data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleViewProject = (project: any) => setSelectedProject(project);
  const handleCloseModal = () => setSelectedProject(null);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-400 bg-black">{error}</div>;
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-xl bg-black">No data loaded.</div>;
  }

  const { about, contact, education, experience, projects, 'real-world_projects': realWorldProjects, skills, socials, themes, homelab, vms, platforms } = data;

  const techSkills = skills.filter((s: any) => s['Skill Category'] === 'Technology');
  const softSkills = skills.filter((s: any) => s['Skill Category'] === 'Soft Skill');

  return (
    <>
      <Cursor />
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] relative">
        <div className="aurora-background"></div>
        <Navbar themes={themes || []} currentTheme={theme} setTheme={setTheme} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl pt-16 relative z-10">
          <Header
            name={processedConfig.name || ''}
            title={processedConfig.title || ''}
            socials={socials || []}
            avatarUrl={processedConfig.avatar_url || ''}
          />
          <main className="py-12">
            <div id="about" className="scroll-mt-24"><About bio={about.map((item: any) => item.paragraph)} /></div>
            <div id="projects" className="scroll-mt-24"><Projects title="Real World Projects" emoji="💼" projects={realWorldProjects || []} onViewDetails={handleViewProject} /></div>
            <div className="mt-16"><Projects title="Personal Projects" emoji="🚀" projects={projects || []} onViewDetails={handleViewProject} /></div>
            <div id="homelab" className="scroll-mt-24"><Homelab devices={homelab || []} vms={vms || []} platforms={platforms || []} /></div>
            <div id="experience" className="scroll-mt-24"><Experience experience={experience || []} /></div>
            <div id="education" className="scroll-mt-24"><Education education={education || []} /></div>
            <div id="skills" className="scroll-mt-24"><Skills skills={techSkills} softSkills={softSkills} /></div>
            <div id="contact" className="scroll-mt-24"><Contact heading={contact[0]?.['heading']} message={contact[0]?.['Contact Message']} email={contact[0]?.['Contact Email']} phone={contact[0]?.['Contact Phone']} /></div>
          </main>
          <Footer name={processedConfig.name || ''} />
        </div>
        <AnimatePresence>
          {selectedProject && <Modal project={selectedProject} onClose={handleCloseModal} />}
        </AnimatePresence>
      </div>
    </>
  );
};

export default App;