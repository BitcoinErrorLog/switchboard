import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProfilePreview from './ProfilePreview'
import type { SwitchboardIdentity } from '@/core/types'

const baseIdentity: SwitchboardIdentity = {
  platform: 'nostr',
  external_id: 'hex123',
  handle: 'alice@example.com',
  display_name: 'Alice',
  bio: 'Hello world',
  avatar_url: 'https://example.com/avatar.jpg',
  profile_url: 'https://example.com',
  links: ['https://example.com'],
  verification_state: 'verified',
  ownership_proof: 'sig',
  import_source: 'relay',
  created_at: 1700000000,
  updated_at: 1700000000,
}

describe('ProfilePreview', () => {
  it('renders display name', () => {
    render(<ProfilePreview identity={baseIdentity} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders handle', () => {
    render(<ProfilePreview identity={baseIdentity} />)
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('renders bio', () => {
    render(<ProfilePreview identity={baseIdentity} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders avatar image', () => {
    render(<ProfilePreview identity={baseIdentity} />)
    const img = screen.getByAltText('Alice')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('renders fallback when no avatar', () => {
    render(<ProfilePreview identity={{ ...baseIdentity, avatar_url: null }} />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders Anonymous when no display_name', () => {
    render(<ProfilePreview identity={{ ...baseIdentity, display_name: null }} />)
    expect(screen.getByText('Anonymous')).toBeInTheDocument()
  })

  it('shows verified badge for verified state', () => {
    render(<ProfilePreview identity={baseIdentity} />)
    expect(screen.getByText('✓ Verified')).toBeInTheDocument()
  })

  it('shows claimed badge for claimed state', () => {
    render(
      <ProfilePreview
        identity={{ ...baseIdentity, verification_state: 'claimed' }}
      />,
    )
    expect(screen.getByText('◉ Claimed')).toBeInTheDocument()
  })

  it('renders platform name', () => {
    render(<ProfilePreview identity={baseIdentity} />)
    expect(screen.getByText('nostr')).toBeInTheDocument()
  })

  it('renders links', () => {
    render(<ProfilePreview identity={baseIdentity} />)
    const link = screen.getByText('example.com')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('does not render links section when empty', () => {
    render(<ProfilePreview identity={{ ...baseIdentity, links: [] }} />)
    expect(screen.queryByText('example.com')).not.toBeInTheDocument()
  })
})
