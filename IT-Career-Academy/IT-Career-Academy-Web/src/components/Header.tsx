import { useState } from 'react';
import { BOOKING_URL, navItems } from '../data/content';
import { useI18n } from '../i18n/context';
import { CalendarIcon, CloseIcon, CodeIcon, MenuIcon } from './Icons';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <header className="header">
      <div className="container header__inner">
        <a href="#top" className="logo" aria-label={t.header.homeLabel}>
          <CodeIcon className="logo__icon" />
          <span>IT Career Academy</span>
        </a>

        <nav className={`nav ${open ? 'nav--open' : ''}`} aria-label={t.header.mainNav}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {t.nav[item.key]}
            </a>
          ))}
          <a href={BOOKING_URL} className="btn btn--outline nav__cta" onClick={() => setOpen(false)}>
            <CalendarIcon width={20} height={20} />
            {t.header.bookConsultation}
          </a>
        </nav>

        <div className="header__actions">
          <LanguageSwitcher />
          <button
            className="menu-toggle"
            aria-label={open ? t.header.closeMenu : t.header.openMenu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
