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
import { ErrorBoundary } from './components/ui/ErrorBoundary.js';

export const App: React.FC = () => {
  const router = useRouter();
  const path = router.pathname;

  let pageContent: React.ReactNode;

  // Render Public Standalone Pages
  if (path === '/' || path === '') {
    pageContent = <LandingPage />;
  } else if (path === '/methodology') {
    pageContent = <MethodologyPage />;
  } else if (path === '/about') {
    pageContent = <AboutPage />;
  } else if (path.startsWith('/app')) {
    // Render Application Shell Pages
    let innerContent: React.ReactNode;

    if (path === '/app/overview' || path === '/app') {
      innerContent = <OverviewPage />;
    } else if (path === '/app/map') {
      innerContent = <MapPage />;
    } else if (path.startsWith('/app/areas/')) {
      const areaId = path.split('/app/areas/')[1]?.split('/')[0];
      innerContent = <AreaDetailPage areaId={areaId} />;
    } else if (path === '/app/compare') {
      innerContent = <ComparePage />;
    } else if (path === '/app/history') {
      innerContent = <HistoryPage />;
    } else if (path === '/app/model') {
      innerContent = <ModelPage />;
    } else if (path === '/app/data-quality') {
      innerContent = <DataQualityPage />;
    } else {
      innerContent = <NotFoundPage />;
    }

    pageContent = (
      <AppShell currentPath={path}>
        <ErrorBoundary fallbackTitle="Application Error in View">{innerContent}</ErrorBoundary>
      </AppShell>
    );
  } else {
    pageContent = <NotFoundPage />;
  }

  return <ErrorBoundary fallbackTitle="DengueAhead System Error">{pageContent}</ErrorBoundary>;
};
