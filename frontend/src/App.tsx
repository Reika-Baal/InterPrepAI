import './App.css'

function App() {
  return (
      <main className="app">
        <nav className="navbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <span className="brand-name">
            InterPrep<span>AI</span>
          </span>
          </div>

          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#about">About</a>
          </div>

          <div className="nav-actions">
            <button className="button button-secondary">Sign in</button>
            <button className="button button-primary">Get started</button>
          </div>
        </nav>

        <section className="hero-section">
          <div className="hero-content">
            <div className="eyebrow">
              AI-powered interview preparation
            </div>

            <h1>
              Prepare smarter
              <br />
              for <span>every interview.</span>
            </h1>

            <p className="hero-description">
              Personalised questions. AI feedback. Real progress.
              <br />
              All in one place.
            </p>

            <div className="hero-actions">
              <button className="button button-primary button-large">
                Get started
                <span className="button-arrow" aria-hidden="true">→</span>
              </button>

              <button className="watch-demo">
        <span className="play-button" aria-hidden="true">
          ▶
        </span>
                Watch demo
              </button>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="orb">
              <div className="orb-core" />
            </div>
          </div>

          <div className="feature-strip">
            <div className="feature-item">
              <div className="feature-icon">▣</div>
              <span>Tailored questions</span>
            </div>

            <div className="feature-item">
              <div className="feature-icon">◇</div>
              <span>AI feedback</span>
            </div>

            <div className="feature-item">
              <div className="feature-icon">⌁</div>
              <span>Track progress</span>
            </div>

            <div className="feature-item">
              <div className="feature-icon">▥</div>
              <span>Build confidence</span>
            </div>
          </div>
        </section>
      </main>
  )
}

export default App