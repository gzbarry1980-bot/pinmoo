import { useMemo } from 'react';
import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import { FloatingContact } from './components/FloatingContact.jsx';
import { getCaseBySlug } from './data/cases.js';
import { About } from './pages/About.jsx';
import { CaseDetail } from './pages/CaseDetail.jsx';
import { Cases } from './pages/Cases.jsx';
import { Contact } from './pages/Contact.jsx';
import { Home } from './pages/Home.jsx';
import { Services } from './pages/Services.jsx';

function normalizePath(pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return clean;
}

function renderPage(pathname) {
  if (pathname === '/') return <Home />;
  if (pathname === '/services') return <Services />;
  if (pathname === '/cases') return <Cases />;
  if (pathname === '/about') return <About />;
  if (pathname === '/contact') return <Contact />;
  if (pathname.startsWith('/cases/')) {
    const slug = pathname.split('/')[2];
    const item = getCaseBySlug(slug);
    if (item) return <CaseDetail item={item} />;
  }
  return <Home />;
}

export function App() {
  const pathname = useMemo(() => normalizePath(window.location.pathname), []);
  return (
    <>
      <Header pathname={pathname} />
      <main id="main-content">{renderPage(pathname)}</main>
      <Footer />
      <FloatingContact />
    </>
  );
}
