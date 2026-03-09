# Design Document: Elite Professional Design System

## Overview

This design document outlines the implementation of a comprehensive design system for TaskHive that replaces inconsistent styling with a cohesive, production-ready visual language. The system is inspired by leading SaaS companies (Linear, Vercel, Figma) and focuses on creating an effortlessly expensive and professional appearance.

The design system consists of six core pillars:
1. HSL-based color system with semantic tokens
2. Inter font typography with rhythmic scale
3. Subtle gradient backgrounds replacing particle effects
4. Consistent component styling with professional glassmorphism
5. Refined layout structure with predictable spacing
6. Accessibility and performance optimizations

This system will be implemented primarily through CSS custom properties, global stylesheets, and Tailwind configuration extensions, ensuring consistency across all components while maintaining flexibility for future enhancements.

## Architecture

### System Structure

The design system follows a layered architecture:

```
┌─────────────────────────────────────────┐
│         Application Components          │
│  (React components using design tokens) │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Tailwind Utility Classes         │
│   (Extended with design token values)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         CSS Custom Properties           │
│    (Design tokens: colors, spacing,     │
│         typography, shadows)             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Global Stylesheets             │
│  (index.css, App.css - base styles)     │
└─────────────────────────────────────────┘
```

### File Organization

- **`client/src/index.css`**: Root-level CSS custom properties, typography system, base element styles
- **`client/src/App.css`**: Application-level layout, background treatment, component base styles
- **`client/tailwind.config.js`**: Tailwind theme extensions referencing CSS custom properties
- **`client/src/components/ParticleBackground.jsx`**: Modified or replaced with subtle gradient background
- **Component files**: Updated to use CSS custom properties and Tailwind utilities

### Design Token Flow

1. Define HSL values as CSS custom properties in `:root`
2. Reference these properties in Tailwind configuration
3. Use Tailwind utilities or direct CSS custom properties in components
4. Enable theme switching by updating root-level custom properties

## Components and Interfaces

### 1. Color System Module

**Purpose**: Provide semantic color tokens using HSL format for consistent theming.

**CSS Custom Properties Structure**:

```css
:root {
  /* Base HSL values (dark mode default) */
  --background: 222 47% 11%;           /* Deep blue-gray */
  --foreground: 213 31% 91%;           /* Light blue-white */
  --card: 222 47% 14%;                 /* Slightly lighter than background */
  --card-foreground: 213 31% 91%;      /* Same as foreground */
  --primary: 217 91% 60%;              /* Vibrant blue */
  --primary-foreground: 222 47% 11%;   /* Dark text on primary */
  --secondary: 222 47% 18%;            /* Muted blue-gray */
  --secondary-foreground: 213 31% 91%; /* Light text */
  --muted: 222 47% 18%;                /* Same as secondary */
  --muted-foreground: 215 20% 65%;     /* Dimmed text */
  --accent: 217 91% 60%;               /* Same as primary */
  --accent-foreground: 222 47% 11%;    /* Dark text on accent */
  --destructive: 0 84% 60%;            /* Red for errors */
  --destructive-foreground: 213 31% 91%; /* Light text */
  --border: 222 47% 20%;               /* Subtle borders */
  --input: 222 47% 20%;                /* Input borders */
  --ring: 217 91% 60%;                 /* Focus ring color */
  
  /* Spacing scale (rem units) */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  --spacing-3xl: 4rem;     /* 64px */
}

/* Light mode (optional) */
@media (prefers-color-scheme: light) {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    /* ... other light mode values */
  }
}
```

**Usage Pattern**:
```css
.card {
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
}
```

### 2. Typography System Module

**Purpose**: Establish consistent text styling using Inter font with a rhythmic scale.

**Font Loading Strategy**:

