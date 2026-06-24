import { describe, expect, it } from 'vitest'
import { cases } from '../data/cases'
import {
  createInitialGrid,
  fillWithSolution,
  findWrongCells,
  formatTime,
  gridIsSolved,
  setGridCell,
} from './state'

describe('game state helpers', () => {
  const caseFile = cases[0]

  it('formats timers for shareable results', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(402)).toBe('06:42')
  })

  it('protects given cells from accidental edits', () => {
    const grid = createInitialGrid(caseFile)
    const given = caseFile.givens[0]
    const original = grid[given.row][given.col]
    const next = setGridCell(caseFile, grid, given.row, given.col, caseFile.suspects[1].id)

    expect(next[given.row][given.col]).toBe(original)
  })

  it('finds wrong cells and recognizes solved grids', () => {
    const solved = fillWithSolution(caseFile)
    expect(gridIsSolved(caseFile, solved)).toBe(true)

    const wrong = setGridCell(caseFile, solved, 0, 1, caseFile.suspects[0].id)
    expect(findWrongCells(caseFile, wrong)).toEqual([{ row: 0, col: 1 }])
    expect(gridIsSolved(caseFile, wrong)).toBe(false)
  })
})
