import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ZüriFish Map", () => {
  it("renders the bottom navigation with map as default tab", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "Karte" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Fische" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fischerkenner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByLabelText("Interaktive Fischerei-Karte")).toBeInTheDocument();
  });

  it("renders a label-light green base map with OSM lake markings", () => {
    render(<App />);

    expect(
      screen.getByLabelText(
        "Interaktive grüne Satellitenbasiskarte mit markiertem Zürichsee, Greifensee, Pfäffikersee und roten Fischereiverbotszonen an Bachmündungen und Seeschutzzonen"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Rot: Fischereiverbotszonen an Zürichsee-Bachmündungen und Pfäffikersee-Seeschutzzonen")).toBeInTheDocument();
  });

  it("opens and closes the Zürichsee panel from the map", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Zürichsee öffnen" }));

    const panel = await screen.findByRole("dialog", { name: "Zürichsee Detailregeln" });
    expect(within(panel).getByRole("heading", { name: "Zürichsee" })).toBeInTheDocument();
    expect(within(panel).getAllByText("Ganzjährig geschützt").length).toBeGreaterThan(0);
    expect(within(panel).getByText(/geschützt \/ nicht entnehmen/i)).toBeInTheDocument();
    expect(within(panel).getByAltText("Fischbild Seeforelle aus dem Steckbrief-Dokument")).toBeInTheDocument();
    const moreFishButton = within(panel).getByRole("button", { name: /Weitere Fische in diesem See/i });
    expect(moreFishButton).toHaveAttribute("aria-expanded", "false");
    expect(within(panel).queryByText("Karpfen")).not.toBeInTheDocument();

    await user.click(moreFishButton);

    expect(within(panel).getByRole("button", { name: /Weitere Fische in diesem See/i })).toHaveAttribute("aria-expanded", "true");
    expect(within(panel).getByText("Karpfen")).toBeInTheDocument();
    expect(within(panel).getByText("Brachsmen")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Panel schliessen" }));
    expect(screen.queryByRole("dialog", { name: "Zürichsee Detailregeln" })).not.toBeInTheDocument();
  });

  it("opens Greifensee and Pfäffikersee panels with their data", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Greifensee öffnen" }));
    expect(await screen.findByRole("dialog", { name: "Greifensee Detailregeln" })).toHaveTextContent("Hecht");
    expect(screen.getByText("45 cm")).toBeInTheDocument();
    expect(screen.queryByText("Mindestmass 45 cm")).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Greifensee Detailregeln" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pfäffikersee öffnen" }));
    expect(await screen.findByRole("dialog", { name: "Pfäffikersee Detailregeln" })).toHaveTextContent("Schutzgebiete am Ufer beachten");
  });

  it("updates the patent detail rules when switching gear modes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Zürichsee öffnen" }));

    const panel = await screen.findByRole("dialog", { name: "Zürichsee Detailregeln" });
    expect(within(panel).getByLabelText("Ohne Patent Detailregeln")).toHaveTextContent("Ohne Patent nur vom trockenen Ufer aus.");

    await user.click(within(panel).getByRole("tab", { name: "Stehendes Boot" }));

    const bootDetails = within(panel).getByLabelText("Stehendes Boot Detailregeln");
    expect(within(panel).getByText("3 Ruten/Schnüre")).toBeInTheDocument();
    expect(bootDetails).toHaveTextContent("Vom stehenden Boot aus");
    expect(bootDetails).toHaveTextContent("Köderfischreuse oder Köderfischflasche");
    expect(bootDetails).not.toHaveTextContent("Ohne Patent nur vom trockenen Ufer aus.");

    await user.click(within(panel).getByRole("tab", { name: "Schleppangeln" }));

    const trollingDetails = within(panel).getByLabelText("Schleppangeln Detailregeln");
    expect(within(panel).getByText("10 Köder")).toBeInTheDocument();
    expect(trollingDetails).toHaveTextContent("Seitliche Ausleger höchstens 40 m vom Boot");
    expect(trollingDetails).not.toHaveTextContent("Vom stehenden Boot aus");
  });

  it("shows only official source links in every panel", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Zürichsee öffnen" }));

    const panel = await screen.findByRole("dialog", { name: "Zürichsee Detailregeln" });
    expect(within(panel).queryByText("Heute-Status")).not.toBeInTheDocument();
    expect(within(panel).queryByText(/Diese App ist eine Orientierungshilfe/i)).not.toBeInTheDocument();
    expect(within(panel).getByText("Offizielle Links")).toBeInTheDocument();
    expect(within(panel).getByText(/Fischerei Kanton Zürich/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Auszug für die Angelfischerei/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Merkblatt Fanglimiten/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Merkblatt Freiangelfischerei/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Äschenfangverbot/i)).toBeInTheDocument();
    expect(within(panel).queryByText(/Fischbilder aus Steckbrief-PDF/i)).not.toBeInTheDocument();
    expect(within(panel).queryByText(/PRD ZüriFish/i)).not.toBeInTheDocument();
    expect(within(panel).queryByText(/OpenStreetMap See-Geometrien/i)).not.toBeInTheDocument();
  });

  it("opens the fish profile tab as compact categories and expands a Steckbrief", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Fische" }));

    expect(screen.getByRole("button", { name: "Fische" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Fische" })).toBeInTheDocument();
    expect(screen.getByText("36 Arten")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kleinfische" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Raubfische" })).toBeInTheDocument();
    expect(screen.queryByText("Perca fluviatilis")).not.toBeInTheDocument();
    expect(screen.queryByText(/Kleine Gummifische/i)).not.toBeInTheDocument();
    expect(screen.queryByAltText("Fischbild Egli aus dem Steckbrief-Dokument")).not.toBeInTheDocument();

    const egliButton = screen.getByRole("button", { name: "Egli Steckbrief öffnen" });
    expect(egliButton).toHaveAttribute("aria-expanded", "false");
    const egliCard = egliButton.closest("article") as HTMLElement;

    await user.click(egliButton);

    expect(screen.getByRole("button", { name: "Egli Steckbrief schliessen" })).toHaveAttribute("aria-expanded", "true");
    expect(within(egliCard).getByAltText("Fischbild Egli aus dem Steckbrief-Dokument")).toBeInTheDocument();
    expect(within(egliCard).getByText("Perca fluviatilis")).toBeInTheDocument();
    expect(within(egliCard).getByText(/Egli sind neugierige Schwarmraeuber/i)).toBeInTheDocument();
    expect(within(egliCard).getByText(/Dunkle Querbänder/i)).toBeInTheDocument();
    expect(within(egliCard).getByText(/Kleine Gummifische/i)).toBeInTheDocument();
    expect(within(egliCard).getByText(/Egli-Filets eignen sich klassisch gebraten/i)).toBeInTheDocument();
    expect(within(egliCard).queryByText("Zürichsee")).not.toBeInTheDocument();
    expect(within(egliCard).queryByText("Greifensee")).not.toBeInTheDocument();
    expect(within(egliCard).queryByText("Pfäffikersee")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Karte" }));

    expect(screen.getByLabelText("Interaktive Fischerei-Karte")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Karte" })).toHaveAttribute("aria-current", "page");
  });

  it("opens the Fischerkenner tab with camera, photo upload, and online recognition action", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Fischerkenner" }));
    expect(screen.getByRole("heading", { name: "Fischerkenner" })).toBeInTheDocument();
    expect(screen.getByLabelText("Online-Fischerkennung")).toBeInTheDocument();
    expect(screen.getByText("Online-API, kein Modell-Download")).toBeInTheDocument();
    expect(screen.getByText("Fishial API Wrapper")).toBeInTheDocument();
    expect(screen.getByText(/Server-Proxy \/api\/fish-recognition/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kamera" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Foto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Online erkennen" })).toBeDisabled();
    expect(screen.queryByRole("link", { name: /Fishial/i })).not.toBeInTheDocument();

    await user.upload(screen.getByLabelText("Fischfoto für Vorschau auswählen"), new File(["fish"], "egli.jpg", { type: "image/jpeg" }));

    expect(screen.getByText(/egli\.jpg/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ausgewähltes Bild entfernen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Online erkennen" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText(/Einstellungen für Darstellung/i)).toBeInTheDocument();
  });

  it("recognizes an uploaded fish through the API wrapper", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<typeof fetch>(async () => {
      return new Response(
        JSON.stringify({
          ok: true,
          queryToken: "query-token",
          objects: [
            {
              bbox: [10, 20, 90, 120],
              species: [
                { id: "perca", certainty: 0.92 },
                { id: "sander", certainty: 0.31 }
              ]
            }
          ],
          definitions: {
            perca: {
              commonName: "European perch",
              scientificName: "Perca fluviatilis",
              imageUrl: "https://example.test/perch.jpg"
            },
            sander: {
              commonName: "Zander",
              scientificName: "Sander lucioperca"
            }
          }
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Fischerkenner" }));
    const file = new File(["fish-image"], "egli.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("Fischfoto für Vorschau auswählen"), file);
    await user.click(screen.getByRole("button", { name: "Online erkennen" }));

    expect(await screen.findByText("1 erkannter Fisch")).toBeInTheDocument();
    expect(screen.getAllByText("European perch").length).toBeGreaterThan(0);
    expect(screen.getByText("Perca fluviatilis")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("31%")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/fish-recognition");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "image/jpeg" });
    expect(init.body).toBe(file);
  });

  it("rejects non-image recognizer uploads before calling the API", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Fischerkenner" }));
    await user.upload(screen.getByLabelText("Fischfoto für Vorschau auswählen"), new File(["plain"], "not-a-fish.txt", { type: "text/plain" }));

    expect(screen.getByText("Bitte ein Bild auswählen.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Online erkennen" })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
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
