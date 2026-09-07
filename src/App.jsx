import { useState } from 'react'
import Login from './components/Login.jsx'
import SnakeGame from './components/SnakeGame.jsx'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)

  return (
    <div className="app-shell">
      {loggedIn ? (
        <SnakeGame onLogout={() => setLoggedIn(false)} />
      ) : (
        <Login onSuccess={() => setLoggedIn(true)} />
      )}
    </div>
  )
}
