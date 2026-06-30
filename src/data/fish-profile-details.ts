import type { FishProfile, FishProfileCategoryGroup, FishProfileDetail } from "../types";

export const FISH_PROFILE_GROUP_ORDER: FishProfileCategoryGroup[] = [
  "Salmoniden",
  "Raubfische",
  "Friedfische",
  "Kleinfische",
  "Geschützte Arten",
  "Landesfremde Arten"
];

const GROUP_BY_ID: Record<string, FishProfileCategoryGroup> = {
  bachforelle: "Salmoniden",
  seeforelle: "Salmoniden",
  seesaiblinge: "Salmoniden",
  hecht: "Raubfische",
  egli: "Raubfische",
  zander: "Raubfische",
  wels: "Raubfische",
  truesche: "Raubfische",
  rapfen: "Raubfische",
  karpfen: "Friedfische",
  brachsmen: "Friedfische",
  alet: "Friedfische",
  barbe: "Friedfische",
  schleie: "Friedfische",
  rotfeder: "Friedfische",
  rotauge: "Friedfische",
  gruendling: "Friedfische",
  hasel: "Friedfische",
  laube: "Friedfische",
  bachschmerle: "Kleinfische",
  elritze: "Kleinfische",
  groppe: "Kleinfische",
  kaulbarsch: "Kleinfische",
  schneider: "Kleinfische",
  stichling: "Kleinfische",
  stroemer: "Kleinfische",
  aesche: "Geschützte Arten",
  nase: "Geschützte Arten",
  aal: "Geschützte Arten",
  regenbogenforelle: "Landesfremde Arten",
  bachsaibling: "Landesfremde Arten",
  "kanadischer-seesaibling": "Landesfremde Arten",
  forellenbarsch: "Landesfremde Arten",
  katzenwels: "Landesfremde Arten",
  sonnenbarsch: "Landesfremde Arten"
};

