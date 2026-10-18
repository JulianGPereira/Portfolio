import { useStore, selectPopup, ZONES } from '../store'
import { projects, websites, certifications, education } from '../data/portfolio'

const Tags = ({ items = [] }) =>
  items.length ? (
    <div className="tags">
      {items.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  ) : null

const LinkOut = ({ href, children }) =>
  href ? (
    <a className="link" href={href} target="_blank" rel="noreferrer">
      {children} ↗
    </a>
  ) : null

const CONTENT = {
  projects: {
    intro: 'Things I have designed, built and shipped.',
    render: () =>
      projects.map((p) => (
        <article className="card" key={p.title}>
          <header>
            <h3>{p.title}</h3>
            {p.period && <span className="muted">{p.period}</span>}
          </header>
          {p.role && <div className="role">{p.role}</div>}
          <p>{p.description}</p>
          {p.highlights?.length > 0 && (
            <ul className="highlights">
              {p.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          <Tags items={p.tech} />
          <LinkOut href={p.link}>View project</LinkOut>
        </article>
      )),
  },
  websites: {
    intro: 'Live sites I have deployed — click to visit.',
    render: () =>
      websites.map((w) => (
        <article className="card" key={w.name}>
          <header>
            <h3>{w.name}</h3>
          </header>
          <p>{w.description}</p>
          <Tags items={w.tech} />
          <LinkOut href={w.url}>Visit site</LinkOut>
        </article>
      )),
  },
  certifications: {
    intro: 'Certifications and credentials.',
    render: () =>
      certifications.map((c) => (
        <article className="card row" key={c.name}>
          <div className="badge">🏅</div>
          <div>
            <h3>{c.name}</h3>
            <div className="muted">
              {c.issuer}
              {c.date ? ` · ${c.date}` : ''}
            </div>
            <LinkOut href={c.url}>Verify</LinkOut>
          </div>
        </article>
      )),
  },
  education: {
    intro: 'Where I studied.',
    render: () =>
      education.map((e) => (
        <article className="card row" key={e.degree + e.institution}>
          <div className="badge">🎓</div>
          <div>
            <h3>{e.degree}</h3>
            <div className="role">{e.institution}</div>
            <div className="muted">{e.period}</div>
            {e.details && <p>{e.details}</p>}
          </div>
        </article>
      )),
  },
}

export default function Popup() {
  const id = useStore(selectPopup)
  const close = useStore((s) => s.closePopup)
  const zone = ZONES.find((z) => z.id === id)
  const content = CONTENT[id]

  return (
    <aside className={`popup ${zone ? 'open' : ''}`} style={{ '--accent': zone?.color }} aria-hidden={!zone}>
      {zone && content && (
        <>
          <div className="popup-head">
            <div>
              <div className="eyebrow">Zone</div>
              <h2>{zone.label}</h2>
              <p className="muted">{content.intro}</p>
            </div>
            <button className="close" onClick={close} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="popup-body">{content.render()}</div>
          <div className="popup-foot muted">Drive out of the zone or press Esc to close</div>
        </>
      )}
    </aside>
  )
}
