import { PFCComponent, ComponentInstance, RenderOptions, ComponentEvents } from './types';
import { CSSScoper } from './css-scoper';

/**
 * DOM Renderer for PFC components
 */
export class DOMRenderer {
  private static instances = new Map<string, ComponentInstance>();
  private static globalEvents: ComponentEvents = {};

  /**
   * Register global event handlers
   */
  static setGlobalEvents(events: ComponentEvents): void {
    this.globalEvents = events;
  }

  /**
   * Render a component into the DOM
   */
  static render(component: PFCComponent, options: RenderOptions = {}): ComponentInstance {
    const instanceId = options.componentId || this.generateInstanceId();
    const container = options.container || document.body;
    const props = options.props || {};

    // Validate component structure
    if (!component) {
      throw new Error('Component is null or undefined');
    }
    
    if (!component.name) {
      throw new Error('Component must have a name');
    }
    
    if (component.html == null) {
      console.warn(`Component "${component.name}" has null/undefined HTML, using empty string`);
      component.html = '';
    }

    // Create component element
    const element = document.createElement('div');
    element.setAttribute('data-pfc-component', component.name);
    
    // Handle scoped CSS or Shadow DOM
    let scopeId: string | undefined;
    let styleElement: HTMLStyleElement | undefined;
    
    if (options.shadowDom) {
      return this.renderWithShadowDOM(component, element, props, instanceId, container);
    } else if (options.scopedCSS !== false && component.css) {
      scopeId = CSSScoper.generateScopeId(component.name);
      element.setAttribute(scopeId, '');
      styleElement = this.injectScopedCSS(component.css, scopeId);
    }

    // Render HTML with prop interpolation
    const renderedHTML = this.interpolateProps(component.html, props);
    element.innerHTML = renderedHTML;

    // Execute component JavaScript if present
    let jsContext: any = {};
    if (component.js) {
      jsContext = this.executeComponentJS(component.js, props, element);
    }

    // Create component instance
    const instance: ComponentInstance = {
      id: instanceId,
      element,
      component,
      props: { ...props },
      destroy: () => this.destroyInstance(instanceId),
      update: (newProps: Record<string, any>) => this.updateInstance(instanceId, newProps)
    };

    // Store instance
    this.instances.set(instanceId, instance);

    // Call lifecycle hooks
    this.globalEvents.beforeMount?.(instance);

    // Append to container
    container.appendChild(element);

    // Call mounted hook
    this.globalEvents.mounted?.(instance);

    return instance;
  }

  /**
   * Render component with Shadow DOM
   */
  private static renderWithShadowDOM(
    component: PFCComponent,
    element: HTMLElement,
    props: Record<string, any>,
    instanceId: string,
    container: HTMLElement
  ): ComponentInstance {
    // Create shadow root
    const shadowRoot = element.attachShadow({ mode: 'open' });

    // Create style element for CSS
    if (component.css) {
      const styleElement = document.createElement('style');
      styleElement.textContent = component.css;
      shadowRoot.appendChild(styleElement);
    }

    // Create content container
    const contentElement = document.createElement('div');
    const renderedHTML = this.interpolateProps(component.html, props);
    contentElement.innerHTML = renderedHTML;
    shadowRoot.appendChild(contentElement);

    // Execute component JavaScript
    let jsContext: any = {};
    if (component.js) {
      jsContext = this.executeComponentJS(component.js, props, contentElement);
    }

    // Create instance
    const instance: ComponentInstance = {
      id: instanceId,
      element,
      component,
      props: { ...props },
      destroy: () => this.destroyInstance(instanceId),
      update: (newProps: Record<string, any>) => this.updateInstance(instanceId, newProps)
    };

    this.instances.set(instanceId, instance);

    // Lifecycle hooks
    this.globalEvents.beforeMount?.(instance);
    container.appendChild(element);
    this.globalEvents.mounted?.(instance);

    return instance;
  }