```css
/* Variable font import for optimal control */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap');

:root {
  /* Typography scale */
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Font sizes (rem units) */
  --font-size-xs: 0.75rem;    /* 12px - tiny text */
  --font-size-sm: 0.875rem;   /* 14px - caption */
  --font-size-base: 1rem;     /* 16px - body */
  --font-size-lg: 1.125rem;   /* 18px - large body */
  --font-size-xl: 1.25rem;    /* 20px - h4 */
  --font-size-2xl: 1.5rem;    /* 24px - h3 */
  --font-size-3xl: 1.875rem;  /* 30px - h2 */
  --font-size-4xl: 2.25rem;   /* 36px - h1 */
  
  /* Font weights */
  --font-weight-normal: 450;  /* Modern thin look for body */
  --font-weight-medium: 500;
  --font-weight-semibold: 600; /* Headings */
  
  /* Line heights */
  --line-height-tight: 1.2;   /* Headings */
  --line-height-normal: 1.6;  /* Body text */
  --line-height-relaxed: 1.8; /* Loose text */
  
  /* Letter spacing */
  --letter-spacing-tight: -0.02em; /* Headings */
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
}

body {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-normal);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}

h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}
```

**Typography Classes**:
```css
.text-caption {
  font-size: var(--font-size-sm);
  color: hsl(var(--muted-foreground));
}

.text-tiny {
  font-size: var(--font-size-xs);
  color: hsl(var(--muted-foreground));
}
```

### 3. Background Treatment Module

**Purpose**: Replace distracting particle animations with subtle, professional background gradients.

**Implementation Strategy**:

Option A: Modify ParticleBackground.jsx to render static gradients
Option B: Remove ParticleBackground.jsx and implement pure CSS solution

**Recommended Approach (Pure CSS)**:

```css
/* In App.css or index.css */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  background: 
    radial-gradient(
      circle at 20% 30%, 
      hsla(217, 91%, 60%, 0.03) 0%, 
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 70%, 
      hsla(280, 91%, 60%, 0.03) 0%, 
      transparent 50%
    ),
    hsl(var(--background));
  background-attachment: fixed;
}

/* Noise overlay for depth */
body::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E");
  pointer-events: none;
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  body::before,
  body::after {
    animation: none;
  }
}
```

**ParticleBackground.jsx Modification**:

If keeping the component for backward compatibility:
```jsx
// Reduce particle count to near-zero or make invisible
const ParticleBackground = () => {
  return null; // Or render with opacity: 0
};
```

### 4. Component Styling Module

**Purpose**: Standardize all UI components with professional glassmorphism and consistent interactions.

**Card Component Styling**:

```css
.card {
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem; /* 12px */
  box-shadow: 
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: 
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover {
  transform: scale(1.02);
  border-color: hsl(var(--border) / 0.8);
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
  .card:hover {
    transform: none;
  }
}
```

**Button Component Styling**:

```css
.btn-primary {
  background: linear-gradient(
    135deg,
    hsl(var(--primary)),
    hsl(var(--primary) / 0.8)
  );
  color: hsl(var(--primary-foreground));
  border: none;
  border-radius: 0.5rem;
  padding: 0.625rem 1.25rem;
  font-weight: var(--font-weight-medium);
  transition: 
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px hsla(var(--primary), 0.3);
}

.btn-primary:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

**Input Component Styling**:

```css
.input {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--input));
  border-radius: 0.5rem;
  padding: 0.625rem 0.875rem;
  font-size: var(--font-size-base);
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 3px hsla(var(--ring), 0.1);
}

.input::placeholder {
  color: hsl(var(--muted-foreground));
}
```

### 5. Layout Structure Module

**Purpose**: Establish consistent spacing and layout patterns across all pages.

**Sidebar Layout**:

```css
.sidebar {
  width: 256px;
  background-color: hsl(var(--card));
  border-right: 1px solid hsl(var(--border));
  padding: var(--spacing-lg);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid hsl(var(--border));
  }
}
```

**Main Content Layout**:

```css
.main-content {
  margin-left: 256px;
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin-right: auto;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: var(--spacing-md);
  }
}
```

**Card Grid Layout**:

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

@media (max-width: 640px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
}
```

### 6. Accessibility Module

**Purpose**: Ensure WCAG AA compliance and support for user preferences.

**Color Contrast Validation**:

All color combinations must meet 4.5:1 contrast ratio:
- `--foreground` on `--background`: ≥ 4.5:1
- `--card-foreground` on `--card`: ≥ 4.5:1
- `--primary-foreground` on `--primary`: ≥ 4.5:1
- `--muted-foreground` on `--background`: ≥ 3:1 (for large text)

**Motion Preferences**:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Focus Management**:

