'use client';

import { useRef } from 'react';
import { useAuth } from '../../features/auth/auth-provider';
import { assessmentApi } from '../../features/assessment/assessment-api';
import {
  createAssessmentStore,
  type AssessmentStore,
} from '../../features/assessment/assessment-store';

/**
 * Binds the framework-free assessment store to React. The store is created once
 * per mount; the injected token getter dereferences the auth provider's in-memory
 * token at call time, so it always sees the current token without exposing it.
 */
export function useAssessmentStore(): AssessmentStore {
  const { getAccessToken } = useAuth();
  const storeRef = useRef<AssessmentStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createAssessmentStore(assessmentApi, getAccessToken);
  }
  return storeRef.current;
}
