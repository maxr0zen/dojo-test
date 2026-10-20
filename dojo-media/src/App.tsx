import {
  lazy,
  createContext,
  useContext,
  Suspense,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { ContactDialog } from "./ContactDialog";
import { CONTACT_HREF, openProject } from "./services/actions";
import type { ProjectId } from "./services/mockApi";
import { usePageMotion } from "./motion";

const WorkshopHero = lazy(() =>
  import("./WorkshopHero").then((module) => ({ default: module.WorkshopHero })),
);

const links = [
  { href: "#projects", label: "Проекты" },
  { href: "#approach", label: "Подход" },
  { href: "#contacts", label: "Контакты" },
];
const projects: {
  id: ProjectId;
  title: string;
  tags: string;
  image: string;
  alt: string;
}[] = [
  {
    id: "briskly",
    title: "БРИСКЛИ",
    tags: "Сайт · Брендинг · Реклама",
    image: "briskly.png",
    alt: "БРИСКЛИ — фирменная карточка на бордовой ткани",
  },
  {
    id: "trade",
    title: "ТРЕЙД ОВЕРСИЗ",
    tags: "Сайт · Стратегия · Реклама",
    image: "trade.jpg",
    alt: "ТРЕЙД ОВЕРСИЗ — порт, корабль и грузовые краны",
  },
  {
    id: "gostiny",
    title: "ГОСТИНЫЙ ДВОР",
    tags: "Сайт · Брендинг · Стратегия",
    image: "gostiny.jpg",
    alt: "ГОСТИНЫЙ ДВОР — исторический фасад с аркадами",
  },
];

const RequestContext = createContext<(opener: HTMLButtonElement) => void>(() => {});

function ContactButton({ onClick }: { onClick?: () => void }) {
  const openRequest = useContext(RequestContext);
  return (
    <button className="contact-button" type="button" aria-haspopup="dialog" onClick={(event) => { onClick?.(); openRequest(event.currentTarget); }}>
      Обсудить проект →
    </button>
  );
}

function Header() {
  const [expanded, setExpanded] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 901px)");
    const close = () => setExpanded(false);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && expanded) {
        setExpanded(false);
        toggleRef.current?.focus();
      }
    };
    media.addEventListener("change", close);
    document.addEventListener("keydown", escape);
    return () => {
      media.removeEventListener("change", close);
      document.removeEventListener("keydown", escape);
    };
  }, [expanded]);
  // Prevent collapsed links from entering the tab order while the close transition runs.
  useEffect(() => {
    if (panelRef.current) panelRef.current.inert = !expanded;
  }, [expanded]);
  return (
    <>
      <header className="site-header">
        <a
          className="wordmark"
          href="#"
          aria-label="Додзё Медиа — начало страницы"
        >
          Додзё Медиа
        </a>
        <nav className="desktop-nav" aria-label="Основная навигация">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="desktop-contact">
          <ContactButton />
        </div>
        <button
          className="menu-toggle"
          type="button"
          ref={toggleRef}
          aria-expanded={expanded}
          aria-controls="mobile-navigation"
          aria-label={expanded ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setExpanded(!expanded)}
        >
          <img
            src={`${import.meta.env.BASE_URL}assets/${expanded ? "close" : "menu"}.svg`}
            alt=""
            width="20"
            height="20"
          />
        </button>
      </header>
      <div
        className={`mobile-navigation ${expanded ? "is-open" : ""}`}
        id="mobile-navigation"
        ref={panelRef}
        aria-hidden={!expanded}
      >
        <nav aria-label="Мобильная навигация">
          <div className="mobile-navigation-content">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setExpanded(false)}
              >
                {link.label}
              </a>
            ))}
            <ContactButton onClick={() => setExpanded(false)} />
          </div>
        </nav>
      </div>
    </>
  );
}

function ProjectCard({
  project,
  reportError,
}: {
  project: (typeof projects)[number];
  reportError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const activate = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      await openProject(project.id);
    } catch (error) {
      reportError(
        error instanceof Error ? error.message : "Не удалось открыть проект.",
      );
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };
  return (
    <a
      className={`project-card ${loading ? "is-loading" : ""}`}
      href="#contacts"
      onClick={activate}
      aria-busy={loading}
      aria-disabled={loading || undefined}
      data-project={project.id}
      data-reveal-order={projects.indexOf(project)}
    >
      <img
        className="project-image"
        src={`${import.meta.env.BASE_URL}assets/${project.image}`}
        alt={project.alt}
        width="352"
        height="220"
        loading="lazy"
      />
      <h3>{project.title}</h3>
      <p className="project-tags">{project.tags}</p>
      <span className="project-link">Смотреть проект →</span>
    </a>
  );
}

export function App() {
  usePageMotion();
  const [error, setError] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const requestTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(""), 6000);
    return () => window.clearTimeout(timeout);
  }, [error]);
  return (
    <RequestContext.Provider value={(opener) => { requestTrigger.current = opener; setRequestOpen(true); }}>
    <div className="page-shell">
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <section className="hero" id="approach" aria-labelledby="hero-title">
          <p className="label hero-eyebrow">САЙТЫ · ПОИСК · СМЫСЛ</p>
          <div className="hero-intro">
            <h1 id="hero-title">
              Цифровое ремесло.
              <br />
              Измеримый результат.
            </h1>
            <div className="hero-description">
              <p className="lead">
                Собираем сайты, поиск и рекламу в единую систему. Помогаем
                амбициозным брендам расти.
              </p>
              <p className="label">ИЗ ЯРОСЛАВЛЯ — В ЛЮБУЮ ТОЧКУ МИРА</p>
            </div>
          </div>
          <Suspense
            fallback={
              <div className="hero-media">
                <img
                  src={`${import.meta.env.BASE_URL}assets/workshop-selected.png`}
                  alt="Мастерская Додзё Медиа: мастера за общим столом с ноутбуками и проектами"
                  width="1978"
                  height="795"
                  fetchPriority="high"
                />
              </div>
            }
          >
            <WorkshopHero />
          </Suspense>
        </section>
        <section
          className="projects"
          id="projects"
          aria-labelledby="projects-title"
        >
          <div className="projects-heading">
            <h2 id="projects-title">Избранные работы</h2>
            <p className="label">ТРИ ПРОЕКТА. ТРИ ИСТОРИИ.</p>
          </div>
          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                reportError={setError}
              />
            ))}
          </div>
        </section>
      </main>
      <footer className="site-footer" id="contacts">
        <div className="contact-content">
          <div className="contact-copy">
            <h2 tabIndex={-1}>Начнём с вашей идеи.</h2>
            <a className="email" href={CONTACT_HREF}>
              hello@dojo-media.com
            </a>
          </div>
          <ContactButton />
        </div>
        <div className="footer-bottom">
          <p>© 2026 Додзё Медиа</p>
          <p>Мастерство начинается с деталей.</p>
        </div>
      </footer>
      <ContactDialog opener={requestTrigger.current} open={requestOpen} onClose={() => setRequestOpen(false)} />
      {error && (
        <div className="toast" role="alert">
          <span>{error}</span>
          <button
            type="button"
            aria-label="Закрыть уведомление"
            onClick={() => setError("")}
          >
            <img src={`${import.meta.env.BASE_URL}assets/close.svg`} width="20" height="20" alt="" />
          </button>
        </div>
      )}
    </div>
    </RequestContext.Provider>
  );
}
