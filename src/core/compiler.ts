import { CompilerOptions } from './types';

/**
 * Simple TypeScript compiler for PFC components
 * This is a basic implementation that handles common TypeScript features
 * For production use, consider integrating with the full TypeScript compiler API
 */
export class TSCompiler {
  private options: CompilerOptions;

  constructor(options: CompilerOptions = {}) {
    this.options = {
      target: options.target || 'es2020',
      module: options.module || 'commonjs',
      strict: options.strict ?? true,
      sourceMap: options.sourceMap ?? false,
    };
  }

  /**
   * Compile TypeScript code to JavaScript
   * This is a simplified transpiler - for full TypeScript support, use the TypeScript compiler API
   */
  compile(source: string, filename: string = 'component.ts'): { js: string; sourceMap?: string; diagnostics: string[] } {
    const diagnostics: string[] = [];
    
    try {
      // Basic TypeScript to JavaScript transformations
      let js = source
        // Remove type annotations
        .replace(/:\s*[A-Za-z][A-Za-z0-9<>[\]|&\s]*(?=[,;=\)])/g, '')
        // Remove interface declarations
        .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
        // Remove type imports
        .replace(/import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]*['"];?/g, '')
        // Convert const assertions
        .replace(/as\s+const/g, '')
        // Remove accessibility modifiers
        .replace(/\b(public|private|protected|readonly)\s+/g, '')
        // Remove optional parameters
        .replace(/\?\s*:/g, ':');

      // Handle template string interpolation
      if (filename.includes('template')) {
        js = this.transformTemplate(js, this.extractComponentName(filename));
      }

      return {
        js: js.trim(),
        sourceMap: this.options.sourceMap ? this.generateSourceMap(source, js) : undefined,
        diagnostics
      };
    } catch (error) {
      diagnostics.push(`Compilation error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        js: source, // Return original source on error
        diagnostics
      };
    }
  }

  /**
   * Transform template literals with prop interpolation
   */
  transformTemplate(template: string, componentName: string): string {
    // Replace {{ prop }} syntax with JavaScript template literals
    const transformed = template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
      return `\${${expression.trim()}}`;
    });

    // Wrap in a function that can be called with props
    return `
      function render${componentName}(props = {}) {
        const { ${this.extractPropNames(template).join(', ')} } = props;
        return \`${transformed.replace(/`/g, '\\`')}\`;
      }
    `;
  }

  /**
   * Extract prop names from template
   */
  private extractPropNames(template: string): string[] {
    const propNames = new Set<string>();
    const matches = template.matchAll(/\{\{\s*([^}]+)\s*\}\}/g);
    
    for (const match of matches) {
      const expression = match[1].trim();
      // Simple extraction - could be enhanced with proper AST parsing
      const propMatch = expression.match(/^(\w+)/);
      if (propMatch) {
        propNames.add(propMatch[1]);
      }
    }
    
    return Array.from(propNames);
  }

  /**
   * Extract component name from filename
   */
  private extractComponentName(filename: string): string {
    const match = filename.match(/([^\/\\]+)(?:\.[^.]*)?$/);
    return match ? match[1].replace(/[^a-zA-Z0-9]/g, '') : 'Component';
  }

  /**
   * Generate a simple source map (basic implementation)
   */
  private generateSourceMap(original: string, transformed: string): string {
    return JSON.stringify({
      version: 3,
      file: 'component.js',
      sourceRoot: '',
      sources: ['component.ts'],
      names: [],
      mappings: this.generateMappings(original, transformed),
      sourcesContent: [original]
    });
  }

  /**
   * Generate basic mappings for source map
   */
  private generateMappings(original: string, transformed: string): string {
    // This is a very basic implementation
    // For production use, implement proper VLQ encoding
    const originalLines = original.split('\n').length;
    const transformedLines = transformed.split('\n').length;
    
    return Array(Math.min(originalLines, transformedLines))
      .fill('AAAA')
      .join(';');
  }
} 