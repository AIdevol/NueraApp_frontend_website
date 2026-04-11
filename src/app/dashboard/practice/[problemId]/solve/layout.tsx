/**
 * Full-width, full-height shell for the coding workspace (split problem | IDE).
 * Breaks out of the dashboard content max-width and vertical padding for this route only.
 */
export default function PracticeSolveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-6 -mt-6 -mb-8 md:-mx-8 md:-mt-8 md:-mb-8 flex max-h-[calc(100dvh-5.75rem)] min-h-0 w-[calc(100%+3rem)] max-w-none flex-1 flex-col min-h-[calc(100dvh-5.75rem)] md:w-[calc(100%+4rem)] rounded-xl overflow-hidden ring-1 ring-orange-500/15">
      {children}
    </div>
  );
}
