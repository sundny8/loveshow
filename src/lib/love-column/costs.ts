// Client-safe cost constants for the 520 Column features.
// Keep this file free of any server-only imports (db, fs, postgres, etc.)
// so it can be imported from client components.

export const COST_COPY = 10;
export const COST_PHOTO = 10;
export const COST_AVATAR = 10;
export const COST_ANALYSIS = 10;
export const COST_MEMOIR = 10;
// Music tab is wired to existing /api/music/generate which deducts COST_PER_MUSIC (20) on its own.
export const COST_MUSIC = 20;

export type LoveColumnType =
  | 'copy'
  | 'couple-photo'
  | 'couple-avatar'
  | 'analysis'
  | 'memoir'
  | 'music';
