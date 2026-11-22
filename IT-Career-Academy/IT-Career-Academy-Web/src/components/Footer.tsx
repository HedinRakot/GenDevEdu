import { navItems } from '../data/content';
import { useI18n } from '../i18n/context';
import { CodeIcon } from './Icons';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="footer" id="ueber">
      <div className="container footer__inner">
        <a href="#top" className="logo">
          <CodeIcon className="logo__icon" />
          <span>IT Career Academy</span>
        </a>
        <nav aria-label="Footer">
          {navItems.map((i) => (
            <a key={i.href} href={i.href}>{t.nav[i.key]}</a>
          ))}
          <a href="#impressum">{t.footer.imprint}</a>
          <a href="#datenschutz">{t.footer.privacy}</a>
        </nav>
        <p>© {new Date().getFullYear()} IT Career Academy</p>
      </div>
    </footer>
  );
}
