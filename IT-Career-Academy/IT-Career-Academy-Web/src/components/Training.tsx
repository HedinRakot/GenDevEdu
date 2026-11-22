import { useI18n } from '../i18n/context';
import Eyebrow from './Eyebrow';
import { CodeIcon, LaptopIcon, LayersIcon } from './Icons';
import LmsMockup from './LmsMockup';

const stepIcons = [LaptopIcon, CodeIcon, LayersIcon];

export default function Training() {
  const { t } = useI18n();

  return (
    <section className="training" id="ablauf">
      <div className="container training__inner">
        <div className="training__content">
          <Eyebrow>{t.training.eyebrow}</Eyebrow>
          <h2>
            {t.training.title}
            <span className="accent-dark">{t.training.titleAccent}</span>
          </h2>
          <ol className="steps">
            {t.training.steps.map((step, i) => {
              const Icon = stepIcons[i];
              return (
                <li key={step.title} className="step">
                  <span className="step__icon">
                    <Icon width={34} height={34} />
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <LmsMockup />
      </div>
    </section>
  );
}
