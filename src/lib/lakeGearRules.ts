import type { FreeFishingRule, GearMode, GearRules, GearRulesByLake, Lake, LakeDetailRules } from "../types";

type GearRuleTemplate = Omit<GearRulesByLake, "lakeId">;

const MODES: GearMode[] = ["withoutPatent", "shorePatent", "stationaryBoat", "trolling"];
const COMMON_LEGAL_NOTE = "Mindestmasse, Schonzeiten, Tageslimiten, Fangstatistik, Tierschutz und lokale Sperrzonen gelten trotzdem.";

function item(label: string, value: string): FreeFishingRule {
  return { label, value };
}

function makeGearRule({
  withoutPatent,
  shorePatent,
  stationaryBoat,
  trolling,
  time,
  note,
  modeDetails = {}
}: Omit<GearRuleTemplate, "modeDetails"> & { modeDetails?: Partial<Record<GearMode, FreeFishingRule[]>> }): GearRuleTemplate {
  return {
    withoutPatent,
    shorePatent,
    stationaryBoat,
    trolling,
    time,
    note,
    modeDetails: {
      withoutPatent: modeDetails.withoutPatent ?? [item("Status", withoutPatent), item("Weiter gültig", COMMON_LEGAL_NOTE)],
      shorePatent: modeDetails.shorePatent ?? [item("Berechtigung", shorePatent), item("Vor dem Fischen", COMMON_LEGAL_NOTE)],
      stationaryBoat: modeDetails.stationaryBoat ?? [item("Berechtigung", stationaryBoat), item("Vor dem Fischen", COMMON_LEGAL_NOTE)],
      trolling: modeDetails.trolling ?? [item("Berechtigung", trolling), item("Vor dem Fischen", COMMON_LEGAL_NOTE)]
    }
  };
}

