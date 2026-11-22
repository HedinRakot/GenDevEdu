import t1 from '../assets/t1.jpg';
import t2 from '../assets/t2.jpg';
import t3 from '../assets/t3.jpg';
import type { Messages } from '../i18n/translations';

export interface NavItem {
  key: keyof Messages['nav'];
  href: string;
}

export const navItems: NavItem[] = [
  { key: 'courses', href: '#kurse' },
  { key: 'stories', href: '#erfolgsgeschichten' },
  { key: 'process', href: '#ablauf' },
  { key: 'about', href: '#ueber' },
];

/** Photos for testimonials, in the same order as `testimonials.items` in translations. */
export const testimonialImages: string[] = [t1, t2, t3];

/** Where "book a consultation" buttons lead. Replace with the real booking link (e.g. Calendly) when available. */
export const BOOKING_URL = '#beratung';
