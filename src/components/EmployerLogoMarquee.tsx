"use client";

import { useState } from "react";

/** Top MNCs & product companies — logos loaded from CDNs with automatic fallbacks (no text labels). */
const EMPLOYERS: { name: string; domain: string }[] = [
  { name: "Google", domain: "google.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "Adobe", domain: "adobe.com" },
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "Oracle", domain: "oracle.com" },
  { name: "IBM", domain: "ibm.com" },
  { name: "NVIDIA", domain: "nvidia.com" },
  { name: "Intel", domain: "intel.com" },
  { name: "SAP", domain: "sap.com" },
  { name: "Cisco", domain: "cisco.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "Airbnb", domain: "airbnb.com" },
  { name: "Spotify", domain: "spotify.com" },
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "PayPal", domain: "paypal.com" },
  { name: "Samsung", domain: "samsung.com" },
];

function logoUrlsForDomain(domain: string): string[] {
  const d = encodeURIComponent(domain);
  return [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${d}&sz=256`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://unavatar.io/${domain}?fallback=false`,
  ];
}

function LogoCell({ name, domain }: { name: string; domain: string }) {
  const sources = logoUrlsForDomain(domain);
  const [index, setIndex] = useState(0);
  const src = sources[index];

  if (index >= sources.length || !src) {
    return (
      <div
        className="flex h-16 w-36 shrink-0 items-center justify-center rounded-2xl border border-orange-500/10 bg-zinc-900/60 md:h-20 md:w-44"
        title={name}
        aria-hidden
      >
        <span className="material-symbols-outlined text-3xl text-zinc-600 md:text-4xl">
          domain
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex h-16 w-36 shrink-0 items-center justify-center px-3 md:h-20 md:w-44"
      title={name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- multiple external logo CDNs */}
      <img
        src={src}
        alt=""
        width={176}
        height={80}
        className="h-12 w-auto max-w-[9.5rem] object-contain object-center md:h-16 md:max-w-[11rem] transition-transform duration-300 hover:scale-105"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setIndex((i) => i + 1)}
      />
    </div>
  );
}

export function EmployerLogoMarquee() {
  return (
    <section
      className="border-y border-orange-500/10 bg-black/50 py-12 md:py-14"
      aria-label="Companies where NeuraApp learners have been placed"
    >
      <div className="mx-auto mb-6 max-w-[1200px] px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400/70">
          Placements
        </p>
        <h2 className="mt-2 text-lg font-bold text-zinc-50 sm:text-xl">
          Our students join leading MNCs & product companies
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Alumni have landed roles across global tech and enterprise teams.
        </p>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-zinc-950 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-zinc-950 to-transparent"
          aria-hidden
        />

        <div className="landing-marquee flex w-max will-change-transform">
          <div className="flex items-center gap-12 pr-12 md:gap-16 md:pr-16 lg:gap-20 lg:pr-20">
            {EMPLOYERS.map((e) => (
              <LogoCell key={`a-${e.domain}`} name={e.name} domain={e.domain} />
            ))}
          </div>
          <div className="flex items-center gap-12 pr-12 md:gap-16 md:pr-16 lg:gap-20 lg:pr-20" aria-hidden>
            {EMPLOYERS.map((e) => (
              <LogoCell key={`b-${e.domain}`} name={e.name} domain={e.domain} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
