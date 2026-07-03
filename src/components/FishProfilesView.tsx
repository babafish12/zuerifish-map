import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FISH_PROFILE_GROUP_ORDER, getFishProfileDetails } from "../data/fish-profile-details";
import { fishProfiles } from "../lib/data";
import type { FishProfile, FishProfileCategoryGroup, FishProfileDetail, LakeId } from "../types";

const LAKE_OCCURRENCE_LABELS: Array<{ id: LakeId; label: string }> = [
  { id: "zuerichsee", label: "Zürichsee" },
  { id: "greifensee", label: "Greifensee" },
  { id: "pfaeffikersee", label: "Pfäffikersee" }
];

export function FishProfilesView() {
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const profilesByGroup = useMemo(() => {
    return fishProfiles.reduce<Record<FishProfileCategoryGroup, Array<{ profile: FishProfile; details: FishProfileDetail }>>>(
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
  }, []);

  return (
    <main className="app-page fish-directory" aria-labelledby="fish-directory-title">
      <header className="page-heading">
        <div>
          <h2 id="fish-directory-title">Fische</h2>
          <p>Kompakte Artenliste mit Steckbrief, Vorkommen, Fanghinweis und Küche.</p>
        </div>
        <strong>{fishProfiles.length} Arten</strong>
      </header>

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
                <span>{entries.length} Arten</span>
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
              <img src={profile.image.src} alt={profile.image.alt} loading="lazy" />
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
            </div>
          </div>

          <div className="profile-facts">
            <section className="profile-occurrence" aria-label={`${profile.name} Vorkommen`}>
              <h4>Vorkommen</h4>
              <dl>
                {LAKE_OCCURRENCE_LABELS.map((lake) => (
                  <div key={lake.id}>
                    <dt>{lake.label}</dt>
                    <dd>{profile.occurrence[lake.id]}</dd>
                  </div>
                ))}
              </dl>
              <p>{profile.note}</p>
            </section>
            <ProfileFact title="Erkennen" values={details.identification} />
            <ProfileFact title="Wo suchen" values={details.habitats} />
            <ProfileFact title="Fangen" values={details.catchingTips} />
            <ProfileFact title="Küche" values={[details.eatingNote]} />
          </div>
        </div>
      ) : null}
    </article>
  );
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