const lemanRule = makeGearRule({
  withoutPatent: "Schweizer Ufer: 1 schwimmende Angel mit festem Schwimmer und einfachem Haken",
  shorePatent: "Leman-Permis; Ufer- und Wurffischerei nach dem 2026-Auszug",
  stationaryBoat: "Bootsfischerei nur mit passendem Leman-Permis",
  trolling: "Schleppangeln nur mit dafuer berechtigendem Leman-Permis",
  time: "max. 30 Min. vor Sonnenaufgang bis 30 Min. nach Sonnenuntergang",
  note: "Grenzsee: Schweizer/Franzoesische Seite und lokale Sperren pruefen.",
  modeDetails: {
    withoutPatent: [
      item("Standort", "Nur Schweizer Seite; vom Ufer aus."),
      item("Geraet", "1 ligne flottante / schwimmende Angel mit festem Schwimmer und einfachem Haken."),
      item("Nicht frei", "Boot, Gambe, Grund-/Senk-/Schleppmethoden brauchen ein passendes Permis."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    shorePatent: [
      item("Permis", "Sport-/Freizeit-Permis fuer den Leman; zustaendige Ausgabestelle GE/VD/VS nach Standort pruefen."),
      item("Geraete", "Erlaubte Linien, Haken und Koeeder stehen im Leman-Auszug 2026; freie Angel zaehlt nicht zusaetzlich."),
      item("Fangzeit", "Sportfischerei nur im offiziellen Tageszeitfenster."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    stationaryBoat: [
      item("Permis", "Bootsfischerei nur mit gueltigem Leman-Permis und zulaessigem Boot/Abschnitt."),
      item("Kinder", "Kinderregeln gelten nur unter Verantwortung einer Person mit Permis."),
      item("Grenze", "Zustaendige Seeseite und Hafen-/Naturschutzzonen pruefen."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    trolling: [
      item("Permis", "Pêche à la traîne / Schleppangeln ist ein eigener Berechtigungsfall."),
      item("Limit", "Koeeder-, Jahres- und Tageslimiten aus dem Leman-Auszug 2026 anwenden."),
      item("Sperren", "Schilf, Mündungen, Häfen und Schutzbereiche koennen lokal sperren."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const bodenseeRule = makeGearRule({
  withoutPatent: "Freiangelei vom Ufer mit 1 Rute, festem Zapfen, einfachem Haken und natuerlichem Koeder",
  shorePatent: "Uferpatent fuer die Halde/Uferfischerei",
  stationaryBoat: "Bootspatent fuer die Fischerei vom Boot",
  trolling: "Schleppangeln nur mit Bootspatent; hoechstens 8 Anbissstellen",
  time: "1 Std. vor Sonnenaufgang bis 1 Std. nach Sonnenuntergang; Aalfang vom Ufer bis 01.00 Uhr",
  note: "Obersee-Regeln gelten nicht automatisch fuer Untersee/Seerhein.",
  modeDetails: {
    withoutPatent: [
      item("Standort", "Vom Ufer oder von Ufermauern aus; lokale Badeanlagen, Haefen und Schutzgebiete beachten."),
      item("Geraet", "1 Rute, Schnur mit festem Zapfen, 1 einfache Angel, natuerlicher Koeder."),
      item("Nicht erlaubt", "Keine Koederfische; ohne SaNa gilt Widerhakenverbot und keine Lebendhaelterung."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    shorePatent: [
      item("Patent", "Uferpatent nach zustaendigem Bodensee-Uferkanton; Monats-/Jahrespatent mit SaNa-Anforderung beachten."),
      item("Geraete", "Angelgeraete dauernd beaufsichtigen; Anbissstellen und Hegenen nach Bodensee-Bestimmungen."),
      item("Zeit", "Angelfischerei im offiziellen Tageszeitfenster."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    stationaryBoat: [
      item("Patent", "Bootspatent erforderlich; Gastpatent nur als Zusatz zum Boot-Jahrespatent."),
      item("Boot", "Boots-, Halden- und hohe-See-Berechtigung nicht vermischen."),
      item("Zeit", "Oeffentliche Ruhetage und Haldenregeln zusaetzlich beachten."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    trolling: [
      item("Patent", "Nur mit Bootspatent und Bodensee-Schleppregeln."),
      item("Koeeder", "Hoechstens 8 Anbissstellen; einzelne Verbote wie 1.11.-10.01. und Segelboot-Regel beachten."),
      item("Abstand", "Abstand zu Netzen, Reusen und Legschnueren einhalten."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const unterseeRule = makeGearRule({
  withoutPatent: "Freiangelei vom Ufer mit 1 Rute, festem Zapfen, einfachem Haken und natuerlichem Koeder",
  shorePatent: "Untersee-/Seerhein-Patent nach zustaendigem Kanton/Abschnitt",
  stationaryBoat: "Boot nur mit passender Untersee-Berechtigung",
  trolling: "Schleppangeln nur, wenn die Untersee-Fischereiordnung es im Abschnitt erlaubt",
  time: "Untersee-Fischereiordnung und lokale Tafeln pruefen",
  note: "Untersee/Seerhein haben eigene Regeln, nicht die Obersee-Karte verwenden.",
  modeDetails: {
    withoutPatent: [
      item("Standort", "Vom Ufer aus."),
      item("Geraet", "1 Rute, feststehender Zapfen, einfacher Haken ohne Widerhaken, natuerlicher Koeder."),
      item("Nicht erlaubt", "Kein Laufzapfen, keine Koederfische, keine Haelterung."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const neuchatelRule = makeGearRule({
  withoutPatent: "Pêche libre: bis 3 schwimmende Linien mit festem Schwimmer und einfachem Haken",
  shorePatent: "Permis D ohne Schleppangeln oder Permis C mit Schleppangeln",
  stationaryBoat: "Bootsfischerei nach Konkordatsreglement; Permis-Typ pruefen",
  trolling: "Schleppangeln nur mit Permis C",
  time: "Fangzeiten je Art im Konkordatsauszug 2025-2027",
  note: "Konkordatssee NE/VD/FR; im Zweifel das aktuelle Reglement vor dem Auswerfen oeffnen.",
  modeDetails: {
    withoutPatent: [
      item("Geraet", "Max. 3 lignes flottantes / schwimmende Linien mit festem Schwimmer und einfachem Haken."),
      item("Standort", "Vom Ufer, auch watend, oder vom Boot gemäss Art. 8 des Konkordatsreglements."),
      item("SaNa", "Pêche libre ist vom SaNa befreit; Kurs wird trotzdem empfohlen."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    shorePatent: [
      item("Permis D", "Tages- oder Jahrespermit ohne pêche à la traîne."),
      item("Permis C", "Permit mit Schleppangeln."),
      item("Geraete", "Linien-/Koeedergrenzen aus dem 2025-2027-Reglement anwenden."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    trolling: [
      item("Permis", "Nur mit Permis C."),
      item("Boot", "Boots- und Koeedergrenzen des Konkordatsreglements einhalten."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const murtenRule = makeGearRule({
  withoutPatent: "Pêche libre nach Murtensee-Konkordat; freie Linien nur im engen Art.-8-Rahmen",
  shorePatent: "Permis D ohne Schleppangeln oder Permis C mit Schleppangeln",
  stationaryBoat: "Bootsfischerei mit passendem Murtensee-Permis",
  trolling: "Schleppangeln nur mit Permis C; max. 8 Koeeder pro Person und 16 pro Boot",
  time: "Regelperiode 2025-2027; Schleppangeln im Winter-/Forellenfenster gesperrt",
  note: "FR/VD-Konkordat: zustaendige Ausgabestelle und lokale Sperren pruefen.",
  modeDetails: {
    withoutPatent: [
      item("Status", "Ohne Permis nur im ausdrücklich geregelten pêche-libre-Rahmen."),
      item("Geraet", "Linien, Schwimmer, Haken und Standort genau nach Art. 8 des Murtensee-Reglements."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    shorePatent: [
      item("Permis D", "Tages- oder Jahrespermit ohne Schleppangeln."),
      item("Geraete", "Bis zu 3 schwimmende, sinkende, ruhende oder Wurflinien laut Auszug."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    stationaryBoat: [
      item("Boot", "Bootsfischerei nur mit passendem Permit und Gewaesserabschnitt."),
      item("Geraete", "Linien-/Koeedergrenzen aus dem 2025-2027-Auszug."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    trolling: [
      item("Permis", "Nur mit Permis C."),
      item("Koeeder", "Max. 8 Koeeder pro Fischer/in und 16 pro Boot; je Koeeder max. 3 Haken."),
      item("Sperre", "Schleppangeln vom 1.11. bis vor Forelleneroeffnung verboten."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

function bernBigLakeRule(lakeName: string): GearRuleTemplate {
  return makeGearRule({
    withoutPatent: "Freiangelei: 1 Angelrute vom Ufer aus ohne Patent",
    shorePatent: "Bernisches Patent fuer Uferfischerei und erweiterte Fangmethoden",
    stationaryBoat: "Bootsfischerei nur mit passendem Bern-Patent und Gewaesserabschnitt",
    trolling: "Schleppangeln nur, wenn Bern-Reglement und Patent/Geraet es erlauben",
    time: "Bern-Reglement 2026 und Gewaesserabschnitt pruefen",
    note: `${lakeName}: Freiangelei gilt nur im engen Berner Grosssee-Rahmen.`,
    modeDetails: {
      withoutPatent: [
        item("Standort", `Am ${lakeName} vom Ufer aus.`),
        item("Geraet", "1 Angelrute; die Ausfuehrungsvorschriften der Freiangelei gelten."),
        item("Nicht frei", "Weitere Ruten, Boot, Spezialgeraete oder nicht abgedeckte Methoden brauchen ein Patent."),
        item("Weiter gültig", COMMON_LEGAL_NOTE)
      ],
      shorePatent: [
        item("Patent", "Bernisches Patent; App Fischen Bern oder Ausgabestelle verwenden."),
        item("Geraete", "Erlaubte Fanggeraete ab 01.01.2026 separat im Bern-Merkblatt pruefen."),
        item("Weiter gültig", COMMON_LEGAL_NOTE)
      ]
    }
  });
}

const bernPatentOnlyRule = makeGearRule({
  withoutPatent: "Keine App-sichere Freiangelei; Bern-Patent oder Sonderbewilligung pruefen",
  shorePatent: "Bernisches Patent fuer Patentgewaesser",
  stationaryBoat: "Boot nur, wenn Patent, Gewaesserabschnitt und lokale Regeln es erlauben",
  trolling: "Schleppangeln nur, wenn Bern-Reglement und Gewaesserabschnitt es erlauben",
  time: "Bern-Reglement 2026 und Gewaesserabschnitt pruefen",
  note: "Nicht mit Brienzer-, Thuner- oder Bielersee-Freiangelei gleichsetzen."
});

const grimselseeRule = makeGearRule({
  withoutPatent: "Nicht ohne geklaerte Sonderbewilligung fischen",
  shorePatent: "Patent-/Sonderstatus beim Fischereiinspektorat Bern oder Betreiber pruefen",
  stationaryBoat: "Boot nicht als App-sichere Option hinterlegt",
  trolling: "Schleppangeln nicht als App-sichere Option hinterlegt",
  time: "Vor Ort zwingend klaeren",
  note: "Die App hat keinen belastbaren offenen Bern-Patentstatus fuer den Grimselsee gefunden.",
  modeDetails: {
    withoutPatent: [
      item("Status", "Keine Freiangelei behauptet."),
      item("Vor dem Fischen", "Fischereiinspektorat Bern oder allfaellige Paechter-/KWO-Sonderbewilligung pruefen.")
    ]
  }
});

const ticinoLakeRule = makeGearRule({
  withoutPatent: "Nicht ohne Tessiner Patente fischen, auch nicht vom Ufer",
  shorePatent: "Patente da riva / Uferpatent fuer Verbano oder Ceresio",
  stationaryBoat: "Bootsfischerei nur mit passender Tessiner/CISPP-Berechtigung",
  trolling: "Traina / Schleppangeln nur mit dafuer berechtigender Patente",
  time: "Tessin-/CISPP-Reglement und Seeseite pruefen",
  note: "Grenzsee: Schweizer und italienische Seite koennen abweichen.",
  modeDetails: {
    withoutPatent: [
      item("Status", "In Ticino ist fuer oeffentliche Gewaesser grundsaetzlich eine Fischereilizenz noetig."),
      item("Ufer", "Das gilt laut Kanton auch fuer Verbano und Ceresio vom Ufer aus."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    shorePatent: [
      item("Patent", "Tessiner digitale Patente und Statistik via Pesca TI; Seeseite Verbano/Ceresio waehlen."),
      item("Geraete", "Nur im RALCSP/CISPP zugelassene Methoden und Koeeder."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    stationaryBoat: [
      item("Patent", "Boot/Natante nur mit passender Lizenz und schiffsrechtlich zulaessigem Standort."),
      item("Grenze", "CISPP- und Tessin-Regeln bei Grenzbereichen abgleichen."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    trolling: [
      item("Patent", "Traina ist eine eigene Geraetekategorie."),
      item("Helfer", "Hilfe ohne eigene Patente ersetzt keine eigene Angelberechtigung."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const vierwaldstaetterseeRule = makeGearRule({
  withoutPatent: "Freiangel je Seeteil unterschiedlich; Luzerner Teil vom oeffentlichen Ufer mit einfacher Angel",
  shorePatent: "Kantonales/interkantonales See- oder Uferpatent nach Seeteil",
  stationaryBoat: "Boot nur mit passender Bootsberechtigung des Seeteils",
  trolling: "Schleppangeln nur nach interkantonalen Ausfuehrungsbestimmungen",
  time: "Interkantonale Vorschriften und Seeteil pruefen",
  note: "LU/NW/OW/SZ/UR: vor Ort immer den zustaendigen Seeteil pruefen.",
  modeDetails: {
    withoutPatent: [
      item("Luzern", "Kostenlos vom oeffentlich zugaenglichen Ufer, Bruecken und Stegen mit einfacher Angel ohne Widerhaken."),
      item("Koeeder", "Natuerliche Koeeder; keine toten oder lebenden Koederfische."),
      item("Andere Seeteile", "Schwyz kennt eine Freiangelkarte/SaNa-Pflicht; andere Kantone separat pruefen."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    shorePatent: [
      item("Patent", "Je nach Zone/Kanton Jahres-, See- oder Sonderpatent."),
      item("Grenze", "Horwerbucht, offener Staatssee und andere Zonen nicht verwechseln."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const zugerseeRule = makeGearRule({
  withoutPatent: "Vom Ufer patentfrei mit 1 Rute, einfachem Haken, Schwimmer und natuerlichem Koeder",
  shorePatent: "Uferpatent fuer erweiterte Methoden",
  stationaryBoat: "Bootsfischerei nur mit Bootspatent/passender Seeteil-Berechtigung",
  trolling: "Schleppangeln mit maximal 10 Anbissstellen pro Boot",
  time: "Nachtverbote und Seeteil-Regeln pruefen",
  note: "Konkordatssee ZG/SZ/LU; zuständigen Seeteil beachten.",
  modeDetails: {
    withoutPatent: [
      item("Standort", "Vom Ufer aus."),
      item("Geraet", "1 Angelrute, ein einziger einfacher Haken ohne Widerhaken, Schwimmer und natuerlicher Koeder."),
      item("Nicht erlaubt", "Keine Koederfische, Loeffel, Spinner und dergleichen."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    shorePatent: [
      item("Geraete", "Grund-, Zapfen-, Spinn-, Flug-, Hegenen- und Juckerfischerei nach Zugersee-Ausfuehrungsbestimmungen."),
      item("Anzahl", "Ausser Schleppangeln maximal zwei der beschriebenen Geraetschaften pro Patentinhaber/in."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    stationaryBoat: [
      item("Patent", "Boots-/Seepatent und zulaessigen Seeteil pruefen."),
      item("Geraete", "Maximal zwei Geraetschaften pro Patentinhaber/in, ausser bei der pro Boot limitierten Schleppfischerei."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    trolling: [
      item("Koeeder", "Maximal 10 Anbissstellen pro Boot."),
      item("Patent", "Nur mit entsprechender patentpflichtiger Berechtigung."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const aegeriseeRule = makeGearRule({
  withoutPatent: "Erwachsene brauchen ein Patent; patentfrei nur Jugendliche bis 14 vom Ufer im engen Rahmen",
  shorePatent: "Aegerisee-Patent fuer Uferfischerei",
  stationaryBoat: "Aegerisee-Patent fuer Bootsfischerei",
  trolling: "Schlepp-/Bootsmethoden nur nach Aegerisee-Reglement und Patent",
  time: "Aegerisee-Patentjahr und Nachtverbote pruefen",
  note: "Patentverkauf laeuft ueber Unteraegeri/Oberaegeri/Fishven Zug.",
  modeDetails: {
    withoutPatent: [
      item("Kinder", "Patentfrei nur bis zum zurueckgelegten 14. Altersjahr vom Ufer aus."),
      item("Geraet", "1 Angelrute, eine einfache Angel ohne Widerhaken, Schwimmer und natuerlicher Koeder."),
      item("Erwachsene", "Ab dem 14. Geburtstag nur mit Patent."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    shorePatent: [
      item("Patent", "Tages-, Wochen-, Monats- oder Jahrespatent der Aegerisee-Ausgabestellen."),
      item("Geraete", "Alle gesetzlich erlaubten Geraetschaften nur im Patentumfang."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    stationaryBoat: [
      item("Patent", "Bootsfischerei nur mit Aegerisee-Patent und zulaessigem Boot."),
      item("Statistik", "Fangstatistik/App-Vorgaben einhalten."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const walenseeRule = makeGearRule({
  withoutPatent: "Freiangelrecht vom Ufer mit 1 Rute/Schnur, einfachem Haken ohne Widerhaken und natuerlichem Koeder oder kuenstlicher Fliege",
  shorePatent: "Walensee-Patent fuer erweiterte Uferfischerei",
  stationaryBoat: "Bootsfischerei nach Walensee-Ausfuehrungsbestimmungen",
  trolling: "Schleppangeln nur mit passender Walensee-Berechtigung",
  time: "Sommer 04-23 Uhr / Winter 05-22 Uhr; Trueeschenfang vom Ufer aus ohne Zeitbeschraenkung",
  note: "SG/GL-Walensee-Regeln und Berufsfischergeraet-Abstaende beachten.",
  modeDetails: {
    withoutPatent: [
      item("Standort", "Nur vom Ufer aus."),
      item("Geraet", "1 Angelrute oder Schnur mit einem einzigen Koeder und einfachem Haken ohne Widerhaken."),
      item("Koeeder", "Natuerliche Koeeder, Lebensmittel und kuenstliche Fliegen; keine Koederfische."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const sempacherseeRule = makeGearRule({
  withoutPatent: "Oeffentliches Ufer: einfache Angel ohne Widerhaken, nur natuerliche Koeder, keine Koederfische",
  shorePatent: "Luzerner Sempachersee-Patent fuer erweiterte Fischerei",
  stationaryBoat: "Bootsfischerei nur mit passender Luzerner Berechtigung",
  trolling: "Schleppangeln nur, wenn Luzerner Sempachersee-Regeln und Patent es erlauben",
  time: "Luzerner Sempachersee-Seite und Patent pruefen",
  note: "Luzern: Gastfischerei nur zusammen mit Patentinhaber/in.",
  modeDetails: {
    withoutPatent: [
      item("Standort", "Oeffentlich zugaengliche Ufer, Bruecken und Stege."),
      item("Geraet", "Einfacher Angel ohne Widerhaken."),
      item("Koeeder", "Nur natuerliche Koeeder; keine toten oder lebenden Koederfische."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const sihlseeRule = makeGearRule({
  withoutPatent: "Kein Freiangelrecht; Sihlsee ist Pachtsee mit eigenen Karten",
  shorePatent: "Sihlsee-Karte/Patent nach Paechter-Merkblatt",
  stationaryBoat: "Boot nur nach Sihlsee-Ausfuehrungsbestimmungen",
  trolling: "Schleppangeln nur, wenn Sihlsee-Merkblatt und Karte es erlauben",
  time: "Saison und Jahresmerkblatt Sihlsee pruefen",
  note: "Schwyz verweist fuer diesen Pachtsee auf die Sihlsee-Unterlagen.",
  modeDetails: {
    withoutPatent: [
      item("Status", "Nicht unter das Schwyzer Freiangelrecht stellen."),
      item("Vor dem Fischen", "Sihlsee-Karte, Merkblatt und Fangstatistikpflicht pruefen.")
    ]
  }
});

const hallwilerseeRule = makeGearRule({
  withoutPatent: "Nicht gratis: Freianglerkarte noetig; Ufer mit 1 Rute, einfacher Angel und natuerlichem Koeder",
  shorePatent: "Hallwilersee-Fischerkarte fuer Ufer oder Boot",
  stationaryBoat: "Bootsfischerei mit Hallwilersee-Karte",
  trolling: "Schleppangeln nur, wenn AG/LU-Uebereinkunft und Karte es erlauben",
  time: "Freianglerei 01.03.-31.10., 05-23 Uhr MEZ",
  note: "AG/LU-Uebereinkunft und lokale Privatfischenzen beachten.",
  modeDetails: {
    withoutPatent: [
      item("Karte", "Freianglerkarte, SaNa und Mindestalter 12 Jahre erforderlich."),
      item("Geraet", "Nur vom Ufer, 1 Rute/eine Schnur, einfache Angel, natuerlicher Koeder."),
      item("Nicht erlaubt", "Keine Koederfische, keine kuenstlichen Koeeder, kein Anfuettern, kein Waten."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    shorePatent: [
      item("Karte", "Jahres-, Wochen- oder Tageskarte Hallwilersee."),
      item("Geltung", "Aargauer und Luzerner Seeteile sowie Privatfischenzen pruefen."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const fribourgPatentRule = makeGearRule({
  withoutPatent: "Keine App-sichere pêche libre; Freiburger Permit vor dem Fischen loesen",
  shorePatent: "Freiburger See-/Stausee-Permit nach OPêche",
  stationaryBoat: "Boot nur, wenn Permit und Gewaesserordnung es erlauben",
  trolling: "Schleppangeln nur, wenn Permitkategorie und Gewaesser es erlauben",
  time: "OPêche 2025-2027 und Gewaesserkarte pruefen",
  note: "Nicht mit Neuenburgersee/Murtensee-Konkordat verwechseln."
});

const lacDeJouxRule = makeGearRule({
  withoutPatent: "Keine App-sichere pêche libre; Waadt-Permis fuer Lac de Joux pruefen",
  shorePatent: "Waadtlaender Permis fuer Uferfischerei",
  stationaryBoat: "Boot nur mit passendem Permis und ausserhalb der Sperrbereiche",
  trolling: "Schleppangeln nur, wenn Lac-de-Joux-Auszug und Permis es erlauben",
  time: "Lac-de-Joux-Auszug 2026 je Art und Sperrzone",
  note: "Orbe-/Lionne-/Brenet-Sperren aus dem Waadt-Auszug beachten."
});

const sarnerseeRule = makeGearRule({
  withoutPatent: "01.04.-15.10. vom Ufer ohne Patent mit 1 handgefuehrten Rute und natuerlichem Koeder",
  shorePatent: "Obwaldner Patent fuer erweiterte Sarnersee-Fischerei",
  stationaryBoat: "Boot nur mit Obwaldner Patent und zulaessigem Seeabschnitt",
  trolling: "Schleppangeln nur, wenn Obwaldner Ausfuehrungsbestimmungen es erlauben",
  time: "Freiangelei 01.04.-15.10.; Patentregeln separat",
  note: "Naturschutzbereiche am Sarnersee bleiben vorbehalten.",
  modeDetails: {
    withoutPatent: [
      item("Standort", "Vom Ufer aus."),
      item("Geraet", "Eine von Hand gefuehrte Angelrute mit oder ohne Schwimmer."),
      item("Koeeder", "Nur einfacher Haken ohne Widerhaken mit natuerlichem Koeder; keine lebenden/toten Fische."),
      item("Nicht erlaubt", "Keine kuenstlichen Lockfische, Loeffel, Spinner, Fangnetze, Koederflaschen oder Koedernetze."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const baldeggerseeRule = makeGearRule({
  withoutPatent: "Kein belastbares Freiangelrecht gefunden; privates Fischereirecht",
  shorePatent: "Patente und Regeln direkt bei Pro Natura Luzern klaeren",
  stationaryBoat: "Boot nicht als App-sichere Option hinterlegt",
  trolling: "Schleppangeln nicht als App-sichere Option hinterlegt",
  time: "Direkt bei Patentausgabe pruefen",
  note: "Keine oeffentliche amtliche Fangtabelle gefunden; die App erfindet keine Werte."
});

const graubuendenLakeRule = makeGearRule({
  withoutPatent: "Kein Freiangelmodus hinterlegt; Buendner Patent erforderlich",
  shorePatent: "Buendner Patent fuer stehende Gewaesser",
  stationaryBoat: "Boot nur, wenn Gewaesser, Patent und lokale Schifffahrtsregeln es erlauben",
  trolling: "Schleppangeln nur, wenn FBV und Gewaesserkarte es ausdruecklich erlauben",
  time: "FBV 2026 und Gewaesserkarte pruefen",
  note: "Graubuenden: Saison, Schonstrecken und Patenttyp sind gewaesserspezifisch."
});

const graubuendenBorderRule = makeGearRule({
  withoutPatent: "Kein Freiangelmodus; GR-Patent oder italienische Erlaubnis je Uferseite noetig",
  shorePatent: "Buendner Patent auf Schweizer Seite; Sondrio-Erlaubnis auf italienischer Seite",
  stationaryBoat: "Boot nur nach Grenz-, Patent- und Schifffahrtsregeln",
  trolling: "Schleppangeln nur, wenn zustaendige Seite es erlaubt",
  time: "GR FBV 2026 und Provincia di Sondrio 2026 abgleichen",
  note: "Grenz-/Sonderlage: Standort entscheidet ueber die Regelquelle."
});

const schwyzPachtRule = makeGearRule({
  withoutPatent: "Kein Schwyzer Freiangelrecht; Paechterkarte noetig",
  shorePatent: "Pachtsee-Karte nach Paechtervorschriften",
  stationaryBoat: "Boot nur nach Paechtervorschriften und Stationierungsregeln",
  trolling: "Schleppangeln nur, wenn Paechtervorschriften es erlauben",
  time: "Pachtsee-Saison und aktuelles Merkblatt pruefen",
  note: "Schwyz listet den See als Pacht-/Sondersee; kantonale Freiangelkarte reicht nicht."
});

const valaisMountainLakeRule = makeGearRule({
  withoutPatent: "Kein Fischfang ohne Walliser Permis",
  shorePatent: "Walliser Kantons-/Bergsee-Permis",
  stationaryBoat: "Boot nicht als App-sichere Standardoption hinterlegt",
  trolling: "Schleppangeln nicht als App-sichere Standardoption hinterlegt",
  time: "Walliser Fuenfjahresbeschluss 2024-2028 und aktuelle Karte",
  note: "Berg-/Stausee: Saison, Zutritt und Spezialzonen vor Ort pruefen.",
  modeDetails: {
    withoutPatent: [
      item("Status", "Walliser Regalgewaesser duerfen nur mit Permis befischt werden."),
      item("Kinder", "Kinder unter 13 nur unter Verantwortung einer Person mit Permis; Fang wird dieser Person zugerechnet."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    shorePatent: [
      item("Permis", "Jahres-, Halbmonats-, Wochenend- oder Tagespermit je Kategorie."),
      item("Geraete", "In Seen/Gouilles grundsaetzlich eine Linie; zusaetzliche Geraete nur nach OcPê."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const kloentalerseeRule = makeGearRule({
  withoutPatent: "Freiangelrecht vom Ufer mit 1 Rute, einfachem Haken ohne Widerhaken und natuerlichem Koeder oder kuenstlicher Fliege",
  shorePatent: "Glarner Patent; im Kloentalersee vom Ufer bis 2 patentpflichtige Ruten moeglich",
  stationaryBoat: "Bootsfischerei ist im Kloentalersee erlaubt, mit Patent",
  trolling: "Schleppangeln nur im Kloentalersee mit den Zusatzregeln/Motorkraft-Regeln",
  time: "Saison 01.04.-31.12.; Detailzeiten nach Glarner Vorschriften",
  note: "Keine zusaetzliche Freiangel, wenn zwei patentpflichtige Ruten verwendet werden.",
  modeDetails: {
    withoutPatent: [
      item("Standort", "Nur vom Ufer aus."),
      item("Geraet", "1 Angelrute, einfache Angel ohne Widerhaken, natuerlicher Koeder oder kuenstliche Fliege."),
      item("Nicht erlaubt", "Keine Koederfische und keine Kunstkoeder wie Twister oder Loeffel."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    shorePatent: [
      item("Ruten", "Im Kloentalersee vom Ufer aus maximal 2 patentpflichtige Angelruten; dann keine zusaetzliche Freiangel."),
      item("Haken", "Grundregel ohne Widerhaken; Ausnahmen fuer Hegene/Schleppangeln mit SaNa beachten."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    stationaryBoat: [
      item("Boot", "Bootsfischerei ist im Kloentalersee erlaubt; andere Glarner Gewaesser nicht automatisch."),
      item("Ruten", "Patent- und Hegenenregeln beachten."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ],
    trolling: [
      item("Motorkraft", "Mit Zusatzpatent Motorkraft bis 5 Anbissstellen je Boot nach Glarner Regel."),
      item("Ohne Motorkraft", "Strengeres Limit fuer Schleppangeln ohne Zusatzpatent beachten."),
      item("Kennzeichnung", "Schleppboot mit weissem Ball kennzeichnen."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const lauerzerseeRule = makeGearRule({
  withoutPatent: "Freiangelkarte + SaNa; nicht einfach dokumentlos",
  shorePatent: "Schwyzer Seefischerei-Patent fuer Lauerzersee",
  stationaryBoat: "Boot nur mit Patent und zulaessigem, stationiertem Boot",
  trolling: "Schleppangeln nur, wenn die Lauerzersee-Ausfuehrungsbestimmungen es erlauben",
  time: "Schwyzer Ausfuehrungsbestimmungen und Bootseinwasserungsregeln pruefen",
  note: "Schwyz: Freiangelkarte/SaNa-Pflicht und lokale Schutzzonen beachten.",
  modeDetails: {
    withoutPatent: [
      item("Karte", "Patentfreie Fischerei braucht im Kanton Schwyz eine Freiangelkarte und SaNa."),
      item("Geltung", "Am Lauerzersee erlaubt; nicht auf Sihlsee/Waegitalersee uebertragen."),
      item("Weiter gültig", COMMON_LEGAL_NOTE)
    ]
  }
});

const lungererseeRule = makeGearRule({
  withoutPatent: "Kein normales Obwaldner Freiangelrecht; Sonderbestimmungen/Gemeinde Lungern pruefen",
  shorePatent: "Lungerersee-Berechtigung nach Sondererlass/Gemeinde",
  stationaryBoat: "Boot nur, wenn Sonderbestimmungen und Gemeinde es erlauben",
  trolling: "Schleppangeln nur, wenn Sonderbestimmungen es erlauben",
  time: "01.12.-25.12. jegliche Fischerei verboten; weitere Regeln Gemeinde Lungern",
  note: "Obwaldner Patentregeln gelten nicht automatisch fuer den Lungerersee."
});

const EXPLICIT_GEAR_RULES_BY_LAKE_ID: Record<string, GearRuleTemplate> = {
  "lac-leman": lemanRule,
  bodensee: bodenseeRule,
  "lac-de-neuchatel": neuchatelRule,
  verbano: ticinoLakeRule,
  vierwaldstaettersee: vierwaldstaetterseeRule,
  untersee: unterseeRule,
  ceresio: ticinoLakeRule,
  thunersee: bernBigLakeRule("Thunersee"),
  "lac-de-bienne": bernBigLakeRule("Bielersee"),
  zugersee: zugerseeRule,
  brienzersee: bernBigLakeRule("Brienzersee"),
  walensee: walenseeRule,
  "lac-de-morat-murtensee": murtenRule,
  sempachersee: sempacherseeRule,
  sihlsee: sihlseeRule,
  hallwilersee: hallwilerseeRule,
  "lac-de-la-gruyere": fribourgPatentRule,
  "lac-de-joux": lacDeJouxRule,
  sarnersee: sarnerseeRule,
  aegerisee: aegeriseeRule,
  baldeggersee: baldeggerseeRule,
  "lago-di-livigno": graubuendenBorderRule,
  schiffenensee: fribourgPatentRule,
  waegitalersee: schwyzPachtRule,
  "lago-di-lei": graubuendenBorderRule,
  silsersee: graubuendenLakeRule,
  "lac-des-dix": valaisMountainLakeRule,
  wohlensee: bernPatentOnlyRule,
  "lac-d-emosson": valaisMountainLakeRule,
  kloentalersee: kloentalerseeRule,
  silvaplanersee: graubuendenLakeRule,
  lauerzersee: lauerzerseeRule,
  grimselsee: grimselseeRule,
  lungerersee: lungererseeRule,
  "lac-de-mauvoisin": valaisMountainLakeRule
};

export function completeGearRules(rawGearRules: GearRules, lakes: Lake[], detailRules: LakeDetailRules[]): GearRules {
  const rawByLakeId = new Map(rawGearRules.byLake.map((entry) => [entry.lakeId, entry]));
  const detailByLakeId = new Map(detailRules.map((entry) => [entry.lakeId, entry]));

  return {
    ...rawGearRules,
    byLake: lakes.map((lake) => {
      const rawRule = rawByLakeId.get(lake.id);
      if (rawRule) {
        return rawRule;
      }

      const explicitRule = EXPLICIT_GEAR_RULES_BY_LAKE_ID[lake.id] ?? buildFallbackRule(lake, detailByLakeId.get(lake.id));

      return {
        lakeId: lake.id,
        ...explicitRule
      };
    })
  };
}

function buildFallbackRule(lake: Lake, details: LakeDetailRules | undefined): GearRulesByLake {
  const summary = details?.coverage === "delegatedPacht" ? "Pacht-/Sonderregeln zuerst pruefen" : "Amtliche Quelle vor dem Fischen pruefen";

  return {
    lakeId: lake.id,
    ...makeGearRule({
      withoutPatent: `Keine App-sichere Freiangelei; ${summary}`,
      shorePatent: "Patent-/Lizenzquelle dieses Sees pruefen",
      stationaryBoat: "Boot nur, wenn die lokale Gewaesserordnung es erlaubt",
      trolling: "Schleppangeln nur, wenn die lokale Gewaesserordnung es erlaubt",
      time: details?.checkedAt ? `Quellenstand ${details.checkedAt}` : "Quelle pruefen",
      note: `${lake.name}: keine spezifische Geraetekarte hinterlegt; konservativ nicht als frei behauptet.`
    })
  };
}

export function hasCompleteGearModeDetails(rule: GearRulesByLake): boolean {
  return MODES.every((mode) => Array.isArray(rule.modeDetails[mode]) && rule.modeDetails[mode].length > 0);
}
