import type { Restaurant } from "@/types";
import { MapPin, Clock, Phone } from "lucide-react";

export function RestaurantHero({ r }: { r: Restaurant }) {
  return (
    <section className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
      <img src={r.heroImage} alt={r.name} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-end p-5 sm:p-8 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              r.openNow ? "bg-emerald-500 text-white" : "bg-zinc-700 text-zinc-100"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            {r.openNow ? "Open now" : "Closed"}
          </span>
          <span className="text-xs text-white/80">{r.hours}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{r.name}</h1>
        <p className="mt-2 text-sm sm:text-base text-white/90 max-w-xl">{r.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/80">
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{r.address}</span>
          <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{r.phone}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{r.hours}</span>
        </div>
      </div>
    </section>
  );
}