  /**
   * Interpolate props into HTML template
   */
  private static interpolateProps(html: string, props: Record<string, any>): string {
    // Handle undefined/null html
    if (html == null) {
      console.warn('Component HTML is null or undefined');
      return '';
    }
    
    // Ensure html is a string
    if (typeof html !== 'string') {
      console.warn('Component HTML is not a string, converting:', typeof html, html);
      html = String(html);
    }
    
    return html.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
      try {
        // Create a safe evaluation context
        const context = { ...props };
        
        // Simple property access - could be enhanced with a proper expression parser
        const value = this.evaluateExpression(expression.trim(), context);
        
        return value != null ? String(value) : '';
      } catch (error) {
        console.warn(`Error interpolating expression "${expression}":`, error);
        return match; // Return original if evaluation fails
      }
    });
  }

  /**
   * Safely evaluate an expression in the given context
   */
  private static evaluateExpression(expression: string, context: Record<string, any>): any {
    // Basic property access
    const parts = expression.split('.');
    let result = context;
    
    for (const part of parts) {
      if (result == null) return undefined;
      result = result[part];
    }
    
    return result;
  }

  /**
   * Execute component JavaScript in a sandboxed context
   */
  private static executeComponentJS(js: string, props: Record<string, any>, element: HTMLElement): any {
    try {
      // Create a context for the component script
      const context = {
        props,
        element,
        document,
        console,
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        // Add other safe globals as needed
      };

      // Create a function that executes the component script
      const scriptFunction = new Function(
        ...Object.keys(context),
        `
        try {
          ${js}
        } catch (error) {
          console.error('Error executing component script:', error);
        }
        `
      );

      // Execute the script with the context
      return scriptFunction(...Object.values(context));
    } catch (error) {
      console.error('Error creating component script context:', error);
      return {};
    }
  }

  /**
   * Inject scoped CSS into the document
   */
  private static injectScopedCSS(css: string, scopeId: string): HTMLStyleElement {
    const scopedCSS = CSSScoper.scopeCSS(css, scopeId);
    
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-pfc-scope', scopeId);
    styleElement.textContent = scopedCSS;
    
    document.head.appendChild(styleElement);
    
    return styleElement;
  }

  /**
   * Update component instance with new props
   */
  private static updateInstance(instanceId: string, newProps: Record<string, any>): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      console.warn(`Component instance ${instanceId} not found`);
      return;
    }

    // Call beforeUpdate hook
    this.globalEvents.beforeUpdate?.(instance, newProps);

    // Update props
    const oldProps = instance.props;
    instance.props = { ...instance.props, ...newProps };

    // Re-render HTML
    const renderedHTML = this.interpolateProps(instance.component.html, instance.props);
    
    if (instance.element.shadowRoot) {
      // Update shadow DOM content
      const contentElement = instance.element.shadowRoot.querySelector('div');
      if (contentElement) {
        contentElement.innerHTML = renderedHTML;
      }
    } else {
      // Update regular DOM
      instance.element.innerHTML = renderedHTML;
    }

    // Re-execute JavaScript if present
    if (instance.component.js) {
      this.executeComponentJS(instance.component.js, instance.props, instance.element);
    }

    // Call updated hook
    this.globalEvents.updated?.(instance);
  }

  /**
   * Destroy a component instance
   */
  private static destroyInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      console.warn(`Component instance ${instanceId} not found`);
      return;
    }

    // Call beforeDestroy hook
    this.globalEvents.beforeDestroy?.(instance);

    // Remove from DOM
    if (instance.element.parentNode) {
      instance.element.parentNode.removeChild(instance.element);
    }

    // Remove scoped styles if any
    const scopeAttribute = Array.from(instance.element.attributes)
      .find(attr => attr.name.startsWith('pfc-'));
    
    if (scopeAttribute) {
      const styleElement = document.querySelector(`style[data-pfc-scope="${scopeAttribute.name}"]`);
      if (styleElement) {
        styleElement.remove();
      }
    }

    // Remove from instances map
    this.instances.delete(instanceId);

    // Call destroyed hook
    this.globalEvents.destroyed?.(instance);
  }

  /**
   * Generate a unique instance ID
   */
  private static generateInstanceId(): string {
    return `pfc-instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all active component instances
   */
  static getInstances(): ComponentInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get a specific component instance by ID
   */
  static getInstance(instanceId: string): ComponentInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Destroy all component instances
   */
  static destroyAll(): void {
    const instanceIds = Array.from(this.instances.keys());
    instanceIds.forEach(id => this.destroyInstance(id));
  }
} 