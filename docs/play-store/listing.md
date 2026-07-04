# Google Play listing — copy kit

Paste-ready listing content for the Play Console (**Store presence → Main store listing**).
EN is the default (`en-US`); add `es-US` as a translated listing (Console →
Manage translations → Add your own translation).

> The app UI is English-only today (Spanish is on the roadmap — see ROADMAP.md).
> The Spanish listing below says so honestly, in its last line. Keeping the es-US
> listing anyway is deliberate: search discoverability for Spanish speakers now,
> full UI translation later.

---

## App name (30 chars max)

| Locale | Name | Chars |
|---|---|---|
| en-US | `Forage for All: wild food map` | 29 |
| es-US | `Forage for All: mapa de comida` | 30 |

The name is Play's strongest search-ranking signal — "wild food map" puts the
top keywords in the title while keeping the brand first.
Fallback if Google rejects the suffix as keyword-stuffing (rare, but possible):
plain `Forage for All` (14).

## Short description (80 chars max)

| Locale | Copy | Chars |
|---|---|---|
| en-US | `Free, open map of fruit trees & edible plants on public land. No ads, ever.` | 76 |
| es-US | `Mapa libre y abierto de árboles frutales y plantas comestibles. Sin anuncios.` | 77 |

## Full description — en-US (4000 chars max; this one ≈1,990)

```
Billions of pounds of fruit fall to sidewalks every year while the same fruit is shipped in from other continents. Forage for All makes the food already growing around you visible — a community-run map of fruit trees, berries, nuts, and edible plants on public land.

🌳 WHAT YOU'LL FIND
• A living map of edible plants near you — street trees, parks, trailsides
• Thousands of pins already seeded from open data (iNaturalist, GBIF, OpenStreetMap, city street-tree censuses)
• A curated catalog of ~85 species with seasons, toxicity notes, and look-alike warnings
• A ripeness ring on every pin that fills as the season progresses and neighbors confirm
• Toggleable layers per data source, plus an "In Season" view of what's ripe this month

🫐 HOW IT WORKS
Drop a pin, pick the species from the catalog, and mark ripeness. Others confirm what's still there and what's ready. Browse without an account — sign in (a 6-digit email code, no passwords) only when you want to add pins.

🔒 PRIVACY IS THE POINT
• No ads, no analytics, no trackers. Ever.
• Pin coordinates are rounded to a ~110 m grid before they're saved — the neighborhood, not the doorstep
• Your device location never leaves your device; it only centers the map
• Browsing needs no account, and anonymous reports are allowed
Full policy (short and human-readable): forage.techempower.org/privacy.html

🌱 FREE AND OPEN SOURCE
Forage for All is AGPLv3 open source, built by volunteers, run by a 501(c)(3) nonprofit. Free forever: no subscriptions, no paywalls, no venture funding, no data sold. Read the code, file an issue, or contribute at github.com/techempower-org/forageforall.

🤝 THE COMMUNITY CODE
Take a third, leave a third for the birds, leave a third for the earth. Only pin on public land (or with the owner's permission). Sensitive and protected species stay off the map. Never eat what you haven't confirmed — the catalog flags toxic look-alikes, and we deliberately don't ship AI plant-ID that could guess wrong.

Whether you're an urban forager, a gleaner, a food-justice organizer, or a neighbor who hates watching plums hit the pavement: the harvest is already out there. This map helps you find it.
```

## Full description — es-US (≈2,080 chars)

```
Cada año, miles de millones de kilos de fruta caen a las aceras mientras esa misma fruta se importa desde otros continentes. Forage for All hace visible la comida que ya crece a tu alrededor: un mapa comunitario de árboles frutales, bayas, nueces y plantas comestibles en terrenos públicos.

🌳 QUÉ VAS A ENCONTRAR
• Un mapa vivo de plantas comestibles cerca de ti: árboles de calle, parques, senderos
• Miles de puntos ya cargados desde datos abiertos (iNaturalist, GBIF, OpenStreetMap, censos municipales de arbolado)
• Un catálogo curado de ~85 especies con temporadas, notas de toxicidad y advertencias sobre especies parecidas
• Un anillo de maduración en cada punto, que se llena según avanza la temporada y la comunidad confirma
• Capas activables por fuente de datos, más una vista "De temporada" con lo que está maduro este mes

🫐 CÓMO FUNCIONA
Marca un punto, elige la especie del catálogo e indica su maduración. Otras personas confirman qué sigue ahí y qué está listo. Explora sin cuenta — inicia sesión (un código de 6 dígitos por correo, sin contraseñas) solo cuando quieras añadir puntos.

🔒 LA PRIVACIDAD ES EL PUNTO
• Sin anuncios, sin analíticas, sin rastreadores. Nunca.
• Las coordenadas se redondean a una cuadrícula de ~110 m antes de guardarse: el vecindario, no la puerta de tu casa
• La ubicación de tu dispositivo nunca sale de él; solo centra el mapa
• Explorar no requiere cuenta, y se permiten reportes anónimos
Política completa (corta y legible): forage.techempower.org/privacy.html

🌱 GRATIS Y DE CÓDIGO ABIERTO
Forage for All es código abierto (AGPLv3), construido por voluntarios y operado por una organización sin fines de lucro 501(c)(3). Gratis para siempre: sin suscripciones, sin muros de pago, sin capital de riesgo, sin venta de datos. Lee el código en github.com/techempower-org/forageforall.

🤝 EL CÓDIGO DE LA COMUNIDAD
Toma un tercio, deja un tercio para los pájaros y un tercio para la tierra. Marca puntos solo en terrenos públicos (o con permiso del dueño). Las especies protegidas quedan fuera del mapa. Nunca comas lo que no hayas confirmado.

La app está en inglés por ahora — la traducción al español está en camino, y buscamos traductores voluntarios.
```

---

## Category recommendation

**Primary: Maps & Navigation.** Reasoning:

1. **It is what the app is.** The core loop is map-first: open map → browse pins →
   drop pins. Play's category guidance says pick by primary function, and the
   primary function is a specialized map.
2. **Search intent matches.** People looking for this type ("foraging map",
   "fruit tree map", "wild food near me") — map-shaped queries. Category is a
   weak ranking signal vs. title/description, so pick the honest one.
3. **Lifestyle is a burial ground.** It's the miscellaneous drawer (horoscopes,
   wallpaper apps, dating). Nothing about being there helps discovery, and it
   makes the app look less like a tool.

Alternatives considered:

- **Lifestyle** — defensible (foraging-as-hobby framing), but see above.
- **Education** — dark-horse option; iNaturalist sits there. Choose this only if
  the listing pivots toward species-learning rather than finding food.
- **Food & Drink** — wrong; Play uses it for recipes/restaurants/delivery.

Tags (Console → Store settings → Tags, pick up to 5): Maps & Navigation,
Lifestyle, Education — plus whatever of Play's rotating tag vocabulary matches
("Outdoors", "Local" if offered).

## Keywords (woven into the copy above — Play has NO separate keyword field)

Play indexes app name, short description, and full description. These phrases are
already placed in the copy; keep them if you edit:

- foraging / urban foraging / forager
- fruit trees / fruit tree map
- edible plants / wild food / wild edibles
- free food / food map / harvest
- berries, nuts, gleaning
- open source, no ads, privacy
- ES: plantas comestibles, árboles frutales, mapa de comida, cosecha, recolección

## Store listing contact details (Console → Store settings)

- Support email: `jp@techempower.org`
- Website: `https://forage.techempower.org/`
- Privacy policy URL (App content form): `https://forage.techempower.org/privacy.html`
