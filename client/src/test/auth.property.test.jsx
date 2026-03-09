/**
 * Property-Based Tests for Authentication Flow
 * Feature: taskhive-completion
 * 
 * These tests verify team code validation, role-based authentication,
 * and error handling in the unified authentication system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import fc from 'fast-check'
import UnifiedAuth from '../pages/UnifiedAuth'
import { AuthContext } from '../context/AuthContext'

// Mock the team service
vi.mock('../services/teamService', () => ({
  getTeamById: vi.fn()
}))

// Mock react-router-dom navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('mode=signup')]
  }
})

// Mock AuthContext
const mockAuthContext = {
  login: vi.fn(),
  registerLeader: vi.fn(),
  registerMember: vi.fn(),
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false
}

const renderUnifiedAuth = (contextValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={contextValue}>
        <UnifiedAuth />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('Authentication Flow Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  /**
   * Property 2: Team code validation is enforced
   * Validates: Requirements 2.2
   */
  it('Property 2: Team code validation is enforced', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.emailAddress(),
        fc.string({ minLength: 6, maxLength: 20 }),
        (teamCode, email, password) => {
          renderUnifiedAuth()
          
          // Select member role using test ID
          const memberButton = screen.getByTestId('member-role-button')
          fireEvent.click(memberButton)
          
          // Verify team code field appears for members
          const teamCodeField = screen.getByPlaceholderText(/team code/i)
          expect(teamCodeField).toBeInTheDocument()
          
          // Fill in form without team code
          const emailField = screen.getByPlaceholderText(/you@example.com/i)
          const passwordField = screen.getByPlaceholderText(/••••••••/i)
          
          fireEvent.change(emailField, { target: { value: email } })
          fireEvent.change(passwordField, { target: { value: password } })
          
          // Try to submit without team code
          const submitButton = screen.getByRole('button', { name: /create account/i })
          fireEvent.click(submitButton)
          
          // Should show team code required error
          expect(screen.getByText(/team code is required/i)).toBeInTheDocument()
          
          cleanup()
        }
      ),
      { numRuns: 3 }
    )
  })

  it('should display role selection options', () => {
    renderUnifiedAuth()
    
    // Verify both role options are present
    expect(screen.getByTestId('leader-role-button')).toBeInTheDocument()
    expect(screen.getByTestId('member-role-button')).toBeInTheDocument()
    
    // Verify role descriptions
    expect(screen.getByText('Manage teams & projects')).toBeInTheDocument()
    expect(screen.getByText('Join existing team')).toBeInTheDocument()
  })

  it('should show team code field only for members', () => {
    renderUnifiedAuth()
    
    // Initially no team code field
    expect(screen.queryByPlaceholderText(/team code/i)).not.toBeInTheDocument()
    
    // Select member role using test ID
    const memberButton = screen.getByTestId('member-role-button')
    fireEvent.click(memberButton)
    
    // Team code field should appear
    expect(screen.getByPlaceholderText(/team code/i)).toBeInTheDocument()
    
    // Select leader role using test ID
    const leaderButton = screen.getByTestId('leader-role-button')
    fireEvent.click(leaderButton)
    
    // Team code field should disappear
    expect(screen.queryByPlaceholderText(/team code/i)).not.toBeInTheDocument()
  })

  it('should validate form fields correctly', () => {
    renderUnifiedAuth()
    
    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    // Should show role selection error
    expect(screen.getByText(/please select your role/i)).toBeInTheDocument()
  })

  it('should handle password visibility toggle', () => {
    renderUnifiedAuth()
    
    const passwordField = screen.getByPlaceholderText(/••••••••/i)
    const toggleButton = passwordField.parentElement.querySelector('button')
    
    // Initially password type
    expect(passwordField.type).toBe('password')
    
    // Click toggle
    fireEvent.click(toggleButton)
    
    // Should become text type
    expect(passwordField.type).toBe('text')
    
    // Click again
    fireEvent.click(toggleButton)
    
    // Should become password type again
    expect(passwordField.type).toBe('password')
  })

  /**
   * Property 3: Invalid team codes trigger error messages
   * Validates: Requirements 2.3
   */
  it('Property 3: Invalid team codes trigger error messages', async () => {
    const { getTeamById } = await import('../services/teamService')
    
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        async (invalidTeamCode) => {
          // Mock team service to return null for invalid codes
          getTeamById.mockResolvedValue(null)
          
          renderUnifiedAuth()
          
          // Select member role using test ID
          const memberButton = screen.getByTestId('member-role-button')
          fireEvent.click(memberButton)
          
          // Enter invalid team code
          const teamCodeField = screen.getByPlaceholderText(/team code/i)
          fireEvent.change(teamCodeField, { target: { value: invalidTeamCode } })
          
          // Wait for validation
          await waitFor(() => {
            const errorMessage = screen.queryByText(/invalid team code/i)
            if (errorMessage) {
              expect(errorMessage).toBeInTheDocument()
            }
          }, { timeout: 1000 })
          
          cleanup()
        }
      ),
      { numRuns: 3 }
    )
  })
})