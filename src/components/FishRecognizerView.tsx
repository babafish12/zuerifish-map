import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Globe2, Search, ShieldCheck, X } from "lucide-react";
import { getFishProfileDetails } from "../data/fish-profile-details";
import { fishProfiles } from "../lib/data";
import type { FishProfile, FishProfileDetail, LakeId } from "../types";

const ONLINE_FISH_RECOGNIZER_URL = "https://www.fisch-finder.de/";
const EMBEDDED_RECOGNIZER_RESULT_MESSAGE_TYPE = "zuerifish:fischfinder-result";
const FISH_RECOGNIZER_TEST_DOCUMENT = `<!doctype html><html lang="de"><head><title>FischFinder Test</title></head><body><main>FischFinder eingebettet</main></body></html>`;

const PRIMARY_REFERENCE_IDS = [
  "egli",
  "hecht",
  "bachforelle",
  "seeforelle",
  "felchen",
  "zander",
  "aesche",
  "karpfen",
  "rotauge",
  "rotfeder",
  "schleie",
  "truesche"
];

const FISH_MATCH_ALIASES: Record<string, string[]> = {
  aesche: ["äsche", "grayling", "european grayling"],
  alet: ["doebel", "döbel", "chub", "squalius cephalus"],
  bachforelle: ["brown trout", "salmo trutta fario"],
  bachsaibling: ["brook trout", "brook char"],
  barbe: ["barbel"],
  brachsmen: ["brasse", "brachse", "bream", "common bream"],
  egli: ["flussbarsch", "barsch", "european perch", "perch"],
  felchen: ["renke", "coregonus", "whitefish"],
  hecht: ["pike", "northern pike"],
  karpfen: ["common carp", "carp"],
  rotauge: ["plötze", "ploetze", "roach", "rutilus rutilus"],
  rotfeder: ["rudd", "scardinius erythrophthalmus"],
  schleie: ["tench"],
  seeforelle: ["lake trout", "salmo trutta lacustris"],
  seesaiblinge: ["seesaibling", "arctic char", "salvelinus alpinus"],
  wels: ["waller", "silurus glanis", "catfish"],
  zander: ["sander", "pike-perch", "pike perch"]
};

const LAKE_OCCURRENCE_LABELS: Array<{ id: LakeId; label: string }> = [
  { id: "zuerichsee", label: "Zürichsee" },
  { id: "greifensee", label: "Greifensee" },
  { id: "pfaeffikersee", label: "Pfäffikersee" }
];

export function FishRecognizerView() {
  const [selectedReferenceId, setSelectedReferenceId] = useState("");
  const [referenceQuery, setReferenceQuery] = useState("");
  const [openReferenceProfileId, setOpenReferenceProfileId] = useState<string | null>(null);
  const referenceProfiles = useMemo(() => orderReferenceProfiles(fishProfiles), []);
  const visibleReferenceProfiles = useMemo(() => matchReferenceProfiles(referenceProfiles, referenceQuery), [referenceProfiles, referenceQuery]);
  const selectedReferenceProfile = referenceProfiles.find((profile) => profile.id === selectedReferenceId) ?? null;
  const selectedReferenceDetails = selectedReferenceProfile ? getFishProfileDetails(selectedReferenceProfile) : null;
  const openReferenceProfile = referenceProfiles.find((profile) => profile.id === openReferenceProfileId) ?? null;
  const openReferenceDetails = openReferenceProfile ? getFishProfileDetails(openReferenceProfile) : null;

  const selectReferenceProfile = useCallback((profileId: string) => {
    setSelectedReferenceId(profileId);
    setOpenReferenceProfileId(profileId);
  }, []);

  const handleRecognizerResult = useCallback(
    (resultText: string) => {
      setReferenceQuery(resultText);
      const matchedProfile = matchReferenceProfiles(referenceProfiles, resultText)[0];

      if (matchedProfile) {
        selectReferenceProfile(matchedProfile.id);
      }
    },
    [referenceProfiles, selectReferenceProfile]
  );

  return (
    <main className="app-page fish-recognizer-view" aria-labelledby="fish-recognizer-page-title">
      <header className="page-heading">
        <div>
          <h2 id="fish-recognizer-page-title">Fischerkenner</h2>
          <p>FischFinder mit direktem Abgleich gegen die ZüriFish-Steckbriefe.</p>
        </div>
        <strong>Online-Erkenner</strong>
      </header>

      <FishOnlineRecognizer
        visibleProfiles={visibleReferenceProfiles}
        selectedProfile={selectedReferenceProfile}
        selectedDetails={selectedReferenceDetails}
        selectedReferenceId={selectedReferenceId}
        onSelectedReferenceIdChange={selectReferenceProfile}
        referenceQuery={referenceQuery}
        onReferenceQueryChange={setReferenceQuery}
        onRecognizerResult={handleRecognizerResult}
      />

      {openReferenceProfile && openReferenceDetails ? (
        <FishProfileDialog profile={openReferenceProfile} details={openReferenceDetails} onClose={() => setOpenReferenceProfileId(null)} />
      ) : null}
    </main>
  );
}

