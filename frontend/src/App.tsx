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
              Prepare smarter for
              <span> every interview.</span>
            </h1>

            <p className="hero-description">
              Personalised interview questions, intelligent feedback and
              structured preparation built around the role you are applying for.
            </p>

            <div className="hero-actions">
              <button className="button button-primary button-large">
                Get started
                <span aria-hidden="true">→</span>
              </button>

              <button className="button button-ghost button-large">
                See how it works
              </button>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="orb">
              <div className="orb-core" />
            </div>
          </div>
        </section>
      </main>
  )
}

export default App