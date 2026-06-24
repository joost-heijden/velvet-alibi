import type { CaseFile, CompletionRecord } from '../types'
import { formatTime } from './state'

export const formatShareResult = (
  caseFile: CaseFile,
  completion: CompletionRecord,
): string => {
  const cleanLabel = completion.clean ? 'foutloos' : `${completion.mistakes} correctie(s)`
  const hintLabel = completion.hintsUsed === 0 ? 'zonder hints' : `${completion.hintsUsed} hint(s)`

  return `Ik loste Dossier ${String(caseFile.number).padStart(2, '0')} van Velvet Alibi op in ${formatTime(
    completion.elapsedSeconds,
  )}, ${hintLabel}, ${cleanLabel}. Jij?`
}
