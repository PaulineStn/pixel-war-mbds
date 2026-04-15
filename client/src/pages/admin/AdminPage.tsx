import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import type { Board } from '../../types/app'
import { getBoards, deleteBoard, createBoard, updateBoard } from '../../lib/boards'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'
import type { Theme } from '../../types/app'

type AdminPageProps = {
  onBack: () => void
  theme: Theme
  onToggleTheme: () => void
}

const emptyForm = {
  title: '',
  width: 50,
  height: 50,
  allowOverwrite: true,
  cooldown: 60,
  endDate: '',
}

export function AdminPage({ onBack, theme, onToggleTheme }: AdminPageProps) {
  const { session, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
    enabled: !!session?.isAdmin,
  })

  useEffect(() => {
    if (!session?.isAdmin) {
      navigate('/')
    }
  }, [session?.isAdmin, navigate])

  type NewBoardPayload = {
    title?: string
    width: number
    height: number
    allowOverwrite: boolean
    cooldown: number
    endDate: Date
  }

  const createMutation = useMutation({
    mutationFn: (newBoard: NewBoardPayload) => createBoard(newBoard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setSuccess('Board créé.')
      setForm(emptyForm)
      setEditingId(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewBoardPayload & { status: string }> }) => updateBoard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setSuccess('Board mis à jour.')
      setForm(emptyForm)
      setEditingId(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBoard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setSuccess('Board supprimé.')
    },
    onError: (err: Error) => setError(err.message),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!session) return

    const payload = {
      title: form.title || undefined,
      width: form.width,
      height: form.height,
      allowOverwrite: form.allowOverwrite,
      cooldown: form.cooldown,
      endDate: new Date(form.endDate),
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (board: Board) => {
    setEditingId(board._id)
    setForm({
      title: board.title ?? '',
      width: board.width,
      height: board.height,
      allowOverwrite: board.allowOverwrite,
      cooldown: board.cooldown,
      endDate: board.endDate.slice(0, 16),
    })
    setError(null)
    setSuccess(null)
  }

  const handleDelete = async (id: string) => {
    if (!session) return
    if (!window.confirm('Supprimer ce board ?')) return

    deleteMutation.mutate(id)
  }

  const handleCancel = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!session?.isAdmin) return null

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/gardian.png" alt="Logo Pixel War" />
        </div>
        <nav>
          <Link to="/">CANVAS</Link>
          {isLoggedIn && <Link to="/profile">MON PROFIL</Link>}
          <Link className="active" to="/admin">ADMIN</Link>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="topbar-actions">
            <ThemeToggleButton theme={theme} onToggleTheme={onToggleTheme} />
            <button className="logout-cta" type="button" onClick={handleLogout}>
              SE DECONNECTER
            </button>
          </div>
        </header>

    <div className="admin-page">
      <div className="admin-header">
        <button className="board-back" onClick={onBack}>← Retour</button>
        <h1 className="admin-title">ADMINISTRATION — PIXELBOARDS</h1>
      </div>

      {/* Form */}
      <section className="admin-form-section">
        <h2>{editingId ? 'MODIFIER LE BOARD' : 'CRÉER UN BOARD'}</h2>

        {error && <div className="board-error-banner">{error}</div>}
        {success && <div className="admin-success">{success}</div>}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Titre (optionnel)
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Battle Royale #1"
              />
            </label>
          </div>

          <div className="form-row form-row-grid">
            <label>
              Largeur (px)
              <input
                type="number"
                min={1}
                max={500}
                required
                value={form.width}
                onChange={(e) => setForm({ ...form, width: Number(e.target.value) })}
              />
            </label>
            <label>
              Hauteur (px)
              <input
                type="number"
                min={1}
                max={500}
                required
                value={form.height}
                onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="form-row form-row-grid">
            <label>
              Cooldown (secondes)
              <input
                type="number"
                min={0}
                required
                value={form.cooldown}
                onChange={(e) => setForm({ ...form, cooldown: Number(e.target.value) })}
              />
            </label>
            <label>
              Date de fin
              <input
                type="datetime-local"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={form.allowOverwrite}
                onChange={(e) => setForm({ ...form, allowOverwrite: e.target.checked })}
              />
              Autoriser l'overwrite (redessiner sur un pixel existant)
            </label>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              {editingId ? 'METTRE À JOUR' : 'CRÉER'}
            </button>
            {editingId && (
              <button className="btn btn-ghost" type="button" onClick={handleCancel}>
                ANNULER
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Board list */}
      <section className="admin-list-section">
        <h2>TOUS LES BOARDS ({boards.length})</h2>

        {isLoading ? (
          <p className="boards-loading">Chargement...</p>
        ) : boards.length === 0 ? (
          <p className="boards-empty">Aucun board créé.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Statut</th>
                <th>Taille</th>
                <th>Cooldown</th>
                <th>Overwrite</th>
                <th>Fin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board) => {
                const isFinished = new Date(board.endDate).getTime() <= Date.now()
                return (
                  <tr key={board._id} className={editingId === board._id ? 'editing' : ''}>
                    <td>{board.title ?? <em>Sans titre</em>}</td>
                    <td>
                      <span className={`board-status ${isFinished ? 'finished' : 'active'}`}>
                        {isFinished ? 'TERMINÉ' : 'EN COURS'}
                      </span>
                    </td>
                    <td>{board.width}×{board.height}</td>
                    <td>{board.cooldown}s</td>
                    <td>{board.allowOverwrite ? '✓' : '✗'}</td>
                    <td>{new Date(board.endDate).toLocaleDateString()}</td>
                    <td className="admin-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleEdit(board)}
                      >
                        MODIFIER
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(board._id)}
                      >
                        SUPPRIMER
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
      </main>
    </div>
  )
}
