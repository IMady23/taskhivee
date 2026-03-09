# Design Document: Particle Background Restoration

## Overview

This design document outlines the verification and testing strategy for the "Quantum Dots" particle background system in TaskHive. The system is already implemented in `ParticleBackground.jsx` and integrated into the appropriate entry pages. This specification focuses on validating the implementation against requirements through comprehensive testing.

The particle background system provides an interactive visual effect using HTML5 canvas, featuring blue dots that drift naturally and respond to mouse movements with repulsion behavior. The system is exclusively used on authentication and entry pages, maintaining a clean, distraction-free experience on dashboard pages.

## Architecture

### Component Structure

```
ParticleBackground.jsx (client/src/components/)
├── Canvas rendering engine
├── Particle class with physics
├── Mouse interaction handler
└── Animation loop with requestAnimationFrame

Entry Pages (client/src/pages/)
├── Landing.jsx → uses ParticleBackground
├── UnifiedAuth.jsx → uses ParticleBackground
├── LeaderAuth.jsx → uses ParticleBackground
├── MemberAuth.jsx → uses ParticleBackground
└── OnboardingWizard.jsx → uses ParticleBackground

Dashboard Pages (client/src/pages/)
├── LeaderDashboard.jsx → NO ParticleBackground
├── MemberDashboard.jsx → NO ParticleBackground
└── Dashboard.jsx → NO ParticleBackground
```

### Design Principles

1. **Separation of Concerns**: The particle system is a self-contained component with no dependencies on application state
2. **Performance**: Uses canvas for efficient rendering and proper cleanup to prevent memory leaks
3. **Interactivity**: Mouse tracking provides engaging user interaction without interfering with UI elements
4. **Scope Limitation**: Strictly limited to entry/auth pages to maintain focus on dashboard functionality

## Components and Interfaces

### ParticleBackground Component

**Purpose**: Render and animate an interactive particle system on a canvas element.

**Props**: None (stateless visual component)

**Internal State**:
- `canvasRef`: Reference to the canvas DOM element
- `particles`: Array of Particle instances
- `mouse`: Object tracking mouse position `{x, y}`
- `animationFrameId`: ID for canceling animation loop

**Key Methods**:
- `handleResize()`: Recalculates canvas dimensions and reinitializes particles
- `initParticles()`: Creates particle array based on viewport size
- `animate()`: Main animation loop that clears canvas and updates all particles
- `handleMouseMove(e)`: Updates mouse position for interaction
- `handleMouseLeave()`: Resets mouse tracking when cursor leaves viewport

### Particle Class

**Purpose**: Represent a single particle with position, velocity, and physics behavior.

