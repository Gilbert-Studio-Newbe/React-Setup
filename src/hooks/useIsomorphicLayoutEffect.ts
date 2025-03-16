import { useLayoutEffect, useEffect } from 'react';

// Use useLayoutEffect on the client, useEffect on the server
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect; 