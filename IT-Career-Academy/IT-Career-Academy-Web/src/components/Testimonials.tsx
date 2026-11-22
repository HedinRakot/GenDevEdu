import { useRef } from 'react';
import { testimonialImages } from '../data/content';
import { useI18n } from '../i18n/context';
import Eyebrow from './Eyebrow';
import { ArrowLeft, ArrowRight } from './Icons';

export default function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const tt = t.testimonials;

  const scroll = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>('.testimonial');
    const step = card ? card.offsetWidth + 16 : track.clientWidth;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className="section section--dark section--stories" id="erfolgsgeschichten">
      <div className="container">
        <div className="section__head">
          <div>
            <Eyebrow light>{tt.eyebrow}</Eyebrow>
            <h2>
              {tt.title}
              <span className="accent">{tt.titleAccent}</span>
            </h2>
          </div>
          <div className="slider-controls">
            <button className="round-btn" aria-label={tt.prev} onClick={() => scroll(-1)}>
              <ArrowLeft width={20} height={20} />
            </button>
            <button className="round-btn round-btn--filled" aria-label={tt.next} onClick={() => scroll(1)}>
              <ArrowRight width={20} height={20} />
            </button>
          </div>
        </div>

        <div className="testimonials" ref={trackRef}>
          {tt.items.map((item, i) => (
            <article className="testimonial" key={i}>
              <div className="testimonial__top">
                <img src={testimonialImages[i]} alt={item.name} loading="lazy" />
                <span className="testimonial__badge">{item.title}</span>
              </div>
              <blockquote>
                {tt.quoteOpen}
                {item.quote}
                {tt.quoteClose}
              </blockquote>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
