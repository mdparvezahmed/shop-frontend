/** Thin message bar above the header (Settings → Store → Announcement). */
export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="bg-primary px-4 py-2 text-center text-xs font-medium tracking-wide text-primary-foreground sm:text-[13px]">
      {text}
    </div>
  );
}
