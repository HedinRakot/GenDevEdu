import { useI18n } from '../i18n/context';
import Eyebrow from './Eyebrow';
import { ArrowRight, BarChartIcon, BrowserIcon, ClockIcon, CodeIcon, LayersIcon } from './Icons';

const programIcons = [CodeIcon, BrowserIcon, LayersIcon];

/** Small illustrated screens for the card headers (decorative). */
function ProgramVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="pv-window pv-window--dark">
        <div className="pv-dots">
          <i /> <i /> <i />
        </div>
        <div className="pv-editor">
          <div className="pv-files">
            <i /> <i /> <i /> <i /> <i />
          </div>
          <div className="pv-code">
            {[60, 82, 46, 70, 38, 88, 54, 30, 66].map((w, i) => (
              <i key={i} style={{ width: `${w}%`, marginLeft: `${(i % 3) * 8}%` }} className={`c${i % 4}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="pv-window pv-window--light">
        <div className="pv-dots">
          <i /> <i /> <i />
          <span className="pv-url" />
        </div>
        <div className="pv-site">
          <div className="pv-hero">
            <span className="pv-mountain pv-mountain--back" />
            <span className="pv-mountain pv-mountain--front" />
            <span className="pv-heading" />
          </div>
          <div className="pv-thumbs">
            <i /> <i /> <i />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pv-window pv-window--dark">
      <div className="pv-dots">
        <i /> <i /> <i />
      </div>
      <div className="pv-repo">
        <svg className="pv-graph" viewBox="0 0 120 70" fill="none">
          <path d="M14 8v54M14 22c0 14 30 10 30 24v16M44 34c0 10 30 6 30 18" />
          <circle cx="14" cy="8" r="5" />
          <circle cx="14" cy="36" r="5" />
          <circle cx="14" cy="62" r="5" />
          <circle cx="44" cy="46" r="5" />
          <circle cx="74" cy="52" r="5" />
        </svg>
        <div className="pv-list">
          {[90, 70, 80, 55].map((w, i) => (
            <span key={i}>
              <b />
              <i style={{ width: `${w}%` }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Programs() {
  const { t } = useI18n();
  const p = t.programs;

  return (
    <section className="section section--dark programs" id="kurse">
      <div className="container">
        <Eyebrow light>{p.eyebrow}</Eyebrow>
        <h2 className="programs__title">{p.title}</h2>
        <p className="programs__lead">{p.lead}</p>

        <div className="programs__grid">
          {p.items.map((item, i) => {
            const Icon = programIcons[i];
            return (
              <article className="program" key={item.title}>
                <div className={`program__visual program__visual--${i + 1}`} aria-hidden="true">
                  <ProgramVisual index={i} />
                </div>
                <div className="program__body">
                  <div className="program__head">
                    <span className={`program__icon ${i === 0 ? 'program__icon--filled' : ''}`}>
                      <Icon width={30} height={30} />
                    </span>
                    <h3>{item.title}</h3>
                  </div>
                  <p className="program__desc">{item.description}</p>

                  <dl className="program__facts">
                    <div>
                      <BarChartIcon className="program__fact-icon" />
                      <dt>{p.level}</dt>
                      <dd>
                        {item.level}
                        <br />
                        {item.levelNote}
                      </dd>
                    </div>
                    <div>
                      <LayersIcon className="program__fact-icon" />
                      <dt>{p.skills}</dt>
                      <dd>{item.skills}</dd>
                    </div>
                    <div>
                      <ClockIcon className="program__fact-icon" />
                      <dt>{p.duration}</dt>
                      <dd>{item.duration}</dd>
                    </div>
                  </dl>

                  <a href="#beratung" className={`btn program__btn ${i === 0 ? 'program__btn--filled' : ''}`}>
                    {p.more}
                    <ArrowRight width={20} height={20} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
