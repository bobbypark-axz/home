type IconProps = { size?: number };

export const ChevronIcon = ({
  size = 10,
  dir = "down",
}: IconProps & { dir?: "down" | "up" | "left" | "right" }) => {
  const r = { down: 0, up: 180, left: 90, right: -90 }[dir];
  return (
    <svg className="chevron" width={size} height={size} viewBox="0 0 10 10" style={{ transform: `rotate(${r}deg)` }}>
      <path d="M 2 3.5 L 5 6.5 L 8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const PinIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M 7 1 C 4.5 1 2.5 3 2.5 5.5 C 2.5 8.5 7 13 7 13 C 7 13 11.5 8.5 11.5 5.5 C 11.5 3 9.5 1 7 1 Z" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="7" cy="5.5" r="1.5" fill="currentColor" />
  </svg>
);

export const HeartIcon = ({ size = 18, filled = false }: IconProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"}>
    <path d="M 10 17 C 10 17 3 12 3 7.5 C 3 5 5 3 7.5 3 C 8.8 3 10 4 10 4 C 10 4 11.2 3 12.5 3 C 15 3 17 5 17 7.5 C 17 12 10 17 10 17 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export const ShareIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M 10 3 V 13 M 10 3 L 6 7 M 10 3 L 14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 4 12 V 16 H 16 V 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const CloseIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M 3 3 L 11 11 M 11 3 L 3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const MapIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M 1 3 L 5 1.5 L 9 3 L 13 1.5 V 11 L 9 12.5 L 5 11 L 1 12.5 Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M 5 1.5 V 11 M 9 3 V 12.5" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

export const ListIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M 2 3 H 12 M 2 7 H 12 M 2 11 H 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const LocateIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3" />
    <path d="M 7 1 V 3 M 7 11 V 13 M 1 7 H 3 M 11 7 H 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const SearchIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <circle cx="6" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M 9 9 L 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const TrainIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <rect x="3" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M 3 7 H 11" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="5" cy="8.5" r=".6" fill="currentColor" />
    <circle cx="9" cy="8.5" r=".6" fill="currentColor" />
    <path d="M 4 12 L 2 13.5 M 10 12 L 12 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const CalendarIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <rect x="2" y="3" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M 2 5.5 H 12" stroke="currentColor" strokeWidth="1.2" />
    <path d="M 4.5 2 V 4 M 9.5 2 V 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