```css
/* Ensure all interactive elements have visible focus states */
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Remove default focus styles only when focus-visible is supported */
a:focus:not(:focus-visible),
button:focus:not(:focus-visible) {
  outline: none;
}
```

**Touch Target Sizing**:

```css
/* Ensure minimum 44x44px touch targets on mobile */
@media (max-width: 768px) {
  button,
  a,
  input[type="checkbox"],
  input[type="radio"] {
    min-width: 44px;
    min-height: 44px;
  }
}
```

## Data Models

### Design Token Schema

The design system uses a hierarchical token structure:

```typescript
interface DesignTokens {
  colors: {
    semantic: {
      background: HSLValue;
      foreground: HSLValue;
      card: HSLValue;
      cardForeground: HSLValue;
      primary: HSLValue;
      primaryForeground: HSLValue;
      secondary: HSLValue;
      secondaryForeground: HSLValue;
      muted: HSLValue;
      mutedForeground: HSLValue;
      accent: HSLValue;
      accentForeground: HSLValue;
      destructive: HSLValue;
      destructiveForeground: HSLValue;
      border: HSLValue;
      input: HSLValue;
      ring: HSLValue;
    };
  };
  spacing: {
    xs: string;  // "0.25rem"
    sm: string;  // "0.5rem"
    md: string;  // "1rem"
    lg: string;  // "1.5rem"
    xl: string;  // "2rem"
    "2xl": string; // "3rem"
    "3xl": string; // "4rem"
  };
  typography: {
    fontFamily: {
      base: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      "2xl": string;
      "3xl": string;
      "4xl": string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
    letterSpacing: {
      tight: string;
      normal: string;
      wide: string;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

type HSLValue = string; // Format: "222 47% 11%"
```

### Tailwind Configuration Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
      },
    },
  },
};
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several opportunities to consolidate redundant properties:

**Consolidations Made:**
1. Typography properties (2.2, 2.3, 2.4, 2.5) can be combined into comprehensive typography validation properties
2. Layout padding properties (5.2, 5.3) are specific examples that don't need separate properties - they're implementation details
3. Component styling properties (4.1, 4.3, 4.4, 4.5) can be grouped by component type
4. Tailwind configuration properties (8.1, 8.2, 8.3, 8.4) can be combined into a single comprehensive validation

**Properties Retained:**
- Each property provides unique validation value
- Properties test different aspects of the design system
- No logical redundancy where one property implies another

### Color System Properties

**Property 1: HSL Color Format Consistency**

*For any* CSS file in the codebase, all color declarations should use the `hsl(var(--*))` format with no hardcoded hex or rgb values.

**Validates: Requirements 1.1, 1.5**

**Property 2: Semantic Color Token Completeness**

*For any* required semantic color token (background, foreground, card, primary, secondary, muted, accent, destructive, border, ring), the token should be defined in the :root CSS selector.

**Validates: Requirements 1.3**

**Property 3: Spacing Scale Consistency**

*For any* spacing token defined in the design system, the token should follow the consistent naming pattern (xs, sm, md, lg, xl, 2xl, 3xl) and use rem units.

**Validates: Requirements 1.4**

**Property 4: Light Mode Token Parity**

*For any* semantic color token defined in dark mode, if light mode is implemented, an equivalent token should exist in the light mode media query.

**Validates: Requirements 1.6**

### Typography Properties

**Property 5: Body Text Typography Consistency**

*For any* body text element in the application, the computed font-weight should be 450 and line-height should be 1.6.

**Validates: Requirements 2.2, 2.4**

**Property 6: Heading Typography Consistency**

*For any* heading element (h1-h6), the computed font-weight should be 600, letter-spacing should be -0.02em, and line-height should be 1.2.

**Validates: Requirements 2.3, 2.5**

### Background Treatment Properties

**Property 7: Gradient Opacity Constraint**

*For any* radial gradient defined in background styles, the maximum opacity value should not exceed 0.03.

**Validates: Requirements 3.2**

### Component Styling Properties

**Property 8: Card Component Styling Consistency**

*For any* element with the card class, it should have a solid background using hsl(var(--card)), a border using hsl(var(--border)), and defined box-shadow values.

**Validates: Requirements 4.1**

**Property 9: Input Focus Ring Consistency**