**Properties**:
- `x, y`: Current position
- `vx, vy`: Velocity vectors (range: -0.5 to 0.5)
- `baseX, baseY`: Natural drift position for return behavior
- `size`: Particle radius (range: 1 to 3 pixels)
- `color`: Blue color (#0288D1 or #81D4FA)
- `density`: Mass factor for repulsion calculation (range: 1 to 31)

**Methods**:
- `draw()`: Renders the particle as a filled circle on canvas
- `update(mouse)`: Applies physics (repulsion, drift, boundary bounce) and renders

### Integration Pattern

Entry pages integrate ParticleBackground using this pattern:

```jsx
<div className="relative min-h-screen ...">
  <ParticleBackground />
  {/* Page content with higher z-index */}
</div>
```

The component is positioned absolutely with `z-index: 1` and `pointer-events: none` to allow UI interaction.

## Data Models

### Particle Data Structure

```javascript
{
  x: number,           // Current X position (0 to canvas.width)
  y: number,           // Current Y position (0 to canvas.height)
  vx: number,          // X velocity (-0.5 to 0.5)
  vy: number,          // Y velocity (-0.5 to 0.5)
  baseX: number,       // Natural drift X position
  baseY: number,       // Natural drift Y position
  size: number,        // Particle radius (1 to 3)
  color: string,       // Hex color (#0288D1 or #81D4FA)
  density: number      // Mass factor (1 to 31)
}
```

### Mouse Tracking Structure

```javascript
{
  x: number | null,    // Mouse X position or null when outside viewport
  y: number | null     // Mouse Y position or null when outside viewport
}
```

### Canvas Configuration

```javascript
{
  width: number,       // Window inner width
  height: number,      // Window inner height
  particleCount: number // (width × height) / 9000
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following testable properties and examples. Several criteria are redundant or can be combined:

**Redundancy Analysis**:
- Criteria 1.2 and 1.3 (color and size validation) can be combined into a single property about particle initialization
- Criteria 2.1, 2.2, and 2.3 (repulsion behavior) are related but test different aspects - keep separate
- Criteria 3.1 and 3.3 (velocity assignment and position updates) can be combined into a single property about physics
- Criteria 4.1-4.5 (entry page integration) are all specific examples - keep as unit tests
- Criteria 5.1-5.5 (dashboard exclusion) are all specific examples - keep as unit tests
- Criteria 6.1-6.4 (cleanup verification) are all specific examples - keep as unit tests

**Properties to Write**:
1. Particle initialization invariants (combines 1.2, 1.3)
2. Particle count calculation (1.4)
3. Repulsion force application (2.1)
4. Return to drift behavior (2.2)
5. Repulsion force calculation (2.3)
6. Velocity bounds (3.1)
7. Boundary bounce behavior (3.2)
8. Position update physics (3.3)
9. Return easing rate (3.5)

### Correctness Properties

Property 1: Particle initialization invariants
*For any* newly created particle, its size SHALL be between 1 and 3 pixels (inclusive), its color SHALL be either #0288D1 or #81D4FA, and its velocity components SHALL be between -0.5 and 0.5 (inclusive).
**Validates: Requirements 1.2, 1.3, 3.1**

Property 2: Particle count calculation
*For any* viewport dimensions (width and height), the particle count SHALL equal Math.floor((width × height) / 9000).
**Validates: Requirements 1.4**

Property 3: Repulsion force application
*For any* particle and mouse position where the distance is less than 200 pixels, calling update SHALL move the particle position away from the mouse position.
**Validates: Requirements 2.1**

Property 4: Return to drift behavior
*For any* particle and mouse position where the distance is greater than or equal to 200 pixels, calling update repeatedly SHALL gradually move the particle toward its base position.
**Validates: Requirements 2.2**

Property 5: Repulsion force calculation
*For any* particle, mouse position, and distance less than 200 pixels, the repulsion force SHALL be calculated as ((200 - distance) / 200) × particle.density, and the direction SHALL be away from the mouse.
**Validates: Requirements 2.3**

Property 6: Boundary bounce behavior
*For any* particle positioned at or beyond a canvas boundary (x ≤ 0, x ≥ width, y ≤ 0, or y ≥ height), calling update SHALL reverse the corresponding velocity component (vx or vy).
**Validates: Requirements 3.2**

Property 7: Position update physics
*For any* particle with velocity (vx, vy) and no mouse interaction, calling update SHALL increment the particle's x position by vx and y position by vy.
**Validates: Requirements 3.3**

Property 8: Return easing rate
*For any* particle with position different from its base position and mouse distance ≥ 200 pixels, the position change toward base SHALL be (current - base) / 50 per update call.
**Validates: Requirements 3.5**

## Error Handling

### Canvas Initialization Errors

**Scenario**: Canvas context cannot be obtained
**Handling**: Component should fail gracefully without crashing the page
**Implementation**: Add null check for `canvas.getContext('2d')` result

### Event Listener Errors

**Scenario**: Event listeners fail to attach or detach
**Handling**: Use try-catch blocks around event listener operations
**Implementation**: Wrap addEventListener/removeEventListener in error handling

### Animation Frame Errors

**Scenario**: requestAnimationFrame is not available (older browsers)
**Handling**: Provide fallback or graceful degradation
**Implementation**: Check for requestAnimationFrame availability before use

### Resize Event Flooding

**Scenario**: Rapid resize events cause performance issues
**Handling**: Debounce or throttle resize handler if needed
**Implementation**: Current implementation reinitializes on every resize - acceptable for this use case

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, component integration, file structure, and edge cases
- **Property tests**: Verify universal physics and mathematical properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete integration bugs and verify specific scenarios, while property tests verify that the physics and mathematical calculations work correctly across the entire input space.

### Property-Based Testing Configuration

**Library Selection**: 
- For JavaScript/React: Use `fast-check` library for property-based testing
- Install: `npm install --save-dev fast-check`

**Test Configuration**:
- Each property test MUST run minimum 100 iterations
- Each test MUST include a comment tag referencing the design property
- Tag format: `// Feature: particle-background-restoration, Property {number}: {property_text}`

**Property Test Implementation**:
- Each correctness property listed above MUST be implemented as a SINGLE property-based test
- Tests should generate random inputs (particle positions, velocities, mouse positions, viewport sizes)
- Tests should verify the mathematical and physical correctness of the particle system

### Unit Testing Strategy

**Component Tests** (React Testing Library):
- Verify ParticleBackground renders a canvas element (Requirements 1.1)
- Verify canvas has correct inline styles (Requirements 4.6, 4.7)
- Verify component cleanup on unmount (Requirements 7.1, 7.2, 7.3)
- Verify resize handler is called on window resize (Requirements 1.5)
- Verify mouse event handlers update mouse tracking (Requirements 2.4)

**Integration Tests**:
- Verify ParticleBackground is imported and rendered on Landing page (Requirements 4.1)
- Verify ParticleBackground is imported and rendered on UnifiedAuth page (Requirements 4.2)
- Verify ParticleBackground is imported and rendered on LeaderAuth page (Requirements 4.3)
- Verify ParticleBackground is imported and rendered on MemberAuth page (Requirements 4.4)
- Verify ParticleBackground is imported and rendered on OnboardingWizard (Requirements 4.5)
- Verify ParticleBackground is NOT imported in LeaderDashboard (Requirements 5.1)
- Verify ParticleBackground is NOT imported in MemberDashboard (Requirements 5.2)
- Verify ParticleBackground is NOT imported in Dashboard (Requirements 5.3)
- Verify dashboard pages do not render ParticleBackground (Requirements 5.4, 5.5)

**Codebase Verification Tests**:
- Verify no file named QuantumBackground.jsx exists (Requirements 6.1)
- Verify no imports reference QuantumBackground (Requirements 6.2)
- Verify exactly one particle background implementation exists (Requirements 6.3)
- Verify no code references to QuantumBackground (Requirements 6.4)

**Visual Verification** (Manual Testing):
- Visual inspection of entry pages to confirm quantum dots appearance (Requirements 8.1)
- Manual testing of mouse interaction to verify repulsion behavior (Requirements 8.2)
- Visual confirmation of natural drift when mouse is away (Requirements 8.3)
- Visual confirmation of smooth boundary bouncing (Requirements 8.5)

### Test Organization

```
tests/
├── unit/
│   ├── ParticleBackground.test.jsx       # Component unit tests
│   ├── ParticleBackground.integration.test.jsx  # Page integration tests
│   └── codebase-verification.test.js     # File structure tests
└── property/
    └── ParticlePhysics.property.test.js  # Property-based tests for physics
```

### Testing Priorities

1. **High Priority**: Property tests for physics calculations (Properties 1-8)
2. **High Priority**: Integration tests for page usage (Requirements 4.x, 5.x)
3. **Medium Priority**: Component unit tests for lifecycle and events
4. **Medium Priority**: Codebase verification tests (Requirements 6.x)
5. **Low Priority**: Manual visual verification (Requirements 8.x)

### Acceptance Criteria

All tests must pass before considering the verification complete:
- All 8 property-based tests pass with 100+ iterations each
- All unit tests pass
- All integration tests confirm correct page usage
- Manual visual inspection confirms expected appearance and behavior
- No references to QuantumBackground found in codebase
