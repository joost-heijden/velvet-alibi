export type Suspect = {
  id: string
  name: string
  role: string
  detail: string
  color: string
}

export type CellCoord = {
  row: number
  col: number
}

export type ExactConstraint = CellCoord & {
  type: 'exact'
  suspectId: string
}

export type NotConstraint = CellCoord & {
  type: 'not'
  suspectId: string
}

export type OneOfConstraint = CellCoord & {
  type: 'oneOf'
  suspectIds: string[]
}

export type CaseConstraint = ExactConstraint | NotConstraint | OneOfConstraint

export type Clue = {
  id: string
  title: string
  body: string
  hint: string
  constraints: CaseConstraint[]
}

export type CaseFile = {
  id: string
  number: number
  title: string
  subtitle: string
  difficulty: 'Warm-up' | 'Slim' | 'Stevig' | 'Meesterlijk'
  intro: string
  victim: string
  sceneNote: string
  rows: string[]
  columns: string[]
  suspects: Suspect[]
  givens: CellCoord[]
  solution: string[][]
  murderCell: CellCoord & {
    label: string
  }
  killerId: string
  clues: Clue[]
  deduction: string[]
  verdict: string
}

export type GridValue = string | null
export type PlayerGrid = GridValue[][]

export type CompletionRecord = {
  caseId: string
  elapsedSeconds: number
  hintsUsed: number
  mistakes: number
  clean: boolean
  completedAt: string
}
