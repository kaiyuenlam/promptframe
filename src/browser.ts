/**
 * Browser Entry Point for PromptFrame
 * This file exposes PromptFrame as a global variable for direct browser usage
 */

import { PromptFrame, createPromptFrame, promptFrame } from './index';

// Expose PromptFrame to global scope
declare global {
  interface Window {
    PromptFrame: typeof PromptFrame;
    createPromptFrame: typeof createPromptFrame;
    promptFrame: PromptFrame;
  }
}

// Attach to window object
if (typeof window !== 'undefined') {
  window.PromptFrame = PromptFrame;
  window.createPromptFrame = createPromptFrame;
  window.promptFrame = promptFrame;
}

// Export everything for UMD
export { PromptFrame, createPromptFrame, promptFrame };

// Export PromptFrame class as default for UMD
export default PromptFrame; 