'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ClientTestFlow = dynamic(() => import('./ClientTestFlow'), {
  ssr: false,
  loading: () => <div>Loading test flow...</div>
});

export default function ClientPage() {
  return <ClientTestFlow />;
} 