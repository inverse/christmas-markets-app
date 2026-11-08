import type { Locale } from "$shared/types";

const english = {
  title: "Berlin Christmas Markets 2026: Dates, Hours & Map",
  description:
    "Find Berlin Christmas markets by date, location, opening hours and admission price. Explore markets across Mitte, Charlottenburg, Prenzlauer Berg, Kreuzberg and more.",
  imageAlt:
    "Berlin Christmas Markets 2026: a map of over 20 Berlin Christmas markets with dates, opening hours and admission prices.",
  checkSite: "Check site",
  openingTimesToBeAnnounced: "Opening times to be announced",
  admission: "Admission",
  address: "Address",
  date: "Date",
  hours: "Hours",
  directions: "Directions",
  viewDetails: "View details",
  bookActivities: "Book activities",
  menuTitle: "Christmas Markets",
  menuSubtitle: "{count} festive highlights in Berlin",
  menu: "Menu",
  welcome: "Welcome",
  about: "About",
  planAVisit: "Plan a visit",
  planAVisitHint:
    "Want to know what's open on a particular day? Pick a date and the map and list will show you.",
  clearDate: "Clear",
  marketsHeading: "Markets",
  shownCount: "{count} shown",
  suggestMarket: "Know a market we're missing? Tell us about it",
  noMarketsOpenOn: "No markets are open on {date}.",
  jumpToDate: "Jump to {date}",
  noMarketsMatch: "No markets match this filter.",
  filterAll: "All",
  filterOpenToday: "Open today",
  filterOpenOn: "Open {date}",
  filterUpcoming: "Upcoming",
  status: {
    open: "Open",
    upcoming: "Upcoming",
    closed: "Closed",
    unknown: "Check Web",
  },
  toursHeading: "Tours & experiences",
  adDisclosure: "Ad",
  findMyLocation: "Find my location",
  dismiss: "Dismiss",
  geoUnavailable: "Geolocation is not available on this device.",
  geoDenied:
    "Location access was denied. Enable it in your browser settings to use find-me.",
  geoPositionUnavailable:
    "Your location is currently unavailable. Check your device signal and try again.",
  geoTimeout: "Getting your location timed out. Please try again.",
  geoUnknown: "Could not get your location: {message}",
  toggleDarkMode: "Toggle dark mode",
  closeMenu: "Close menu",
  noMarketData: "No market data loaded yet.",
  nearestMarket: "Nearest market:",
  youAreHere: "You are here",
  welcomeTitle: "Welcome!",
  welcomeIntro:
    "Find Berlin's brightest Christmas markets, check the dates, and plan a magical festive outing.",
  welcomeSeasonHere: "The season is here!",
  welcomeSeasonHereHint: "Berlin is full of festive magic",
  welcomeSeasonEnded: "The season has ended",
  welcomeSeeYouNextYear: "See you next year!",
  welcomeDays: "days",
  welcomeSeasonNearlyHere: "The season is nearly here",
  welcomeUntilFirstMarket: "until the first market opens",
  welcomeExploreCount: "Explore {count} festive markets across Berlin",
  welcomeStartExploring: "Start exploring",
  closeAboutModal: "Close about modal",
  aboutWhyTitle: "Why I built this",
  aboutWhyBody:
    "Every winter, Berlin comes alive with dozens of Christmas markets, but finding out which ones are open today, where they are, and what dates they run always felt harder than it should be. I built this map to make it simple for locals and visitors to explore the city's festive season and plan outings together.",
  aboutDataTitle: "Where the data comes from",
  aboutDataBefore:
    "Market details and locations come directly from the official",
  aboutDataLink: "Berlin.de Open Data portal",
  aboutDataNote:
    "Opening hours and dates can change due to weather or organiser updates, so it's always a good idea to double-check official event pages before heading out!",
  aboutSupportTitle: "Supporting this project",
  aboutSupportBody:
    "Some attraction and activity links (powered by GetYourGuide) are affiliate links. If you book an activity or tour through them, I may earn a small commission at no additional cost to you. This helps support hosting and maintenance to keep the site free.",
  aboutIosTitle: "Install on iPhone or iPad",
  aboutIosBefore: "In Safari, tap the",
  aboutIosShare: "Share",
  aboutIosMiddle: "button, then choose",
  aboutIosAddToHome: "Add to Home Screen",
  aboutIosAfter: "It then opens full screen, just like a native app.",
  aboutLastBuilt: "Last built: {time}",
  aboutCreatedBy: "Created by",
  aboutTilesBefore: "Map tiles ©",
  aboutTilesMiddle: "contributors, rendered with",
  aboutBackToMap: "Back to Map",
  installApp: "Install app",
  installHint: "Quick access from your home screen.",
  install: "Install",
  dismissInstallPrompt: "Dismiss install prompt",
};

