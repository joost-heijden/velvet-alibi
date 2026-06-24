import { describe, expect, it } from 'vitest'
import type { CaseConstraint } from '../types'
import { cases } from '../data/cases'
import { countSolutions, validateCase } from './solver'

describe('solver', () => {
  it('counts a uniquely constrained case', () => {
    const caseFile = cases[0]

    expect(validateCase(caseFile).solutionCount).toBe(1)
  })

  it('detects under-constrained grids', () => {
    const suspectIds = cases[0].suspects.map((suspect) => suspect.id)
    const constraints: CaseConstraint[] = [
      { type: 'exact', row: 0, col: 0, suspectId: suspectIds[0] },
    ]

    expect(countSolutions(5, suspectIds, constraints)).toBe(2)
  })

  it('returns zero when constraints conflict with row uniqueness', () => {
    const suspectIds = cases[0].suspects.map((suspect) => suspect.id)
    const constraints: CaseConstraint[] = [
      { type: 'exact', row: 0, col: 0, suspectId: suspectIds[0] },
      { type: 'exact', row: 0, col: 1, suspectId: suspectIds[0] },
    ]

    expect(countSolutions(5, suspectIds, constraints)).toBe(0)
  })
})
