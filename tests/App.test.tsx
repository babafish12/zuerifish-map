import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("ZüriFish Map", () => {
  it("renders a Swiss base map with OSM lake markings", () => {
    render(<App />);

    expect(screen.getByLabelText("Interaktive Schweizer Basiskarte mit markiertem Zürichsee, Greifensee und Pfäffikersee")).toBeInTheDocument();
    expect(screen.getByText("Schweizer Basiskarte; See-Flächen exakt aus OpenStreetMap markiert")).toBeInTheDocument();
  });

  it("opens and closes the Zürichsee panel from the map", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Zürichsee öffnen" }));

    const panel = await screen.findByRole("dialog", { name: "Zürichsee Detailregeln" });
    expect(within(panel).getByRole("heading", { name: "Zürichsee" })).toBeInTheDocument();
    expect(within(panel).getAllByText("Ganzjährig geschützt").length).toBeGreaterThan(0);
    expect(within(panel).getByText(/geschützt \/ nicht entnehmen/i)).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Panel schliessen" }));
    expect(screen.queryByRole("dialog", { name: "Zürichsee Detailregeln" })).not.toBeInTheDocument();
  });

  it("opens Greifensee and Pfäffikersee panels with their data", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Greifensee öffnen" }));
    expect(await screen.findByRole("dialog", { name: "Greifensee Detailregeln" })).toHaveTextContent("Hecht");
    expect(screen.getByText("Mindestmass 45 cm")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Greifensee Detailregeln" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pfäffikersee öffnen" }));
    expect(await screen.findByRole("dialog", { name: "Pfäffikersee Detailregeln" })).toHaveTextContent("Schutzgebiete am Ufer lokal prüfen");
  });

  it("shows source and legal disclaimer in every panel", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Zürichsee öffnen" }));

    const panel = await screen.findByRole("dialog", { name: "Zürichsee Detailregeln" });
    expect(within(panel).getByText(/Diese App ist eine Orientierungshilfe/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Merkblatt Fanglimiten/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Lokale SVG-Fischillustrationen/i)).toBeInTheDocument();
  });

  it("keeps keyboard focus inside the open panel", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Zürichsee öffnen" }));

    const panel = await screen.findByRole("dialog", { name: "Zürichsee Detailregeln" });
    const closeButton = within(panel).getByRole("button", { name: "Panel schliessen" });
    expect(closeButton).toHaveFocus();

    await user.keyboard("{Shift>}{Tab}{/Shift}");

    expect(panel).toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole("button", { name: "Pfäffikersee öffnen" })).not.toHaveFocus();
  });
});
