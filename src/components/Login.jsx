import { useState, useRef, useEffect } from 'react'

export default function Login({ onSuccess }) {
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (value.trim().toLowerCase() === 'nation') {
      onSuccess()
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="login-scene">
      <div className="login-glow" aria-hidden="true" />
      <div className={`login-card ${shake ? 'login-card--shake' : ''}`}>
        <p className="login-eyebrow">Kvällens spelning</p>
        <h1 className="login-title">Nationsormen</h1>
        <p className="login-subtitle">
          Ett rum, en orm, tio minuter. Ange lösenordet för kvällen för att komma in.
        </p>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="username" className="login-label">
            Lösenord
          </label>
          <input
            id="username"
            ref={inputRef}
            type="text"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="nation"
            className="login-input"
          />
          <button type="submit" className="login-button">
            Kliv in
          </button>
        </form>
        {shake && <p className="login-error">Det där är inte kvällens lösenord.</p>}
      </div>
    </div>
  )
}
