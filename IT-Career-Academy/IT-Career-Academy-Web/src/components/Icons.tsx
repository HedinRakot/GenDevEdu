import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const CodeIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2.4}>
    <path d="M8 6 2 12l6 6M16 6l6 6-6 6M14 4l-4 16" />
  </svg>
);

export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" />
  </svg>
);

export const PlayIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="10" />
    <path d="m10 8 6 4-6 4z" />
  </svg>
);

export const ArrowRight = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeft = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const LaptopIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="11" rx="1.5" />
    <path d="M2 19h20" />
  </svg>
);

export const LayersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
  </svg>
);

export const UsersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3" />
    <circle cx="5" cy="10" r="2.2" />
    <circle cx="19" cy="10" r="2.2" />
    <path d="M6.5 20a5.5 5.5 0 0 1 11 0M1.5 19a3.5 3.5 0 0 1 4.5-3.3M22.5 19a3.5 3.5 0 0 0-4.5-3.3" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2.4}>
    <path d="m5 12 4 4 10-10" />
  </svg>
);

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10" />
  </svg>
);

export const CheckSquareIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="m8 12 3 3 5-6" />
  </svg>
);

export const BarChartIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 20v-6M10 20v-9M15 20V7M20 20V4" strokeWidth={2.6} />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const BrowserIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.5" y="4" width="19" height="16" rx="2" />
    <path d="M2.5 9h19M6 6.5h.01M9 6.5h.01" />
  </svg>
);

export const ClipboardIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M9 3h6v4H9zM8 12h8M8 16h5" />
  </svg>
);

export const BellIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />
  </svg>
);

export const UserCircleIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3.2" />
    <path d="M6 19a7 7 0 0 1 12 0" />
  </svg>
);

export const VolumeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6" />
  </svg>
);

export const ExpandIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

export const VideoIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.5" y="6" width="13" height="12" rx="2" />
    <path d="m15.5 10.5 6-3.5v10l-6-3.5" />
  </svg>
);

export const ShieldCheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6z" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
);

export const GraduationIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 4 10 5-10 5L2 9z" />
    <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6" />
  </svg>
);

export const RefreshIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" />
  </svg>
);

export const BriefcaseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18M11 12v2h2v-2" />
  </svg>
);

export const BookIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14" />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </svg>
);

export const AwardIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="9" r="5.5" />
    <circle cx="12" cy="9" r="2.5" />
    <path d="m8.5 13.5-2 7 3-1.5 2 2.5 .5-6M15.5 13.5l2 7-3-1.5-2 2.5-.5-6" />
  </svg>
);

export const ChatIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5c5 0 9 3.4 9 7.6s-4 7.6-9 7.6c-1.1 0-2.2-.2-3.2-.5L4 20l1.3-3.8C3.9 14.8 3 13 3 11.1 3 6.9 7 3.5 12 3.5z" />
    <path d="M8 11.2h.01M12 11.2h.01M16 11.2h.01" strokeWidth={2.6} />
  </svg>
);

export const GrowthIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 20v-2M9 20v-5M14 20v-7M19 20V11" strokeWidth={2.4} />
    <path d="m4 13 5-4 4 3 7-7M15 5h5v5" />
  </svg>
);

export const MenuIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
