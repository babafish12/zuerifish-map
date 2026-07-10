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
  window.history.replaceState({}, "", "/");
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
    expect(screen.getByRole("button", { name: "Seen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Settings/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByText(/Orientierungshilfe/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Interaktive Fischerei-Karte")).toBeInTheDocument();
    expect(screen.queryByLabelText("Seen und Kernzahlen")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zürichsee öffnen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lac Léman öffnen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lago di Poschiavo öffnen" })).not.toBeInTheDocument();
  });

  it("renders an offline default base map with switchable map styles", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByLabelText(/Interaktive Fischerei-Karte mit wechselbaren Basiskarten/i)
    ).toBeInTheDocument();

    const mapSwitcher = screen.getByRole("group", { name: "Kartenauswahl" });
    const mapToggle = within(mapSwitcher).getByRole("button", { name: /Kartenauswahl öffnen/i });
    expect(mapToggle).toHaveAttribute("aria-expanded", "false");
    expect(mapToggle).toHaveTextContent("Offline");
    expect(within(mapSwitcher).queryByLabelText("Basiskarten auswählen")).not.toBeInTheDocument();

    await user.click(mapToggle);

    const baseMapOptions = within(mapSwitcher).getByLabelText("Basiskarten auswählen");
    expect(within(baseMapOptions).getAllByRole("button")).toHaveLength(4);
    expect(within(baseMapOptions).getByRole("button", { name: /Offline/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(baseMapOptions).getByRole("button", { name: /Klar/i })).toHaveAttribute("aria-pressed", "false");
    expect(within(baseMapOptions).getByRole("button", { name: /Natur/i })).toHaveAttribute("aria-pressed", "false");
    expect(within(baseMapOptions).getByRole("button", { name: /Satellit/i })).toHaveAttribute("aria-pressed", "false");
    expect(within(mapSwitcher).getByRole("button", { name: "Fischereiverbotszonen ausblenden" })).toHaveAttribute("aria-pressed", "true");

    await user.click(within(baseMapOptions).getByRole("button", { name: /Satellit/i }));

    expect(within(mapSwitcher).getByRole("button", { name: /Kartenauswahl öffnen/i })).toHaveAttribute("aria-expanded", "false");
    expect(within(mapSwitcher).getByRole("button", { name: /Kartenauswahl öffnen/i })).toHaveTextContent("Satellit");
    expect(within(mapSwitcher).queryByLabelText("Basiskarten auswählen")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Kartenhinweis")).not.toBeInTheDocument();
    expect(screen.queryByText(/Rot: heute oder ganzjährig verboten/i)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.getItem("zuerifish:map-preferences")).toContain('"selectedBaseMapId":"satellit"');
    });

    await user.click(within(mapSwitcher).getByRole("button", { name: /Kartenauswahl öffnen/i }));
    await user.click(within(mapSwitcher).getByRole("button", { name: "Fischereiverbotszonen ausblenden" }));

    expect(within(mapSwitcher).getByRole("button", { name: "Fischereiverbotszonen einblenden" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Fischereiverbotszonen sind ausgeblendet")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.getItem("zuerifish:map-preferences")).toContain('"showRestrictionZones":false');
    });
  });

  it("keeps overview lake labels compact while preserving accessible map buttons", () => {
    render(<App />);

    expect(screen.getByLabelText(/Interaktive Fischerei-Karte.*38 Schweizer Seen/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lac Léman öffnen" })).toHaveTextContent("Lac Léman");
    expect(screen.getByRole("button", { name: "Grimselsee öffnen" })).toHaveClass("compact");
    expect(screen.getByRole("button", { name: "Grimselsee öffnen" })).toHaveTextContent("");
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

  it("restores saved lake and map preferences", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("zuerifish:selected-lake", "greifensee");
    window.localStorage.setItem(
      "zuerifish:map-preferences",
      JSON.stringify({ selectedBaseMapId: "natur", showRestrictionZones: false })
    );

    render(<App />);

    expect(screen.getByRole("dialog", { name: "Greifensee Detailregeln" })).toBeInTheDocument();

    const mapSwitcher = screen.getByRole("group", { name: "Kartenauswahl" });
    expect(within(mapSwitcher).getByRole("button", { name: /Kartenauswahl öffnen/i })).toHaveTextContent("Natur");
    await user.click(within(mapSwitcher).getByRole("button", { name: /Kartenauswahl öffnen/i }));
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

    await user.click(within(panel).getByRole("tab", { name: "Boot / stehend" }));

    const bootDetails = within(panel).getByLabelText("Boot / stehend Detailregeln");
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

  it("shows source and patent links in detailed panels", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Zürichsee öffnen" }));

    const panel = await screen.findByRole("dialog", { name: "Zürichsee Detailregeln" });
    expect(within(panel).queryByText("Heute-Status")).not.toBeInTheDocument();
    expect(within(panel).queryByText(/Diese App ist eine Orientierungshilfe/i)).not.toBeInTheDocument();
    expect(within(panel).getByText("Patent & Vorschriften")).toBeInTheDocument();
    expect(within(panel).getByText(/Fischerei Kanton Zürich/i)).toBeInTheDocument();
    expect(within(panel).getAllByText(/Auszug für die Angelfischerei/i).length).toBeGreaterThan(0);
    expect(within(panel).getAllByText(/Merkblatt Fanglimiten/i).length).toBeGreaterThan(0);
    expect(within(panel).getByText(/Merkblatt Freiangelfischerei/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Fischereipatente beziehen 2026/i)).toBeInTheDocument();
    expect(within(panel).getAllByText(/Äschenfangverbot/i).length).toBeGreaterThan(0);
    expect(within(panel).queryByText(/Fischbilder aus Steckbrief-PDF/i)).not.toBeInTheDocument();
    expect(within(panel).queryByText(/PRD ZüriFish/i)).not.toBeInTheDocument();
    expect(within(panel).queryByText(/List of lakes of Switzerland/i)).not.toBeInTheDocument();
    expect(within(panel).queryByText(/Wikidata-Koordinaten Schweizer Seen/i)).not.toBeInTheDocument();
    expect(within(panel).queryByText(/OpenStreetMap See-Geometrien/i)).not.toBeInTheDocument();
  });

  it("opens an overview lake panel with rule notice and license links", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Bodensee öffnen" }));

    const panel = await screen.findByRole("dialog", { name: "Bodensee Detailregeln" });
    expect(within(panel).getByRole("heading", { name: "Bodensee" })).toBeInTheDocument();
    expect(within(panel).getByRole("heading", { name: "Seeinformationen" })).toBeInTheDocument();
    expect(within(panel).getByRole("heading", { name: "Freiangelrecht und Patent" })).toBeInTheDocument();
    expect(panel).toHaveTextContent("Freiangelei vom Ufer");
    expect(within(panel).getByLabelText("Ohne Patent Detailregeln")).toHaveTextContent("Vom Ufer oder von Ufermauern");
    expect(within(panel).getByRole("tab", { name: "Boot / stehend" })).toBeInTheDocument();
    expect(within(panel).getByRole("heading", { name: "Amtliche Detailregeln" })).toBeInTheDocument();
    expect(within(panel).getByText(/Bodensee-Obersee SG\/TG\/international/i)).toBeInTheDocument();
    expect(within(panel).getByRole("heading", { name: "Fischarten im Steckbrief" })).toBeInTheDocument();
    expect(within(panel).getByAltText("Fischbild Felchen aus dem Steckbrief-Dokument")).toBeInTheDocument();
    expect(within(panel).getByAltText("Fischbild Zander aus dem Steckbrief-Dokument")).toBeInTheDocument();
    expect(within(panel).queryByRole("heading", { name: "Regeln prüfen" })).not.toBeInTheDocument();
    expect(within(panel).getByText(/Fischen im Kanton St. Gallen/i)).toBeInTheDocument();
    expect(within(panel).getByText(/eFJ Webshop Thurgau/i)).toBeInTheDocument();
    expect(within(panel).getAllByText(/Fischereibestimmungen Bodensee 2026/i).length).toBeGreaterThan(0);
    expect(within(panel).queryByText(/List of lakes of Switzerland/i)).not.toBeInTheDocument();
    expect(within(panel).queryByText(/Wikidata-Koordinaten Schweizer Seen/i)).not.toBeInTheDocument();
  });

  it("opens the fish profile tab as compact categories and expands a Steckbrief", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Fische" }));

    expect(screen.getByRole("button", { name: "Fische" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { level: 1, name: "ZüriFish" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "ZüriFish Logo" })).toBeInTheDocument();
    expect(screen.queryByText(/Orientierungshilfe/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fische" })).toBeInTheDocument();
    expect(screen.getByText("36 Arten")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kleinfische" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Raubfische" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Fischarten direkt in der App")).not.toBeInTheDocument();
    expect(screen.queryByText("Perca fluviatilis")).not.toBeInTheDocument();
    expect(screen.queryByText(/Kleine Gummifische/i)).not.toBeInTheDocument();
    expect(screen.queryByAltText("Echtes Foto eines Egli")).not.toBeInTheDocument();

    const egliButton = screen.getByRole("button", { name: "Egli Steckbrief öffnen" });
    expect(egliButton).toHaveAttribute("aria-expanded", "false");
    const egliCard = egliButton.closest("article") as HTMLElement;

    await user.click(egliButton);

    expect(screen.getByRole("button", { name: "Egli Steckbrief schliessen" })).toHaveAttribute("aria-expanded", "true");
    expect(within(egliCard).getByAltText("Echtes Foto eines Egli")).toBeInTheDocument();
    expect(within(egliCard).getByText(/Foto: Gilles San Martin/i)).toBeInTheDocument();
    expect(within(egliCard).getByText("Perca fluviatilis")).toBeInTheDocument();
    expect(within(egliCard).getAllByText(/Egli sind neugierige Schwarmraeuber/i).length).toBeGreaterThan(0);
    expect(within(egliCard).getByText(/Dunkle Querbänder/i)).toBeInTheDocument();
    expect(within(egliCard).getByText(/Kleine Gummifische/i)).toBeInTheDocument();
    expect(within(egliCard).getByText(/Egli-Filets eignen sich klassisch gebraten/i)).toBeInTheDocument();
    expect(within(egliCard).getByLabelText("Was tun nach dem Fang")).toHaveTextContent("Entnahme nur regelkonform");
    expect(within(egliCard).getByText("Sicher erkennen")).toBeInTheDocument();
    expect(within(egliCard).getByText("Standplätze und Saison")).toBeInTheDocument();
    expect(within(egliCard).getByText("Verwechslungen vermeiden")).toBeInTheDocument();
    expect(within(egliCard).getByText("Zürichsee")).toBeInTheDocument();
    expect(within(egliCard).getByText("Greifensee")).toBeInTheDocument();
    expect(within(egliCard).getByText("Pfäffikersee")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Karte" }));

    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
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
    expect(within(appSpeciesList).getAllByRole("button")).toHaveLength(6);
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
    expect(within(profileDialog).getByAltText("Echtes Foto eines Egli")).toBeInTheDocument();
    expect(within(profileDialog).getByText(/Dunkle Querbänder/i)).toBeInTheDocument();
    expect(within(profileDialog).getByLabelText("Was tun nach dem Fang")).toHaveTextContent("Entnahme nur regelkonform");
    expect(within(profileDialog).getByText(/Mass, Schonzeit und Fangzahl/i)).toBeInTheDocument();

    await user.click(within(profileDialog).getByRole("button", { name: "Steckbrief-Popup schliessen" }));

    expect(screen.queryByRole("dialog", { name: "Egli Steckbrief" })).not.toBeInTheDocument();
  });

  it("highlights protected and landesfremd catch guidance in fish profiles", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Fische" }));

    const aescheButton = screen.getByRole("button", { name: "Äsche Steckbrief öffnen" });
    const aescheCard = aescheButton.closest("article") as HTMLElement;
    await user.click(aescheButton);

    expect(within(aescheCard).getByLabelText("Was tun nach dem Fang")).toHaveTextContent("Geschützte Art");
    expect(within(aescheCard).getByText(/Nicht entnehmen - sofort schonend zurücksetzen/i)).toBeInTheDocument();

    const rainbowButton = screen.getByRole("button", { name: "Regenbogenforelle Steckbrief öffnen" });
    const rainbowCard = rainbowButton.closest("article") as HTMLElement;
    await user.click(rainbowButton);

    expect(within(rainbowCard).getByLabelText("Was tun nach dem Fang")).toHaveTextContent("Landesfremd / invasiv prüfen");
    expect(within(rainbowCard).getByText(/Nicht lebend versetzen/i)).toBeInTheDocument();
  });

  it("filters fish profiles by search term and category", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Fische" }));
    const search = screen.getByRole("searchbox", { name: "Fischart suchen" });

    await user.type(search, "Perca fluviatilis");

    expect(screen.getByRole("button", { name: "Egli Steckbrief öffnen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hecht Steckbrief öffnen" })).not.toBeInTheDocument();
    expect(screen.getByText("1 von 36 Arten")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fischsuche leeren" }));
    await user.click(screen.getByRole("button", { name: "Geschützte Arten" }));

    expect(screen.getByRole("button", { name: "Äsche Steckbrief öffnen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Egli Steckbrief öffnen" })).not.toBeInTheDocument();
    expect(screen.getByText("3 von 36 Arten")).toBeInTheDocument();
  });

  it("opens the lakes tab with collapsed lake details and source links", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Seen" }));

    expect(screen.getByRole("button", { name: "Seen" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Seen" })).toBeInTheDocument();
    expect(screen.getByText("38 Seen")).toBeInTheDocument();
    const lakeDirectory = screen.getByLabelText("Schweizer Seen");
    expect(lakeDirectory).toHaveTextContent("Zürichsee");
    expect(lakeDirectory).toHaveTextContent("Lac Léman");
    expect(lakeDirectory).toHaveTextContent("Patent prüfen");

    const lemanButton = within(lakeDirectory).getByRole("button", { name: "Lac Léman Seeinfos öffnen" });
    expect(lemanButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("heading", { name: "Patente / Lizenzen kaufen" })).not.toBeInTheDocument();

    await user.click(lemanButton);

    expect(within(lakeDirectory).getByRole("button", { name: "Lac Léman Seeinfos schliessen" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("heading", { name: "Patent und Geräte" })).toBeInTheDocument();
    expect(screen.getByText("Ohne Patent")).toBeInTheDocument();
    expect(screen.getByText("Uferpatent")).toBeInTheDocument();
    expect(screen.getByText("Boot / stehend")).toBeInTheDocument();
    expect(screen.getByText("Schleppangeln")).toBeInTheDocument();
    expect(screen.getByText(/Schweizer Ufer: 1 schwimmende Angel/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Amtliche Detailregeln" })).toBeInTheDocument();
    expect(screen.getByText(/International geregelter Genfersee/i)).toBeInTheDocument();
    expect(screen.getByText(/35 cm · Fangzeit bis 04.10/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Patente / Lizenzen kaufen" })).toBeInTheDocument();
    expect(screen.getAllByText("Permis de pêche").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Commander un permis de pêche/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Commande en ligne - Permis de pêche ePêche/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Vor dem Auswerfen prüfen")).toBeInTheDocument();
    expect(screen.getByText("Datenquellen")).toBeInTheDocument();
    expect(screen.getAllByText("List of lakes of Switzerland").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Wikidata-Koordinaten Schweizer Seen").length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Fischerkenner" })).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });

  it("finds a lake and opens it directly on the map", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Seen" }));
    await user.type(screen.getByRole("searchbox", { name: "See oder Region suchen" }), "Zürichsee");

    const lakeDirectory = screen.getByLabelText("Schweizer Seen");
    expect(within(lakeDirectory).getByRole("button", { name: "Zürichsee Seeinfos öffnen" })).toBeInTheDocument();
    expect(within(lakeDirectory).queryByRole("button", { name: "Bodensee Seeinfos öffnen" })).not.toBeInTheDocument();

    await user.click(within(lakeDirectory).getByRole("button", { name: "Zürichsee Seeinfos öffnen" }));
    await user.click(screen.getByRole("button", { name: "Auf Karte zeigen" }));

    expect(screen.getByRole("button", { name: "Karte" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByRole("dialog", { name: "Zürichsee Detailregeln" })).toBeInTheDocument();
  });

  it("opens a lake from the map search", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole("searchbox", { name: "See auf der Karte suchen" }), "Greifen");
    const matches = screen.getByLabelText("Gefundene Seen");
    await user.click(within(matches).getByRole("button", { name: /Greifensee/i }));

    expect(await screen.findByRole("dialog", { name: "Greifensee Detailregeln" })).toBeInTheDocument();
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