const DEFAULT_DETAILS: Record<FishProfileCategoryGroup, FishProfileDetail> = {
  Salmoniden: {
    categoryGroup: "Salmoniden",
    portrait: "Kuehlwasserfische mit hoher Sauerstoffbindung. In Seen sind sie oft mobil, saisonal tief und reagieren stark auf Temperatur, Licht und Zufluesse.",
    identification: ["Schlanker, torpedoförmiger Koerper.", "Fettflosse zwischen Ruecken- und Schwanzflosse.", "Punkt- oder Marmorzeichnung je nach Art und Alter."],
    habitats: ["Kuehle, sauerstoffreiche Bereiche; im See oft tiefer oder nahe Zufluessen.", "Ufer- und Mündungsbereiche sind besonders in kuehlen Phasen interessant."],
    catchingTips: ["Feine Spinn- oder Schleppmontagen und ruhige Koederfuehrung funktionieren meist besser als lautes Suchen.", "Schonzeiten und Mindestmass sind bei Salmoniden besonders wichtig."],
    eatingNote: "Sehr guter Speisefisch; schlicht gebraten, gedämpft oder im Ofen mit Kraeutern zubereiten."
  },
  Raubfische: {
    categoryGroup: "Raubfische",
    portrait: "Aktive Jaeger, die Kleinfischen folgen. Standplaetze wechseln mit Wind, Licht, Wassertemperatur und Futterfisch.",
    identification: ["Kräftiges Maul und klare Raubfisch-Silhouette.", "Oft harte Stachelflossen oder langgestreckter Koerper.", "Bissspuren und Aktivitaet zeigen sich haeufig nahe Kleinfischschwaermen."],
    habitats: ["Kanten, Krautfelder, Stege, Hafenbereiche und Übergänge zwischen flach und tief absuchen.", "Aktive Fische stehen oft dort, wo Kleinfischschwaerme ziehen."],
    catchingTips: ["Gummifisch, Spinner, Wobbler oder Köderfisch-Optiken langsam und sauber fuehren.", "Morgens, abends und bei Windkanten sind Raubfische oft leichter zu finden."],
    eatingNote: "Meist gute Speisefische; Filets eignen sich zum Braten, Backen oder fuer Fischknusperli."
  },
  Friedfische: {
    categoryGroup: "Friedfische",
    portrait: "Friedfische suchen Schnecken, Larven, Pflanzenreste oder Kleintiere am Grund und in Krautbereichen. Viele sind vorsichtig und reagieren auf Laerm am Ufer.",
    identification: ["Meist kleineres Maul ohne Raubfischzaehne.", "Koerperform von hochrueckig bis schlank.", "Schuppenbild, Flossenfarbe und Maulstellung helfen bei der Artbestimmung."],
    habitats: ["Ruhige Buchten, Krautgaertel, Häfen und warme Flachwasserzonen sind typische Standplaetze.", "Groessere Friedfische suchen oft Grundnahe Nahrung."],
    catchingTips: ["Posen- oder Grundmontage mit Mais, Wurm, Brot oder Teig ist naheliegend.", "Fein anfuettern, leise bleiben und Haken der Fischgroesse anpassen."],
    eatingNote: "Je nach Art gut verwertbar; wegen vielen Graeten eignen sich Einschneiden, Einlegen oder Fischfrikadellen oft besser als dicke Filets."
  },
  Kleinfische: {
    categoryGroup: "Kleinfische",
    portrait: "Kleine Arten zeigen viel ueber Wasserqualitaet, Uferstruktur und Laichplaetze. Fuer Angler sind sie meistens Beobachtungs- statt Entnahmearten.",
    identification: ["Kleine Koerpergroesse, oft in Schwärmen oder nahe Deckung.", "Artbestimmung ueber Maulstellung, Seitenlinie, Flossen und Muster.", "Viele Arten sind empfindlich gegen Trockenheit und grobe Handhabung."],
    habitats: ["Flache Ufer, Kies, Kraut, kleine Zufluesse und strukturreiche Randbereiche.", "Viele Kleinfische sind eher Beobachtungs- oder Ökologiearten als Zielfische."],
    catchingTips: ["Nicht als Hauptzielfisch behandeln; bei zufaelligem Fang schonend loesen und sofort zuruecksetzen, wenn keine sichere Entnahme vorgesehen ist."],
    eatingNote: "Fuer die Kueche meist nicht relevant; wichtiger ist die Rolle als Futterfisch und Bestandsanzeiger."
  },
  "Geschützte Arten": {
    categoryGroup: "Geschützte Arten",
    portrait: "Arten mit Schutzstatus oder sehr heiklen Bestaenden. Hier steht Erkennen, Schonung und schnelles Zuruecksetzen vor jeder Nutzung.",
    identification: ["Vor dem Angeln Schutzarten in der Region kennen.", "Bei unsicherer Bestimmung nicht entnehmen.", "Schonend im Wasser oder mit nassen Haenden behandeln."],
    habitats: ["Je nach Art Fliessgewässer, Zufluesse, Grundstrukturen oder seltene Restbestaende.", "Der Schutzstatus ist wichtiger als der Fangplatz."],
    catchingTips: ["Nicht gezielt befischen. Bei Beifang sofort schonend mit nassen Haenden zuruecksetzen."],
    eatingNote: "Nicht entnehmen und nicht zubereiten."
  },
  "Landesfremde Arten": {
    categoryGroup: "Landesfremde Arten",
    portrait: "Nicht heimische Arten oder Arten mit unsicherem Vorkommen in den drei Seen. Wichtig ist korrekte Bestimmung und kein Verschleppen in andere Gewaesser.",
    identification: ["Oft auffaellige Form oder Zeichnung gegenueber heimischen Arten.", "Verwechslung mit heimischen Arten moeglich.", "Nicht als lebenden Koeder oder Besatz weitertransportieren."],
    habitats: ["Vorkommen in den drei Zürcher Seen ist je nach Art unsicher, selten oder nicht bestaetigt.", "Nicht zwischen Gewaessern versetzen."],
    catchingTips: ["Keine gezielte Empfehlung fuer die drei Seen; bei Fang Einordnung und aktuelle Vorschriften beachten."],
    eatingNote: "Nur verwerten, wenn Entnahme erlaubt und Art sicher bestimmt ist."
  }
};

