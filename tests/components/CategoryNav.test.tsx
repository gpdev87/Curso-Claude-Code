import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategoryNav } from "@/components/CategoryNav";

describe("CategoryNav", () => {
  it("links every category keeping the current order", () => {
    render(<CategoryNav current="terror" order="nota" />);
    const nav = screen.getByRole("navigation", { name: "Categorias" });
    expect(within(nav).getAllByRole("link")).toHaveLength(20);
    const terror = within(nav).getByRole("link", { name: "Terror" });
    expect(terror).toHaveAttribute("aria-current", "page");
    expect(terror).toHaveAttribute("href", "/categoria/terror?ordem=nota");
    expect(within(nav).getByRole("link", { name: "Comédia" })).toHaveAttribute("href", "/categoria/comedia?ordem=nota");
    expect(within(nav).getByRole("link", { name: "Comédia" })).not.toHaveAttribute("aria-current");
  });

  it("switches the order keeping the category", () => {
    render(<CategoryNav current="terror" order="nota" />);
    const sort = screen.getByRole("navigation", { name: "Ordenar" });
    expect(within(sort).getByRole("link", { name: "Em alta" })).toHaveAttribute("href", "/categoria/terror");
    expect(within(sort).getByRole("link", { name: "★ Mais bem avaliados" })).toHaveAttribute("aria-current", "page");
  });
});
