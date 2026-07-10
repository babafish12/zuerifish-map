import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Search, X } from "lucide-react";
import { FishCatchGuidanceBox } from "./FishCatchGuidanceBox";
import { PageIntro } from "./PageIntro";
import { FISH_PROFILE_GROUP_ORDER, getFishProfileDetails } from "../data/fish-profile-details";
import { fishProfiles } from "../lib/data";
import type { FishProfile, FishProfileCategoryGroup, FishProfileDetail, FishProfileLongSection, LakeId } from "../types";

const LAKE_OCCURRENCE_LABELS: Array<{ id: LakeId; label: string }> = [
  { id: "zuerichsee", label: "Zürichsee" },
  { id: "greifensee", label: "Greifensee" },
  { id: "pfaeffikersee", label: "Pfäffikersee" }
];

type FishGroupFilter = FishProfileCategoryGroup | "Alle";

function normalizeSearchValue(value: string) {
  return value
    .toLocaleLowerCase("de-CH")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function FishProfilesView() {
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<FishGroupFilter>("Alle");
  const filteredProfiles = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);

    return fishProfiles.filter((profile) => {
      const details = getFishProfileDetails(profile);
      const matchesGroup = groupFilter === "Alle" || details.categoryGroup === groupFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeSearchValue(`${profile.name} ${profile.scientificName} ${profile.category} ${details.categoryGroup}`).includes(normalizedQuery);

      return matchesGroup && matchesQuery;
    });
  }, [groupFilter, query]);
  const profilesByGroup = useMemo(() => {
    return filteredProfiles.reduce<Record<FishProfileCategoryGroup, Array<{ profile: FishProfile; details: FishProfileDetail }>>>(
      (groups, profile) => {
        const details = getFishProfileDetails(profile);
        groups[details.categoryGroup].push({ profile, details });
        return groups;
      },
      {
        Salmoniden: [],
        Raubfische: [],
        Friedfische: [],
        Kleinfische: [],
        "Geschützte Arten": [],
        "Landesfremde Arten": []
      }
    );
  }, [filteredProfiles]);

  return (
    <main id="app-main" className="app-page fish-directory" aria-labelledby="fish-directory-title">
      <PageIntro
        id="fish-directory-title"
        eyebrow="Artenbuch"
        title="Fische"
        description="Erkennen, Fangstatus prüfen und den passenden Steckbrief direkt am Wasser öffnen."
        stat={`${fishProfiles.length} Arten`}
      />

      <section className="page-tools" aria-label="Fischliste filtern">
        <div className="search-control">
          <Search size={19} aria-hidden="true" />
          <label className="sr-only" htmlFor="fish-directory-search">
            Fischart suchen
          </label>
          <input
            id="fish-directory-search"
            type="search"
            value={query}
            placeholder="Name oder wissenschaftliche Art"
            aria-label="Fischart suchen"
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          {query ? (
            <button type="button" aria-label="Fischsuche leeren" onClick={() => setQuery("")}>
              <X size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="filter-chip-row" role="group" aria-label="Artengruppe filtern">
          {(["Alle", ...FISH_PROFILE_GROUP_ORDER] as FishGroupFilter[]).map((group) => (
            <button
              key={group}
              type="button"
              className={groupFilter === group ? "filter-chip active" : "filter-chip"}
              aria-pressed={groupFilter === group}
              onClick={() => setGroupFilter(group)}
            >
              {group}
            </button>
          ))}
        </div>

        <p className="filter-result" aria-live="polite">
          {filteredProfiles.length === fishProfiles.length
            ? "Alle Arten sichtbar"
            : `${filteredProfiles.length} von ${fishProfiles.length} Arten`}
        </p>
      </section>

      {filteredProfiles.length > 0 ? (
        <div className="profile-groups">
          {FISH_PROFILE_GROUP_ORDER.map((group, groupIndex) => {
            const entries = profilesByGroup[group];
            const groupId = `fish-group-${groupIndex}`;

            if (entries.length === 0) {
              return null;
            }

            return (
              <section key={group} className="profile-group" aria-labelledby={groupId}>
                <div className="profile-group-heading">
                  <h3 id={groupId}>{group}</h3>
                  <span>{entries.length === 1 ? "1 Art" : `${entries.length} Arten`}</span>
                </div>

                <div className="profile-list">
                  {entries.map(({ profile, details }) => (
                    <FishProfileCard
                      key={profile.id}
                      profile={profile}
                      details={details}
                      isExpanded={expandedProfileId === profile.id}
                      onToggle={() => setExpandedProfileId((currentId) => (currentId === profile.id ? null : profile.id))}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="search-empty-state" aria-live="polite">
          <Search size={24} aria-hidden="true" />
          <h3>Kein Fisch gefunden</h3>
          <p>Versuche einen anderen Namen oder wähle wieder „Alle“.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setGroupFilter("Alle");
            }}
          >
            Filter zurücksetzen
          </button>
        </section>
      )}
    </main>
  );
}

function FishProfileCard({
  profile,
  details,
  isExpanded,
  onToggle
}: {
  profile: FishProfile;
  details: FishProfileDetail;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const detailId = `fish-profile-${profile.id}`;

  return (
    <article className={isExpanded ? "profile-card expanded" : "profile-card"}>
      <button
        type="button"
        className="profile-summary"
        aria-expanded={isExpanded}
        aria-controls={detailId}
        aria-label={`${profile.name} Steckbrief ${isExpanded ? "schliessen" : "öffnen"}`}
        onClick={onToggle}
      >
        <span className="profile-thumb">
          <img src={profile.image.src} alt="" loading="lazy" />
        </span>
        <span className="profile-summary-text">
          <strong>{profile.name}</strong>
          <span>{profile.category}</span>
        </span>
        <ChevronDown className="profile-chevron" size={18} aria-hidden="true" />
      </button>

      {isExpanded ? (
        <div className="profile-detail" id={detailId}>
          <div className="profile-hero">
            <div className="profile-hero-image">
              <img src={details.photo.src} alt={details.photo.alt} loading="lazy" />
              <PhotoCredit details={details} />
            </div>
            <div className="profile-hero-copy">
              <div className="profile-title">
                <div>
                  <h3>{profile.name}</h3>
                  <p>{profile.scientificName}</p>
                </div>
                <span>{details.categoryGroup}</span>
              </div>
              <p>{details.portrait}</p>
              <FishCatchGuidanceBox guidance={details.catchGuidance} />
            </div>
          </div>

          <div className="profile-long-layout">
            <section className="profile-occurrence" aria-label={`${profile.name} Vorkommen`}>
              <h4>Vorkommen</h4>
              <dl>
                {LAKE_OCCURRENCE_LABELS.map((lake) => (
                  <div key={lake.id}>
                    <dt>{lake.label}</dt>
                    <dd>{profile.occurrence[lake.id] ?? "nicht erfasst"}</dd>
                  </div>
                ))}
              </dl>
              <p>{profile.note}</p>
            </section>
            <div className="profile-longform" aria-label={`${profile.name} detaillierter Steckbrief`}>
              {details.longSections.map((section) => (
                <LongProfileSection key={section.title} section={section} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function PhotoCredit({ details }: { details: FishProfileDetail }) {
  return (
    <a className="profile-photo-credit" href={details.photo.sourceUrl} target="_blank" rel="noreferrer">
      <ExternalLink size={13} aria-hidden="true" />
      <span>
        Foto: {details.photo.attribution} · {details.photo.license}
      </span>
    </a>
  );
}

function LongProfileSection({ section }: { section: FishProfileLongSection }) {
  return (
    <section className="profile-long-section" aria-label={section.title}>
      <h4>{section.title}</h4>
      <p>{section.body}</p>
      <ul>
        {section.points.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </section>
  );
}
