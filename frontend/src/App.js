import "./App.css"
import { useState } from "react"
import Router from "./routes/Router"
import { BonusProvider } from "./context/BonusesContext/BonusContext"
import { AuthProvider } from "./context/AuthContext"

function App() {
  const [isNavOpen, setIsNavOpen] = useState(true)
  const toggleNav = () => setIsNavOpen(!isNavOpen)

  return (
    <AuthProvider>
      <BonusProvider>
        <Router toggleNav={toggleNav} isNavOpen={isNavOpen} />
      </BonusProvider>
    </AuthProvider>
  )
}

export default App
