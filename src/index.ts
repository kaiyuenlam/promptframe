/**
 * PromptFrame - TypeScript-based UI Component Framework
 * 
 * A framework for creating reusable UI components using .pfc files
 * with template, script, and style blocks.
 */

// Export core functionality
export * from './core';

// Export React renderer (optional)
export * from './react-renderer';

// Main framework class
import { PFCCompiler } from './core/pfc-compiler';
import { DOMRenderer } from './core/renderer';
import { PFCComponent, FrameworkConfig, ComponentEvents } from './core/types';

/**
 * Main PromptFrame class
 */
export class PromptFrame {
  private compiler: PFCCompiler;
  private components: Map<string, PFCComponent>;
  private config: FrameworkConfig;

  constructor(config: FrameworkConfig = {}) {
    this.config = config;
    this.compiler = new PFCCompiler();
    this.components = new Map();

    // Register global events if provided
    if (config.events) {
      DOMRenderer.setGlobalEvents(config.events);
    }

    // Register initial components if provided
    if (config.components) {
      Object.entries(config.components).forEach(([name, component]) => {
        this.registerComponent(name, component);
      });
    }
  }

  /**
   * Compile a .pfc file and register the component
   */
  compileAndRegister(content: string, filename?: string): { success: boolean; errors: string[]; warnings: string[] } {
    const { component, errors, warnings } = this.compiler.compile(content, filename);
    
    if (errors.length === 0) {
      this.registerComponent(component.name, component);
      return { success: true, errors, warnings };
    }
    
    return { success: false, errors, warnings };
  }

  /**
   * Register a compiled component
   */
  registerComponent(name: string, component: PFCComponent): void {
    this.components.set(name, component);
  }

  /**
   * Get a registered component
   */
  getComponent(name: string): PFCComponent | undefined {
    return this.components.get(name);
  }

  /**
   * Render a component to the DOM
   */
  render(componentName: string, container: HTMLElement, props: Record<string, any> = {}) {
    const component = this.getComponent(componentName);
    if (!component) {
      throw new Error(`Component "${componentName}" not found`);
    }

    return DOMRenderer.render(component, {
      container,
      props,
      scopedCSS: true
    });
  }

  /**
   * Get all registered component names
   */
  getComponentNames(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Update framework configuration
   */
  updateConfig(config: Partial<FrameworkConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.events) {
      DOMRenderer.setGlobalEvents(config.events);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): FrameworkConfig {
    return { ...this.config };
  }

  /**
   * Clear all registered components
   */
  clear(): void {
    this.components.clear();
    DOMRenderer.destroyAll();
  }
}

/**
 * Create a new PromptFrame instance
 */
export function createPromptFrame(config?: FrameworkConfig): PromptFrame {
  return new PromptFrame(config);
}

/**
 * Default PromptFrame instance
 */
export const promptFrame = new PromptFrame();

// Convenience exports
export { PFCCompiler, DOMRenderer };
export type {
  PFCComponent,
  ComponentInstance,
  RenderOptions,
  CompilerOptions,
  ComponentEvents,
  FrameworkConfig
} from './core/types'; 