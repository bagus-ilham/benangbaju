import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn utility', () => {
  it('merges basic string classes', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('merges arrays of classes', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
  })

  it('handles object conditional classes', () => {
    expect(cn({ 'class1': true, 'class2': false })).toBe('class1')
  })

  it('resolves tailwind conflicts correctly', () => {
    // p-4 should be overridden by p-8
    expect(cn('p-4', 'p-8')).toBe('p-8')
    // pt-4 should be overridden by pt-8
    expect(cn('pt-4', 'pt-8')).toBe('pt-8')
  })

  it('ignores falsy values (null, undefined, false, empty string)', () => {
    expect(cn('class1', null, 'class2', undefined, false, '', 'class3')).toBe('class1 class2 class3')
  })

  it('handles a mix of all input types', () => {
    expect(
      cn(
        'base-class',
        ['arr-class', false, 'arr-class2'],
        { 'obj-class': true, 'obj-false': false },
        'p-4',
        'p-8' // Tailwind merge conflict resolution
      )
    ).toBe('base-class arr-class arr-class2 obj-class p-8')
  })
})