export type Messages = typeof english;

const german: Messages = {
  title: "Berliner Weihnachtsmärkte 2026: Termine, Öffnungszeiten & Karte",
  description:
    "Finden Sie Berliner Weihnachtsmärkte nach Datum, Ort, Öffnungszeiten und Eintrittspreis. Entdecken Sie Märkte in Mitte, Charlottenburg, Prenzlauer Berg, Kreuzberg und mehr.",
  imageAlt:
    "Berliner Weihnachtsmärkte 2026: Karte mit über 20 Märkten und Angaben zu Terminen, Öffnungszeiten und Eintrittspreisen.",
  checkSite: "Website prüfen",
  openingTimesToBeAnnounced: "Öffnungszeiten werden noch bekannt gegeben",
  admission: "Eintritt",
  address: "Adresse",
  date: "Datum",
  hours: "Öffnungszeiten",
  directions: "Route",
  viewDetails: "Details ansehen",
  noMarketData: "Noch keine Marktdaten geladen.",
  nearestMarket: "Nächster Markt:",
  youAreHere: "Sie sind hier",
  bookActivities: "Aktivitäten buchen",
  menuTitle: "Weihnachtsmärkte",
  menuSubtitle: "{count} festliche Highlights in Berlin",
  menu: "Menü",
  welcome: "Willkommen",
  about: "Über",
  planAVisit: "Besuch planen",
  planAVisitHint:
    "Möchten Sie wissen, was an einem bestimmten Tag geöffnet ist? Wählen Sie ein Datum und Karte und Liste zeigen es Ihnen.",
  clearDate: "Löschen",
  marketsHeading: "Märkte",
  shownCount: "{count} angezeigt",
  suggestMarket: "Kennen Sie einen Markt, der fehlt? Erzählen Sie uns davon",
  noMarketsOpenOn: "Keine Märkte geöffnet am {date}.",
  jumpToDate: "Zu {date} springen",
  noMarketsMatch: "Keine Märkte passen zu diesem Filter.",
  filterAll: "Alle",
  filterOpenToday: "Heute geöffnet",
  filterOpenOn: "Geöffnet am {date}",
  filterUpcoming: "Demnächst",
  status: {
    open: "Geöffnet",
    upcoming: "Demnächst",
    closed: "Geschlossen",
    unknown: "Web prüfen",
  },
  toursHeading: "Touren & Erlebnisse",
  adDisclosure: "Werbung",
  findMyLocation: "Meinen Standort finden",
  dismiss: "Schließen",
  geoUnavailable: "Standortbestimmung ist auf diesem Gerät nicht verfügbar.",
  geoDenied:
    "Der Standortzugriff wurde verweigert. Aktivieren Sie ihn in den Browser-Einstellungen, um die Standortsuche zu nutzen.",
  geoPositionUnavailable:
    "Ihr Standort ist derzeit nicht verfügbar. Prüfen Sie das Gerätesignal und versuchen Sie es erneut.",
  geoTimeout:
    "Die Standortabfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.",
  geoUnknown: "Ihr Standort konnte nicht ermittelt werden: {message}",
  toggleDarkMode: "Dunkelmodus umschalten",
  closeMenu: "Menü schließen",
  welcomeTitle: "Willkommen!",
  welcomeIntro:
    "Finden Sie Berlins schönste Weihnachtsmärkte, prüfen Sie die Termine und planen Sie einen magischen Weihnachtsausflug.",
  welcomeSeasonHere: "Die Saison ist da!",
  welcomeSeasonHereHint: "Berlin ist voller festlicher Magie",
  welcomeSeasonEnded: "Die Saison ist vorbei",
  welcomeSeeYouNextYear: "Bis nächstes Jahr!",
  welcomeDays: "Tage",
  welcomeSeasonNearlyHere: "Die Saison steht vor der Tür",
  welcomeUntilFirstMarket: "bis der erste Markt öffnet",
  welcomeExploreCount: "Entdecken Sie {count} festliche Märkte in ganz Berlin",
  welcomeStartExploring: "Los geht's",
  closeAboutModal: "Info-Dialog schließen",
  aboutWhyTitle: "Warum ich das gebaut habe",
  aboutWhyBody:
    "Jeden Winter erwacht Berlin mit Dutzenden von Weihnachtsmärkten zum Leben, aber herauszufinden, welche heute geöffnet sind, wo sie liegen und an welchen Tagen sie stattfinden, war immer schwieriger als nötig. Ich habe diese Karte gebaut, damit Einheimische und Besucher die festliche Saison der Stadt einfach erkunden und gemeinsame Ausflüge planen können.",
  aboutDataTitle: "Woher die Daten stammen",
  aboutDataBefore:
    "Marktdetails und Standorte stammen direkt aus dem offiziellen",
  aboutDataLink: "Berlin.de Open-Data-Portal",
  aboutDataNote:
    "Öffnungszeiten und Termine können sich aufgrund von Wetter oder Änderungen der Veranstalter ändern. Es lohnt sich daher immer, die offiziellen Veranstaltungsseiten vor dem Besuch zu prüfen!",
  aboutSupportTitle: "Dieses Projekt unterstützen",
  aboutSupportBody:
    "Einige Attraktions- und Aktivitätslinks (bereitgestellt von GetYourGuide) sind Affiliate-Links. Wenn Sie darüber eine Aktivität oder Tour buchen, erhalte ich möglicherweise eine kleine Provision - ohne zusätzliche Kosten für Sie. Das hilft, Hosting und Wartung zu finanzieren und die Seite kostenlos zu halten.",
  aboutIosTitle: "Auf iPhone oder iPad installieren",
  aboutIosBefore: "Tippen Sie in Safari auf die",
  aboutIosShare: "Teilen",
  aboutIosMiddle: "-Taste und wählen Sie dann",
  aboutIosAddToHome: "Zum Home-Bildschirm",
  aboutIosAfter:
    "Danach öffnet sie sich im Vollbildmodus, genau wie eine native App.",
  aboutLastBuilt: "Zuletzt erstellt: {time}",
  aboutCreatedBy: "Erstellt von",
  aboutTilesBefore: "Kartenmaterial ©",
  aboutTilesMiddle: "-Mitwirkende, dargestellt mit",
  aboutBackToMap: "Zurück zur Karte",
  installApp: "App installieren",
  installHint: "Schneller Zugriff direkt vom Home-Bildschirm.",
  install: "Installieren",
  dismissInstallPrompt: "Installationshinweis ausblenden",
};

const dictionaries: Record<Locale, Messages> = { en: english, de: german };

export function messages(locale: Locale): Messages {
  return dictionaries[locale];
}

/** Replaces `{key}` placeholders in a message template with values. */
export function interpolate(
  template: string,
  values: Record<string, string>,
): string {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
    template,
  );
}
