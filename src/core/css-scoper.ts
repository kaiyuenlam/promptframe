/**
 * CSS Scoping utility for PFC components
 */
export class CSSScoper {
  private static scopeCounter = 0;

  /**
   * Generate a unique scope ID for a component
   */
  static generateScopeId(componentName?: string): string {
    const id = `pfc-${componentName || 'component'}-${++this.scopeCounter}`;
    return id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /**
   * Scope CSS by adding a unique attribute selector to all rules
   */
  static scopeCSS(css: string, scopeId: string): string {
    if (!css.trim()) {
      return css;
    }

    // Split CSS into rules and scope each one
    const rules = this.splitCSSRules(css);
    const scopedRules = rules.map(rule => this.scopeRule(rule, scopeId));
    
    return scopedRules.join('\n\n');
  }

  /**
   * Split CSS into individual rules
   */
  private static splitCSSRules(css: string): string[] {
    const rules: string[] = [];
    let currentRule = '';
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < css.length; i++) {
      const char = css[i];
      const prevChar = css[i - 1];
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
      } else if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            currentRule += char;
            rules.push(currentRule.trim());
            currentRule = '';
            continue;
          }
        }
      }
      
      currentRule += char;
    }
    
    // Add any remaining rule
    if (currentRule.trim()) {
      rules.push(currentRule.trim());
    }
    
    return rules.filter(rule => rule.length > 0);
  }

  /**
   * Scope a single CSS rule
   */
  private static scopeRule(rule: string, scopeId: string): string {
    // Skip @rules like @media, @keyframes, etc.
    if (rule.trim().startsWith('@')) {
      return this.scopeAtRule(rule, scopeId);
    }
    
    // Extract selector and declaration
    const braceIndex = rule.indexOf('{');
    if (braceIndex === -1) {
      return rule;
    }
    
    const selector = rule.substring(0, braceIndex).trim();
    const declaration = rule.substring(braceIndex);
    
    // Scope the selector
    const scopedSelector = this.scopeSelector(selector, scopeId);
    
    return `${scopedSelector} ${declaration}`;
  }

  /**
   * Scope at-rules like @media
   */
  private static scopeAtRule(rule: string, scopeId: string): string {
    // For @media and similar rules, scope the inner rules
    const braceIndex = rule.indexOf('{');
    if (braceIndex === -1) {
      return rule;
    }
    
    const atRuleHeader = rule.substring(0, braceIndex + 1);
    const innerCSS = rule.substring(braceIndex + 1, rule.lastIndexOf('}'));
    const closingBrace = '}';
    
    const scopedInnerCSS = this.scopeCSS(innerCSS, scopeId);
    
    return `${atRuleHeader}\n${scopedInnerCSS}\n${closingBrace}`;
  }

  /**
   * Scope a CSS selector
   */
  private static scopeSelector(selector: string, scopeId: string): string {
    // Split multiple selectors (comma-separated)
    const selectors = selector.split(',').map(s => s.trim());
    
    return selectors.map(sel => {
      // Handle pseudo-selectors and complex selectors
      if (sel.includes(':')) {
        return this.scopeComplexSelector(sel, scopeId);
      }
      
      // Simple selector scoping
      return `[${scopeId}] ${sel}`.trim();
    }).join(', ');
  }

  /**
   * Scope complex selectors with pseudo-classes, pseudo-elements, etc.
   */
  private static scopeComplexSelector(selector: string, scopeId: string): string {
    // Handle :host selector (for Shadow DOM compatibility)
    if (selector.includes(':host')) {
      return selector.replace(/:host/g, `[${scopeId}]`);
    }
    
    // For other pseudo-selectors, add scope before the base element
    const pseudoMatch = selector.match(/^([^:]+)(:.*)$/);
    if (pseudoMatch) {
      const [, baseSelector, pseudoPart] = pseudoMatch;
      return `[${scopeId}] ${baseSelector.trim()}${pseudoPart}`;
    }
    
    // Fallback: add scope at the beginning
    return `[${scopeId}] ${selector}`;
  }

  /**
   * Create CSS for defining CSS custom properties (variables) in scope
   */
  static createScopeVariables(scopeId: string, variables: Record<string, string>): string {
    if (Object.keys(variables).length === 0) {
      return '';
    }
    
    const props = Object.entries(variables)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join('\n');
    
    return `[${scopeId}] {\n${props}\n}`;
  }

  /**
   * Extract CSS custom properties from CSS text
   */
  static extractCSSVariables(css: string): Record<string, string> {
    const variables: Record<string, string> = {};
    const variableRegex = /--([a-zA-Z0-9-_]+):\s*([^;]+);/g;
    
    let match;
    while ((match = variableRegex.exec(css)) !== null) {
      const [, name, value] = match;
      variables[name] = value.trim();
    }
    
    return variables;
  }
} 