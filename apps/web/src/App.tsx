import React from 'react';
import { useRouter } from './lib/router.js';
import { AppShell } from './components/layout/AppShell.js';
import { LandingPage } from './pages/LandingPage.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { MapPage } from './pages/MapPage.js';
import { AreaDetailPage } from './pages/AreaDetailPage.js';
import { ComparePage } from './pages/ComparePage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { ModelPage } from './pages/ModelPage.js';
import { DataQualityPage } from './pages/DataQualityPage.js';
import { MethodologyPage } from './pages/MethodologyPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

export const App: React.FC = () => {
  const router = useRouter();
  const path = router.pathname;

  // Render Public Standalone Pages
  if (path === '/' || path === '') {
    return <LandingPage />;
  }

  if (path === '/methodology') {
    return <MethodologyPage />;
  }

  if (path === '/about') {
    return <AboutPage />;
  }

  // Render Application Shell Pages
  if (path.startsWith('/app')) {
    let content: React.ReactNode;

    if (path === '/app/overview' || path === '/app') {
      content = <OverviewPage />;
    } else if (path === '/app/map') {
      content = <MapPage />;
    } else if (path.startsWith('/app/areas/')) {
      const areaId = path.split('/app/areas/')[1]?.split('/')[0];
      content = <AreaDetailPage areaId={areaId} />;
    } else if (path === '/app/compare') {
      content = <ComparePage />;
    } else if (path === '/app/history') {
      content = <HistoryPage />;
    } else if (path === '/app/model') {
      content = <ModelPage />;
    } else if (path === '/app/data-quality') {
      content = <DataQualityPage />;
    } else {
      content = <NotFoundPage />;
    }

    return <AppShell currentPath={path}>{content}</AppShell>;
  }

  // 404 Catch-All
  return <NotFoundPage />;
};