*For any* input field element, when focused, it should display a focus ring using hsl(var(--ring)) with appropriate outline or box-shadow.

**Validates: Requirements 4.3**

**Property 10: Interactive Element Hover Behavior**

*For any* interactive element (buttons, cards, links), the hover state should include transform: scale(1.02) and a transition on border-color or relevant property.

**Validates: Requirements 4.4**

**Property 11: Focus State Visibility**

*For any* interactive component (button, link, input, select, textarea), a visible focus-visible style should be defined with outline or box-shadow.

**Validates: Requirements 4.5**

### Layout Properties

**Property 12: Card Gap Consistency**

*For any* container using gap property for card layouts, the gap value should be either 1rem or 1.5rem (var(--spacing-md) or var(--spacing-lg)).

**Validates: Requirements 5.5**

### Accessibility Properties

**Property 13: Color Contrast Compliance**

*For any* text element and its background, the color contrast ratio should be at least 4.5:1 for normal text or 3:1 for large text (WCAG AA compliance).

**Validates: Requirements 6.1**

**Property 14: Touch Target Sizing**

*For any* interactive element on mobile viewports (max-width: 768px), the computed min-width and min-height should be at least 44px.

**Validates: Requirements 6.5**

### Tailwind Configuration Properties

**Property 15: Tailwind Design Token Integration**

*For any* semantic design token (color, spacing, typography), an equivalent entry should exist in the Tailwind configuration that references the CSS custom property using var(--*) syntax.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

## Error Handling

### CSS Parsing Errors

**Scenario**: Invalid CSS custom property references or malformed HSL values

**Handling Strategy**:
- Use CSS validation tools during build process to catch syntax errors
- Provide fallback colors for critical UI elements
- Log warnings for missing custom properties in development mode

**Example**:
```css
/* Fallback pattern */
.card {
  background-color: #1a1f2e; /* Fallback */
  background-color: hsl(var(--card)); /* Preferred */
}
```

### Font Loading Failures

**Scenario**: Inter font fails to load from CDN or network issues

**Handling Strategy**:
- Use font-display: swap to show fallback fonts immediately
- Define comprehensive font stack with system fonts
- Monitor font loading with FontFaceObserver (optional)

**Example**:
```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}
```

### Color Contrast Failures

**Scenario**: Color combinations fail WCAG AA contrast requirements

**Handling Strategy**:
- Use automated contrast checking tools during development
- Adjust HSL lightness values to meet minimum ratios
- Document contrast ratios for each color pair
- Provide high-contrast mode option for users who need it

**Validation Tool**:
```javascript
// Example contrast checking function
function getContrastRatio(foreground, background) {
  // Calculate relative luminance and return ratio
  // Ensure ratio >= 4.5 for normal text
}
```

### Browser Compatibility Issues

**Scenario**: Older browsers don't support CSS custom properties or HSL format

**Handling Strategy**:
- Set minimum browser support requirements (modern evergreen browsers)
- Provide fallback values for critical properties
- Use PostCSS plugins to generate fallbacks if needed
- Display upgrade notice for unsupported browsers

### Missing Design Tokens

**Scenario**: Component references undefined CSS custom property

**Handling Strategy**:
- Validate all token references during build
- Use CSS linting rules to catch undefined variables
- Provide comprehensive token documentation
- Use TypeScript for Tailwind config to catch missing tokens

**Linting Rule Example**:
```javascript
// stylelint configuration
{
  "rules": {
    "custom-property-no-missing-var-function": true,
    "function-no-unknown": true
  }
}
```

### Performance Degradation

**Scenario**: Too many CSS custom properties or complex gradients impact performance

**Handling Strategy**:
- Limit number of custom properties to essential tokens
- Use simple gradients with minimal color stops
- Avoid animating expensive properties (use transform and opacity)
- Monitor paint and layout performance with DevTools

**Performance Budget**:
- Maximum 100 CSS custom properties
- Maximum 3 color stops per gradient
- Maximum 2 pseudo-elements for background effects

## Testing Strategy

### Dual Testing Approach

This design system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Verify specific color token values are defined
- Test font loading with mocked network responses
- Validate specific component styling examples
- Test responsive breakpoint behavior at exact pixel widths
- Verify accessibility features like focus states on specific components