const DETAIL_OVERRIDES: Record<string, Partial<FishProfileDetail>> = {
  seeforelle: {
    portrait: "Die Seeforelle ist die wandernde Seeform der Forelle. Sie jagt im Freiwasser, kommt zum Fressen aber auch an Kanten, Ufernaehe und Zuflussbereiche.",
    identification: ["Silbrige Flanken mit dunklen Punkten.", "Schlanker Koerper und grosse Schwanzflosse.", "Im See meist heller und silbriger als typische Bachforellen."],
    habitats: ["Freie Wasserzonen, tiefe Kanten, Einläufe und kuehle Uferstrecken.", "Bei kuehlem Wasser naeher am Ufer, bei Waerme haeufig tiefer."],
    catchingTips: ["Vom Ufer bei kuehlem Wasser, Wind und Daemmerung suchen; vom Boot eher schleppend oder mit schlanken Koedern.", "Langsam, sauber und unauffaellig fuehren. Einzelne Kontakte sind wertvoller als viele schnelle Platzwechsel."],
    eatingNote: "Sehr hochwertiger Speisefisch; am besten schlicht als Filet, im Ofen oder leicht geraeuchert."
  },
  felchen: {
    portrait: "Felchen sind klassische Freiwasserfische. Sie ziehen in Schwärmen und fressen kleine Wasserorganismen, darum ist die richtige Tiefe entscheidend.",
    identification: ["Silbriger, seitlich abgeflachter Koerper.", "Kleines Maul, feine Schuppen, keine harte Raubfischform.", "Artgruppe Coregonus: lokale Formen koennen sehr aehnlich aussehen."],
    habitats: ["Offenes Wasser und tiefere, kuehle Schichten; Standtiefe aendert sich mit Jahreszeit und Temperatur.", "Schwaerme koennen schnell die Tiefe wechseln."],
    catchingTips: ["Hegenenfischen mit feiner Abstimmung auf Tiefe und Schwarmstand ist typisch.", "Kleine Nymphen, ruhige Fuehrung und saubere Bisserkennung sind wichtiger als grosse Koeder."],
    eatingNote: "Sehr guter, feiner Speisefisch; gebraten, blau, gedämpft oder als Filet besonders geeignet."
  },
  seesaiblinge: {
    habitats: ["Kalte, tiefe Bereiche des Zürichsees; laut Datengrundlage fuer die drei Seen nur dort relevant.", "Laichzeit und tiefe Standplaetze machen ihn stark saisonal."],
    catchingTips: ["Tief und fein fischen; kleine Nymphen, Hegenen oder schlanke Koeder sind plausibel.", "Schonzeit und Mindestmass sind zentral."],
    eatingNote: "Sehr guter Speisefisch mit feinem Fleisch; gebraten oder im Ofen nicht ueberwuerzen."
  },
  hecht: {
    portrait: "Der Hecht ist ein Standraeuber. Er wartet in Deckung und attackiert Beute explosiv, oft direkt an Kraut, Kanten oder Schatten.",
    identification: ["Sehr langgestreckter Koerper mit entenartigem Maul.", "Helle Flecken/Querzeichnung auf gruenlichem Grund.", "Ruecken- und Afterflosse sitzen weit hinten."],
    habitats: ["Krautkanten, Schilfnaehe, Stege, Buchten und flache Waermezonen mit Deckung.", "Groessere Fische stehen oft an Kanten zwischen Kraut und tieferem Wasser."],
    catchingTips: ["Grosse Spinner, Wobbler, Swimbaits oder Gummifische langsam an Strukturkanten fuehren.", "Stahl- oder Titanvorfach verwenden; Bisse kommen oft direkt an Deckung oder beim Stopp."],
    eatingNote: "Guter Speisefisch, aber graetenreich; Filetieren mit Y-Graeten-Schnitt, als Klösschen oder Fischburger sehr brauchbar."
  },
  egli: {
    portrait: "Egli sind neugierige Schwarmraeuber. Kleine und mittlere Fische jagen oft gemeinsam; groessere Exemplare stehen strukturbezogener und tiefer.",
    identification: ["Dunkle Querbänder, rote Bauch- und Afterflossen.", "Stachelige erste Rueckenflosse.", "Kompakter Koerper mit relativ grossem Maul."],
    habitats: ["Uferkanten, Häfen, Stege, Krautfelder und Schwarmbereiche mit Kleinfischen.", "Im Sommer oft flacher oder an Strukturen, im Winter eher tiefer und gruppiert."],
    catchingTips: ["Kleine Gummifische, Dropshot, Spinner oder Wurm an feinem Geraet; Schwarm suchen statt lange am leeren Platz bleiben.", "Bisse kommen oft in Phasen: nach einem Fang ruhig denselben Bereich weiter befischen."],
    eatingNote: "Sehr guter Speisefisch; Egli-Filets eignen sich klassisch gebraten, als Fischknusperli oder in Butter mit Zitrone."
  },
  zander: {
    portrait: "Zander sind lichtscheue Raubfische mit starkem Bezug zu Grund, Kanten und Daemmerung. Sie jagen oft unauffaelliger als Hecht oder Egli.",
    identification: ["Langgestreckter Koerper, Glasaugen und zwei Rueckenflossen.", "Dunkle Querbinden, spitze Zaehne.", "Maul groesser als beim Egli, aber Koerperform schlanker."],
    habitats: ["Trübere Bereiche, Kanten, Grundstrukturen, Häfen und tieferes Wasser mit Kleinfischnaehe.", "Daemmerung, Nacht und bedecktes Wetter sind oft besser als greller Mittag."],
    catchingTips: ["Gummifisch grundnah jiggen oder langsam fuehren; harte Grundkontakte und Pausen koennen entscheidend sein.", "Nicht zu hektisch fischen: kurze Spruenge, Pausen und Bodenkontakt bringen oft mehr."],
    eatingNote: "Sehr guter Speisefisch mit festen, graetenarmen Filets; braten, pochieren oder im Ofen."
  },
  karpfen: {
    portrait: "Karpfen sind vorsichtige, kraeftige Grundfische. Sie suchen Muscheln, Larven, Pflanzenreste und andere Nahrung am Boden.",
    identification: ["Hoher, kräftiger Koerper und Barteln am Maul.", "Saugmaul nach unten gerichtet.", "Schuppenbild je nach Form sehr unterschiedlich."],
    habitats: ["Warme, ruhige Buchten, Kraut, Schlammgrund und nahrungsreiche Uferzonen.", "Aktivitaet steigt meist mit waermerem Wasser."],
    catchingTips: ["Mais, Boilies, Teig oder Wurm am Grund; leise Montage und Geduld sind wichtiger als haeufiges Umwerfen.", "Schonend landen, weil grosse Karpfen kraeftig kaempfen."],
    eatingNote: "Kann gut sein, wenn sauber verarbeitet; wässern, filetieren, räuchern oder als Karpfenfilet mit kräftiger Wuerzung."
  },
  schleie: {
    habitats: ["Dichte Kraut- und Seerosenbereiche, weicher Grund, ruhige Uferzonen.", "Fruehmorgens und abends oft naeher am Ufer."],
    catchingTips: ["Feine Pose oder Grundmontage mit Wurm, Mais oder Brotflocke; sehr vorsichtig anschlagen.", "Nicht zu grob fischen, weil Schleien oft heikel beissen."],
    eatingNote: "Essbar und aromatisch; am besten frisch, gruendlich entschleimt und gebraten oder geschmort."
  },
  wels: {
    portrait: "Der Wels ist der groesste Raubfisch der Region. Er jagt grundnah, nutzt Deckung und wird bei Waerme und Dunkelheit aktiver.",
    identification: ["Breiter Kopf, grosses Maul und Barteln.", "Schuppenlose, glatte Haut.", "Sehr lange Afterflosse und kraeftiger Schwanzbereich."],
    habitats: ["Tiefe Loecher, Hafenstrukturen, Krautkanten und warme, nahrungsreiche Zonen.", "Vor allem groessere Seen und Nachtphasen sind interessant."],
    catchingTips: ["Kräftiges Geraet verwenden; groessere Koeder grundnah oder an Struktur anbieten.", "Nur gezielt befischen, wenn Landung, Betäubung und Verwertung realistisch sind."],
    eatingNote: "Junge bis mittlere Fische sind gut verwertbar; Filets braten, grillieren oder räuchern."
  },
  truesche: {
    portrait: "Die Trüsche ist ein bodennaher Kaltwasserfisch. Sie ist eher in kuehlen Phasen aktiv und wirkt beim Fang oft unscheinbar, ist kulinarisch aber spannend.",
    identification: ["Ein Bartfaden am Kinn.", "Marmorierte braun-gelbe Zeichnung.", "Weicher, langgezogener Koerper mit langen Flossen."],
    habitats: ["Kuehle, grundnahe Bereiche, Steinpackungen und tieferes Wasser.", "Oft eher in der kalten Jahreszeit interessant."],
    catchingTips: ["Wurm oder Fischfetzen grundnah anbieten; langsam und bodennah fischen.", "Dunkelheit und kaltes Wasser koennen helfen."],
    eatingNote: "Guter Speisefisch mit festem Fleisch; gebraten oder als Suppe/Trüschenfilet geeignet."
  },
  aal: {
    catchingTips: ["Nicht gezielt befischen; Aal ist geschuetzt und muss bei Beifang sofort zurueckgesetzt werden."],
    eatingNote: "Nicht entnehmen."
  },
  aesche: {
    catchingTips: ["Nicht gezielt befischen; im Kanton Zürich besteht ein Aeschenfangverbot."],
    eatingNote: "Nicht entnehmen."
  },
  nase: {
    catchingTips: ["Nicht gezielt befischen; geschuetzte Art bei Beifang sofort schonend zuruecksetzen."],
    eatingNote: "Nicht entnehmen."
  },
  sonnenbarsch: {
    catchingTips: ["Nicht versetzen und nicht als Koederfisch zwischen Gewaessern transportieren.", "Bei Fang aktuelle lokale Vorgaben beachten."],
    eatingNote: "Klein, kuechlich meist uninteressant."
  }
};

