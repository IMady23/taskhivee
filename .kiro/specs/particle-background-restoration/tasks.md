# Implementation Plan: Particle Background Restoration

## Overview

This implementation plan focuses on verifying and testing the existing "Quantum Dots" particle background system. The ParticleBackground component is already implemented and integrated into the correct pages. The tasks focus on creating comprehensive tests to validate the implementation against requirements, ensuring correct behavior, and verifying proper integration.

## Tasks

- [ ] 1. Set up testing infrastructure
  - Install fast-check library for property-based testing: `npm install --save-dev fast-check`
  - Create test directory structure: `tests/unit/` and `tests/property/`
  - Configure test environment for React component testing
  - _Requirements: All (testing foundation)_

- [ ] 2. Implement property-based tests for particle physics
  - [ ] 2.1 Write property test for particle initialization invariants
    - **Property 1: Particle initialization invariants**
    - Generate random particles and verify size (1-3), color (#0288D1 or #81D4FA), and velocity (-0.5 to 0.5) bounds
    - **Validates: Requirements 1.2, 1.3, 3.1**
  
  - [ ] 2.2 Write property test for particle count calculation
    - **Property 2: Particle count calculation**
    - Generate random viewport dimensions and verify particle count equals (width × height) / 9000
    - **Validates: Requirements 1.4**
  
  - [ ] 2.3 Write property test for repulsion force application
    - **Property 3: Repulsion force application**
    - Generate random particle and mouse positions with distance < 200, verify particle moves away
    - **Validates: Requirements 2.1**
  
  - [ ] 2.4 Write property test for return to drift behavior
    - **Property 4: Return to drift behavior**
    - Generate random particle and mouse positions with distance ≥ 200, verify particle moves toward base position
    - **Validates: Requirements 2.2**
  
  - [ ] 2.5 Write property test for repulsion force calculation
    - **Property 5: Repulsion force calculation**
    - Generate random distances < 200 and densities, verify force formula: ((200 - distance) / 200) × density
    - **Validates: Requirements 2.3**
  
  - [ ] 2.6 Write property test for boundary bounce behavior
    - **Property 6: Boundary bounce behavior**
    - Generate random particles at boundaries, verify velocity reversal
    - **Validates: Requirements 3.2**
  
  - [ ] 2.7 Write property test for position update physics
    - **Property 7: Position update physics**
    - Generate random particles with velocities, verify position increments by velocity
    - **Validates: Requirements 3.3**
  
  - [ ] 2.8 Write property test for return easing rate
    - **Property 8: Return easing rate**
    - Generate random particles away from base position, verify easing rate of (current - base) / 50
    - **Validates: Requirements 3.5**

- [ ] 3. Checkpoint - Ensure all property tests pass
  - Run property tests with 100+ iterations each
  - Verify all physics calculations are correct
  - Ask the user if questions arise

- [ ] 4. Implement component unit tests
  - [ ] 4.1 Write test for canvas rendering
    - Verify ParticleBackground renders a canvas element
    - Verify canvas has correct inline styles (position: absolute, z-index: 1, pointer-events: none)
    - _Requirements: 1.1, 4.6, 4.7_
  
  - [ ] 4.2 Write test for component lifecycle and cleanup
    - Verify useEffect cleanup function cancels animation frame
    - Verify cleanup removes event listeners (resize, mousemove, mouseleave)
    - Mock requestAnimationFrame and event listeners to verify cleanup
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 4.3 Write test for resize handler
    - Simulate window resize event
    - Verify canvas dimensions update
    - Verify particles are reinitialized
    - _Requirements: 1.5_
  
  - [ ] 4.4 Write test for mouse event handlers
    - Simulate mousemove event and verify mouse tracking updates
    - Simulate mouseleave event and verify mouse tracking resets
    - _Requirements: 2.4_

- [ ] 5. Implement integration tests for entry pages
  - [ ] 5.1 Write test for Landing page integration
    - Verify ParticleBackground is imported and rendered on Landing page
    - _Requirements: 4.1_
  
  - [ ] 5.2 Write test for UnifiedAuth page integration
    - Verify ParticleBackground is imported and rendered on UnifiedAuth page
    - _Requirements: 4.2_
  
  - [ ] 5.3 Write test for LeaderAuth page integration
    - Verify ParticleBackground is imported and rendered on LeaderAuth page
    - _Requirements: 4.3_
  
  - [ ] 5.4 Write test for MemberAuth page integration
    - Verify ParticleBackground is imported and rendered on MemberAuth page
    - _Requirements: 4.4_
  
  - [ ] 5.5 Write test for OnboardingWizard integration
    - Verify ParticleBackground is imported and rendered on OnboardingWizard component
    - _Requirements: 4.5_

- [ ] 6. Implement integration tests for dashboard exclusion
  - [ ] 6.1 Write test for LeaderDashboard exclusion
    - Verify ParticleBackground is NOT imported in LeaderDashboard
    - Verify rendering LeaderDashboard does not include ParticleBackground
    - _Requirements: 5.1, 5.4_
  
  - [ ] 6.2 Write test for MemberDashboard exclusion
    - Verify ParticleBackground is NOT imported in MemberDashboard
    - Verify rendering MemberDashboard does not include ParticleBackground
    - _Requirements: 5.2, 5.4_
  
  - [ ] 6.3 Write test for Dashboard exclusion
    - Verify ParticleBackground is NOT imported in Dashboard
    - Verify rendering Dashboard does not include ParticleBackground
    - _Requirements: 5.3, 5.4, 5.5_

- [ ] 7. Implement codebase verification tests
  - [ ] 7.1 Write test to verify QuantumBackground.jsx does not exist
    - Use filesystem checks to verify no file named QuantumBackground.jsx exists
    - _Requirements: 6.1, 6.3_
  
  - [ ] 7.2 Write test to verify no QuantumBackground imports
    - Search all .jsx and .js files for "QuantumBackground" imports
    - Verify no references found
    - _Requirements: 6.2, 6.4_
  
  - [ ] 7.3 Write test to verify single particle background implementation
    - Verify exactly one file named ParticleBackground.jsx exists
    - Verify it's located in client/src/components/
    - _Requirements: 6.3_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Run complete test suite (property tests + unit tests + integration tests)
  - Verify all requirements are covered by passing tests
  - Ask the user if questions arise

- [ ] 9. Manual visual verification
  - Document manual testing steps for visual appearance
  - Create checklist for verifying quantum dots appearance on entry pages
  - Create checklist for verifying mouse repulsion behavior
  - Create checklist for verifying dashboard pages have no particle background
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 10. Final checkpoint - Complete verification
  - Confirm all automated tests pass
  - Confirm manual visual verification completed
  - Ensure all requirements validated
  - Ask the user if questions arise

## Notes

- The ParticleBackground component is already implemented and integrated correctly
- This plan focuses on verification through comprehensive testing
- Property-based tests validate physics and mathematical correctness across all inputs
- Unit and integration tests validate specific scenarios and page integration
- Manual visual verification confirms the user experience matches expectations
- Each property test must run minimum 100 iterations and include the property reference comment
- All tests must pass before considering the verification complete
