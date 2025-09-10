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
import fetchData from './constants';
import { Data, Theme } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [processedConfig, setProcessedConfig] = useState<{ [key: string]: string }>({});

  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
        const scrollY = window.scrollY;
        document.body.style.backgroundPosition = `0px ${-scrollY * 0.2}px`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (theme) {
      document.documentElement.style.setProperty('--color-bg', theme.backgroundColor);
      document.documentElement.style.setProperty('--color-text', theme.textColor);
      document.documentElement.style.setProperty('--color-primary', theme.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', theme.secondaryColor);
    }
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      console.log('Starting data load...');
      try {
        const fetchedData = await fetchData();
        console.log('Data fetched:', fetchedData);
        setData(fetchedData);

        // Process config data into a key-value object
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
    return <div className="min-h-screen flex items-center justify-center text-xl bg-[var(--color-bg)] text-[var(--color-text)]">Loading Portfolio...</div>;
  }
  
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-400 bg-[var(--color-bg)]">{error}</div>;
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-xl bg-[var(--color-bg)] text-[var(--color-text)]">No data loaded.</div>;
  }

  const { about, contact, education, experience, projects, 'real-world_projects': realWorldProjects, skills, socials, themes } = data;

  const techSkills = skills.filter((s: any) => s['Skill Category'] === 'Technology');
  const softSkills = skills.filter((s: any) => s['Skill Category'] === 'Soft Skill');

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Navbar themes={themes} currentTheme={theme} setTheme={setTheme} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl pt-16">
        <Header 
          name={processedConfig.name || ''} 
          title={processedConfig.title || ''} 
          socials={socials || []}
          avatarUrl={processedConfig.avatar_url || ''}
        />
        <main className="py-12">
          <div id="about" className="scroll-mt-16">
            <About 
              bio={about.map((item: any) => item.paragraph)}
            />
          </div>
          <div id="projects" className="scroll-mt-16">
            <Projects title="Real World Projects" emoji="💼" projects={realWorldProjects} onViewDetails={handleViewProject} />
            <Projects title="Personal Projects" emoji="🚀" projects={projects} onViewDetails={handleViewProject}/>
          </div>
          <div id="experience" className="scroll-mt-16">
            <Experience experience={experience} />
          </div>
          <div id="education" className="scroll-.mt-16">
            <Education education={education} />
          </div>
          <div id="skills" className="scroll-mt-16">
            <Skills skills={techSkills} softSkills={softSkills} />
          </div>
          <div id="contact" className="scroll-mt-16">
            <Contact 
              heading={contact[0]['heading']} 
              message={contact[0]['Contact Message']} 
              email={contact[0]['Contact Email']}
              phone={contact[0]['Contact Phone']} 
            />
          </div>
        </main>
        <Footer name={about[0]['Full Name']} />
      </div>
      <AnimatePresence>
        {selectedProject && <Modal project={selectedProject} onClose={handleCloseModal} />}
      </AnimatePresence>
    </div>
  );
};

export default App;