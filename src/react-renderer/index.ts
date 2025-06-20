/**
 * React Renderer for PromptFrame components
 * Provides React-specific utilities and components
 */

import { PFCComponent, ComponentInstance, RenderOptions } from '../core/types';
import { DOMRenderer } from '../core/renderer';

/**
 * React hook to render PFC components
 */
export function usePFCComponent(
  component: PFCComponent,
  props: Record<string, any> = {},
  options: Omit<RenderOptions, 'container' | 'props'> = {}
): {
  ref: (element: HTMLElement | null) => void;
  instance: ComponentInstance | null;
} {
  // Use React state to properly track the instance
  const [instance, setInstance] = React.useState<ComponentInstance | null>(null);
  const [currentElement, setCurrentElement] = React.useState<HTMLElement | null>(null);

  const ref = (element: HTMLElement | null) => {
    if (element && element !== currentElement) {
      // Clean up previous instance
      if (instance) {
        instance.destroy();
      }

      setCurrentElement(element);
      
      // Render new component
      const newInstance = DOMRenderer.render(component, {
        ...options,
        container: element,
        props
      });
      
      setInstance(newInstance);
    } else if (!element && instance) {
      // Clean up when element is removed
      instance.destroy();
      setInstance(null);
      setCurrentElement(null);
    }
  };

  // Update props when they change
  React.useEffect(() => {
    if (instance) {
      instance.update(props);
    }
  }, [instance, props]);

  return { ref, instance };
}

/**
 * React component wrapper for PFC components
 */
export interface PFCReactComponentProps {
  component: PFCComponent;
  props?: Record<string, any>;
  options?: Omit<RenderOptions, 'container' | 'props'>;
  onMount?: (instance: ComponentInstance) => void;
  onUpdate?: (instance: ComponentInstance) => void;
  onDestroy?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * React functional component for rendering PFC components
 */
export function PFCReactComponent({
  component,
  props = {},
  options = {},
  onMount,
  onUpdate,
  onDestroy,
  className,
  style
}: PFCReactComponentProps) {
  const { ref, instance } = usePFCComponent(component, props, options);

  // Handle lifecycle callbacks
  React.useEffect(() => {
    if (instance && onMount) {
      onMount(instance);
    }
  }, [instance, onMount]);

  React.useEffect(() => {
    if (instance && onUpdate) {
      onUpdate(instance);
    }
  }, [instance, props, onUpdate]);

  React.useEffect(() => {
    return () => {
      if (onDestroy) {
        onDestroy();
      }
    };
  }, [onDestroy]);

  return React.createElement('div', {
    ref,
    className,
    style: {
      display: 'contents', // Make wrapper transparent
      ...style
    }
  });
}

/**
 * Context type definition
 */
interface PFCContextType {
  components: Record<string, PFCComponent>;
  registerComponent: (name: string, component: PFCComponent) => void;
  getComponent: (name: string) => PFCComponent | undefined;
}

/**
 * React context for providing PFC components
 */
export const PFCContext = React.createContext<PFCContextType>({
  components: {},
  registerComponent: () => {},
  getComponent: () => undefined
});

/**
 * Provider component for PFC context
 */
export function PFCProvider({
  children,
  components: initialComponents = {}
}: {
  children: React.ReactNode;
  components?: Record<string, PFCComponent>;
}) {
  const [components, setComponents] = React.useState(initialComponents);

  const registerComponent = React.useCallback((name: string, component: PFCComponent) => {
    setComponents(prev => ({
      ...prev,
      [name]: component
    }));
  }, []);

  const getComponent = React.useCallback((name: string) => {
    return components[name];
  }, [components]);

  const contextValue = React.useMemo(() => ({
    components,
    registerComponent,
    getComponent
  }), [components, registerComponent, getComponent]);

  return React.createElement(PFCContext.Provider, {
    value: contextValue
  }, children);
}

/**
 * Hook to access PFC context
 */
export function usePFCContext(): PFCContextType {
  return React.useContext(PFCContext);
}

/**
 * Hook to render a component by name from context
 */
export function usePFCComponentByName(
  name: string,
  props: Record<string, any> = {},
  options: Omit<RenderOptions, 'container' | 'props'> = {}
) {
  const { getComponent } = usePFCContext();
  const component = getComponent(name);

  if (!component) {
    console.warn(`PFC component "${name}" not found in context`);
    return { ref: () => {}, instance: null };
  }

  return usePFCComponent(component, props, options);
}

/**
 * Higher-order component for wrapping PFC components
 */
export function withPFCComponent(
  component: PFCComponent,
  defaultOptions: Omit<RenderOptions, 'container' | 'props'> = {}
) {
  return function WrappedPFCComponent(props: Record<string, any>) {
    const { ref } = usePFCComponent(component, props, defaultOptions);
    
    return React.createElement('div', {
      ref,
      style: { display: 'contents' }
    });
  };
}

/**
 * React component for dynamic PFC component rendering
 */
export function DynamicPFCComponent({
  componentName,
  props = {},
  options = {},
  fallback = null
}: {
  componentName: string;
  props?: Record<string, any>;
  options?: Omit<RenderOptions, 'container' | 'props'>;
  fallback?: React.ReactNode;
}) {
  const { getComponent } = usePFCContext();
  const component = getComponent(componentName);

  if (!component) {
    return fallback;
  }

  return React.createElement(PFCReactComponent, {
    component,
    props,
    options
  });
}

// Type declarations for React (would normally be imported)
declare namespace React {
  function createElement(type: any, props?: any, ...children: any[]): any;
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void];
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  function useMemo<T>(factory: () => T, deps: any[]): T;
  function useContext<T>(context: any): T;
  function createContext<T>(defaultValue: T): any;
  
  interface CSSProperties {
    [key: string]: any;
  }
  
  type ReactNode = any;
} 