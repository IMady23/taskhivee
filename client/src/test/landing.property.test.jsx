/**
 * Property-Based Tests for Landing Page Navigation
 * Feature: taskhive-completion
 * 
 * These tests verify that navigation redirects are role-appropriate
 * and that the landing page provides correct authentication flows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import fc from 'fast-check'
import SimpleLanding from '../pages/SimpleLanding'

// Mock react-router-dom's Link component for testing
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Link: ({ to, children, className, ...props }) => (
      <a href={to} className={className} data-testid={`link-${to}`} {...props}>
        {children}
      </a>
    )
  }
})

const renderLandingPage = () => {
  return render(
    <BrowserRouter>
      <SimpleLanding />
    </BrowserRouter>
  )
}

describe('Landing Page Navigation Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Property 4: Navigation redirects are role-appropriate
   * Validates: Requirements 1.4
   */
  it('Property 4: Navigation redirects are role-appropriate', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('leader', 'member'),
        (userRole) => {
          const { container } = renderLandingPage()
          
          // Verify that appropriate navigation links exist for each role
          if (userRole === 'leader') {
            const leaderLinks = container.querySelectorAll('[data-testid*="leader-auth"]')
            expect(leaderLinks.length).toBeGreaterThan(0)
            
            // Verify leader links point to leader authentication
            leaderLinks.forEach(link => {
              expect(link.getAttribute('href')).toMatch(/leader-auth/)
            })
          }
          
          if (userRole === 'member') {
            const memberLinks = container.querySelectorAll('[data-testid*="member-auth"]')
            expect(memberLinks.length).toBeGreaterThan(0)
            
            // Verify member links point to member authentication
            memberLinks.forEach(link => {
              expect(link.getAttribute('href')).toMatch(/member-auth/)
            })
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should display the correct tagline', () => {
    renderLandingPage()
    
    // Verify the main tagline is present (using getAllByText since it appears twice)
    const taglines = screen.getAllByText('Plan. Assign. Track. Collaborate — All in One Place')
    expect(taglines.length).toBeGreaterThan(0)
    expect(taglines[0]).toBeInTheDocument()
  })

  it('should have navigation links for both roles', () => {
    renderLandingPage()
    
    // Verify leader authentication links exist
    const leaderLinks = screen.getAllByText(/Start as Team Leader|Get Started|For Leaders/)
    expect(leaderLinks.length).toBeGreaterThan(0)
    
    // Verify member authentication links exist  
    const memberLinks = screen.getAllByText(/Join as Team Member|Join Existing Team|For Members/)
    expect(memberLinks.length).toBeGreaterThan(0)
  })

  it('should display key features', () => {
    renderLandingPage()
    
    // Verify key features are displayed
    expect(screen.getByText('Task Management')).toBeInTheDocument()
    expect(screen.getByText('Team Collaboration')).toBeInTheDocument()
    expect(screen.getByText('Bug Tracking')).toBeInTheDocument()
    expect(screen.getByText('Real-time Communication')).toBeInTheDocument()
    expect(screen.getByText('Analytics & Insights')).toBeInTheDocument()
    expect(screen.getByText('Progress Tracking')).toBeInTheDocument()
  })

  it('should have proper navigation structure', () => {
    const { container } = renderLandingPage()
    
    // Verify navigation bar exists
    const nav = container.querySelector('nav')
    expect(nav).toBeInTheDocument()
    
    // Verify main sections exist
    expect(container.querySelector('section')).toBeInTheDocument()
    expect(container.querySelector('footer')).toBeInTheDocument()
  })

  /**
   * Property test for responsive design elements
   */
  it('Property: Landing page maintains responsive design structure', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('mobile', 'tablet', 'desktop'),
        (deviceType) => {
          const { container } = renderLandingPage()
          
          // Verify responsive classes are present
          const responsiveElements = container.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]')
          expect(responsiveElements.length).toBeGreaterThan(0)
          
          // Verify grid layouts exist for features
          const gridElements = container.querySelectorAll('[class*="grid"]')
          expect(gridElements.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property test for accessibility
   */
  it('Property: Landing page maintains accessibility standards', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          const { container } = renderLandingPage()
          
          // Verify heading hierarchy
          const h1Elements = container.querySelectorAll('h1')
          expect(h1Elements.length).toBeGreaterThan(0)
          
          const h2Elements = container.querySelectorAll('h2')
          expect(h2Elements.length).toBeGreaterThan(0)
          
          // Verify links have proper attributes
          const links = container.querySelectorAll('a')
          links.forEach(link => {
            expect(link.getAttribute('href')).toBeTruthy()
          })
        }
      ),
      { numRuns: 25 }
    )
  })
})