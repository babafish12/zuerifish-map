import type {
  FishCatchGuidance,
  FishProfile,
  FishProfileCategoryGroup,
  FishProfileDetail,
  FishProfileLongSection,
  FishProfilePhoto
} from "../types";

type BaseFishProfileDetail = Omit<FishProfileDetail, "photo" | "catchGuidance" | "longSections">;

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

const PHOTO_BY_ID: Record<string, FishProfilePhoto> = {
  bachforelle: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/34847723/medium.jpg",
    "https://www.inaturalist.org/taxa/47518",
    "kirk gardner",
    "CC BY",
    "Echtes Beispiel-Foto einer Bachforelle / Salmo trutta"
  ),
  seeforelle: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/34847723/medium.jpg",
    "https://www.inaturalist.org/taxa/47518",
    "kirk gardner",
    "CC BY",
    "Echtes Beispiel-Foto einer Seeforelle / Salmo trutta"
  ),
  regenbogenforelle: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/690417756/medium.jpg",
    "https://www.inaturalist.org/observations/377545145",
    "oly19",
    "CC BY-NC",
    "Echtes Foto einer Regenbogenforelle"
  ),
  seesaiblinge: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/48677186/medium.jpg",
    "https://www.inaturalist.org/taxa/111974",
    "Christa Rohrbach",
    "CC BY-NC-SA",
    "Echtes Foto eines Seesaiblings"
  ),
  bachsaibling: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/244460087/medium.jpg",
    "https://www.inaturalist.org/taxa/49596",
    "Cody Cromer",
    "CC BY-NC",
    "Echtes Foto eines Bachsaiblings"
  ),
  "kanadischer-seesaibling": photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/427764/medium.jpg",
    "https://www.inaturalist.org/taxa/111991",
    "Eric Engbretson",
    "Public Domain",
    "Echtes Foto eines Kanadischen Seesaiblings"
  ),
  aesche: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/682085/medium.jpg",
    "https://www.inaturalist.org/taxa/47513",
    "Gilles San Martin",
    "CC BY-SA",
    "Echtes Foto einer Aesche"
  ),
  felchen: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/269516751/medium.jpg",
    "https://www.inaturalist.org/taxa/98461",
    "Thomas Menut",
    "CC BY-NC",
    "Echtes Beispiel-Foto eines Felchens"
  ),
  karpfen: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/2754663/medium.JPG",
    "https://www.inaturalist.org/taxa/53911",
    "lonnyholmes",
    "CC BY-NC",
    "Echtes Foto eines Karpfens"
  ),
  brachsmen: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/170747213/medium.jpg",
    "https://www.inaturalist.org/taxa/92984",
    "Mikova Natalia",
    "Public Domain",
    "Echtes Foto eines Brachsmens"
  ),
  alet: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/4222775/medium.jpg",
    "https://www.inaturalist.org/taxa/113003",
    "Karelj",
    "Public Domain",
    "Echtes Foto eines Alets"
  ),
  rapfen: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/689576149/medium.jpg",
    "https://www.inaturalist.org/observations/377110499",
    "lukama",
    "CC BY-NC",
    "Echtes Foto eines Rapfens"
  ),
  barbe: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/51360/medium.jpg",
    "https://www.inaturalist.org/taxa/53893",
    "Bas Kers",
    "CC BY-NC-SA",
    "Echtes Foto einer Barbe"
  ),
  schleie: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/225783093/medium.jpg",
    "https://www.inaturalist.org/taxa/53898",
    "Susanne Spindler",
    "CC BY-NC-ND",
    "Echtes Foto einer Schleie"
  ),
  nase: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/105333791/medium.jpg",
    "https://www.inaturalist.org/taxa/97708",
    "Christa Rohrbach",
    "CC BY-NC-SA",
    "Echtes Foto einer Nase"
  ),
  rotfeder: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/351728711/medium.jpg",
    "https://www.inaturalist.org/taxa/112118",
    "Iidkk",
    "CC BY-SA",
    "Echtes Foto einer Rotfeder"
  ),
  rotauge: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/363198204/medium.jpg",
    "https://www.inaturalist.org/taxa/94045",
    "Joerg Freyhof",
    "CC BY-NC",
    "Echtes Foto eines Rotauges"
  ),
  hecht: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/486754787/medium.jpg",
    "https://www.inaturalist.org/taxa/55387",
    "Neil Ward",
    "CC BY-ND",
    "Echtes Foto eines Hechts"
  ),
  egli: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/194421912/medium.jpg",
    "https://www.inaturalist.org/taxa/109062",
    "Gilles San Martin",
    "CC BY-SA",
    "Echtes Foto eines Egli"
  ),
  forellenbarsch: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/689920321/medium.jpg",
    "https://www.inaturalist.org/observations/377290240",
    "hpoland2025",
    "CC BY-NC",
    "Echtes Foto eines Forellenbarschs"
  ),
  zander: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/689127125/medium.jpg",
    "https://www.inaturalist.org/observations/376879626",
    "Mikhail Yazykov",
    "CC BY",
    "Echtes Foto eines Zanders"
  ),
  wels: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/689142111/medium.jpg",
    "https://www.inaturalist.org/observations/376887065",
    "Benoit Segerer",
    "CC BY-NC",
    "Echtes Foto eines Welses"
  ),
  truesche: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/189028180/medium.jpg",
    "https://www.inaturalist.org/taxa/101591",
    "cedo12",
    "CC BY-NC",
    "Echtes Foto einer Truesche"
  ),
  aal: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/21512695/medium.jpg",
    "https://www.inaturalist.org/taxa/67452",
    "Mattia",
    "CC BY-NC",
    "Echtes Foto eines Aals"
  ),
  katzenwels: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/690189274/medium.jpg",
    "https://www.inaturalist.org/observations/377424833",
    "beckett243",
    "CC BY-NC",
    "Echtes Foto eines Katzenwelses"
  ),
  bachschmerle: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/238072903/medium.jpg",
    "https://www.inaturalist.org/taxa/95099",
    "Ilya Burylov",
    "CC BY-NC",
    "Echtes Foto einer Bachschmerle"
  ),
  elritze: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/485615917/medium.jpeg",
    "https://www.inaturalist.org/taxa/48560",
    "Axel Gosseries",
    "CC BY-NC",
    "Echtes Foto einer Elritze"
  ),
  groppe: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/48297610/medium.jpg",
    "https://www.inaturalist.org/taxa/47635",
    "Julien Renoult",
    "CC BY",
    "Echtes Foto einer Groppe"
  ),
  gruendling: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/99043377/medium.jpg",
    "https://www.inaturalist.org/taxa/97699",
    "Museo de la Ciencia de Valladolid",
    "CC BY-SA",
    "Echtes Foto eines Gruendlings"
  ),
  hasel: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/687424940/medium.jpg",
    "https://www.inaturalist.org/observations/375998944",
    "transbusgirl",
    "CC BY-NC",
    "Echtes Foto eines Hasels"
  ),
  kaulbarsch: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/48683050/medium.jpg",
    "https://www.inaturalist.org/taxa/101887",
    "Christa Rohrbach",
    "CC BY-NC-SA",
    "Echtes Foto eines Kaulbarschs"
  ),
  laube: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/425095556/medium.jpg",
    "https://www.inaturalist.org/taxa/93611",
    "UNDP Europe and CIS",
    "CC BY-NC-SA",
    "Echtes Foto einer Laube"
  ),
  schneider: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/269511876/medium.jpg",
    "https://www.inaturalist.org/taxa/93603",
    "Thomas Menut",
    "CC BY-NC",
    "Echtes Foto eines Schneiders"
  ),
  sonnenbarsch: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/244776119/medium.jpg",
    "https://www.inaturalist.org/taxa/49614",
    "Riccardo Novaga",
    "CC BY-NC",
    "Echtes Foto eines Sonnenbarschs"
  ),
  stichling: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/244775846/medium.jpg",
    "https://www.inaturalist.org/taxa/48403",
    "Riccardo Novaga",
    "CC BY-NC",
    "Echtes Foto eines Stichlings"
  ),
  stroemer: photo(
    "https://inaturalist-open-data.s3.amazonaws.com/photos/180080299/medium.jpeg",
    "https://www.inaturalist.org/taxa/113865",
    "Philippe Geniez",
    "CC BY-NC",
    "Echtes Foto eines Stroemers"
  )
};

