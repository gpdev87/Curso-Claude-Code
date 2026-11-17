import { cookies } from "next/headers";
import { PersonalizeNotice } from "@/components/PersonalizeNotice";
import { ShelfList } from "@/components/ShelfList";
import { StreamingSelector } from "@/components/StreamingSelector";
import { COOKIE_NAME, parseMyStreamings, providerIdsFor } from "@/lib/streamings";
import { getAllShelves } from "@/lib/tmdb/discover";
import { getOtherBrProviders } from "@/lib/tmdb/search";

export default async function Home() {
  const cookieStore = await cookies();
  const selected = parseMyStreamings(cookieStore.get(COOKIE_NAME)?.value);

  const [shelves, others] = await Promise.all([
    getAllShelves(providerIdsFor(selected)),
    getOtherBrProviders().catch(() => []),
  ]);

  return (
    <>
      <StreamingSelector selected={selected} others={others} />
      {selected.length === 0 && <PersonalizeNotice />}
      <ShelfList shelves={shelves} />
    </>
  );
}
