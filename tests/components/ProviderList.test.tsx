import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderList } from "@/components/ProviderList";

const max = { id: 1899, name: "Max", logoPath: "/m.jpg" };
const netflix = { id: 8, name: "Netflix", logoPath: "/n.jpg" };

describe("ProviderList", () => {
  it("lists my services first, marked as subscribed", () => {
    render(<ProviderList providers={[max, netflix]} myProviderIds={[8]} />);
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("Netflix")).toBeInTheDocument();
    expect(within(items[0]).getByText("✓ você assina")).toBeInTheDocument();
    expect(within(items[1]).queryByText("✓ você assina")).toBeNull();
  });

  it("explains when the movie is not on subscription streaming in Brazil", () => {
    render(<ProviderList providers={[]} myProviderIds={[8]} />);
    expect(screen.getByText("Não disponível em streaming por assinatura no Brasil")).toBeInTheDocument();
  });
});
