import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";

describe("ErrorPage", () => {
  it("shows a friendly message and retries", async () => {
    const retry = vi.fn();
    render(<ErrorPage error={new Error("TMDB respondeu 401")} retry={retry} />);
    expect(
      screen.getByText("Não conseguimos carregar os filmes agora. Tente de novo em instantes."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/401/)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
