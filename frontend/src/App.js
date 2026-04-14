import "./App.css"
import { useState } from "react"
import Router from "./routes/Router"
import { BonusProvider } from "./context/BonusesContext/BonusContext"

function App() {
  const [isNavOpen, setIsNavOpen] = useState(true)
  const toggleNav = () => setIsNavOpen(!isNavOpen)

  return (
    <BonusProvider>
      <Router toggleNav={toggleNav} isNavOpen={isNavOpen} />
    </BonusProvider>
  )
}

export default App
