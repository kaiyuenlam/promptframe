# PromptFrame Examples

This directory contains comprehensive examples demonstrating PromptFrame's capabilities.

## 📁 Directory Structure

### `basic/` - Getting Started Examples
- Simple component creation
- Basic prop interpolation  
- CSS scoping demonstrations
- Component lifecycle usage

### `components/` - Component Library Examples
- Common UI components (buttons, forms, cards)
- Advanced component patterns
- Reusable component libraries
- Complex prop handling

### `react-integration/` - React Examples  
- React hooks usage
- Context providers
- Component integration
- Full React applications

### `projects/` - Complete Project Examples
- Mini applications
- Component composition
- Real-world usage scenarios
- Best practices demonstrations

## 🚀 Running Examples

### Prerequisites
```bash
# Install PromptFrame
npm install -g promptframe

# Or install locally in your project
npm install promptframe
```

### Basic Usage
```bash
# Compile any .pfc file
promptframe compile basic/HelloWorld.pfc

# Compile entire directory
promptframe compile components/ -o dist/

# View HTML examples
open basic/index.html
```

### React Examples
```bash
cd react-integration/
npm install
npm start
```

## 📚 Learning Path

1. **Start with `basic/`** - Learn fundamental concepts
2. **Explore `components/`** - See real component patterns  
3. **Try `react-integration/`** - Understand React usage
4. **Study `projects/`** - See complete applications

## 🎯 Key Learning Topics

- **.pfc file structure** - Template, script, style blocks
- **Prop interpolation** - `{{ }}` syntax and data binding
- **Scoped CSS** - Automatic style encapsulation
- **TypeScript integration** - Type-safe components
- **Event handling** - User interaction patterns
- **Component composition** - Building complex UIs
- **React integration** - Hooks and context usage

Each example includes detailed comments and documentation to help you understand the concepts and patterns used. 