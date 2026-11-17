import { cookies } from "next/headers";
import { Hero } from "@/components/Hero";
import { PersonalizeNotice } from "@/components/PersonalizeNotice";
import { ShelfList } from "@/components/ShelfList";
import { StreamingSelector } from "@/components/StreamingSelector";
import { COOKIE_NAME, parseMyStreamings, providerIdsFor } from "@/lib/streamings";
import { saveStreamings } from "@/app/streamings-actions";
import { getCurrentUser } from "@/lib/supabase/server";
import { getAllShelves } from "@/lib/tmdb/discover";
import { getMovieDetail } from "@/lib/tmdb/movie";
import { getOtherBrProviders } from "@/lib/tmdb/search";

export default async function Home() {
  const cookieStore = await cookies();
  const selected = parseMyStreamings(cookieStore.get(COOKIE_NAME)?.value);
  const myProviderIds = providerIdsFor(selected);
  const user = await getCurrentUser();

  const [shelves, others] = await Promise.all([
    getAllShelves(myProviderIds),
    getOtherBrProviders().catch(() => []),
  ]);

  // Destaque: o filme mais em alta (nos streamings marcados, ou no Brasil todo).
  const topId = shelves.find((s) => s.shelf.id === "em-alta")?.movies[0]?.id ?? shelves[0]?.movies[0]?.id;
  const featured = topId ? await getMovieDetail(topId).catch(() => null) : null;
  const kicker = selected.length > 0 ? "em alta nos seus streamings" : "em alta no streaming hoje";

  return (
    <>
      {featured ? <Hero movie={featured} kicker={kicker} myProviderIds={myProviderIds} /> : <div className="h-20" />}

      <section
        aria-labelledby="meus-streamings"
        className={`relative z-10 px-4 md:px-12 ${featured ? "-mt-16 md:-mt-20" : ""}`}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="meus-streamings" className="font-display text-2xl font-bold tracking-tight md:text-[1.75rem]">
            Meus streamings
          </h2>
          {selected.length === 0 && <PersonalizeNotice />}
        </div>
        <div className="mt-3">
          <StreamingSelector selected={selected} others={others} saveToAccount={user ? saveStreamings : undefined} />
        </div>
      </section>

      <div className="mt-10">
        <ShelfList shelves={shelves} />
      </div>
    </>
  );
}
