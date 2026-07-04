import { NavLink, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">Teilnehmerverwaltung</span>
          <nav className="mainnav">
            <NavLink to="/" end>
              Board
            </NavLink>
            <NavLink to="/teilnehmer" end>
              Teilnehmer
            </NavLink>
            <NavLink to="/vorlage">E-Mail-Vorlage</NavLink>
          </nav>
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
