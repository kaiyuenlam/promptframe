/**
 * Core types for PromptFrame
 */

export interface PFCComponent {
  name: string;
  html: string;
  css: string;
  js: string;
  props?: Record<string, any>;
}

export interface PFCBlock {
  type: 'template' | 'script' | 'style';
  content: string;
  attributes?: Record<string, string>;
  lang?: string;
  scoped?: boolean;
}

export interface ParsedPFC {
  template?: PFCBlock;
  script?: PFCBlock;
  style?: PFCBlock;
  name?: string;
}

export interface CompilerOptions {
  target?: 'es5' | 'es2015' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'esnext';
  module?: 'commonjs' | 'amd' | 'system' | 'umd' | 'es6' | 'es2015' | 'esnext';
  strict?: boolean;
  sourceMap?: boolean;
}

export interface RenderOptions {
  container?: HTMLElement;
  props?: Record<string, any>;
  shadowDom?: boolean;
  scopedCSS?: boolean;
  componentId?: string;
}

export interface ComponentInstance {
  id: string;
  element: HTMLElement;
  component: PFCComponent;
  props: Record<string, any>;
  destroy: () => void;
  update: (newProps: Record<string, any>) => void;
}

export type PropValue = string | number | boolean | object | null | undefined;

export interface ComponentEvents {
  beforeMount?: (instance: ComponentInstance) => void;
  mounted?: (instance: ComponentInstance) => void;
  beforeUpdate?: (instance: ComponentInstance, newProps: Record<string, any>) => void;
  updated?: (instance: ComponentInstance) => void;
  beforeDestroy?: (instance: ComponentInstance) => void;
  destroyed?: (instance: ComponentInstance) => void;
}

export interface FrameworkConfig {
  globalCSS?: string;
  theme?: Record<string, any>;
  components?: Record<string, PFCComponent>;
  events?: ComponentEvents;
} 