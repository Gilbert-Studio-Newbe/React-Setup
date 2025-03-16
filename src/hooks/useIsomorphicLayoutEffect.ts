import { useLayoutEffect, useEffect } from 'react';

// Use useLayoutEffect on the client and useEffect on the server
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect; 