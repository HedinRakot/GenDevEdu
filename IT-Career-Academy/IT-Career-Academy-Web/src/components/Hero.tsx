import heroImg from '../assets/hero-yuri.jpg';
import { BOOKING_URL } from '../data/content';
import { useI18n } from '../i18n/context';
import { ArrowRight, BriefcaseIcon, LaptopIcon, LayersIcon, PlayIcon, UsersIcon } from './Icons';
import Eyebrow from './Eyebrow';

const featureIcons = [LaptopIcon, LayersIcon, UsersIcon];

export default function Hero() {
  const { t } = useI18n();

  return (
    <section className="hero" id="top">
      <div className="hero__image" style={{ backgroundImage: `url(${heroImg})` }} role="img" aria-label={t.hero.imageAlt} />
      <div className="container hero__content">
        <Eyebrow light>{t.hero.eyebrow}</Eyebrow>
        <h1>
          {t.hero.title}
          <span className="accent">{t.hero.titleAccent}</span>
        </h1>
        <p className="hero__lead">{t.hero.lead}</p>
        <a href={BOOKING_URL} className="btn btn--primary btn--lg hero__btn">
          <PlayIcon width={30} height={30} />
          {t.common.startTrial}
          <ArrowRight />
        </a>

        <div className="hero__funding">
          <span className="hero__funding-icon" aria-hidden="true">
            <BriefcaseIcon width={36} height={36} />
          </span>
          <div>
            <strong>{t.hero.fundingTitle}</strong>
            <p>{t.hero.fundingText}</p>
          </div>
        </div>

        <ul className="hero__features">
          {featureIcons.map((Icon, i) => (
            <li key={i}>
              <Icon width={34} height={34} className="accent" />
              <span>{t.hero.features[i]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