**Property-Based Tests**: Verify universal properties across all inputs
- Validate all CSS files contain only HSL color format (no hex/rgb)
- Ensure all semantic tokens exist and follow naming conventions
- Verify color contrast ratios meet WCAG AA across all combinations
- Test that all interactive elements have proper hover and focus states
- Validate Tailwind configuration includes all design tokens

**Balance**: Unit tests provide concrete examples and catch specific bugs, while property tests ensure the design system maintains consistency across all components and use cases.

### Property-Based Testing Configuration

**Library Selection**: 
- **JavaScript/React**: Use `fast-check` library for property-based testing
- **CSS Testing**: Use `css-tree` for parsing and validating CSS
- **Color Contrast**: Use `wcag-contrast` or similar library for ratio calculations

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: elite-professional-design-system, Property {number}: {property_text}`

**Example Property Test Structure**:

```javascript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { parseCSS, extractColors } from './test-utils';

describe('Design System Properties', () => {
  // Feature: elite-professional-design-system, Property 1: HSL Color Format Consistency
  it('should use only HSL color format in all CSS files', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllCSSFiles()),
        (cssFile) => {
          const colors = extractColors(cssFile);
          const hasHexOrRgb = colors.some(
            color => color.match(/#[0-9a-f]{3,6}|rgb\(|rgba\(/i)
          );
          expect(hasHexOrRgb).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: elite-professional-design-system, Property 13: Color Contrast Compliance
  it('should meet WCAG AA contrast ratios for all text/background pairs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllTextBackgroundPairs()),
        (pair) => {
          const ratio = calculateContrastRatio(pair.foreground, pair.background);
          const minRatio = pair.isLargeText ? 3.0 : 4.5;
          expect(ratio).toBeGreaterThanOrEqual(minRatio);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Examples

```javascript
describe('Design System Unit Tests', () => {
  it('should load Inter font with correct weight', () => {
    const bodyStyle = window.getComputedStyle(document.body);
    expect(bodyStyle.fontFamily).toContain('Inter');
    expect(bodyStyle.fontWeight).toBe('450');
  });

  it('should apply dark mode colors by default', () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const bgColor = rootStyles.getPropertyValue('--background');
    expect(bgColor).toBe('222 47% 11%');
  });

  it('should show focus ring on button focus', () => {
    const button = document.querySelector('.btn-primary');
    button.focus();
    const styles = window.getComputedStyle(button);
    expect(styles.outline).toContain('hsl(var(--ring))');
  });
});
```

### Integration Testing

**Visual Regression Testing**:
- Use tools like Percy, Chromatic, or BackstopJS
- Capture screenshots of key components and pages
- Compare against baseline to detect unintended visual changes
- Test both dark and light modes (if implemented)

**Accessibility Testing**:
- Use axe-core or similar automated accessibility testing
- Verify WCAG AA compliance across all pages
- Test keyboard navigation flows
- Validate screen reader compatibility

**Performance Testing**:
- Measure First Contentful Paint (FCP) and Largest Contentful Paint (LCP)
- Ensure font loading doesn't cause significant layout shift (CLS)
- Verify CSS bundle size remains under budget
- Test paint performance with Chrome DevTools

### Manual Testing Checklist

- [ ] Verify visual consistency across all major pages
- [ ] Test responsive behavior at common breakpoints (320px, 768px, 1024px, 1440px)
- [ ] Validate color contrast with browser DevTools
- [ ] Test keyboard navigation and focus indicators
- [ ] Verify hover states on all interactive elements
- [ ] Check font rendering across different operating systems
- [ ] Test with prefers-reduced-motion enabled
- [ ] Validate in multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Review with design team for alignment with vision
- [ ] Gather user feedback on professional appearance

### Continuous Integration

**Build-Time Checks**:
- Run CSS linting to catch undefined custom properties
- Validate color contrast ratios automatically
- Check for hardcoded color values in component files
- Verify Tailwind configuration completeness
- Run property-based tests in CI pipeline

**Pre-Commit Hooks**:
- Lint CSS files for design system compliance
- Run fast unit tests for immediate feedback
- Validate new components use design tokens

**Documentation Updates**:
- Auto-generate design token documentation from CSS
- Update component library with new styling patterns
- Maintain changelog of design system updates
