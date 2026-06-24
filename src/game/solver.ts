import type { CaseConstraint, CaseFile } from '../types'

type CandidateGrid = Set<string>[][]

export type ValidationResult = {
  valid: boolean
  solutionCount: number
  errors: string[]
}

export const constraintsForCase = (caseFile: CaseFile): CaseConstraint[] =>
  caseFile.clues.flatMap((clue) => clue.constraints)

const cloneCandidates = (candidates: CandidateGrid): CandidateGrid =>
  candidates.map((row) => row.map((cell) => new Set(cell)))

const makeCandidates = (size: number, suspectIds: string[]): CandidateGrid =>
  Array.from({ length: size }, () =>
    Array.from({ length: size }, () => new Set(suspectIds)),
  )

export const applyConstraints = (
  candidates: CandidateGrid,
  constraints: CaseConstraint[],
): CandidateGrid => {
  const next = cloneCandidates(candidates)

  constraints.forEach((constraint) => {
    const cell = next[constraint.row]?.[constraint.col]
    if (!cell) {
      throw new Error(`Constraint outside grid at ${constraint.row},${constraint.col}`)
    }

    if (constraint.type === 'exact') {
      cell.clear()
      cell.add(constraint.suspectId)
    }

    if (constraint.type === 'not') {
      cell.delete(constraint.suspectId)
    }

    if (constraint.type === 'oneOf') {
      for (const value of [...cell]) {
        if (!constraint.suspectIds.includes(value)) {
          cell.delete(value)
        }
      }
    }
  })

  return next
}

const solutionSatisfiesConstraints = (
  solution: string[][],
  constraints: CaseConstraint[],
): boolean =>
  constraints.every((constraint) => {
    const value = solution[constraint.row]?.[constraint.col]
    if (!value) {
      return false
    }

    if (constraint.type === 'exact') {
      return value === constraint.suspectId
    }

    if (constraint.type === 'not') {
      return value !== constraint.suspectId
    }

    return constraint.suspectIds.includes(value)
  })

const hasUniqueRowsAndColumns = (solution: string[][], suspectIds: string[]): boolean => {
  const sortedTarget = [...suspectIds].sort().join('|')

  return solution.every((row) => [...row].sort().join('|') === sortedTarget) &&
    suspectIds.every((_, col) => {
      const column = solution.map((row) => row[col])
      return [...column].sort().join('|') === sortedTarget
    })
}

export const countSolutions = (
  size: number,
  suspectIds: string[],
  constraints: CaseConstraint[],
  limit = 2,
): number => {
  const candidates = applyConstraints(makeCandidates(size, suspectIds), constraints)
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  )
  const rowUsed = Array.from({ length: size }, () => new Set<string>())
  const colUsed = Array.from({ length: size }, () => new Set<string>())
  let count = 0

  const search = (): void => {
    if (count >= limit) {
      return
    }

    let bestRow = -1
    let bestCol = -1
    let bestValues: string[] = []

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (grid[row][col]) {
          continue
        }

        const values = [...candidates[row][col]].filter(
          (value) => !rowUsed[row].has(value) && !colUsed[col].has(value),
        )

        if (values.length === 0) {
          return
        }

        if (bestRow === -1 || values.length < bestValues.length) {
          bestRow = row
          bestCol = col
          bestValues = values
        }
      }
    }

    if (bestRow === -1) {
      count += 1
      return
    }

    for (const value of bestValues) {
      grid[bestRow][bestCol] = value
      rowUsed[bestRow].add(value)
      colUsed[bestCol].add(value)
      search()
      rowUsed[bestRow].delete(value)
      colUsed[bestCol].delete(value)
      grid[bestRow][bestCol] = null
    }
  }

  search()
  return count
}

export const validateCase = (caseFile: CaseFile): ValidationResult => {
  const errors: string[] = []
  const size = caseFile.suspects.length
  const suspectIds = caseFile.suspects.map((item) => item.id)
  const constraints = constraintsForCase(caseFile)

  if (caseFile.rows.length !== size || caseFile.columns.length !== size) {
    errors.push('Rows and columns must match suspect count.')
  }

  if (caseFile.solution.length !== size || caseFile.solution.some((row) => row.length !== size)) {
    errors.push('Solution dimensions must match suspect count.')
  }

  if (!hasUniqueRowsAndColumns(caseFile.solution, suspectIds)) {
    errors.push('Solution must contain each suspect exactly once per row and column.')
  }

  if (!solutionSatisfiesConstraints(caseFile.solution, constraints)) {
    errors.push('Solution does not satisfy all clue constraints.')
  }

  const expectedKiller = caseFile.solution[caseFile.murderCell.row]?.[caseFile.murderCell.col]
  if (expectedKiller !== caseFile.killerId) {
    errors.push('Killer must match the suspect in the murder cell.')
  }

  const solutionCount = countSolutions(size, suspectIds, constraints)
  if (solutionCount !== 1) {
    errors.push(`Expected exactly one solution, found ${solutionCount}.`)
  }

  return {
    valid: errors.length === 0,
    solutionCount,
    errors,
  }
}
