import { describe, it, expect } from 'vitest'
import { decodeNostrIdentifier, generateVerificationCode } from './identity'

describe('decodeNostrIdentifier', () => {
  it('decodes a hex pubkey', () => {
    const hex = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
    const result = decodeNostrIdentifier(hex)
    expect(result.hexPubkey).toBe(hex)
    expect(result.relayHints).toEqual([])
  })

  it('decodes uppercase hex pubkey', () => {
    const hex = 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789'
    const result = decodeNostrIdentifier(hex)
    expect(result.hexPubkey).toBe(hex.toLowerCase())
  })

  it('trims whitespace', () => {
    const hex = '  abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789  '
    const result = decodeNostrIdentifier(hex)
    expect(result.hexPubkey).toBe(hex.trim())
  })

  it('throws on invalid identifier', () => {
    expect(() => decodeNostrIdentifier('not_valid')).toThrow()
  })

  it('throws on empty string', () => {
    expect(() => decodeNostrIdentifier('')).toThrow()
  })
})

describe('generateVerificationCode', () => {
  it('generates a code with the right prefix', () => {
    const code = generateVerificationCode()
    expect(code).toMatch(/^switchboard-verify-[a-f0-9]{12}$/)
  })

  it('generates unique codes', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 100; i++) {
      codes.add(generateVerificationCode())
    }
    expect(codes.size).toBe(100)
  })
})
