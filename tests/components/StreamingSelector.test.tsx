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
    await userEvent.click(screen.getByRole("button", { name: "Max" }));
    expect(cookieValue()).toBe("netflix%2Cmax");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("removes a selected service", async () => {
    render(<StreamingSelector selected={["netflix", "max"]} others={[]} />);
    expect(screen.getByRole("button", { name: "Netflix" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Netflix" }));
    expect(cookieValue()).toBe("max");
  });

  it("hides curated chips that have no provider ids yet", () => {
    render(<StreamingSelector selected={[]} others={[]} />);
    expect(screen.queryByRole("button", { name: "Mercado Play" })).toBeNull();
  });

  it("reveals other providers behind the + button as p<id> chips", async () => {
    render(<StreamingSelector selected={[]} others={[{ id: 190, name: "Curiosity", logoPath: null }]} />);
    expect(screen.queryByRole("button", { name: "Curiosity" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "+ outros" }));
    await userEvent.click(screen.getByRole("button", { name: "Curiosity" }));
    expect(cookieValue()).toBe("p190");
  });
});

describe("PersonalizeNotice", () => {
  it("shows the hint", () => {
    render(<PersonalizeNotice />);
    expect(screen.getByText("Marque seus streamings para personalizar")).toBeInTheDocument();
  });
});
