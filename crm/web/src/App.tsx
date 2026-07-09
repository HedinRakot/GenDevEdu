import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { theme, toggle } = useTheme();
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">EduCode CRM</span>
          <nav className="mainnav">
            <NavLink to="/" end>
              Board
            </NavLink>
            <NavLink to="/teilnehmer" end>
              Teilnehmer
            </NavLink>
            <NavLink to="/vorlage">E-Mail-Vorlage</NavLink>
          </nav>
          <button
            type="button"
            className="btn btn-ghost theme-toggle"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}
            title={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <NavLink to="/teilnehmer/neu" className="btn btn-primary">
            + Neuer Teilnehmer
          </NavLink>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
