import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/?qa=1')
  })

  it('plays the first case through hint, wrong accusation, solve and share', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: /Velvet Alibi/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Het stilte-uur in de leeszaal/i })).toBeInTheDocument()

    await user.click(screen.getByTestId('cell-0-1'))
    await user.click(screen.getByRole('button', { name: /Check dossier/i }))
    expect(screen.getByText(/botsen met het dossier/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Toon hint/i }))
    expect(screen.getByText(/Begin linksboven/i)).toBeInTheDocument()

    await user.click(screen.getByTestId('qa-fill'))
    await user.click(screen.getByTestId('accuse-ada'))
    expect(screen.getByText(/klopt niet/i)).toBeInTheDocument()

    await user.click(screen.getByTestId('accuse-mara'))
    expect(screen.getByTestId('share-box')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Deel resultaat/i }))
    expect((screen.getByTestId('share-text') as HTMLTextAreaElement).value).toContain('Ik loste Dossier 01')
  })
})
