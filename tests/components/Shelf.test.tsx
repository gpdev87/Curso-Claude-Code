import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PosterCard } from "@/components/PosterCard";
import { Shelf } from "@/components/Shelf";
import type { MovieSummary } from "@/lib/tmdb/types";

const m = (id: number, title: string, posterPath: string | null = "/p.jpg"): MovieSummary => ({
  id,
  title,
  posterPath,
  voteAverage: 7,
  releaseDate: "2024-01-01",
});

describe("Shelf", () => {
  it("renders nothing without movies", () => {
    const { container } = render(<Shelf title="😱 Terror" movies={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links each movie to its page", () => {
    render(<Shelf title="🔥 Em alta" movies={[m(872585, "Oppenheimer"), m(1, "Duna")]} />);
    expect(screen.getByRole("heading", { name: "🔥 Em alta" })).toBeInTheDocument();
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/filme/872585-oppenheimer", "/filme/1-duna"]);
  });

  it("badges recommendations available on my streamings", () => {
    render(
      <Shelf
        title="Se gostou, veja também"
        movies={[
          { ...m(1, "A"), onMyStreamings: true },
          { ...m(2, "B"), onMyStreamings: false },
        ]}
      />,
    );
    expect(screen.getAllByText("✓ nos seus streamings")).toHaveLength(1);
  });
});

describe("PosterCard", () => {
  it("shows the title instead of an image when there is no poster", () => {
    render(<PosterCard movie={m(3, "Sem Pôster", null)} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Sem Pôster")).toBeInTheDocument();
  });

  it("uses the w342 poster with the title as alt text", () => {
    render(<PosterCard movie={m(3, "Com Pôster", "/abc.jpg")} />);
    expect(screen.getByRole("img", { name: "Com Pôster" })).toHaveAttribute(
      "src",
      "https://image.tmdb.org/t/p/w342/abc.jpg",
    );
  });
});

describe("PosterCard rating", () => {
  it("shows the TMDB rating with one decimal when asked", () => {
    render(<PosterCard movie={{ ...m(4, "Nota"), voteAverage: 7.84 }} showRating />);
    expect(screen.getByText("★ 7.8")).toBeInTheDocument();
  });
  it("hides a zero rating", () => {
    render(<PosterCard movie={{ ...m(5, "Sem nota"), voteAverage: 0 }} showRating />);
    expect(screen.queryByText(/★/)).toBeNull();
  });
  it("hides the rating by default", () => {
    render(<PosterCard movie={m(6, "Padrão")} />);
    expect(screen.queryByText(/★/)).toBeNull();
  });
});

describe("Shelf see all", () => {
  it("links to the category page", () => {
    render(<Shelf title="Terror" movies={[m(1, "A")]} seeAllHref="/categoria/terror" />);
    expect(screen.getByRole("link", { name: /Ver tudo/ })).toHaveAttribute("href", "/categoria/terror");
  });
  it("has no see all link without a target", () => {
    render(<Shelf title="Top" movies={[m(1, "A")]} />);
    expect(screen.queryByRole("link", { name: /Ver tudo/ })).toBeNull();
  });
});
