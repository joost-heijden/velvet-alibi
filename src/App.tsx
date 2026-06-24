import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eraser,
  Eye,
  Grid3X3,
  Lightbulb,
  Moon,
  Search,
  Share2,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { cases, getCaseById } from './data/cases'
import {
  createInitialGrid,
  filledCount,
  findWrongCells,
  formatTime,
  gridIsSolved,
  isGivenCell,
  setGridCell,
  totalCells,
} from './game/state'
import { formatShareResult } from './game/share'
import type { CaseFile, CellCoord, CompletionRecord, PlayerGrid, Suspect } from './types'

const STORAGE_KEY = 'velvet-alibi-completions'
const REVEAL_KEY = 'velvet-alibi-revealed'

type StyleWithVars = CSSProperties & Record<string, string | number>
type ViewMode = 'catalog' | 'case'

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '') as T
  } catch {
    return fallback
  }
}

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const initials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

const suspectById = (caseFile: CaseFile, suspectId: string | null): Suspect | undefined =>
  suspectId ? caseFile.suspects.find((suspect) => suspect.id === suspectId) : undefined

const sameCell = (a: CellCoord, row: number, col: number) => a.row === row && a.col === col

function MiniBoard({ caseFile }: { caseFile: CaseFile }) {
  return (
    <div className="mini-board" aria-hidden="true">
      {caseFile.solution.map((row, rowIndex) =>
        row.map((suspectId, colIndex) => {
          const suspect = suspectById(caseFile, suspectId)
          const isMurder =
            caseFile.murderCell.row === rowIndex && caseFile.murderCell.col === colIndex
          return (
            <span
              className={isMurder ? 'murder' : ''}
              key={`${rowIndex}-${colIndex}`}
              style={{ '--suspect': suspect?.color ?? '#657858' } as StyleWithVars}
            />
          )
        }),
      )}
    </div>
  )
}

