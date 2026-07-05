import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

const originalGeolocation = navigator.geolocation;

function setMockGeolocation(geolocation: Pick<Geolocation, "getCurrentPosition"> | undefined) {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: geolocation
  });
}

afterEach(() => {
  window.localStorage.clear();
  setMockGeolocation(originalGeolocation);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ZüriFish Map", () => {
  it("renders the bottom navigation with map as default tab", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "Karte" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Fische" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fischerkenner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Regeln" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Settings/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Interaktive Fischerei-Karte")).toBeInTheDocument();
    expect(screen.getByLabelText("Seen und Kernzahlen")).toHaveTextContent("Zürichsee");
    expect(screen.getByLabelText("Seen und Kernzahlen")).toHaveTextContent("7 Regeln");
  });

  it("renders an offline default base map with switchable map styles", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByLabelText(/Interaktive Fischerei-Karte mit wechselbaren Basiskarten/i)
    ).toBeInTheDocument();

    const mapSwitcher = screen.getByLabelText("Kartentyp auswählen");
    const baseMapOptions = within(mapSwitcher).getByLabelText("Basiskarten auswählen");
    expect(within(baseMapOptions).getAllByRole("button")).toHaveLength(4);
    expect(within(baseMapOptions).getByRole("button", { name: /Offline/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(baseMapOptions).getByRole("button", { name: /Klar/i })).toHaveAttribute("aria-pressed", "false");
    expect(within(baseMapOptions).getByRole("button", { name: /Natur/i })).toHaveAttribute("aria-pressed", "false");
    expect(within(baseMapOptions).getByRole("button", { name: /Satellit/i })).toHaveAttribute("aria-pressed", "false");
    expect(within(mapSwitcher).getByRole("button", { name: "Fischereiverbotszonen ausblenden" })).toHaveAttribute("aria-pressed", "true");

    await user.click(within(baseMapOptions).getByRole("button", { name: /Satellit/i }));

    expect(within(baseMapOptions).getByRole("button", { name: /Offline/i })).toHaveAttribute("aria-pressed", "false");
    expect(within(baseMapOptions).getByRole("button", { name: /Satellit/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByLabelText("Kartenhinweis")).not.toBeInTheDocument();
    expect(screen.queryByText(/Rot: heute oder ganzjährig verboten/i)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.getItem("zuerifish:map-preferences")).toContain('"selectedBaseMapId":"satellit"');
    });

    await user.click(within(mapSwitcher).getByRole("button", { name: "Fischereiverbotszonen ausblenden" }));

    expect(within(mapSwitcher).getByRole("button", { name: "Fischereiverbotszonen einblenden" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Fischereiverbotszonen sind ausgeblendet")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.getItem("zuerifish:map-preferences")).toContain('"showRestrictionZones":false');
    });
  });

  it("requests and displays the user location only after the location button is pressed", async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: {
          accuracy: 18,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          latitude: 47.3769,
          longitude: 8.5417,
          speed: null
        },
        timestamp: Date.now()
      } as GeolocationPosition);
    });
    setMockGeolocation({ getCurrentPosition });
    render(<App />);

    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(screen.queryByText(/Standort gefunden/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Standort anzeigen" }));

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), expect.objectContaining({ enableHighAccuracy: true }));
    expect(await screen.findByText("Standort gefunden (±18 m)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Standort erneut suchen" })).toBeInTheDocument();
  });

  it("restores saved lake and map preferences", () => {
    window.localStorage.setItem("zuerifish:selected-lake", "greifensee");
    window.localStorage.setItem(
      "zuerifish:map-preferences",
      JSON.stringify({ selectedBaseMapId: "natur", showRestrictionZones: false })
    );

    render(<App />);

    expect(screen.getByRole("dialog", { name: "Greifensee Detailregeln" })).toBeInTheDocument();

    const mapSwitcher = screen.getByLabelText("Kartentyp auswählen");
    const baseMapOptions = within(mapSwitcher).getByLabelText("Basiskarten auswählen");
    expect(within(baseMapOptions).getByRole("button", { name: /Natur/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(mapSwitcher).getByRole("button", { name: "Fischereiverbotszonen einblenden" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Fischereiverbotszonen sind ausgeblendet")).not.toBeInTheDocument();
  });

  it("opens and closes the Zürichsee panel from the map", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Zürichsee öffnen" }));
    await waitFor(() => {
      expect(window.localStorage.getItem("zuerifish:selected-lake")).toBe("zuerichsee");
    });

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
    await waitFor(() => {
      expect(window.localStorage.getItem("zuerifish:selected-lake")).toBeNull();
    });
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
    expect(screen.queryByLabelText("Fischarten direkt in der App")).not.toBeInTheDocument();
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
    expect(within(egliCard).getByText("Zürichsee")).toBeInTheDocument();
    expect(within(egliCard).getByText("Greifensee")).toBeInTheDocument();
    expect(within(egliCard).getByText("Pfäffikersee")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Karte" }));

    expect(screen.getByLabelText("Interaktive Fischerei-Karte")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Karte" })).toHaveAttribute("aria-current", "page");
  });

  it("embeds the online fish recognizer and opens a matched app profile popup", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Fischerkenner" }));

    expect(screen.getByRole("button", { name: "Fischerkenner" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Fischerkenner" })).toBeInTheDocument();
    const recognizerFrame = screen.getByTitle("FischFinder Online-Erkenner") as HTMLIFrameElement;
    expect(recognizerFrame).toHaveAttribute("srcdoc", expect.stringContaining("FischFinder eingebettet"));
    expect(recognizerFrame).not.toHaveAttribute("src");
    expect(await screen.findByText("Auto-Zuweisung aktiv")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /FischFinder|Öffnen/i })).not.toBeInTheDocument();

    const appSpeciesList = screen.getByLabelText("Fischarten direkt in der App");
    const resultMessage = new MessageEvent("message", {
      data: {
        type: "zuerifish:fischfinder-result",
        resultText: "Fischart: Flussbarsch Wissenschaftlicher Name: Perca fluviatilis"
      }
    });
    Object.defineProperty(resultMessage, "source", { value: recognizerFrame.contentWindow });

    window.dispatchEvent(resultMessage);

    await waitFor(() => {
      expect(screen.getByLabelText("FischFinder-Ergebnis oder Artname")).toHaveValue(
        "Fischart: Flussbarsch Wissenschaftlicher Name: Perca fluviatilis"
      );
    });
    expect(await screen.findByRole("button", { name: /Bester ZüriFish-Treffer Egli Steckbrief-Popup öffnen/i })).toBeInTheDocument();
    expect(within(appSpeciesList).getByRole("button", { name: "Egli Perca fluviatilis Steckbrief-Popup öffnen" })).toBeInTheDocument();
    expect(within(appSpeciesList).queryByRole("button", { name: /Hecht/i })).not.toBeInTheDocument();

    const profileDialog = await screen.findByRole("dialog", { name: "Egli Steckbrief" });
    expect(within(profileDialog).getByText("Perca fluviatilis")).toBeInTheDocument();
    expect(within(profileDialog).getByAltText("Fischbild Egli aus dem Steckbrief-Dokument")).toBeInTheDocument();
    expect(within(profileDialog).getByText(/Dunkle Querbänder/i)).toBeInTheDocument();

    await user.click(within(profileDialog).getByRole("button", { name: "Steckbrief-Popup schliessen" }));

    expect(screen.queryByRole("dialog", { name: "Egli Steckbrief" })).not.toBeInTheDocument();
  });

  it("opens the rules tab with lake metrics, restriction state and official sources", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Regeln" }));

    expect(screen.getByRole("button", { name: "Regeln" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Regeln" })).toBeInTheDocument();
    expect(screen.getByLabelText("Regeln nach See")).toHaveTextContent("Zürichsee");
    expect(screen.getByLabelText("Regeln nach See")).toHaveTextContent("Bestätigte Fische");
    expect(screen.getByLabelText("Regeln nach See")).toHaveTextContent("Sperrzonen");
    expect(screen.getByText("Vor dem Auswerfen prüfen")).toBeInTheDocument();
    expect(screen.getByText("Freiangelrecht")).toBeInTheDocument();
    expect(screen.getByText("Quellen und Datenstand")).toBeInTheDocument();
    expect(screen.getAllByText(/Fischereivorschriften: Auszug für die Angelfischerei/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Fischerkenner" })).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
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
