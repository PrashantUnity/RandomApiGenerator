import { describe, expect, it } from 'vitest'
import { tabListNextIndex } from './useTabListKeyboard'

describe('tabListNextIndex', () => {
  it('returns null for unknown keys or single tab', () => {
    expect(tabListNextIndex(1, 0, 'ArrowRight')).toBe(null)
    expect(tabListNextIndex(3, 1, 'Enter')).toBe(null)
  })

  it('wraps ArrowLeft and ArrowRight', () => {
    expect(tabListNextIndex(3, 0, 'ArrowRight')).toBe(1)
    expect(tabListNextIndex(3, 2, 'ArrowRight')).toBe(0)
    expect(tabListNextIndex(3, 0, 'ArrowLeft')).toBe(2)
    expect(tabListNextIndex(3, 1, 'ArrowLeft')).toBe(0)
  })

  it('supports Home and End', () => {
    expect(tabListNextIndex(4, 2, 'Home')).toBe(0)
    expect(tabListNextIndex(4, 0, 'End')).toBe(3)
  })
})
