import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StreamingSelector } from "@/components/StreamingSelector";
import { PersonalizeNotice } from "@/components/PersonalizeNotice";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const cookieValue = () => /meus_streamings=([^;]*)/.exec(document.cookie)?.[1];

beforeEach(() => {
  refresh.mockReset();
  document.cookie = "meus_streamings=; path=/; max-age=0";
});

describe("StreamingSelector", () => {
  it("adds a service to the cookie and refreshes", async () => {
    render(<StreamingSelector selected={["netflix"]} others={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "HBO Max" }));
    expect(cookieValue()).toBe("netflix%2Cmax");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("removes a selected service", async () => {
    render(<StreamingSelector selected={["netflix", "max"]} others={[]} />);
    expect(screen.getByRole("button", { name: "Netflix" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Netflix" }));
    expect(cookieValue()).toBe("max");
  });

  it("shows every curated service, including Mercado Play", () => {
    render(<StreamingSelector selected={[]} others={[]} />);
    expect(screen.getByRole("button", { name: "Mercado Play" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apple TV" })).toBeInTheDocument();
  });

  it("reveals other providers behind the + button as p<id> chips", async () => {
    render(<StreamingSelector selected={[]} others={[{ id: 190, name: "Curiosity", logoPath: null }]} />);
    expect(screen.queryByRole("button", { name: "Curiosity" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "+ outros" }));
    await userEvent.click(screen.getByRole("button", { name: "Curiosity" }));
    expect(cookieValue()).toBe("p190");
  });
});

describe("StreamingSelector with saved extra providers", () => {
  it("shows selected p<id> chips without expanding, so they can be cleared", async () => {
    render(<StreamingSelector selected={["p190"]} others={[{ id: 190, name: "Curiosity", logoPath: null }]} />);
    const chip = screen.getByRole("button", { name: "Curiosity" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(chip);
    expect(cookieValue()).toBe("");
  });

  it("shows a selected provider even when the providers list failed to load", () => {
    render(<StreamingSelector selected={["p190"]} others={[]} />);
    expect(screen.getByRole("button", { name: "Serviço 190" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("PersonalizeNotice", () => {
  it("shows the hint", () => {
    render(<PersonalizeNotice />);
    expect(screen.getByText("Marque seus streamings para personalizar")).toBeInTheDocument();
  });
});
