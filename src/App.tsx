import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eraser,
  Grid3X3,
  Lightbulb,
  LockKeyhole,
  RotateCcw,
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

type StyleWithVars = CSSProperties & Record<string, string | number>

const readCompletions = (): Record<string, CompletionRecord> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, CompletionRecord>
  } catch {
    return {}
  }
}

const writeCompletions = (records: Record<string, CompletionRecord>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
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

function App() {
  const [activeCaseId, setActiveCaseId] = useState(cases[0].id)
  const activeCase = useMemo(() => getCaseById(activeCaseId), [activeCaseId])
  const [grid, setGrid] = useState<PlayerGrid>(() => createInitialGrid(cases[0]))
  const [selectedSuspectId, setSelectedSuspectId] = useState(cases[0].suspects[0].id)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [hintCount, setHintCount] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [wrongCells, setWrongCells] = useState<CellCoord[]>([])
  const [status, setStatus] = useState('Kies een verdachte en tik een leeg vak.')
  const [completion, setCompletion] = useState<CompletionRecord | null>(null)
  const [shareText, setShareText] = useState('')
  const [records, setRecords] = useState<Record<string, CompletionRecord>>(() => readCompletions())

  const progress = filledCount(grid)
  const total = totalCells(activeCase)
  const progressPercent = Math.round((progress / total) * 100)
  const selectedSuspect = suspectById(activeCase, selectedSuspectId)
  const hints = [...activeCase.clues.map((clue) => clue.hint), ...activeCase.deduction]
  const best = records[activeCase.id]

  useEffect(() => {
    if (completion) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [completion, activeCaseId])

  const startCase = (caseFile: CaseFile) => {
    setActiveCaseId(caseFile.id)
    setGrid(createInitialGrid(caseFile))
    setSelectedSuspectId(caseFile.suspects[0].id)
    setElapsedSeconds(0)
    setHintCount(0)
    setMistakes(0)
    setWrongCells([])
    setStatus('Nieuw dossier geopend. Begin met de gegeven vakken en de eerste clues.')
    setCompletion(null)
    setShareText('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCellPress = (row: number, col: number) => {
    if (completion || isGivenCell(activeCase, row, col)) {
      return
    }

    const nextValue = grid[row][col] === selectedSuspectId ? null : selectedSuspectId
    setGrid((currentGrid) => setGridCell(activeCase, currentGrid, row, col, nextValue))
    setWrongCells((current) => current.filter((cell) => !sameCell(cell, row, col)))
    setStatus(nextValue ? `${selectedSuspect?.name ?? 'Verdachte'} genoteerd.` : 'Vak leeggemaakt.')
  }

  const handleCheck = () => {
    const nextWrongCells = findWrongCells(activeCase, grid)
    setWrongCells(nextWrongCells)

    if (nextWrongCells.length > 0) {
      setMistakes((value) => value + 1)
      setStatus(`${nextWrongCells.length} vak(ken) botsen met het dossier. Corrigeer voor je beschuldigt.`)
      return
    }

    if (progress < total) {
      setStatus('Geen fouten in de ingevulde vakken. Gebruik rij/kolom-uniciteit om de rest te sluiten.')
      return
    }

    setStatus('Het raster is sluitend. Maak nu je finale beschuldiging.')
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
      writeCompletions(next)
      return next
    })
  }

  const handleAccuse = (suspectId: string) => {
    const suspect = suspectById(activeCase, suspectId)

    if (suspectId !== activeCase.killerId) {
      setMistakes((value) => value + 1)
      setStatus(`${suspect?.name ?? 'Deze verdachte'} klopt niet. Het gemarkeerde vak wijst ergens anders heen.`)
      return
    }

    if (!gridIsSolved(activeCase, grid)) {
      setStatus('Je vermoeden raakt de juiste naam, maar het dossier is nog niet sluitend. Maak eerst het raster af.')
      return
    }

    completeCase()
  }

  const revealHint = () => {
    setHintCount((value) => Math.min(value + 1, hints.length))
    setStatus('Vera Lens legt een zachte hint op je notitieblad.')
  }

  const clearActiveCell = () => {
    setSelectedSuspectId(activeCase.suspects[0].id)
    setWrongCells([])
    setStatus('Palette gereset. Tik een verdachte om verder te puzzelen.')
  }

  const qaFillSolution = () => {
    if (!window.location.search.includes('qa=1')) {
      return
    }
    setGrid(activeCase.solution.map((row) => [...row]))
    setWrongCells([])
    setStatus('QA-oplossing ingevuld.')
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
      setStatus('Share-copy staat op je klembord.')
    } catch {
      setStatus('Share-copy staat hieronder klaar.')
    }
  }

  return (
    <main className="app-shell">
      <section className="play-surface" aria-label="Velvet Alibi speelbord">
        <header className="topbar">
          <div className="brand-block">
            <img src="/assets/app-icon.png" alt="" className="brand-icon" />
            <div>
              <p className="eyebrow">Sudoku meets cozy crime</p>
              <h1>Velvet Alibi</h1>
            </div>
          </div>
          <div className="session-stats" aria-label="Sessie statistieken">
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
        </header>

        <nav className="case-rail" aria-label="Dossiers">
          {cases.map((caseFile) => {
            const record = records[caseFile.id]
            return (
              <button
                className={`case-chip ${caseFile.id === activeCase.id ? 'active' : ''}`}
                key={caseFile.id}
                onClick={() => startCase(caseFile)}
                type="button"
              >
                <span>Dossier {String(caseFile.number).padStart(2, '0')}</span>
                <strong>{caseFile.title}</strong>
                {record ? <small>{formatTime(record.elapsedSeconds)}</small> : <small>{caseFile.difficulty}</small>}
              </button>
            )
          })}
        </nav>

        <div className="workspace">
          <section className="case-panel" aria-labelledby="case-title">
            <div className="case-heading">
              <div>
                <p className="eyebrow">Dossier {String(activeCase.number).padStart(2, '0')}</p>
                <h2 id="case-title">{activeCase.title}</h2>
                <p>{activeCase.subtitle}</p>
              </div>
              <span className="difficulty">{activeCase.difficulty}</span>
            </div>

            <div className="intro-strip">
              <img src="/assets/mascot-assistant.webp" alt="Vera Lens, de hint-assistent" />
              <div>
                <p className="victim">Slachtoffer: {activeCase.victim}</p>
                <p>{activeCase.intro}</p>
                <p className="rule-note">
                  <LockKeyhole size={16} aria-hidden="true" />
                  {activeCase.sceneNote}
                </p>
              </div>
            </div>

            <div
              className="progress-track"
              aria-label={`Voortgang ${progressPercent} procent`}
              style={{ '--progress': `${progressPercent}%` } as StyleWithVars}
            >
              <span />
            </div>

            <div
              className="logic-grid"
              style={{ '--n': activeCase.suspects.length } as StyleWithVars}
              role="grid"
              aria-label="Alibi rooster"
              data-testid="logic-grid"
            >
              <div className="corner-label">Spoor</div>
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
                    const murder = activeCase.murderCell.row === row && activeCase.murderCell.col === col

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

            <div className="palette" aria-label="Verdachten">
              {activeCase.suspects.map((suspect) => (
                <button
                  className={`suspect-button ${selectedSuspectId === suspect.id ? 'active' : ''}`}
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
              <button className="icon-button" onClick={clearActiveCell} title="Palette resetten" type="button">
                <Eraser size={18} aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>

            <div className="action-row">
              <button className="primary-action" onClick={handleCheck} type="button">
                <ClipboardCheck size={18} aria-hidden="true" />
                Check dossier
              </button>
              <button className="secondary-action" onClick={() => startCase(activeCase)} type="button">
                <RotateCcw size={18} aria-hidden="true" />
                Herstart
              </button>
              {window.location.search.includes('qa=1') ? (
                <button className="secondary-action" data-testid="qa-fill" onClick={qaFillSolution} type="button">
                  Vul oplossing
                </button>
              ) : null}
            </div>

            <div className={`status-line ${completion ? 'solved' : wrongCells.length ? 'error' : ''}`} role="status">
              {completion ? <CheckCircle2 size={18} aria-hidden="true" /> : wrongCells.length ? <XCircle size={18} aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
              <span>{status}</span>
            </div>
          </section>

          <aside className="notebook" aria-label="Aanwijzingen en finale">
            <section>
              <div className="section-title">
                <BookOpen size={18} aria-hidden="true" />
                <h3>Aanwijzingen</h3>
              </div>
              <div className="clue-list">
                {activeCase.clues.map((clue, index) => (
                  <article className="clue" key={clue.id}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <h4>{clue.title}</h4>
                      <p>{clue.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="hint-box">
              <div className="section-title">
                <Lightbulb size={18} aria-hidden="true" />
                <h3>Hints van Vera</h3>
              </div>
              <img src="/assets/hint-notebook.webp" alt="" />
              {hintCount === 0 ? (
                <p>Hints sturen je naar de volgende logische stap zonder de finale naam direct weg te geven.</p>
              ) : (
                <ol>
                  {hints.slice(0, hintCount).map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ol>
              )}
              <button className="secondary-action full" disabled={hintCount >= hints.length} onClick={revealHint} type="button">
                <Lightbulb size={18} aria-hidden="true" />
                Toon hint
              </button>
            </section>

            <section className="accuse-box">
              <div className="section-title">
                <Search size={18} aria-hidden="true" />
                <h3>Finale beschuldiging</h3>
              </div>
              <p>
                Gemarkeerde cel: <strong>{activeCase.murderCell.label}</strong>
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
                  <p className="eyebrow">Dossier gesloten</p>
                  <h3>{formatTime(completion.elapsedSeconds)}</h3>
                  <p>
                    {completion.hintsUsed} hint(s), {completion.mistakes} correctie(s),{' '}
                    {completion.clean ? 'foutloos afgerond' : 'dossier hersteld'}.
                  </p>
                </div>
                <button className="primary-action full" onClick={handleShare} type="button">
                  <Share2 size={18} aria-hidden="true" />
                  Deel resultaat
                </button>
                {shareText ? <textarea data-testid="share-text" readOnly value={shareText} /> : null}
              </section>
            ) : (
              <section className="mascot-note">
                <img src="/assets/case-closed.webp" alt="" />
                <p>
                  Tip: speel als een sudoku. De crime-sfeer zit in de clues; de zekerheid komt uit rijen en kolommen.
                </p>
              </section>
            )}

            {best ? (
              <section className="best-run">
                <Sparkles size={18} aria-hidden="true" />
                Beste run: {formatTime(best.elapsedSeconds)} met {best.hintsUsed} hint(s).
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  )
}

export default App
