import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareButton } from "@/components/ShareButton";

const url = "https://cinecasa.app/filme/872585-oppenheimer";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ShareButton", () => {
  it("uses the native share sheet when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    render(<ShareButton title="Oppenheimer" url={url} />);
    await userEvent.click(screen.getByRole("button", { name: /Compartilhar/ }));
    expect(share).toHaveBeenCalledWith({ title: "Oppenheimer", url });
  });

  it("copies the link when native share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<ShareButton title="Oppenheimer" url={url} />);
    await userEvent.click(screen.getByRole("button", { name: /Compartilhar/ }));
    expect(writeText).toHaveBeenCalledWith(url);
    expect(await screen.findByText("Link copiado!")).toBeInTheDocument();
  });
});
