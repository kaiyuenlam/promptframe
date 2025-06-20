#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { PFCCompiler } from '../core/pfc-compiler';
import { CompilerOptions } from '../core/types';

const program = new Command();

program
  .name('promptframe')
  .description('PromptFrame CLI - Compile .pfc files to components')
  .version('1.0.0');

program
  .command('compile')
  .description('Compile .pfc files to .json')
  .argument('<input>', 'Input .pfc file or directory')
  .option('-o, --output <path>', 'Output directory or file')
  .option('-w, --watch', 'Watch for file changes')
  .option('--target <target>', 'TypeScript compilation target', 'es2020')
  .option('--module <module>', 'Module system', 'commonjs')
  .option('--source-map', 'Generate source maps')
  .option('--strict', 'Enable strict mode', true)
  .action(async (input: string, options: any) => {
    const compilerOptions: CompilerOptions = {
      target: options.target,
      module: options.module,
      sourceMap: options.sourceMap,
      strict: options.strict
    };

    const compiler = new PFCCompiler(compilerOptions);

    if (options.watch) {
      await watchFiles(input, options.output, compiler);
    } else {
      await compileFiles(input, options.output, compiler);
    }
  });

program
  .command('init')
  .description('Initialize a new PromptFrame project')
  .argument('[name]', 'Project name', 'my-promptframe-project')
  .action((name: string) => {
    initProject(name);
  });

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('--open', 'Open browser automatically')
  .action((options: any) => {
    console.log('Development server feature coming soon!');
    console.log(`Would start on port ${options.port}`);
  });

/**
 * Compile .pfc files
 */
async function compileFiles(input: string, output: string | undefined, compiler: PFCCompiler): Promise<void> {
  try {
    const inputPath = path.resolve(input);
    const stats = fs.statSync(inputPath);

    if (stats.isFile()) {
      await compileSingleFile(inputPath, output, compiler);
    } else if (stats.isDirectory()) {
      await compileDirectory(inputPath, output, compiler);
    } else {
      console.error('Input must be a file or directory');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Compile a single .pfc file
 */
async function compileSingleFile(filePath: string, outputPath: string | undefined, compiler: PFCCompiler): Promise<void> {
  if (!filePath.endsWith('.pfc')) {
    console.error('Input file must have .pfc extension');
    return;
  }

  console.log(`Compiling ${filePath}...`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);
  
  const { component, errors, warnings } = compiler.compile(content, filename);
  
  // Show warnings
  if (warnings.length > 0) {
    console.warn('Warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  // Show errors
  if (errors.length > 0) {
    console.error('Errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    return;
  }
  
  // Determine output path
  const outputFilePath = outputPath || filePath.replace('.pfc', '.json');
  
  // Generate JSON output
  const jsonOutput = compiler.compileToJSON(content, filename);
  
  // Write output
  fs.writeFileSync(outputFilePath, jsonOutput);
  console.log(`✓ Compiled to ${outputFilePath}`);
}

/**
 * Compile all .pfc files in a directory
 */
async function compileDirectory(dirPath: string, outputDir: string | undefined, compiler: PFCCompiler): Promise<void> {
  const pfcFiles = findPFCFiles(dirPath);
  
  if (pfcFiles.length === 0) {
    console.log('No .pfc files found in directory');
    return;
  }
  
  const outputDirectory = outputDir || path.join(dirPath, 'dist');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }
  
  console.log(`Compiling ${pfcFiles.length} files...`);
  
  const results = [];
  
  for (const filePath of pfcFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const relativePath = path.relative(dirPath, filePath);
    
    const { component, errors, warnings } = compiler.compile(content, filename);
    
    results.push({
      file: relativePath,
      component: component.name,
      errors: errors.length,
      warnings: warnings.length
    });
    
    if (errors.length === 0) {
      const outputPath = path.join(outputDirectory, relativePath.replace('.pfc', '.json'));
      const outputPathDir = path.dirname(outputPath);
      
      if (!fs.existsSync(outputPathDir)) {
        fs.mkdirSync(outputPathDir, { recursive: true });
      }
      
      const jsonOutput = compiler.compileToJSON(content, filename);
      fs.writeFileSync(outputPath, jsonOutput);
    }
  }
  
  // Print summary
  console.log('\nCompilation Summary:');
  results.forEach(result => {
    const status = result.errors > 0 ? '✗' : '✓';
    console.log(`  ${status} ${result.file} (${result.component})`);
    if (result.warnings > 0) {
      console.log(`    ${result.warnings} warning(s)`);
    }
    if (result.errors > 0) {
      console.log(`    ${result.errors} error(s)`);
    }
  });
  
  const successful = results.filter(r => r.errors === 0).length;
  console.log(`\n${successful}/${results.length} files compiled successfully`);
}

/**
 * Find all .pfc files recursively
 */
function findPFCFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        traverse(fullPath);
      } else if (stats.isFile() && entry.endsWith('.pfc')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Watch files for changes
 */
async function watchFiles(input: string, output: string | undefined, compiler: PFCCompiler): Promise<void> {
  console.log(`Watching ${input} for changes...`);
  
  // Initial compilation
  await compileFiles(input, output, compiler);
  
  // Set up file watcher
  fs.watch(input, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.pfc')) {
      console.log(`\nFile changed: ${filename}`);
      compileFiles(input, output, compiler).catch(console.error);
    }
  });
  
  console.log('Press Ctrl+C to stop watching');
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\nStopping watcher...');
    process.exit(0);
  });
}

/**
 * Initialize a new project
 */
function initProject(name: string): void {
  const projectDir = path.resolve(name);
  
  if (fs.existsSync(projectDir)) {
    console.error(`Directory ${name} already exists`);
    return;
  }
  
  console.log(`Creating new PromptFrame project: ${name}`);
  
  // Create project structure
  fs.mkdirSync(projectDir);
  fs.mkdirSync(path.join(projectDir, 'src'));
  fs.mkdirSync(path.join(projectDir, 'src', 'components'));
  fs.mkdirSync(path.join(projectDir, 'dist'));
  
  // Create package.json
  const packageJson = {
    name,
    version: '1.0.0',
    scripts: {
      build: 'promptframe compile src -o dist',
      dev: 'promptframe compile src -o dist --watch'
    },
    devDependencies: {
      promptframe: '^1.0.0'
    }
  };
  
  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create example component
  const exampleComponent = `<template>
  <div class="hello">
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
    <button onclick="handleClick()">Click me!</button>
  </div>
</template>

<script lang="typescript">
interface Props {
  title: string;
  message: string;
}

function handleClick() {
  alert('Button clicked!');
}
</script>

<style scoped>
.hello {
  text-align: center;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #42b883;
}

button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #369970;
}
</style>`;
  
  fs.writeFileSync(
    path.join(projectDir, 'src', 'components', 'Hello.pfc'),
    exampleComponent
  );
  
  // Create HTML example
  const htmlExample = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
</head>
<body>
    <div id="app"></div>
    <script src="dist/Hello.js"></script>
    <script>
        // Example of how to use the compiled component
        // This would be integrated with your framework
        console.log('Component compiled and ready to use');
    </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(projectDir, 'index.html'), htmlExample);
  
  console.log(`✓ Project ${name} created successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${name}`);
  console.log(`  npm install`);
  console.log(`  npm run build`);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Parse command line arguments
program.parse(); 