import { Link } from "react-router-dom";
import {
  ArrowRight,
  Play,
  ClipboardCheck,
  MessagesSquare,
  ChartNoAxesCombined,
  Sparkles,
  Check,
  ArrowUpRight,
} from "lucide-react";
import EnergyOrb from "../components/EnergyOrb";
import { Logo } from "../components/UI";
const features = [
  {
    icon: ClipboardCheck,
    title: "Questions that fit you",
    text: "Practise the technical and behavioural questions that matter for your next role.",
  },
  {
    icon: MessagesSquare,
    title: "Make every answer better",
    text: "Reflect on your responses with a structured review and a clear next step.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "See how far you’ve come",
    text: "Keep your interviews, practice sessions and preparation in one workspace.",
  },
];
export default function Landing() {
  return (
    <div className="landing">
      <header className="marketing-nav container">
        <Logo />
        <nav aria-label="Main">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="nav-actions">
          <Link className="btn secondary" to="/dashboard">
            Open workspace
          </Link>
          <Link className="btn primary" to="/dashboard">
            Get started <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main>
        <section className="hero container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> AI-POWERED INTERVIEW PREPARATION
            </div>
            <h1>
              Prepare smarter
              <br />
              for <span className="gradient-text">every interview.</span>
            </h1>
            <p>
              Personalised questions. AI feedback. Real progress.
              <br />
              All in one place.
            </p>
            <div className="hero-actions">
              <Link to="/dashboard" className="btn primary large">
                Get started <ArrowRight size={21} />
              </Link>
              <Link to="/practice" className="demo-link">
                <span>
                  <Play size={15} />
                </span>
                Try a practice session
              </Link>
            </div>
            <div className="hero-note">
              <span className="avatars">
                P<span>A</span>
                <span>J</span>
              </span>
              <span>Your next opportunity starts with preparation.</span>
            </div>
          </div>
          <div className="orb-wrap" aria-hidden="true">
            <EnergyOrb className="hero-orb" />
            <div className="orb-caption">
              <Sparkles size={14} /> A little practice. A lot more confidence.
            </div>
          </div>
          <div className="hero-benefits">
            {[
              ["Tailored questions", ClipboardCheck],
              ["AI feedback", MessagesSquare],
              ["Track progress", ChartNoAxesCombined],
              ["Actual confidence", Sparkles],
            ].map(([text, Icon]) => {
              const I = Icon as typeof Sparkles;
              return (
                <div key={String(text)}>
                  <span>
                    <I size={21} />
                  </span>
                  {String(text)}
                </div>
              );
            })}
          </div>
        </section>
        <section id="features" className="container marketing-section">
          <div className="section-label">BUILT FOR YOUR NEXT CHAPTER</div>
          <h2>Good preparation changes everything.</h2>
          <p className="section-intro">
            Less guessing. More clarity. A space to get ready for the role you
            want.
          </p>
          <div className="feature-grid">
            {features.map((f) => (
              <article className="panel feature" key={f.title}>
                <div className="icon-box">
                  <f.icon size={24} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="how-it-works" className="container marketing-section">
          <div className="section-label">A SIMPLE WAY FORWARD</div>
          <h2>From “what if” to “I’m ready”.</h2>
          <div className="steps">
            {[
              [
                "01",
                "Add your interview",
                "Keep the company, role and important details together.",
              ],
              [
                "02",
                "Practise with purpose",
                "Choose a topic and work through five focused questions.",
              ],
              [
                "03",
                "Build your confidence",
                "Review your answers and track your preparation.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="pricing" className="container marketing-section">
          <div className="pricing-card panel">
            <div>
              <div className="section-label">START WHERE YOU ARE</div>
              <h2>Your preparation, all in one place.</h2>
              <p>Create an account to save your practice and progress.</p>
              <div className="pricing-points">
                <span>
                  <Check size={16} /> Interview planner
                </span>
                <span>
                  <Check size={16} /> Practice sessions
                </span>
                <span>
                  <Check size={16} /> Progress tracking
                </span>
              </div>
            </div>
            <Link className="btn primary large" to="/dashboard">
              Open workspace <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="container">
        <Logo />
        <span>Prepare with purpose. Show up with confidence.</span>
        <span>© {new Date().getFullYear()} InterPrepAI</span>
      </footer>
    </div>
  );
}
