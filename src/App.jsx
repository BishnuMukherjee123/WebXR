import ARScene from './components/ARScene'
import UIOverlay from './components/UIOverlay'
import './index.css'

function App() {
  return (
    <>
      <ARScene />
      {/* zIndex 10 — above Three.js canvas (z:1), pointer-events none so taps reach canvas */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        <UIOverlay />
      </div>
    </>
  )
}

export default App