const DEFAULT_DETAILS: Record<FishProfileCategoryGroup, BaseFishProfileDetail> = {
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

const DETAIL_OVERRIDES: Record<string, Partial<BaseFishProfileDetail>> = {
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

const PROTECTED_PROFILE_IDS = new Set(["aesche", "nase", "aal"]);
const NON_NATIVE_PROFILE_IDS = new Set([
  "regenbogenforelle",
  "bachsaibling",
  "kanadischer-seesaibling",
  "forellenbarsch",
  "katzenwels",
  "sonnenbarsch"
]);
const LOW_TARGET_PROFILE_IDS = new Set(["bachschmerle", "elritze", "groppe", "gruendling", "hasel", "laube", "schneider", "stichling", "stroemer"]);

export function getFishProfileDetails(profile: FishProfile): FishProfileDetail {
  const categoryGroup = GROUP_BY_ID[profile.id] ?? groupFromCategory(profile.category);
  const defaults = DEFAULT_DETAILS[categoryGroup];
  const override = DETAIL_OVERRIDES[profile.id] ?? {};
  const baseDetails: BaseFishProfileDetail = {
    ...defaults,
    ...override,
    categoryGroup,
    portrait: override.portrait ?? defaults.portrait,
    identification: override.identification ?? defaults.identification,
    habitats: override.habitats ?? defaults.habitats,
    catchingTips: override.catchingTips ?? defaults.catchingTips,
    eatingNote: override.eatingNote ?? defaults.eatingNote
  };
  const catchGuidance = buildCatchGuidance(profile, categoryGroup);

  return {
    ...baseDetails,
    photo: PHOTO_BY_ID[profile.id] ?? fallbackPhoto(profile),
    catchGuidance,
    longSections: buildLongSections(profile, baseDetails, catchGuidance)
  };
}

function photo(src: string, sourceUrl: string, attribution: string, license: string, alt: string): FishProfilePhoto {
  return {
    src,
    alt,
    sourceUrl,
    provider: "iNaturalist",
    attribution,
    license
  };
}

function fallbackPhoto(profile: FishProfile): FishProfilePhoto {
  return {
    src: profile.image.src,
    alt: profile.image.alt,
    sourceUrl: profile.image.src,
    provider: "ZüriFish",
    attribution: "Lokales Steckbrief-Bild",
    license: "Quelle im Steckbrief-Dokument"
  };
}

function buildCatchGuidance(profile: FishProfile, categoryGroup: FishProfileCategoryGroup): FishCatchGuidance {
  if (PROTECTED_PROFILE_IDS.has(profile.id) || categoryGroup === "Geschützte Arten") {
    return {
      status: "protected",
      label: "Geschützte Art",
      headline: "Nicht entnehmen - sofort schonend zurücksetzen",
      summary:
        "Diese Art ist in den ZüriFish-Daten als geschützt oder ganzjährig nicht entnehmbar markiert. Behandle sie als Schutzart, auch wenn du beim Fang unsicher bist.",
      steps: [
        "Fisch möglichst im Wasser lassen oder nur mit nassen Händen kurz sichern.",
        "Haken vorsichtig lösen; bei tief sitzendem Haken Vorfach nah am Maul kappen.",
        "Sofort zurücksetzen, nicht messen, nicht fotografisch lange exponieren und nicht verwerten."
      ],
      legalNote: "Vor Ort gilt immer das aktuelle Zürcher Reglement; bei Unsicherheit nicht entnehmen."
    };
  }

  if (NON_NATIVE_PROFILE_IDS.has(profile.id) || categoryGroup === "Landesfremde Arten") {
    return {
      status: "nonNative",
      label: "Landesfremd / invasiv prüfen",
      headline: "Nicht lebend versetzen und lokale Vorgaben prüfen",
      summary:
        "Diese Art ist in den Daten als landesfremd oder für die drei Seen unsicher markiert. Wichtig ist, sie nicht in andere Gewässer zu verschleppen.",
      steps: [
        "Artbestimmung sichern, weil Verwechslungen mit heimischen Arten möglich sind.",
        "Nicht als lebenden Köder, Besatz oder Transportfisch verwenden.",
        "Entnahme oder Verwertung nur, wenn Mass, Schonzeit und lokale Vorgaben klar passen."
      ],
      legalNote: "Landesfremd bedeutet nicht automatisch entnahmepflichtig; prüfe das aktuelle Gewässerreglement."
    };
  }

  if (LOW_TARGET_PROFILE_IDS.has(profile.id) || categoryGroup === "Kleinfische") {
    return {
      status: "checkRules",
      label: "Keine typische Entnahmeart",
      headline: "Schonend lösen und nur bei sicherer Regelklarheit entnehmen",
      summary:
        "Diese Art ist eher ein Bestands- oder Futterfisch als ein normaler Zielfisch. Bei zufälligem Fang zählt sichere Bestimmung und kurze Handhabung.",
      steps: [
        "Mit nassen Händen behandeln und nicht trocken ablegen.",
        "Bei unsicherer Bestimmung sofort zurücksetzen.",
        "Nicht zwischen Gewässern transportieren und nicht ohne klare Erlaubnis als Köderfisch nutzen."
      ],
      legalNote: "Kleine Arten können lokal geschützt oder eingeschränkt sein; aktuelle Vorgaben gehen vor."
    };
  }

  return {
    status: "allowed",
    label: "Entnahme nur regelkonform",
    headline: "Mass, Schonzeit und Fangzahl vor dem Töten prüfen",
    summary:
      "Diese Art ist in ZüriFish nicht als Schutz- oder landesfremde Problemarte markiert. Entnahme ist trotzdem nur erlaubt, wenn die aktuellen Regeln passen.",
    steps: [
      "Mindestmass und Schonzeit für den konkreten See prüfen.",
      "Tagesfangzahl und Patent-/Freiangelregeln beachten.",
      "Wenn alles passt: tierschutzkonform betäuben, töten und sauber kühlen; sonst sofort zurücksetzen."
    ],
    legalNote: "Die App ist eine Orientierungshilfe und ersetzt keine offizielle Rechtsauskunft."
  };
}

function buildLongSections(
  profile: FishProfile,
  details: BaseFishProfileDetail,
  catchGuidance: FishCatchGuidance
): FishProfileLongSection[] {
  return [
    {
      title: "Kurzportrait",
      body: `${details.portrait} Für den Zürcher Praxisblick ist wichtig, ob die Art in Zürichsee, Greifensee oder Pfäffikersee wirklich bestätigt ist und ob sie als Ziel-, Schutz- oder Beobachtungsart behandelt werden sollte.`,
      points: [
        `Kategorie in der App: ${profile.category}.`,
        `Wissenschaftlicher Name: ${profile.scientificName}.`,
        profile.note
      ]
    },
    {
      title: "Sicher erkennen",
      body:
        "Vor einer Entnahme muss die Bestimmung sicher sein. Achte nicht nur auf Farbe, sondern auf Körperform, Maulstellung, Flossen, Seitenlinie, Zeichnung und den Fangort.",
      points: details.identification
    },
    {
      title: "Standplätze und Saison",
      body:
        "Die besten Stellen hängen stark von Temperatur, Wind, Wassertrübung und Futterfisch ab. Wechsel zwischen Uferkante, Kraut, Hafenstruktur, Zuflussnähe und tieferem Wasser, bis das Muster klar wird.",
      points: details.habitats
    },
    {
      title: "Fangpraxis",
      body:
        "Der Steckbrief ersetzt keine Tagesanalyse, gibt aber eine robuste Richtung für Gerät, Köderführung und Verhalten am Wasser. Leise Annäherung und kurze, saubere Drills sind fast immer besser als grobe Montagen.",
      points: details.catchingTips
    },
    {
      title: "Wenn gefangen",
      body: catchGuidance.summary,
      points: catchGuidance.steps
    },
    {
      title: "Verwechslungen vermeiden",
      body:
        "Gerade Jungfische, Salmoniden, Weissfische und Barschartige können schnell verwechselt werden. Wenn Merkmale oder Gewässerregel nicht eindeutig sind, ist Zurücksetzen die robustere Entscheidung.",
      points: [
        "Vergleiche immer mehrere Merkmale statt nur Farbe oder Grösse.",
        "Bei geschützten oder landesfremden Gruppen den Status vor der Entnahme besonders streng prüfen.",
        "Fotos nur kurz machen und den Fisch dabei feucht halten."
      ]
    },
    {
      title: "Küche und Nutzung",
      body: details.eatingNote,
      points: [
        "Nur Fische verwerten, die sicher bestimmt und legal entnommen wurden.",
        "Fisch nach der Tötung kühl halten und möglichst rasch ausnehmen.",
        "Bei kleinen oder grätenreichen Arten passt oft eine andere Zubereitung als klassische Filets."
      ]
    }
  ];
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
