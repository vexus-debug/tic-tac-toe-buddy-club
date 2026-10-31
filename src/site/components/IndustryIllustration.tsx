import { memo } from "react";

type Props = { variant: string; className?: string };

const P = "hsl(var(--primary))";
const T = "hsl(var(--medical-teal))";

import type { JSX } from "react";

const motifs: Record<string, JSX.Element> = {
  dental: (
    <g>
      <path
        d="M100 62c-14-12-34-10-40 6-6 17 2 30 6 48 3 15 2 30 10 32 9 2 9-18 14-18s5 20 14 18c8-2 7-17 10-32 4-18 12-31 6-48-6-16-26-18-40-6Z"
        fill="url(#grad)"
        opacity=".85"
      />
      <path d="M78 78c6-6 16-7 22-2" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" fill="none" />
      <circle cx="146" cy="70" r="16" stroke={T} strokeWidth="3" fill="none" opacity=".6" />
      <path d="M139 70l5 5 10-11" stroke={T} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  ),
  eye: (
    <g>
      <path d="M28 100c22-30 48-45 72-45s50 15 72 45c-22 30-48 45-72 45s-50-15-72-45Z" fill="url(#grad)" opacity=".2" />
      <path
        d="M28 100c22-30 48-45 72-45s50 15 72 45c-22 30-48 45-72 45s-50-15-72-45Z"
        stroke={P}
        strokeWidth="3.5"
        fill="none"
      />
      <circle cx="100" cy="100" r="26" fill="url(#grad)" />
      <circle cx="100" cy="100" r="11" fill="hsl(var(--background))" opacity=".9" />
      <circle cx="110" cy="90" r="4" fill="#fff" opacity=".8" />
    </g>
  ),
  stethoscope: (
    <g>
      <path
        d="M58 44v28c0 18 14 32 32 32s32-14 32-32V44"
        stroke={P}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="58" cy="40" r="7" fill={P} />
      <circle cx="122" cy="40" r="7" fill={P} />
      <path d="M90 104v20c0 16 13 28 29 28s29-12 29-28v-14" stroke={T} strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="148" cy="80" r="16" fill="url(#grad)" />
      <circle cx="148" cy="80" r="6" fill="hsl(var(--background))" opacity=".8" />
    </g>
  ),
  baby: (
    <g>
      <rect x="34" y="46" width="132" height="108" rx="16" fill="url(#grad)" opacity=".12" />
      <path d="M46 132c14-24 22-40 30-40s10 22 18 22 14-34 24-34 16 34 26 52" stroke={P} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="70" cy="70" r="9" fill={T} />
      <path d="M46 154h108" stroke={P} strokeWidth="3" opacity=".4" strokeLinecap="round" />
    </g>
  ),
  bone: (
    <g>
      <path
        d="M62 138c-10 10-26 6-28-6-10-2-14-18-4-26 8-8 18-4 24 2l50-50c-6-6-10-16-2-24 8-10 24-6 26 4 12 2 16 18 6 28-8 8-18 4-24-2l-50 50c6 6 10 16 2 24Z"
        fill="url(#grad)"
        opacity=".85"
      />
      <circle cx="150" cy="140" r="20" stroke={T} strokeWidth="3.5" fill="none" opacity=".5" />
      <path d="M142 140h16M150 132v16" stroke={T} strokeWidth="3.5" strokeLinecap="round" />
    </g>
  ),
  derma: (
    <g>
      <circle cx="96" cy="98" r="52" fill="url(#grad)" opacity=".18" />
      <circle cx="96" cy="98" r="52" stroke={P} strokeWidth="3.5" fill="none" />
      <path d="M132 136l30 30" stroke={P} strokeWidth="8" strokeLinecap="round" />
      <path d="M78 92c6-8 16-8 22 0M84 116c10 8 22 4 28-6" stroke={T} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="120" cy="76" r="5" fill={T} />
    </g>
  ),
  heart: (
    <g>
      <path
        d="M100 152S40 118 40 80c0-20 16-32 32-32 12 0 22 7 28 16 6-9 16-16 28-16 16 0 32 12 32 32 0 38-60 72-60 72Z"
        fill="url(#grad)"
        opacity=".85"
      />
      <path d="M46 100h26l10-18 14 34 12-24 8 8h38" stroke="hsl(var(--background))" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  ear: (
    <g>
      <path
        d="M78 154c0-24-24-30-24-64 0-28 22-48 48-48s46 20 46 44c0 26-32 24-32 44 0 14-10 24-22 24"
        stroke={P}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="98" cy="86" r="14" fill="url(#grad)" opacity=".5" />
      <path d="M150 60c10 10 10 34 0 44M162 48c16 16 16 52 0 68" stroke={T} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".7" />
    </g>
  ),
  brain: (
    <g>
      <path
        d="M96 46c-14-6-32 2-32 18-12 4-16 22-6 32-8 12 0 30 14 32 2 14 18 22 30 14V46Z"
        fill="url(#grad)"
        opacity=".85"
      />
      <path
        d="M104 46c14-6 32 2 32 18 12 4 16 22 6 32 8 12 0 30-14 32-2 14-18 22-30 14V46Z"
        fill={T}
        opacity=".35"
      />
      <path d="M100 60v90" stroke="hsl(var(--background))" strokeWidth="3" opacity=".6" />
    </g>
  ),
  lab: (
    <g>
      <path d="M86 40h28v40l30 58c6 12-2 24-14 24H70c-12 0-20-12-14-24l30-58V40Z" fill="url(#grad)" opacity=".2" />
      <path d="M86 40h28v40l30 58c6 12-2 24-14 24H70c-12 0-20-12-14-24l30-58V40Z" stroke={P} strokeWidth="3.5" fill="none" />
      <path d="M74 110h52l18 30c4 8-1 16-10 16H66c-9 0-14-8-10-16l18-30Z" fill={T} opacity=".55" />
      <circle cx="92" cy="132" r="5" fill="#fff" opacity=".7" />
      <circle cx="112" cy="142" r="4" fill="#fff" opacity=".5" />
      <path d="M80 34h40" stroke={P} strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  wellness: (
    <g>
      <path d="M100 150c0-34 20-60 52-64-4 32-24 56-52 64Z" fill="url(#grad)" opacity=".8" />
      <path d="M100 150c0-30-18-52-46-56 4 28 22 48 46 56Z" fill={T} opacity=".45" />
      <path d="M100 156V96" stroke={P} strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="62" r="18" stroke={T} strokeWidth="3.5" fill="none" opacity=".6" />
    </g>
  ),
};

const IndustryIllustration = ({ variant, className }: Props) => (
  <svg viewBox="0 0 200 200" role="img" aria-hidden="true" className={className}>
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={P} />
        <stop offset="100%" stopColor={T} />
      </linearGradient>
      <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.4" fill={P} opacity=".25" />
      </pattern>
    </defs>
    <circle cx="100" cy="100" r="86" fill="url(#grad)" opacity=".07" />
    <circle cx="100" cy="100" r="86" stroke={P} strokeWidth="1.5" opacity=".15" fill="none" />
    <rect x="126" y="126" width="62" height="62" rx="10" fill="url(#dots)" />
    {motifs[variant] ?? motifs.stethoscope}
  </svg>
);

export default memo(IndustryIllustration);
