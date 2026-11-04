import {reviseDistractors} from './distractor-revisions.js';
import {transfer6} from './transfer6.js';
import {transfer7} from './transfer7.js';
import {transfer8} from './transfer8.js';
import {transfer9} from './transfer9.js';
import {bank6} from './bank6.js';
import {bank7} from './bank7.js';
import {bank8} from './bank8.js';
import {bank9} from './bank9.js';
export const examBank=[...bank6,...bank7,...bank8,...bank9,...transfer6,...transfer7,...transfer8,...transfer9].map(reviseDistractors);
// Change when keys or scoring semantics change; old sessions cannot silently use new keys.
export const EXAM_VERSION='2026-11-02.1';
// This version used identical source keys but strict/optional-AI grading. Retain
// those sessions with their original scoring rather than silently upgrading.
export const LEGACY_EXAM_VERSION='2026-10-30.2';
