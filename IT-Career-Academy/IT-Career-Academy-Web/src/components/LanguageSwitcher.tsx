import { useI18n } from '../i18n/context';
import { languages } from '../i18n/translations';

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang-switch" role="group" aria-label={t.header.languageSwitcher}>
      {languages.map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-switch__btn ${code === lang ? 'lang-switch__btn--active' : ''}`}
          aria-pressed={code === lang}
          lang={code}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
