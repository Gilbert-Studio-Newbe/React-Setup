'use client';

import dynamic from 'next/dynamic';

// Dynamically import the client component with SSR disabled
const DynamicJsonParameterFormatterNode = dynamic(
  () => import('./ClientJsonParameterFormatterNode'),
  { ssr: false }
);

export default DynamicJsonParameterFormatterNode; 