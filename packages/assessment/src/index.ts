/**
 * @sapiensmetric/assessment — versioned assessment scoring core (T-016).
 *
 * Pure, deterministic, and dependency-free: no UI, HTTP, database,
 * authentication, environment variables, network, randomness, or wall-clock
 * time. Inputs are never mutated. See `docs/assessment-scoring.md`.
 */
export * from './errors';
export * from './types';
export * from './scoring';
export * from './public-form';
