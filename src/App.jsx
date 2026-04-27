import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import ARScene from './components/ARScene'
import UIOverlay from './components/UIOverlay'

function App() {

  return (
    <>
      <ARScene/>
      <UIOverlay/>
    </>
  )
}

export default App
