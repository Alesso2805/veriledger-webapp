import type { components } from './api';

// A peer this node knows. status is a word the API stores at registration; nothing checks it, so the page
// never shows it (DESIGN.md › What the design does not show).
export type Peer = components['schemas']['NodeResponseDTO'];

export type ResolveOutcome = components['schemas']['ResolveConflictsResponseDTO'];