function FishOnlineRecognizer({
  visibleProfiles,
  selectedProfile,
  selectedDetails,
  selectedReferenceId,
  onSelectedReferenceIdChange,
  referenceQuery,
  onReferenceQueryChange,
  onRecognizerResult
}: {
  visibleProfiles: FishProfile[];
  selectedProfile: FishProfile | null;
  selectedDetails: FishProfileDetail | null;
  selectedReferenceId: string;
  onSelectedReferenceIdChange: (profileId: string) => void;
  referenceQuery: string;
  onReferenceQueryChange: (query: string) => void;
  onRecognizerResult: (resultText: string) => void;
}) {
  const recognizerFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [recognizerDocument, setRecognizerDocument] = useState(() => buildRecognizerStatusDocument("FischFinder wird eingebettet geladen."));
  const [recognizerState, setRecognizerState] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    let isCurrent = true;

    if (import.meta.env.MODE === "test") {
      setRecognizerDocument(prepareEmbeddedRecognizerDocument(FISH_RECOGNIZER_TEST_DOCUMENT));
      setRecognizerState("ready");
      return () => {
        isCurrent = false;
      };
    }

    fetch(ONLINE_FISH_RECOGNIZER_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`FischFinder responded with ${response.status}`);
        }
        return response.text();
      })
      .then((html) => {
        if (isCurrent) {
          setRecognizerDocument(prepareEmbeddedRecognizerDocument(html));
          setRecognizerState("ready");
        }
      })
      .catch(() => {
        if (isCurrent) {
          setRecognizerDocument(buildRecognizerStatusDocument("FischFinder konnte nicht eingebettet geladen werden."));
          setRecognizerState("fallback");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    function handleRecognizerMessage(event: MessageEvent) {
      if (event.source && event.source !== recognizerFrameRef.current?.contentWindow && event.source !== window) {
        return;
      }

      if (!isEmbeddedRecognizerResultMessage(event.data)) {
        return;
      }

      onRecognizerResult(event.data.resultText);
    }

    window.addEventListener("message", handleRecognizerMessage);
    return () => window.removeEventListener("message", handleRecognizerMessage);
  }, [onRecognizerResult]);

  return (
    <section className="recognizer-page" aria-labelledby="fish-recognizer-tool-title">
      <div className="recognizer-heading">
        <div>
          <p className="recognizer-kicker">Online-Erkenner</p>
          <h3 id="fish-recognizer-tool-title">Fisch per Foto bestimmen</h3>
          <p>Deutschsprachiger FischFinder direkt in ZüriFish, ohne API-Key und ohne lokale KI.</p>
        </div>
        <div className="recognizer-model-pill" aria-label="Erkenner-Eigenschaften">
          <span>
            <Globe2 size={15} aria-hidden="true" />
            Online
          </span>
          <span>
            <BadgeCheck size={15} aria-hidden="true" />
            Deutsch
          </span>
          <span>
            <ShieldCheck size={15} aria-hidden="true" />
            Keine API-Konfig
          </span>
        </div>
      </div>

      <div className="recognizer-shell">
        <div className="recognizer-embed">
          <div className="recognizer-toolbar">
            <div className="recognizer-provider">
              <strong>FischFinder eingebettet</strong>
              <span>Automatische Bestimmung mit ZüriFish-Steckbrief-Popup</span>
            </div>
            <span className="recognizer-frame-status">
              {recognizerState === "ready" ? "Auto-Zuweisung aktiv" : recognizerState === "fallback" ? "Fallback aktiv" : "Lädt"}
            </span>
          </div>

          <div className="recognizer-embed-wrap">
            <iframe
              ref={recognizerFrameRef}
              className="recognizer-online-frame"
              title="FischFinder Online-Erkenner"
              srcDoc={recognizerDocument}
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-forms allow-scripts"
              allow="camera; fullscreen"
            />
          </div>
        </div>

        <aside className="recognizer-reference" aria-labelledby="fish-reference-title">
          <div className="recognizer-reference-heading">
            <p className="recognizer-kicker">ZüriFish-Abgleich</p>
            <h4 id="fish-reference-title">Fischart in der App</h4>
          </div>

          <label className="recognizer-match-label" htmlFor="fish-reference-search">
            FischFinder-Ergebnis oder Artname
          </label>
          <div className="recognizer-search">
            <Search size={16} aria-hidden="true" />
            <input
              id="fish-reference-search"
              type="search"
              value={referenceQuery}
              placeholder="z.B. Fischart: Flussbarsch"
              onChange={(event) => onReferenceQueryChange(event.currentTarget.value)}
            />
          </div>

          {referenceQuery.trim() && visibleProfiles.length > 0 ? (
            <button
              type="button"
              className="recognizer-best-match"
              onClick={() => onSelectedReferenceIdChange(visibleProfiles[0].id)}
            >
              <span>Bester ZüriFish-Treffer</span>
              <strong>{visibleProfiles[0].name}</strong>
              <small>Steckbrief-Popup öffnen</small>
            </button>
          ) : null}

          <div className="recognizer-reference-results" aria-label="Fischarten direkt in der App">
            {visibleProfiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className={profile.id === selectedReferenceId ? "recognizer-reference-option active" : "recognizer-reference-option"}
                aria-pressed={profile.id === selectedReferenceId}
                aria-label={`${profile.name} ${profile.scientificName} Steckbrief-Popup öffnen`}
                onClick={() => onSelectedReferenceIdChange(profile.id)}
              >
                <strong>{profile.name}</strong>
                <span>{profile.scientificName}</span>
              </button>
            ))}
          </div>

          {selectedProfile && selectedDetails ? (
            <article className="recognizer-reference-card">
              <div className="recognizer-reference-image">
                <img src={selectedProfile.image.src} alt={selectedProfile.image.alt} loading="lazy" />
              </div>
              <div className="recognizer-reference-copy">
                <div className="recognizer-reference-title">
                  <div>
                    <h5>{selectedProfile.name}</h5>
                    <p>{selectedProfile.scientificName}</p>
                  </div>
                  <span>{selectedDetails.categoryGroup}</span>
                </div>
                <p>{selectedDetails.portrait}</p>
                <dl className="recognizer-reference-lakes" aria-label={`${selectedProfile.name} Vorkommen`}>
                  {LAKE_OCCURRENCE_LABELS.map((lake) => (
                    <div key={lake.id}>
                      <dt>{lake.label}</dt>
                      <dd>{selectedProfile.occurrence[lake.id]}</dd>
                    </div>
                  ))}
                </dl>
                <p className="recognizer-reference-note">{selectedProfile.note}</p>
                <div className="recognizer-reference-facts">
                  <ProfileFact title="Erkennen" values={selectedDetails.identification.slice(0, 3)} />
                  <ProfileFact title="Wo suchen" values={selectedDetails.habitats.slice(0, 3)} />
                </div>
              </div>
            </article>
          ) : (
            <p className="recognizer-disclaimer">
              Nach der FischFinder-Erkennung öffnet ZüriFish den passenden App-Steckbrief automatisch. Das Feld bleibt als
              manueller Fallback für Ergebnistext oder Artnamen.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function prepareEmbeddedRecognizerDocument(html: string) {
  const withHeadInjects = html.replace(
    /<head([^>]*)>/i,
    `<head$1>${FISH_RECOGNIZER_BASE_TAG}${FISH_RECOGNIZER_EMBED_STYLE}${FISH_RECOGNIZER_STORAGE_SHIM}`
  );

  const withResultHook = withHeadInjects.replace(/<script\s+src=["']app\.js["']><\/script>/i, (scriptTag) => {
    return `${scriptTag}${buildRecognizerResultHookScript()}`;
  });

  if (withResultHook === withHeadInjects) {
    return withHeadInjects.replace(/<\/body>/i, `${buildRecognizerResultHookScript()}</body>`);
  }

  return withResultHook;
}

const FISH_RECOGNIZER_BASE_TAG = `<base href="${ONLINE_FISH_RECOGNIZER_URL}" target="_self">`;
const FISH_RECOGNIZER_EMBED_STYLE = `<style>
  html, body { min-height: 100%; }
  body { margin: 0 !important; }
  .container { width: min(100%, 980px) !important; max-width: 980px !important; padding: 12px !important; }
  .header, .section, .profile-page { border-radius: 8px !important; }
  .header { margin-bottom: 14px !important; }
  .section { margin-bottom: 14px !important; }
  .footer { padding-bottom: 24px !important; }
</style>`;
const FISH_RECOGNIZER_STORAGE_SHIM = `<script>
  (function () {
    var store = {};
    try {
      var testKey = "__zuerifish_storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
    } catch (error) {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
          getItem: function (key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
          setItem: function (key, value) { store[key] = String(value); },
          removeItem: function (key) { delete store[key]; },
          clear: function () { store = {}; }
        }
      });
    }
  })();
</script>`;

function buildRecognizerResultHookScript() {
  const targetOrigin = getParentMessageTargetOrigin();

  return `<script>
  (function () {
    var messageType = ${JSON.stringify(EMBEDDED_RECOGNIZER_RESULT_MESSAGE_TYPE)};
    var targetOrigin = ${JSON.stringify(targetOrigin)};

    function publishResult(resultText) {
      try {
        window.parent.postMessage({ type: messageType, resultText: String(resultText || "") }, targetOrigin);
      } catch (error) {
        // ZüriFish listens opportunistically; recognition itself must still work if forwarding fails.
      }
    }

    function patchRecognizer() {
      try {
        if (typeof FischFinder === "undefined" || !FischFinder.prototype || FischFinder.prototype.__zuerifishPatched) {
          return false;
        }

        var originalDisplayResults = FischFinder.prototype.displayResults;
        FischFinder.prototype.displayResults = function (resultText) {
          var returnValue = originalDisplayResults.apply(this, arguments);
          publishResult(resultText);
          return returnValue;
        };
        FischFinder.prototype.__zuerifishPatched = true;
        return true;
      } catch (error) {
        return false;
      }
    }

    if (!patchRecognizer()) {
      document.addEventListener("DOMContentLoaded", patchRecognizer);
      window.setTimeout(patchRecognizer, 0);
    }
  })();
</script>`;
}

function getParentMessageTargetOrigin() {
  if (typeof window === "undefined" || window.location.origin === "null") {
    return "*";
  }

  return window.location.origin;
}

function buildRecognizerStatusDocument(message: string) {
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <style>
      body {
        display: grid;
        min-height: 100vh;
        place-items: center;
        margin: 0;
        color: #24434c;
        background: #f7fbfa;
        font: 700 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
    </style>
  </head>
  <body>
    <p>${message}</p>
  </body>
</html>`;
}

function isEmbeddedRecognizerResultMessage(value: unknown): value is { type: string; resultText: string } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return payload.type === EMBEDDED_RECOGNIZER_RESULT_MESSAGE_TYPE && typeof payload.resultText === "string";
}

function FishProfileDialog({ profile, details, onClose }: { profile: FishProfile; details: FishProfileDetail; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="recognizer-dialog-layer" role="presentation" onMouseDown={onClose}>
      <article
        className="recognizer-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recognizer-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="recognizer-dialog-close" aria-label="Steckbrief-Popup schliessen" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>

        <div className="recognizer-dialog-hero">
          <div className="recognizer-dialog-image">
            <img src={profile.image.src} alt={profile.image.alt} loading="lazy" />
          </div>
          <div className="recognizer-dialog-copy">
            <p className="recognizer-kicker">ZüriFish-Steckbrief</p>
            <h3 id="recognizer-dialog-title">{profile.name} Steckbrief</h3>
            <p className="recognizer-dialog-scientific">{profile.scientificName}</p>
            <span>{details.categoryGroup}</span>
            <p>{details.portrait}</p>
          </div>
        </div>

        <dl className="recognizer-reference-lakes" aria-label={`${profile.name} Vorkommen im Steckbrief-Popup`}>
          {LAKE_OCCURRENCE_LABELS.map((lake) => (
            <div key={lake.id}>
              <dt>{lake.label}</dt>
              <dd>{profile.occurrence[lake.id]}</dd>
            </div>
          ))}
        </dl>
        <p className="recognizer-reference-note">{profile.note}</p>
        <div className="recognizer-reference-facts">
          <ProfileFact title="Erkennen" values={details.identification} />
          <ProfileFact title="Wo suchen" values={details.habitats} />
          <ProfileFact title="Fangen" values={details.catchingTips} />
          <ProfileFact title="Küche" values={[details.eatingNote]} />
        </div>
      </article>
    </div>
  );
}

function orderReferenceProfiles(profiles: FishProfile[]) {
  const primaryOrder = new Map(PRIMARY_REFERENCE_IDS.map((id, index) => [id, index]));

  return [...profiles].sort((firstProfile, secondProfile) => {
    const firstIndex = primaryOrder.get(firstProfile.id) ?? Number.POSITIVE_INFINITY;
    const secondIndex = primaryOrder.get(secondProfile.id) ?? Number.POSITIVE_INFINITY;

    if (firstIndex !== secondIndex) {
      return firstIndex - secondIndex;
    }

    return firstProfile.name.localeCompare(secondProfile.name, "de-CH");
  });
}

function matchReferenceProfiles(profiles: FishProfile[], query: string) {
  const normalizedQuery = normalizeFishSearch(query);

  if (!normalizedQuery) {
    return profiles;
  }

  return profiles
    .map((profile) => ({ profile, score: getReferenceMatchScore(profile, normalizedQuery) }))
    .filter((match) => match.score > 0)
    .sort((firstMatch, secondMatch) => secondMatch.score - firstMatch.score || firstMatch.profile.name.localeCompare(secondMatch.profile.name, "de-CH"))
    .map((match) => match.profile);
}

function getReferenceMatchScore(profile: FishProfile, normalizedQuery: string) {
  const terms = getFishSearchTerms(profile);
  const haystack = normalizeFishSearch(`${profile.name} ${profile.scientificName} ${profile.category} ${terms.join(" ")}`);

  if (haystack.includes(normalizedQuery)) {
    return normalizedQuery.length >= 4 ? 6 : 3;
  }

  return terms.reduce((score, term) => {
    const normalizedTerm = normalizeFishSearch(term);

    if (!normalizedTerm) {
      return score;
    }

    if (normalizedQuery.includes(normalizedTerm)) {
      return Math.max(score, normalizedTerm === normalizeFishSearch(profile.name) ? 10 : 8);
    }

    return score;
  }, 0);
}

function getFishSearchTerms(profile: FishProfile) {
  return [profile.name, profile.scientificName, profile.category, ...(FISH_MATCH_ALIASES[profile.id] ?? [])];
}

function normalizeFishSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function ProfileFact({ title, values }: { title: string; values: string[] }) {
  return (
    <section className="profile-fact" aria-label={title}>
      <h4>{title}</h4>
      <ul>
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </section>
  );
}
