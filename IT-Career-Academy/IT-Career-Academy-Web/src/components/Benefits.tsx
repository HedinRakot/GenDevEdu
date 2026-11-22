import { useI18n } from '../i18n/context';
import Eyebrow from './Eyebrow';
import { AwardIcon, ChatIcon, CodeIcon, GrowthIcon } from './Icons';

const icons = [AwardIcon, CodeIcon, ChatIcon, GrowthIcon];

export default function Benefits() {
  const { t } = useI18n();
  const b = t.benefits;

  return (
    <section className="section section--light why" id="vorteile">
      <div className="container why__inner">
        <div className="why__intro">
          <Eyebrow>{b.eyebrow}</Eyebrow>
          <h2>
            {b.title}{' '}
            <span className="why__title-line">
              <span className="accent-dark">{b.titleAccent}</span>
              {b.titleEnd}
            </span>
          </h2>
          <p className="why__lead">{b.lead}</p>
        </div>

        <ul className="why__list">
          {b.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <li className="why__item" key={item.title}>
                <span className="why__icon" aria-hidden="true">
                  <Icon width={52} height={52} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
