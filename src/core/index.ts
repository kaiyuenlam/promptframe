/**
 * PromptFrame Core Module
 * Main entry point for the core framework functionality
 */

// Types
export * from './types';

// Parser
export { PFCParser } from './parser';

// Compiler
export { TSCompiler } from './compiler';
export { PFCCompiler } from './pfc-compiler';

// CSS Utilities
export { CSSScoper } from './css-scoper';

// Renderer
export { DOMRenderer } from './renderer';

// Re-export main types for convenience
export type {
  PFCComponent,
  ParsedPFC,
  ComponentInstance,
  RenderOptions,
  CompilerOptions,
  ComponentEvents,
  FrameworkConfig
} from './types'; 