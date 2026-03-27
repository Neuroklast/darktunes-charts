# Vollständiges Strukturkonzept der Darktunes Charts

Der aktuelle Zyklus schließt in wenigen Tagen ab. Die nachfolgende Struktur bildet das verifizierte Fundament für alle kommenden Zyklen ab April und definiert die gesamte Plattformarchitektur.

1. Musikalische Taxonomie
* Genres: Overall, Metal, Goth, Dark Electro. Diese Liste ist dynamisch erweiterbar.
* Tiers: Newcomer, Rising star, Established, International, Topacts. Die Einstufung erfolgt durch das Einfrieren der Spotify Hörerzahlen zum Zeitpunkt der Einreichung.

2. Benutzerrollen und Dashboards
* Fan: Meldet sich über OAuth an. Nutzt das Fan Dashboard. Stimmt über ein Quadratic Voting System ab und sammelt wöchentliche Energiepunkte.
* Band: Meldet sich über OAuth an und durchläuft einen Background Check. Nutzt das Band Dashboard. Stimmt über Peer Review ab.
* Label: Verwaltet verknüpfte Bands zentral im Label Dashboard. Bands müssen dafür explizit Vollmachten erteilen.
* DJ: Durchläuft eine manuelle Registrierung mit Background Check. Nutzt das DJ Dashboard. Stimmt über die Schulze Methode ab.
* Editor: Verifizierte redaktionelle Mitarbeiter. Verwalten redaktionelle Inhalte.
* Admin: Nur durch direkten Datenbankeingriff erstellbar. Verwalten das System und prüfen Neuanmeldungen.

3. Die Hauptcharts
Alle Kategorien sind rotierende Listen. Jede Liste existiert in getrennten Ansichten für das Fan Voting sowie das DJ Voting und das Band Voting und als finale kombinierte Gesamtliste.
* Basis Einreichungen: Track of the Month und Album of the Month. Die Nominierung hierfür ist absolut kostenlos und wird automatisch in alle passenden Genrelisten geroutet.
* Handwerkliche Musikcharts: Best Vocals, Best Riffs, Best Crossover, Best Concept Album.
* Visuelle Charts: Best Cover Art, Best Merch, Best Music Video. Diese Einträge erfordern zwingend externe Shopverlinkungen oder Videolinks.
* Gemeinschaftscharts: Best Content Creator, Best Lyrics, Social Commitment Award.

4. Event Charts und Startseiten Rotationen
* Ranked Konzerte: Ein Ranking kommender Veranstaltungen auf die sich die Gemeinschaft am meisten freut.
* Best Event Ranking: Eine rückblickende Bewertung bereits vergangener Veranstaltungen.
* Random Band of the Day: Eine rein zufällige und täglich wechselnde Künstlerpräsentation auf der Startseite zur maximalen Entdeckung.

5. Spezifische Rankings und besondere Auszeichnungen
* Engagement Ranking: Eine sortierte Liste die kleine Bands belohnt. Sie berechnet sich rein aus den erhaltenen Stimmen geteilt durch die absoluten Hörerzahlen der Band.
* DJ Curator Ranking: Eine Rangliste aller DJs basierend auf ihrer Entdeckerquote. DJs steigen im Rang wenn sie früh für Bands stimmen die später erfolgreich werden.
* Besondere Awards: Einmalige und manuell vergebene Auszeichnungen für extrem loyale Fans oder besonders faire Labels oder herausragende Bands.

6. Wahlsysteme und Transparenz
* Tripartites System: Das finale Ranking entsteht zu exakt gleichen Teilen aus den drei unabhängigen Wählergruppen.
* Fan Voting: Nutzt isolierte Budgets. Nutzer verteilen Energiepunkte getrennt auf Musik sowie Visuelles und Gemeinschaft.
* Band Voting: Reziprokes Wählen ist verboten. Algorithmen werten gegenseitige Absprachen und Cliquenbildung drastisch ab.
* Verifizierbarkeit: Es gibt ein Live Voting Log. Dieses Log zeigt keine Namen an sondern ausschließlich serverseitig generierte kryptografische Quittungsnummern.
* Barrierefreiheit: Alle Mechaniken sind in einfacher Sprache auf einer zentralen Hilfeseite erklärt. Jedes komplexe UI Element besitzt einen erklärenden Hilfebutton. Deutsch ist die primäre Sprache und Englisch ist auswählbar.

7. Das Symbiosemodell
* Die grundlegende Teilnahme an allen Listen und Kategorien ist für alle Gruppen vollständig kostenlos. Es gibt kein Pay to Win.
* Upselling für Bands: Das kostenpflichtige Amplifier Dashboard bietet detaillierte geografische und demografische Analysen der Wählerschaft ohne das Voting zu beeinflussen.
* Upselling für Fans: Der kostenpflichtige Supporter Pass bietet einen werbefreien Zugang sowie exklusive Profilabzeichen und erweiterte Kommentarfunktionen an Pinnwänden der Künstler.
