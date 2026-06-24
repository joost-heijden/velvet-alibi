import type { CaseFile, CellCoord, PlayerGrid } from '../types'

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export const createInitialGrid = (caseFile: CaseFile): PlayerGrid => {
  const size = caseFile.suspects.length
  const grid: PlayerGrid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  )

  caseFile.givens.forEach(({ row, col }) => {
    grid[row][col] = caseFile.solution[row][col]
  })

  return grid
}

export const isGivenCell = (caseFile: CaseFile, row: number, col: number): boolean =>
  caseFile.givens.some((cell) => cell.row === row && cell.col === col)

export const setGridCell = (
  caseFile: CaseFile,
  grid: PlayerGrid,
  row: number,
  col: number,
  suspectId: string | null,
): PlayerGrid => {
  if (isGivenCell(caseFile, row, col)) {
    return grid
  }

  return grid.map((gridRow, rowIndex) =>
    gridRow.map((value, colIndex) => (rowIndex === row && colIndex === col ? suspectId : value)),
  )
}

export const filledCount = (grid: PlayerGrid): number =>
  grid.flat().filter((value) => value !== null).length

export const totalCells = (caseFile: CaseFile): number => caseFile.suspects.length ** 2

export const findWrongCells = (caseFile: CaseFile, grid: PlayerGrid): CellCoord[] => {
  const wrongCells: CellCoord[] = []

  grid.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value !== null && value !== caseFile.solution[rowIndex][colIndex]) {
        wrongCells.push({ row: rowIndex, col: colIndex })
      }
    })
  })

  return wrongCells
}

export const gridIsComplete = (caseFile: CaseFile, grid: PlayerGrid): boolean =>
  filledCount(grid) === totalCells(caseFile)

export const gridIsSolved = (caseFile: CaseFile, grid: PlayerGrid): boolean =>
  gridIsComplete(caseFile, grid) && findWrongCells(caseFile, grid).length === 0

export const fillWithSolution = (caseFile: CaseFile): PlayerGrid =>
  caseFile.solution.map((row) => [...row])
