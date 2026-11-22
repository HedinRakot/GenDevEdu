import { BOOKING_URL } from '../data/content';
import { useI18n } from '../i18n/context';
import Eyebrow from './Eyebrow';
import {
  ArrowRight,
  BookIcon,
  BriefcaseIcon,
  CalendarIcon,
  GraduationIcon,
  LaptopIcon,
  RefreshIcon,
  SearchIcon,
} from './Icons';

const icons = [GraduationIcon, RefreshIcon, BriefcaseIcon, LaptopIcon, BookIcon, SearchIcon];

export default function Audience() {
  const { t } = useI18n();
  const a = t.audience;

  return (
    <section className="section section--light audience" id="fuer-wen">
      <div className="container">
        <Eyebrow>{a.eyebrow}</Eyebrow>
        <h2 className="audience__title">
          {a.title} <span className="accent-dark">{a.titleAccent}</span>
        </h2>
        <p className="audience__lead">{a.lead}</p>

        <ul className="audience__grid">
          {a.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <li className="persona" key={item.title}>
                <span className="persona__icon" aria-hidden="true">
                  <Icon width={44} height={44} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            );
          })}
        </ul>

        <div className="audience__banner">
          <span className="audience__banner-icon" aria-hidden="true">
            <CalendarIcon width={48} height={48} />
          </span>
          <div className="audience__banner-text">
            <h3>{a.bannerTitle}</h3>
            <p>{a.bannerText}</p>
          </div>
          <a href={BOOKING_URL} className="btn btn--primary btn--lg">
            {a.bannerButton}
            <ArrowRight />
          </a>
        </div>
      </div>
    </section>
  );
}