function App() {
  const [view, setView] = useState<ViewMode>('catalog')
  const [activeCaseId, setActiveCaseId] = useState(cases[0].id)
  const activeCase = useMemo(() => getCaseById(activeCaseId), [activeCaseId])
  const [grid, setGrid] = useState<PlayerGrid>(() => createInitialGrid(cases[0]))
  const [selectedSuspectId, setSelectedSuspectId] = useState(cases[0].suspects[0].id)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [hintCount, setHintCount] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [wrongCells, setWrongCells] = useState<CellCoord[]>([])
  const [status, setStatus] = useState('Select a suspect, then tap an empty square.')
  const [completion, setCompletion] = useState<CompletionRecord | null>(null)
  const [shareText, setShareText] = useState('')
  const [records, setRecords] = useState<Record<string, CompletionRecord>>(() =>
    readJson(STORAGE_KEY, {}),
  )
  const [revealed, setRevealed] = useState<string[]>(() => readJson(REVEAL_KEY, []))
  const [difficultyFilter, setDifficultyFilter] = useState('All')

  const progress = filledCount(grid)
  const total = totalCells(activeCase)
  const selectedSuspect = suspectById(activeCase, selectedSuspectId)
  const hints = [...activeCase.clues.map((clue) => clue.hint), ...activeCase.deduction]
  const completedCount = Object.keys(records).length
  const filteredCases = cases.filter(
    (caseFile) => difficultyFilter === 'All' || caseFile.difficulty === difficultyFilter,
  )

  useEffect(() => {
    if (view !== 'case' || completion) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [completion, view, activeCaseId])

  const resetCaseState = (caseFile: CaseFile) => {
    setActiveCaseId(caseFile.id)
    setGrid(createInitialGrid(caseFile))
    setSelectedSuspectId(caseFile.suspects[0].id)
    setElapsedSeconds(0)
    setHintCount(0)
    setMistakes(0)
    setWrongCells([])
    setStatus('Select a suspect, then tap an empty square.')
    setCompletion(null)
    setShareText('')
  }

  const openCase = (caseFile: CaseFile) => {
    resetCaseState(caseFile)
    setView('case')
    if (navigator.userAgent.includes('jsdom')) {
      return
    }

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      return
    }
  }

  const revealOrOpen = (caseFile: CaseFile) => {
    if (!revealed.includes(caseFile.id) && !records[caseFile.id]) {
      const next = [...revealed, caseFile.id]
      setRevealed(next)
      writeJson(REVEAL_KEY, next)
      setStatus(`${caseFile.title} revealed.`)
      return
    }

    openCase(caseFile)
  }

  const handleCellPress = (row: number, col: number) => {
    if (completion || isGivenCell(activeCase, row, col)) {
      return
    }

    const nextValue = grid[row][col] === selectedSuspectId ? null : selectedSuspectId
    setGrid((currentGrid) => setGridCell(activeCase, currentGrid, row, col, nextValue))
    setWrongCells((current) => current.filter((cell) => !sameCell(cell, row, col)))
    setStatus(nextValue ? `${selectedSuspect?.name ?? 'Suspect'} placed.` : 'Square cleared.')
  }

  const handleCheck = () => {
    const nextWrongCells = findWrongCells(activeCase, grid)
    setWrongCells(nextWrongCells)

    if (nextWrongCells.length > 0) {
      setMistakes((value) => value + 1)
      setStatus(`${nextWrongCells.length} square(s) contradict the case file.`)
      return
    }

    if (progress < total) {
      setStatus('No mistakes in filled squares. Keep using row and column uniqueness.')
      return
    }

    setStatus('The grid is closed. Make the final accusation.')
  }

  const completeCase = () => {
    const record: CompletionRecord = {
      caseId: activeCase.id,
      elapsedSeconds: Math.max(elapsedSeconds, 1),
      hintsUsed: hintCount,
      mistakes,
      clean: mistakes === 0,
      completedAt: new Date().toISOString(),
    }

    setCompletion(record)
    setStatus(activeCase.verdict)
    setRecords((current) => {
      const existing = current[activeCase.id]
      const shouldReplace =
        !existing ||
        record.elapsedSeconds < existing.elapsedSeconds ||
        (record.elapsedSeconds === existing.elapsedSeconds && record.mistakes < existing.mistakes)
      const next = shouldReplace ? { ...current, [activeCase.id]: record } : current
      writeJson(STORAGE_KEY, next)
      return next
    })
  }

  const handleAccuse = (suspectId: string) => {
    const suspect = suspectById(activeCase, suspectId)

    if (suspectId !== activeCase.killerId) {
      setMistakes((value) => value + 1)
      setStatus(`${suspect?.name ?? 'That suspect'} is not supported by the marked square.`)
      return
    }

    if (!gridIsSolved(activeCase, grid)) {
      setStatus('Right name, but the case file is not closed yet. Finish the grid first.')
      return
    }

    completeCase()
  }

  const revealHint = () => {
    setHintCount((value) => Math.min(value + 1, hints.length))
    setStatus('A hint was added to the case notes.')
  }

  const qaFillSolution = () => {
    if (!window.location.search.includes('qa=1')) {
      return
    }
    setGrid(activeCase.solution.map((row) => [...row]))
    setWrongCells([])
    setStatus('QA solution filled.')
  }

  const handleShare = async () => {
    if (!completion) {
      return
    }

    const text = formatShareResult(activeCase, completion)
    setShareText(text)

    try {
      if (!window.location.search.includes('qa=1') && navigator.share) {
        await navigator.share({ title: 'Velvet Alibi', text, url: window.location.href })
        return
      }

      await navigator.clipboard.writeText(text)
      setStatus('Share copy is ready below.')
    } catch {
      setStatus('Share copy is ready below.')
    }
  }

  return (
    <main className={`app-shell ${view === 'catalog' ? 'catalog-mode' : 'case-mode'}`}>
      <header className="app-header">
        <div className="brand-mark" aria-label="Velvet Alibi">
          <img src="/assets/app-icon.png" alt="" />
          <div>
            <strong>VELVET ALIBI</strong>
            <span>by Vera Lens</span>
          </div>
        </div>
        <div className="header-actions">
          <button type="button">Sign in</button>
          <select aria-label="Language" defaultValue="en">
            <option value="en">English</option>
            <option value="nl">Nederlands</option>
          </select>
          <button aria-label="Theme" type="button">
            <Moon size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      {view === 'catalog' ? (
        <section className="catalog" aria-label="Case archive">
          <div className="alpha-note">
            Original cozy-crime sudoku cases. Reveal a file, then solve the suspect grid.
          </div>

          <div className="archive-counts">
            <strong>{cases.length}</strong> cases
            <span>
              <strong>{completedCount}</strong> completed
            </span>
          </div>

          <div className="filter-row" aria-label="Difficulty filters">
            {['All', 'Warm-up', 'Slim', 'Stevig', 'Meesterlijk'].map((difficulty) => (
              <button
                className={difficultyFilter === difficulty ? 'on' : ''}
                key={difficulty}
                onClick={() => setDifficultyFilter(difficulty)}
                type="button"
              >
                {difficulty}
              </button>
            ))}
          </div>

          <div className="sort-row">
            <label>
              Sort by:
              <select defaultValue="difficulty">
                <option value="difficulty">Difficulty</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
            </label>
            <button type="button">Hide unreleased</button>
          </div>

          <div className="case-grid">
            {filteredCases.map((caseFile) => {
              const isRevealed = revealed.includes(caseFile.id) || Boolean(records[caseFile.id])
              const record = records[caseFile.id]
              return (
                <button
                  className={`archive-card ${isRevealed ? 'revealed' : 'sealed'}`}
                  data-testid={`case-card-${caseFile.id}`}
                  key={caseFile.id}
                  onClick={() => revealOrOpen(caseFile)}
                  type="button"
                >
                  {isRevealed ? (
                    <>
                      <MiniBoard caseFile={caseFile} />
                      <strong>{caseFile.title}</strong>
                      <span className="card-meta">
                        <b>{caseFile.difficulty}</b>
                        <span>{caseFile.suspects.length}x{caseFile.suspects.length}</span>
                        <span>{caseFile.suspects.length} suspects</span>
                      </span>
                      {record ? <em>{formatTime(record.elapsedSeconds)}</em> : null}
                    </>
                  ) : (
                    <>
                      <img src="/assets/case-closed.webp" alt="" />
                      <span>CASE</span>
                      <strong>AVAILABLE!</strong>
                      <small>CLICK TO REVEAL</small>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="play" aria-label="Murder sudoku case">
          <button className="back-button" onClick={() => setView('catalog')} type="button">
            <ArrowLeft size={18} aria-hidden="true" />
            Cases
          </button>

          <section className="case-title-card">
            <MiniBoard caseFile={activeCase} />
            <div>
              <p className="case-label">Case {String(activeCase.number).padStart(2, '0')}</p>
              <h1>{activeCase.title}</h1>
              <p>{activeCase.subtitle}</p>
              <div className="case-facts">
                <span>{activeCase.difficulty}</span>
                <span>{activeCase.suspects.length}x{activeCase.suspects.length}</span>
                <span>{activeCase.suspects.length} suspects</span>
              </div>
            </div>
          </section>

          <div className="run-stats" aria-label="Current run">
            <span>
              <Clock3 size={16} aria-hidden="true" />
              {formatTime(elapsedSeconds)}
            </span>
            <span>
              <Grid3X3 size={16} aria-hidden="true" />
              {progress}/{total}
            </span>
            <span>
              <Lightbulb size={16} aria-hidden="true" />
              {hintCount}
            </span>
          </div>

          <section className="brief-card">
            <h2>Case brief</h2>
            <p>
              <strong>Victim:</strong> {activeCase.victim}
            </p>
            <p>{activeCase.intro}</p>
            <p className="murder-cell-note">
              Final square: <strong>{activeCase.murderCell.label}</strong>
            </p>
          </section>

          <section className="board-card">
            <div
              className="logic-grid"
              style={{ '--n': activeCase.suspects.length } as StyleWithVars}
              role="grid"
              aria-label="Suspect grid"
              data-testid="logic-grid"
            >
              <div className="corner-label">Place</div>
              {activeCase.columns.map((column) => (
                <div className="column-label" key={column}>
                  {column}
                </div>
              ))}
              {activeCase.rows.map((rowLabel, row) => (
                <div className="grid-row-fragment" key={rowLabel} role="row">
                  <div className="row-label">{rowLabel}</div>
                  {activeCase.columns.map((columnLabel, col) => {
                    const value = grid[row][col]
                    const suspect = suspectById(activeCase, value)
                    const locked = isGivenCell(activeCase, row, col)
                    const wrong = wrongCells.some((cell) => sameCell(cell, row, col))
                    const murder =
                      activeCase.murderCell.row === row && activeCase.murderCell.col === col

                    return (
                      <button
                        aria-label={`${rowLabel} ${columnLabel}${suspect ? ` ${suspect.name}` : ''}`}
                        className={`grid-cell ${locked ? 'locked' : ''} ${wrong ? 'wrong' : ''} ${murder ? 'murder' : ''}`}
                        data-testid={`cell-${row}-${col}`}
                        disabled={locked || Boolean(completion)}
                        key={`${rowLabel}-${columnLabel}`}
                        onClick={() => handleCellPress(row, col)}
                        style={suspect ? ({ '--suspect': suspect.color } as StyleWithVars) : undefined}
                        type="button"
                      >
                        {suspect ? (
                          <>
                            <span className="token">{initials(suspect.name)}</span>
                            <span>{suspect.name.split(' ')[0]}</span>
                          </>
                        ) : (
                          <span className="empty-dot" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </section>

          <section className="suspect-tray" aria-label="Suspects">
            {activeCase.suspects.map((suspect) => (
              <button
                className={selectedSuspectId === suspect.id ? 'active' : ''}
                key={suspect.id}
                onClick={() => setSelectedSuspectId(suspect.id)}
                style={{ '--suspect': suspect.color } as StyleWithVars}
                type="button"
              >
                <span className="token">{initials(suspect.name)}</span>
                <span>
                  <strong>{suspect.name}</strong>
                  <small>{suspect.role}</small>
                </span>
              </button>
            ))}
          </section>

          <div className="case-actions">
            <button className="primary-action" onClick={handleCheck} type="button">
              <ClipboardCheck size={18} aria-hidden="true" />
              Check
            </button>
            <button className="secondary-action" onClick={() => resetCaseState(activeCase)} type="button">
              <Eraser size={18} aria-hidden="true" />
              Reset
            </button>
            {window.location.search.includes('qa=1') ? (
              <button className="secondary-action" data-testid="qa-fill" onClick={qaFillSolution} type="button">
                Fill solution
              </button>
            ) : null}
          </div>

          <div className={`status-line ${completion ? 'solved' : wrongCells.length ? 'error' : ''}`} role="status">
            {completion ? <CheckCircle2 size={18} aria-hidden="true" /> : wrongCells.length ? <XCircle size={18} aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
            <span>{status}</span>
          </div>

          <section className="clue-card">
            <h2>Clues</h2>
            {activeCase.clues.map((clue, index) => (
              <details key={clue.id} open={index < 2}>
                <summary>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {clue.title}
                </summary>
                <p>{clue.body}</p>
              </details>
            ))}
          </section>

          <section className="hint-card">
            <div>
              <h2>Hints</h2>
              <button disabled={hintCount >= hints.length} onClick={revealHint} type="button">
                <Eye size={16} aria-hidden="true" />
                Reveal hint
              </button>
            </div>
            {hintCount === 0 ? (
              <p>No hints used.</p>
            ) : (
              <ol>
                {hints.slice(0, hintCount).map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ol>
            )}
          </section>

          <section className="accuse-card">
            <h2>Accuse</h2>
            <p>
              Read the suspect in <strong>{activeCase.murderCell.label}</strong>.
            </p>
            <div className="accuse-list">
              {activeCase.suspects.map((suspect) => (
                <button
                  data-testid={`accuse-${suspect.id}`}
                  key={suspect.id}
                  onClick={() => handleAccuse(suspect.id)}
                  style={{ '--suspect': suspect.color } as StyleWithVars}
                  type="button"
                >
                  <span className="token">{initials(suspect.name)}</span>
                  {suspect.name}
                </button>
              ))}
            </div>
          </section>

          {completion ? (
            <section className="share-box" data-testid="share-box">
              <img src="/assets/share-card.webp" alt="" />
              <div>
                <p className="case-label">Case closed</p>
                <h2>{formatTime(completion.elapsedSeconds)}</h2>
                <p>
                  {completion.hintsUsed} hint(s), {completion.mistakes} correction(s),{' '}
                  {completion.clean ? 'clean solve' : 'case repaired'}.
                </p>
              </div>
              <button className="primary-action full" onClick={handleShare} type="button">
                <Share2 size={18} aria-hidden="true" />
                Share result
              </button>
              {shareText ? <textarea data-testid="share-text" readOnly value={shareText} /> : null}
            </section>
          ) : null}

          {records[activeCase.id] ? (
            <section className="best-run">
              <Sparkles size={18} aria-hidden="true" />
              Best run: {formatTime(records[activeCase.id].elapsedSeconds)} with{' '}
              {records[activeCase.id].hintsUsed} hint(s).
            </section>
          ) : null}
        </section>
      )}
    </main>
  )
}

export default App
