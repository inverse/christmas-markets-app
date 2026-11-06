import type { Attraction, Locale } from "$shared/types";

/**
 * Per-locale copy for the GetYourGuide attractions in data/attractions.json,
 * which holds the English text. English is the source data, so it needs no
 * table; `de` falls back to the JSON values for any missing id.
 */
export type AttractionText = { name: string; description: string };

const german: Record<string, AttractionText> = {
  "christmas-markets-tour": {
    name: "Berliner Weihnachtsmarkt-Tour",
    description:
      "Orientierungstour über Berlins festlichste Märkte, gewürzt mit Geschichten über deutsche Weihnachtsbräuche, Kunsthandwerk und saisonale Leckereien.",
  },
  "christmas-market-sightseeing-tour": {
    name: "Weihnachtsmarkt-Tour mit Glühwein",
    description:
      "Eine kompakte Abendkombination: Stadtrundgang zu Fuß, abgerundet mit einem Becher Glühwein auf einem Berliner Weihnachtsmarkt.",
  },
  "private-christmas-market-tour": {
    name: "Private Weihnachtsmarkt-Tour",
    description:
      "Ein privater zweistündiger Rundgang durch Berlins beliebteste Weihnachtsmärkte - für Gruppen bis zu fünfzehn Personen.",
  },
  "christmas-lights-bus-tour": {
    name: "Christmas-Lights-Bustour inkl. Glühwein",
    description:
      "Eine stimmungsvolle Abendfahrt im Bus durch das weihnachtlich beleuchtete Berlin, mit festlichem Kommentar und einem Aufwärm-Stopp auf einem Markt.",
  },
  "tour-of-lights": {
    name: "Tour of Lights mit Fotostopps",
    description:
      "Eine live moderierte Abendtour zu Berlins schillerndsten Lichtinstallationen - mit Stopps für das perfekte Foto.",
  },
  "evening-spree-christmas-cruise": {
    name: "Abendliche Spreefahrt zur Weihnachtszeit",
    description:
      "Zwei Stunden gemütliches Gleiten auf der beheizten Spree vorbei an Museumsinsel und Regierungsviertel - alles in festlichem Licht.",
  },
  "solar-catamaran-christmas-tour": {
    name: "Tannenduft & Lichterglanz: Solarkatamaran-Tour",
    description:
      "Ein solarbetriebener Katamaran trägt euch auf einer gemächlichen zweieinhalbstündigen Sightseeing-Tour über die beleuchteten Wasserwege.",
  },
  "mulled-wine-boat-trip": {
    name: "Weihnachtliche Bootsfahrt mit Glühwein",
    description:
      "Eine gemütliche Winterfahrt, die Stadtblicke mit heißem Glühwein und Gebäck an Bord verbindet.",
  },
  "christmas-garden-berlin": {
    name: "Christmas Garden Berlin",
    description:
      "Der Botanische Garten als illuminiertes Märchen: Lichtarenen, leuchtende Bäume und ein glänzender Weg durch die Beete.",
  },
  "christmas-at-tierpark": {
    name: "Weihnachten im Tierpark",
    description:
      "Der Tierpark Friedrichsfelde in festlichem Gewand: leuchtende Kunstinstallationen, Winterbuden und Tiere in winterlicher Ruhe.",
  },
  "advent-concert-philharmonic": {
    name: "Adventskonzert in der Berliner Philharmonie",
    description:
      "Weihnachtliche klassische Werke in der warmen Akustik des Kammermusiksaals - eine ruhige Insel im Adventstrubel.",
  },
  "christmas-market-photoshoot": {
    name: "Fotoshooting auf dem Weihnachtsmarkt",
    description:
      "Ein privater Fotograf begleitet euch über den Weihnachtsmarkt und fängt festliche Porträts vor dem Lichterglanz ein.",
  },
  "candle-making-workshop": {
    name: "Kerzenworkshop mit Prosecco",
    description:
      "Eigene Kerzen gießen, beduften und verzieren - in einem praktischen Workshop mit einem Glas Prosecco dazu; Geschenke inklusive.",
  },
  "christmas-pottery-workshop": {
    name: "Privater Weihnachts-Töpferworkshop",
    description:
      "Zwei Stunden festliche Keramik von Hand formen - mit Glühwein in der Hand, in einer kleinen Studiogruppe.",
  },
  "christmas-cooking-class": {
    name: "studio32 Weihnachts-Kochkurs",
    description:
      "Vier Stunden kochen und backen mit einem einheimischen Gastgeber - und mit Gerichten nach Hause gehen, die ein Geschenkpapier wert sind.",
  },
  "christmas-with-bibi-tina": {
    name: "Weihnachten mit Bibi & Tina - Das Musical",
    description:
      "Berliner Winterzeit mit dem pferdeverrückten TV-Liebling: ein dreistündiges Familienmusical.",
  },
};

/** Localized name/description for an attraction; falls back to its JSON text. */
export function attractionText(
  attraction: Attraction,
  locale: Locale,
): AttractionText {
  if (locale === "de" && german[attraction.id]) return german[attraction.id];
  return { name: attraction.name, description: attraction.description };
}
