import ARScene from './components/ARScene'
import UIOverlay from './components/UIOverlay'
import './index.css'

/**
 * App — ARScene sets up the Three.js WebXR renderer and injects ARButton.
 * UIOverlay lives in the React tree so it renders into document.body (the
 * WebXR dom-overlay root), remaining visible during the immersive session.
 */
function App() {
  return (
    <>
      <ARScene />
      <UIOverlay />
    </>
  )
}

export default App
