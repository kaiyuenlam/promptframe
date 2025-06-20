# Component Library Examples

This directory contains advanced PromptFrame component examples demonstrating real-world UI patterns and best practices.

## 🧩 Available Components

### FormInput.pfc
**Advanced Form Input Component**
- ✅ Type validation and error states
- 🎨 Custom icons and styling
- ♿ Full accessibility support
- 📱 Responsive design
- 🔧 Configurable validation rules

**Key Features:**
- Multiple input types (text, email, password, etc.)
- Real-time validation with custom rules
- Error message display with visual indicators
- Help text and required field indicators
- Focus states and interaction feedback

### Modal.pfc
**Flexible Modal Dialog**
- 🎭 Multiple size variants (small, medium, large, fullscreen)
- 🎯 Backdrop and ESC key handling
- 🎨 Smooth animations and transitions
- 📱 Mobile-responsive design
- ⚙️ Configurable headers and footers

**Key Features:**
- Customizable title and content
- Confirm/cancel button actions
- Click-outside-to-close functionality
- Keyboard navigation support
- Body scroll prevention when open

### Toast.pfc
**Notification Toast System**
- 🎨 Multiple types (success, error, warning, info)
- 📍 Flexible positioning (6 positions available)
- ⏱️ Auto-dismiss with custom duration
- 👆 Manual dismiss capability
- 📱 Mobile-optimized display

**Key Features:**
- Animated entrance/exit transitions
- Stacking support for multiple toasts
- Icon-based type identification
- Responsive positioning
- Custom timing controls

### Dropdown.pfc
**Advanced Select Component**
- 🔍 Built-in search functionality
- 🎨 Custom option rendering
- ♿ Keyboard navigation support
- 📱 Mobile-friendly interface
- 🔧 Flexible option configuration

**Key Features:**
- Searchable option filtering
- Selected state management
- Disabled option support
- Click-outside-to-close
- Custom placeholder text

## 🚀 Usage Examples

### Form Input
```typescript
pfc.render('FormInput', {
  label: 'Email Address',
  type: 'email',
  placeholder: 'Enter your email',
  required: true,
  icon: '📧',
  helpText: 'We will never share your email',
  validation: (value) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return true;
  },
  onChange: (value) => console.log('Email changed:', value)
});
```

### Modal Dialog
```typescript
pfc.render('Modal', {
  isOpen: true,
  title: 'Confirm Delete',
  message: 'Are you sure you want to delete this item? This action cannot be undone.',
  showFooter: true,
  confirmText: 'Delete',
  cancelText: 'Cancel',
  size: 'medium',
  onConfirm: () => console.log('Item deleted'),
  onCancel: () => console.log('Delete cancelled'),
  onClose: () => console.log('Modal closed')
});
```

### Toast Notification
```typescript
pfc.render('Toast', {
  type: 'success',
  title: 'Success!',
  message: 'Your changes have been saved successfully.',
  duration: 5000,
  dismissible: true,
  position: 'top-right',
  onDismiss: () => console.log('Toast dismissed')
});
```

### Dropdown Select
```typescript
pfc.render('Dropdown', {
  label: 'Choose a Country',
  placeholder: 'Select country...',
  searchable: true,
  searchPlaceholder: 'Search countries...',
  options: [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia', disabled: true }
  ],
  onChange: (value, option) => {
    console.log('Selected:', value, option);
  }
});
```

## 🎨 Styling and Customization

All components use scoped CSS to prevent style conflicts. Each component supports:

- **CSS Custom Properties** - For easy theme customization
- **Responsive Design** - Mobile-first approach
- **Dark Mode** - Ready for theme switching
- **Animation Controls** - Customizable transitions
- **Accessibility** - WCAG 2.1 compliant

## 📁 File Structure

```
components/
├── README.md           # This documentation
├── FormInput.pfc       # Advanced form input component
├── Modal.pfc          # Modal dialog component
├── Toast.pfc          # Notification toast component
├── Dropdown.pfc       # Select dropdown component
└── index.html         # Interactive demo page
```

## 🧪 Testing and Demo

Run the interactive demo to see all components in action:

```bash
# Compile components
promptframe compile components/

# Open demo in browser
open components/index.html
```

The demo page includes:
- Live component examples
- Interactive controls
- Code snippets for each component
- Real-time state management demonstrations

## 🔧 Customization Tips

1. **Modify CSS Variables** - Each component exposes CSS custom properties
2. **Extend Props Interface** - Add new properties for additional functionality
3. **Override Styles** - Use CSS specificity to customize appearance
4. **Add Event Handlers** - Extend with custom interaction logic
5. **Compose Components** - Combine multiple components for complex UIs

## 📚 Best Practices

1. **Always validate props** - Use TypeScript interfaces for type safety
2. **Handle edge cases** - Empty states, loading states, error states
3. **Optimize performance** - Debounce inputs, lazy load options
4. **Test accessibility** - Use screen readers, keyboard navigation
5. **Document usage** - Provide clear examples and prop descriptions

These components serve as a foundation for building more complex UI libraries with PromptFrame. They demonstrate advanced patterns like state management, event handling, accessibility, and responsive design. 