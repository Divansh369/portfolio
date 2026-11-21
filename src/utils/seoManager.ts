/**
 * Dynamic SEO, OpenGraph, Twitter Card, Canonical URL, and Schema.org (GEO / AIEO) synchronization.
 * Keeps browser document metadata aligned with loaded portfolio.json / CSV configuration.
 */
export function syncSeoMetadata(rawJson: any, configMap: Record<string, string>) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const profile = rawJson?.profile || {};
  const hero = rawJson?.hero || {};
  const seo = rawJson?.seo || {};

  const name = profile.name || configMap.name || '';
  const roleTitle = profile.title || configMap.title || 'Software Engineer';
  const pageTitle = name ? `${name} — ${roleTitle}` : roleTitle;

  const rawDesc =
    profile.resumeSummary ||
    hero.lead ||
    profile.summary ||
    'Software engineering portfolio featuring production systems, architecture visualizations, and ATS resume.';
  const description = String(rawDesc).replace(/\s+/g, ' ').trim().slice(0, 160);

  const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
  const ogImageRel = seo.ogImage || '/og-card.png';
  const ogImageAbs = ogImageRel.startsWith('http')
    ? ogImageRel
    : `${window.location.origin}${ogImageRel.startsWith('/') ? '' : '/'}${ogImageRel}`;

  document.title = pageTitle;

  const setMetaByName = (metaName: string, content: string) => {
    if (!content) return;
    let el = document.querySelector(`meta[name="${metaName}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', metaName);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const setMetaByProp = (prop: string, content: string) => {
    if (!content) return;
    let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', prop);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMetaByName('description', description);
  if (name) setMetaByName('author', name);

  const keywordList: string[] = Array.isArray(seo.keywords)
    ? seo.keywords
    : typeof rawJson?.cv?.keywords === 'string'
    ? String(rawJson.cv.keywords)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  if (keywordList.length > 0) {
    setMetaByName('keywords', keywordList.join(', '));
  }

  setMetaByProp('og:type', 'profile');
  setMetaByProp('og:title', pageTitle);
  setMetaByProp('og:description', description);
  setMetaByProp('og:url', canonicalUrl);
  setMetaByProp('og:site_name', name ? `${name} Portfolio` : 'Developer Portfolio');
  setMetaByProp('og:image', ogImageAbs);
  setMetaByProp('og:image:alt', `${pageTitle} preview card`);

  setMetaByName('twitter:card', 'summary_large_image');
  setMetaByName('twitter:title', pageTitle);
  setMetaByName('twitter:description', description);
  setMetaByName('twitter:image', ogImageAbs);

  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // Build dynamic Schema.org JSON-LD @graph for Search + Generative Answer Engines (GEO/AIEO)
  if (!rawJson) return;

  const socials = Array.isArray(rawJson.socials) ? rawJson.socials : [];
  const sameAs = new Set<string>();
  if (profile.githubUrl) sameAs.add(profile.githubUrl);
  if (profile.linkedinUrl) sameAs.add(profile.linkedinUrl);
  if (profile.googlePlayUrl) sameAs.add(profile.googlePlayUrl);
  socials.forEach((s: any) => {
    if (s?.url && /^https?:\/\//.test(s.url)) sameAs.add(s.url);
  });
  if (Array.isArray(profile.domains)) {
    profile.domains.forEach((d: string) => {
      if (d) sameAs.add(d.startsWith('http') ? d : `https://${d}`);
    });
  }

  const projects = Array.isArray(rawJson.realWorldProjects)
    ? rawJson.realWorldProjects.filter((p: any) => p.status !== 'hidden')
    : [];
  const education = Array.isArray(rawJson.education) ? rawJson.education : [];
  const skillItems = Array.isArray(rawJson.skills?.categories)
    ? rawJson.skills.categories.flatMap((c: any) => c.items || [])
    : [];
  const faqs = Array.isArray(seo.faqs) ? seo.faqs.filter((f: any) => f?.question && f?.answer) : [];

  const origin = window.location.origin;
  const personId = `${origin}/#person`;
  const websiteId = `${origin}/#website`;

  const graph: Record<string, any>[] = [
    {
      '@type': 'Person',
      '@id': personId,
      name: name || 'Developer',
      jobTitle: roleTitle,
      description,
      url: canonicalUrl,
      image: profile.avatarUrl
        ? profile.avatarUrl.startsWith('http')
          ? profile.avatarUrl
          : `${origin}${profile.avatarUrl.startsWith('/') ? '' : '/'}${profile.avatarUrl}`
        : ogImageAbs,
      ...(profile.email ? { email: `mailto:${profile.email}` } : {}),
      ...(profile.company
        ? { worksFor: { '@type': 'Organization', name: profile.company } }
        : {}),
      ...(profile.location
        ? { homeLocation: { '@type': 'Place', name: profile.location } }
        : {}),
      ...(education[0]
        ? { alumniOf: { '@type': 'CollegeOrUniversity', name: education[0].institution } }
        : {}),
      knowsAbout: Array.from(new Set(skillItems)).slice(0, 24),
      sameAs: Array.from(sameAs),
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: pageTitle,
      url: `${origin}/`,
      description,
      author: { '@id': personId },
      inLanguage: 'en-US',
    },
    {
      '@type': 'ProfilePage',
      '@id': `${origin}/#profilepage`,
      url: canonicalUrl,
      name: pageTitle,
      isPartOf: { '@id': websiteId },
      mainEntity: { '@id': personId },
    },
    ...projects.slice(0, 6).map((proj: any, idx: number) => ({
      '@type': 'SoftwareApplication',
      '@id': `${origin}/#project-${proj.id || idx + 1}`,
      name: proj.name,
      applicationCategory: proj.category || 'DeveloperApplication',
      operatingSystem: 'All',
      description: proj.description,
      url: proj.url || `${origin}/#projects`,
      author: { '@id': personId },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    })),
  ];

  if (faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${origin}/#faq`,
      mainEntity: faqs.map((faq: { question: string; answer: string }) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  let jsonLdScript = document.getElementById('portfolio-jsonld') as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'portfolio-jsonld';
    jsonLdScript.type = 'application/ld+json';
    document.head.appendChild(jsonLdScript);
  }
  jsonLdScript.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
}
