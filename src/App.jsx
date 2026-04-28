import ARScene from './components/ARScene'
import UIOverlay from './components/UIOverlay'

function App() {
  return (
    <>
      {/* Layer 0: camera video + Layer 1: Three.js canvas — both inside ARScene */}
      <ARScene />

      {/* Layer 2: UI buttons on top */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        <UIOverlay />
      </div>
    </>
  )
}

export default App