export function getFishProfileDetails(profile: FishProfile): FishProfileDetail {
  const categoryGroup = GROUP_BY_ID[profile.id] ?? groupFromCategory(profile.category);
  const defaults = DEFAULT_DETAILS[categoryGroup];
  const override = DETAIL_OVERRIDES[profile.id] ?? {};

  return {
    ...defaults,
    ...override,
    categoryGroup,
    portrait: override.portrait ?? defaults.portrait,
    identification: override.identification ?? defaults.identification,
    habitats: override.habitats ?? defaults.habitats,
    catchingTips: override.catchingTips ?? defaults.catchingTips,
    eatingNote: override.eatingNote ?? defaults.eatingNote
  };
}

function groupFromCategory(category: string): FishProfileCategoryGroup {
  const normalized = category.toLowerCase();

  if (normalized.includes("geschützt")) {
    return "Geschützte Arten";
  }

  if (normalized.includes("landesfremd")) {
    return "Landesfremde Arten";
  }

  if (normalized.includes("klein")) {
    return "Kleinfische";
  }

  if (normalized.includes("raub") || normalized.includes("barsch") || normalized.includes("räuber")) {
    return "Raubfische";
  }

  if (normalized.includes("forelle") || normalized.includes("saibling") || normalized.includes("kaltwasser")) {
    return "Salmoniden";
  }

  return "Friedfische";
}
