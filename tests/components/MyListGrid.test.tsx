import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MyListGrid } from "@/components/MyListGrid";
import type { Mark } from "@/lib/marks";

const mark = (movieId: number, title: string): Mark => ({
  movieId,
  title,
  posterPath: null,
  status: "quero",
  updatedAt: "2026-01-01T00:00:00Z",
});

describe("MyListGrid", () => {
  it("renders the marks in the received order", () => {
    render(<MyListGrid marks={[mark(2, "Beta"), mark(1, "Alfa")]} tab="quero" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/filme/2-beta");
    expect(links[1]).toHaveAttribute("href", "/filme/1-alfa");
  });

  it("shows the empty state for quero", () => {
    render(<MyListGrid marks={[]} tab="quero" />);
    expect(
      screen.getByText("Nenhum filme em Quero assistir ainda. Marque filmes na página de cada um."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver filmes" })).toHaveAttribute("href", "/");
  });

  it("shows the empty state for visto", () => {
    render(<MyListGrid marks={[]} tab="visto" />);
    expect(screen.getByText("Nenhum filme em Já assisti ainda.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver filmes" })).toHaveAttribute("href", "/");
  });
});
