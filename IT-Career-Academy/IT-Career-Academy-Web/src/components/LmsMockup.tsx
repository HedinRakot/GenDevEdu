import { useI18n } from '../i18n/context';
import {
  BarChartIcon,
  BellIcon,
  CheckIcon,
  CheckSquareIcon,
  ClipboardIcon,
  CodeIcon,
  ArrowRight,
  ExpandIcon,
  HomeIcon,
  LayersIcon,
  PlayIcon,
  UserCircleIcon,
  UsersIcon,
  VolumeIcon,
} from './Icons';

const menuIcons = [HomeIcon, PlayIcon, CheckSquareIcon, BarChartIcon, LayersIcon, UsersIcon];
const PROGRESS = 68;
const DONE_TOPICS = 3;

/** Decorative laptop showing a lesson in the learning platform. Built in HTML so it scales and translates. */
export default function LmsMockup() {
  const { t } = useI18n();
  const m = t.training.mockup;

  return (
    <figure className="laptop" role="img" aria-label={m.label}>
      <div className="laptop__lid" aria-hidden="true">
        <div className="lms">
          <div className="lms__top">
            <span className="lms__logo">
              <CodeIcon /> IT Career Academy
            </span>
            <span className="lms__top-icons">
              <BellIcon />
              <UserCircleIcon />
            </span>
          </div>

          <aside className="lms__side">
            {m.menu.map((label, i) => {
              const Icon = menuIcons[i];
              return (
                <span key={label} className={`lms__menu-item ${i === 0 ? 'lms__menu-item--active' : ''}`}>
                  <Icon /> {label}
                </span>
              );
            })}
          </aside>

          <div className="lms__main">
            <p className="lms__crumbs">
              {m.breadcrumbCourse} {m.courseName} <span>›</span> <b>{m.lesson}</b>
            </p>

            <div className="lms__grid">
              <div className="lms__video">
                <div className="lms__video-title">
                  <span>{m.lesson}</span>
                  <span>{m.lessonTitle}</span>
                </div>
                <pre className="lms__code">
                  <code>
                    <span className="k">if</span> (age {'>='} <span className="n">18</span>) {'{'}
                    {'\n  '}console.log(<span className="s">"{m.codeAllowed}"</span>);
                    {'\n'}
                    {'}'} <span className="k">else</span> {'{'}
                    {'\n  '}console.log(<span className="s">"{m.codeDenied}"</span>);
                    {'\n}'}
                  </code>
                </pre>
                <span className="lms__play">
                  <svg viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" fill="currentColor" />
                  </svg>
                </span>
                <div className="lms__controls">
                  <span className="lms__bar" />
                  <span className="lms__controls-row">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                    <VolumeIcon />
                    <span>0:00 / 12:34</span>
                    <span className="lms__spacer" />
                    <ExpandIcon />
                  </span>
                </div>
              </div>

              <div className="lms__progress lms__card">
                <span className="lms__card-label">{m.progress}</span>
                <strong>{PROGRESS}%</strong>
                <span className="lms__meter">
                  <span style={{ width: `${PROGRESS}%` }} />
                </span>
              </div>

              <ul className="lms__topics lms__card">
                {m.topics.map((topic, i) => (
                  <li key={topic} className={i < DONE_TOPICS ? 'is-done' : ''}>
                    <span className="lms__tick">{i < DONE_TOPICS && <CheckIcon />}</span>
                    {topic}
                  </li>
                ))}
              </ul>

              <div className="lms__task lms__card">
                <b>
                  <ClipboardIcon /> {m.taskTitle}
                </b>
                <p>{m.taskText}</p>
                <span className="lms__go">
                  <ArrowRight />
                </span>
              </div>

              <div className="lms__test lms__card">
                <b>
                  <BarChartIcon /> {m.testTitle}
                </b>
                <p>{m.testText}</p>
                <span className="lms__go">
                  <ArrowRight />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="laptop__base" aria-hidden="true" />
    </figure>
  );
}
