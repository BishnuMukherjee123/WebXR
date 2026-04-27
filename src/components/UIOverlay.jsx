import React from 'react'
import '../styles/ar.css'

function UIOverlay() {
    return (
        <>
            <button id="start-ar" className="overlay-btn">
                Start AR
            </button>
            <button id="reset-ar" className="overlay-btn">
                Reset
            </button>
            <div className="overlay-text">
                Tap a surface to place object
            </div>
        </>
    )
}

export default UIOverlay