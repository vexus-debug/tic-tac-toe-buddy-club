import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const messages = [
  "Clinexus now brings AI into your clinical workflow",
  "Draft visit notes in seconds with the AI copilot",
  "Safer prescriptions with AI interaction and allergy checks",
  "Catch missed billing items before patients leave",
];

const Row = () => (
  <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden>
    {messages.map((m) => (
      <span key={m} className="flex items-center gap-2 whitespace-nowrap">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        {m}
      </span>
    ))}
    <Link to="/updates" className="whitespace-nowrap font-semibold underline-offset-4 hover:underline">
      See what's new →
    </Link>
  </div>
);

const AnnouncementTicker = () => (
  <div
    role="region"
    aria-label="Announcement: Clinexus now brings AI into your clinical workflow"
    className="group fixed inset-x-0 top-0 z-[60] flex h-9 items-center overflow-hidden bg-primary text-xs font-medium text-primary-foreground sm:text-sm"
  >
    <div className="flex w-max animate-[ticker_40s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
      <Row />
      <Row />
    </div>
  </div>
);

export default AnnouncementTicker;
