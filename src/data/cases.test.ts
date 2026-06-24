import { describe, expect, it } from 'vitest'
import { cases } from './cases'
import { validateCase } from '../game/solver'

describe('case data', () => {
  it('ships at least ten complete playable cases', () => {
    expect(cases).toHaveLength(10)

    for (const caseFile of cases) {
      expect(caseFile.suspects.length).toBeGreaterThanOrEqual(5)
      expect(caseFile.suspects.length).toBeLessThanOrEqual(6)
      expect(caseFile.clues.length).toBeGreaterThanOrEqual(6)
      expect(caseFile.clues.length).toBeLessThanOrEqual(10)
      expect(caseFile.deduction.length).toBeGreaterThanOrEqual(4)
      expect(caseFile.verdict.length).toBeGreaterThan(40)
    }
  })

  it('validates every case as a unique Latin-grid mystery', () => {
    const results = cases.map((caseFile) => [caseFile.title, validateCase(caseFile)] as const)
    const failures = results.filter(([, result]) => !result.valid)

    expect(failures).toEqual([])
    for (const [, result] of results) {
      expect(result.solutionCount).toBe(1)
    }
  })
})
