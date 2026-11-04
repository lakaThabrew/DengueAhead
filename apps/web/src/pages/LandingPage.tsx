/**
 * LandingPage.tsx — Public landing route ("/")
 *
 * Now delegates the hero section to <Hero4 />, which provides the full
 * animated header + hero + trust strip. The page is entirely self-contained
 * within Hero4; no additional wrappers are required.
 */

import React from 'react';
import Hero4 from '../components/ui/hero4.js';

export const LandingPage: React.FC = () => {
  return <Hero4 />;
};
