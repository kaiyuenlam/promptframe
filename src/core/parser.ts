import { PFCBlock, ParsedPFC } from './types';

/**
 * Parser for .pfc files
 */
export class PFCParser {
  private static readonly BLOCK_REGEX = /<(template|script|style)([^>]*)>([\s\S]*?)<\/\1>/gi;
  private static readonly ATTRIBUTE_REGEX = /(\w+)(?:=["']([^"']*)["'])?/g;

  /**
   * Parse a .pfc file content into structured blocks
   */
  static parse(content: string, filename?: string): ParsedPFC {
    const blocks: ParsedPFC = {};
    
    // Extract component name from filename if provided
    if (filename) {
      const nameMatch = filename.match(/([^\/\\]+)\.pfc$/);
      if (nameMatch) {
        blocks.name = nameMatch[1];
      }
    }

    let match;
    const regex = new RegExp(this.BLOCK_REGEX);
    
    while ((match = regex.exec(content)) !== null) {
      const [, blockType, attributesStr, blockContent] = match;
      const type = blockType as 'template' | 'script' | 'style';
      
      // Parse attributes
      const attributes = this.parseAttributes(attributesStr);
      
      // Determine language and scoped flag
      const lang = attributes.lang || (type === 'script' ? 'typescript' : type === 'style' ? 'css' : 'html');
      const scoped = type === 'style' && (attributes.scoped !== undefined || attributes.scoped === 'true');
      
      const block: PFCBlock = {
        type,
        content: blockContent.trim(),
        attributes,
        lang,
        ...(type === 'style' && { scoped })
      };
      
      blocks[type] = block;
    }
    
    return blocks;
  }

  /**
   * Parse HTML attributes string into key-value pairs
   */
  private static parseAttributes(attributesStr: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    if (!attributesStr.trim()) {
      return attributes;
    }
    
    let match;
    const regex = new RegExp(this.ATTRIBUTE_REGEX);
    
    while ((match = regex.exec(attributesStr)) !== null) {
      const [, key, value] = match;
      attributes[key] = value || 'true';
    }
    
    return attributes;
  }

  /**
   * Validate that required blocks are present
   */
  static validate(parsed: ParsedPFC): string[] {
    const errors: string[] = [];
    
    if (!parsed.template) {
      errors.push('Missing required <template> block');
    }
    
    if (parsed.template && !parsed.template.content.trim()) {
      errors.push('<template> block cannot be empty');
    }
    
    return errors;
  }

  /**
   * Extract props from script block if present
   */
  static extractProps(parsed: ParsedPFC): Record<string, any> {
    if (!parsed.script) {
      return {};
    }
    
    const content = parsed.script.content;
    const props: Record<string, any> = {};
    
    // Simple regex to extract props definition
    // This is a basic implementation - could be enhanced with AST parsing
    const propsMatch = content.match(/(?:export\s+)?(?:interface\s+)?Props\s*[=:]?\s*\{([^}]+)\}/);
    if (propsMatch) {
      const propsContent = propsMatch[1];
      const propLines = propsContent.split('\n');
      
      for (const line of propLines) {
        const propMatch = line.trim().match(/(\w+)[\?:]?\s*:\s*([^;,]+)/);
        if (propMatch) {
          const [, propName, propType] = propMatch;
          props[propName] = this.getDefaultValueForType(propType.trim());
        }
      }
    }
    
    return props;
  }

  /**
   * Get default value based on TypeScript type
   */
  private static getDefaultValueForType(type: string): any {
    if (type.includes('string')) return '';
    if (type.includes('number')) return 0;
    if (type.includes('boolean')) return false;
    if (type.includes('[]') || type.includes('Array')) return [];
    if (type.includes('{}') || type.includes('object')) return {};
    return undefined;
  }
} 