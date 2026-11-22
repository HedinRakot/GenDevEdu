import yuriImg from '../assets/yuri.jpg';
import { BOOKING_URL } from '../data/content';
import { useI18n } from '../i18n/context';
import Eyebrow from './Eyebrow';
import { ArrowRight, ClockIcon, ShieldCheckIcon, VideoIcon } from './Icons';

const factIcons = [ClockIcon, VideoIcon, ShieldCheckIcon];

export default function Consultation() {
  const { t } = useI18n();
  const c = t.consultation;

  return (
    <section className="consult" id="beratung">
      <svg className="consult__lines" viewBox="0 0 1440 800" preserveAspectRatio="none" aria-hidden="true">
        <path d="M640 800C760 520 980 160 1440 40" />
        <path d="M0 690C260 700 520 760 640 800" />
      </svg>

      <div className="consult__photo">
        <img src={yuriImg} alt={c.imageAlt} loading="lazy" />
      </div>

      <div className="container consult__inner">
        <div className="consult__content">
          <Eyebrow light>{c.eyebrow}</Eyebrow>
          <h2>
            {c.title}
            <span className="accent">{c.titleAccent}</span>
          </h2>
          <p className="consult__text">{c.text}</p>
          <a href={BOOKING_URL} className="btn btn--primary consult__btn">
            {c.button}
            <ArrowRight />
          </a>
          <ul className="consult__facts">
            {factIcons.map((Icon, i) => (
              <li key={i}>
                <Icon width={30} height={30} />
                {c.facts[i]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
