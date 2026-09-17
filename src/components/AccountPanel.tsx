import { useState } from 'react'
import { Cloud, CloudOff, LoaderCircle, LogIn, LogOut, RefreshCw, ShieldCheck, UserPlus, UserRound } from 'lucide-react'
import { loginAccount, logoutAccount, registerAccount, type AuthUser } from '../lib/api'

export type SyncStatus = 'idle' | 'loading' | 'synced' | 'saving' | 'offline' | 'error'

interface AccountPanelProps {
  user: AuthUser | null
  loading: boolean
  syncStatus: SyncStatus
  onAuthenticated: (user: AuthUser) => Promise<void>
  onLoggedOut: () => void
  onSyncNow: () => Promise<void>
}

const syncCopy: Record<SyncStatus, string> = {
  idle: 'Sẵn sàng đồng bộ',
  loading: 'Đang tải tiến độ…',
  synced: 'Đã đồng bộ',
  saving: 'Đang lưu…',
  offline: 'Đang dùng dữ liệu trên máy',
  error: 'Chưa thể đồng bộ',
}

export function AccountPanel({ user, loading, syncStatus, onAuthenticated, onLoggedOut, onSyncNow }: AccountPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const authenticated = mode === 'login'
        ? await loginAccount(username, password)
        : await registerAccount(username, password)
      setPassword('')
      await onAuthenticated(authenticated)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể đăng nhập.')
    } finally {
      setSubmitting(false)
    }
  }

  const logout = async () => {
    setSubmitting(true)
    try {
      await logoutAccount()
    } finally {
      onLoggedOut()
      setSubmitting(false)
    }
  }

  if (loading) {
    return <section className="account-card account-loading" aria-live="polite"><LoaderCircle className="spin" aria-hidden="true" /><span>Đang kiểm tra tài khoản…</span></section>
  }

  if (user) {
    const StatusIcon = syncStatus === 'offline' || syncStatus === 'error' ? CloudOff : Cloud
    return (
      <section className="account-card" aria-labelledby="account-title">
        <div className="card-heading"><UserRound aria-hidden="true" /><div><span className="eyebrow">Tài khoản phụ huynh</span><h2 id="account-title">{user.username}</h2></div></div>
        <div className={`sync-state ${syncStatus}`} role="status"><StatusIcon aria-hidden="true" /><span><strong>{syncCopy[syncStatus]}</strong><small>Tiến độ được lưu an toàn cho tài khoản này.</small></span></div>
        <div className="account-actions">
          <button className="secondary-button" onClick={() => void onSyncNow()} disabled={syncStatus === 'saving' || syncStatus === 'loading'} type="button"><RefreshCw className={syncStatus === 'saving' ? 'spin' : ''} aria-hidden="true" /> Đồng bộ ngay</button>
          <button className="danger-text-button" onClick={() => void logout()} disabled={submitting} type="button"><LogOut aria-hidden="true" /> Đăng xuất</button>
        </div>
      </section>
    )
  }

  return (
    <section className="account-card" aria-labelledby="account-title">
      <div className="card-heading"><ShieldCheck aria-hidden="true" /><div><h2 id="account-title">Lưu tiến độ theo tài khoản</h2><p>Đăng nhập để học tiếp trên điện thoại, tablet hoặc máy tính.</p></div></div>
      <div className="auth-tabs" role="tablist" aria-label="Đăng nhập hoặc tạo tài khoản">
        <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }} type="button"><LogIn aria-hidden="true" /> Đăng nhập</button>
        <button role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }} type="button"><UserPlus aria-hidden="true" /> Tạo tài khoản</button>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <label><span>Tên đăng nhập</span><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={40} pattern="[A-Za-z0-9._-]+" required placeholder="Ví dụ: me-cua-an" /></label>
        <label><span>Mật khẩu</span><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required placeholder="Tối thiểu 8 ký tự" /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={submitting} type="submit">{submitting ? <LoaderCircle className="spin" aria-hidden="true" /> : mode === 'login' ? <LogIn aria-hidden="true" /> : <UserPlus aria-hidden="true" />}{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
      </form>
      <p className="account-privacy"><ShieldCheck aria-hidden="true" /> Chỉ lưu tên đăng nhập, mật khẩu đã băm và tiến độ học. Không có quảng cáo hoặc theo dõi.</p>
    </section>
  )
}
