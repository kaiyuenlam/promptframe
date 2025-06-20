import { PFCParser } from './parser';
import { TSCompiler } from './compiler';
import { CSSScoper } from './css-scoper';
import { PFCComponent, ParsedPFC, CompilerOptions } from './types';

/**
 * Main compiler for .pfc files
 */
export class PFCCompiler {
  private tsCompiler: TSCompiler;
  private options: CompilerOptions;

  constructor(options: CompilerOptions = {}) {
    this.options = options;
    this.tsCompiler = new TSCompiler(options);
  }

  /**
   * Compile a .pfc file content into a PFCComponent
   */
  compile(content: string, filename?: string): { component: PFCComponent; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Parse the .pfc file
      const parsed = PFCParser.parse(content, filename);
      
      // Validate the parsed content
      const validationErrors = PFCParser.validate(parsed);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        return { 
          component: this.createEmptyComponent(parsed.name || 'UnknownComponent'), 
          errors, 
          warnings 
        };
      }

      // Create the component
      const component = this.createComponent(parsed, filename);
      
      return { component, errors, warnings };
    } catch (error) {
      errors.push(`Compilation failed: ${error instanceof Error ? error.message : String(error)}`);
      return { 
        component: this.createEmptyComponent('ErrorComponent'), 
        errors, 
        warnings 
      };
    }
  }

  /**
   * Compile multiple .pfc files
   */
  compileMultiple(files: Array<{ content: string; filename: string }>): Array<{ 
    filename: string; 
    component: PFCComponent; 
    errors: string[]; 
    warnings: string[] 
  }> {
    return files.map(file => ({
      filename: file.filename,
      ...this.compile(file.content, file.filename)
    }));
  }

  /**
   * Create a PFCComponent from parsed content
   */
  private createComponent(parsed: ParsedPFC, filename?: string): PFCComponent {
    const componentName = parsed.name || this.extractComponentName(filename);
    
    // Process HTML template
    const html = this.processTemplate(parsed.template?.content || '', componentName);
    
    // Process CSS
    const css = this.processCSS(parsed.style?.content || '', parsed.style?.scoped || false);
    
    // Process JavaScript/TypeScript
    const js = this.processScript(parsed.script?.content || '', componentName);
    
    // Extract props definition
    const props = PFCParser.extractProps(parsed);

    return {
      name: componentName,
      html,
      css,
      js,
      props
    };
  }

  /**
   * Process HTML template
   */
  private processTemplate(template: string, componentName: string): string {
    if (!template.trim()) {
      return '<div></div>';
    }

    // Basic template processing
    let processedTemplate = template.trim();

    // Handle conditional rendering (simple v-if like syntax)
    processedTemplate = this.processConditionalRendering(processedTemplate);
    
    // Handle list rendering (simple v-for like syntax)
    processedTemplate = this.processListRendering(processedTemplate);

    return processedTemplate;
  }

  /**
   * Process CSS styles
   */
  private processCSS(css: string, scoped: boolean): string {
    if (!css.trim()) {
      return '';
    }

    let processedCSS = css.trim();

    // If scoped, we'll handle scoping during render time
    // For now, just return the CSS as-is
    return processedCSS;
  }

  /**
   * Process JavaScript/TypeScript
   */
  private processScript(script: string, componentName: string): string {
    if (!script.trim()) {
      return '';
    }

    // Compile TypeScript to JavaScript
    const { js, diagnostics } = this.tsCompiler.compile(script, `${componentName}.ts`);
    
    if (diagnostics.length > 0) {
      console.warn(`TypeScript compilation warnings for ${componentName}:`, diagnostics);
    }

    return js;
  }

  /**
   * Process conditional rendering syntax
   */
  private processConditionalRendering(template: string): string {
    // Replace v-if="condition" with template logic
    return template.replace(/v-if=["']([^"']+)["']/g, (match, condition) => {
      return `data-pfc-if="${condition}"`;
    });
  }

  /**
   * Process list rendering syntax
   */
  private processListRendering(template: string): string {
    // Replace v-for="item in items" with template logic
    return template.replace(/v-for=["']([^"']+)\s+in\s+([^"']+)["']/g, (match, item, items) => {
      return `data-pfc-for="${item}:${items}"`;
    });
  }

  /**
   * Extract component name from filename
   */
  private extractComponentName(filename?: string): string {
    if (!filename) {
      return 'Component';
    }
    
    const match = filename.match(/([^\/\\]+)\.pfc$/);
    return match ? match[1] : 'Component';
  }

  /**
   * Create an empty component for error cases
   */
  private createEmptyComponent(name: string): PFCComponent {
    return {
      name,
      html: '<div>Error loading component</div>',
      css: '',
      js: '',
      props: {}
    };
  }

  /**
   * Compile to JSON (for CLI output)
   */
  compileToJSON(content: string, filename?: string): string {
    const { component, errors, warnings } = this.compile(content, filename);
    
    const result = {
      component,
      meta: {
        compiled: new Date().toISOString(),
        filename: filename || 'unknown.pfc',
        errors,
        warnings,
        version: '1.0.0'
      }
    };
    
    return JSON.stringify(result, null, 2);
  }

  /**
   * Set compiler options
   */
  setOptions(options: CompilerOptions): void {
    this.options = { ...this.options, ...options };
    this.tsCompiler = new TSCompiler(this.options);
  }

  /**
   * Get current compiler options
   */
  getOptions(): CompilerOptions {
    return { ...this.options };
  }
} 