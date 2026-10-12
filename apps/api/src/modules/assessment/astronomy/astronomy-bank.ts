import type { KeyedFormSnapshot } from '@sapiensmetric/assessment';
import type {
  BankItem,
  BankObjective,
  BankSource,
  LocalizedText,
} from './astronomy-types.js';

/**
 * SYNTHETIC-ADJACENT DRAFT astronomy bank (T-022) — repository-managed,
 * **server-only**, bilingual EN/LT, and **unreviewed**.
 *
 * Scope: the owner's 25-topic list. This is a *draft* bank for local review; it
 * is not the reviewed astronomy pilot, is not calibrated, and must not be
 * presented as a validated assessment. Difficulty labels are editorial estimates.
 *
 * Response kinds: the engine supports four kinds, but every item here uses
 * `single-answer` because these are concept-comprehension items ("which
 * statement is correct?") — a documented, deliberate departure.
 *
 * Answer keys live only here (server side); client-safe projections never expose
 * them for in-progress attempts.
 */

export const ASTRONOMY_ASSESSMENT_ID = 'astronomy-draft';
export const ASTRONOMY_FORM_ID = 'astronomy-draft-form-1';
export const ASTRONOMY_FORM_VERSION = '1.0.0';
export const ASTRONOMY_TRANSLATION_VERSION = 'astro-draft-1';
export const ASTRONOMY_SCORING_RULE_VERSION = '1.0.0';

const t = (en: string, lt: string): LocalizedText => ({ en, lt });

/**
 * Sources. `checked: true` means the drafting session actually opened the page
 * (2026-10-09); `checked: false` means it is a stable authoritative reference to
 * be confirmed during review. ALL entries remain subject to independent review.
 */
export const ASTRONOMY_SOURCES: BankSource[] = [
  { id: 'src-nasa-solar-system', label: 'NASA Science — Solar System', url: 'https://science.nasa.gov/solar-system/', accessed: '2026-10-09', checked: false },
  { id: 'src-nasa-moon', label: 'NASA Science — Moon', url: 'https://science.nasa.gov/moon/', accessed: '2026-10-09', checked: false },
  { id: 'src-nasa-eclipses', label: 'NASA Science — Eclipses', url: 'https://science.nasa.gov/eclipses/', accessed: '2026-10-09', checked: false },
  { id: 'src-nasa-comets', label: 'NASA Science — Comet Facts', url: 'https://science.nasa.gov/solar-system/comets/facts', accessed: '2026-10-09', checked: true },
  { id: 'src-nasa-comet-tails', label: 'NASA — New Insights on Comet Tails Are Blowing in the Solar Wind', url: 'https://www.nasa.gov/solar-system/new-insights-on-comet-tails-are-blowing-in-the-solar-wind/', accessed: '2026-10-09', checked: true },
  { id: 'src-iau-pluto', label: 'IAU — Pluto and the Solar System', url: 'https://www.iau.org/public/themes/pluto/', accessed: '2026-10-09', checked: false },
  { id: 'src-nasa-sun', label: 'NASA Science — Sun', url: 'https://science.nasa.gov/sun/', accessed: '2026-10-09', checked: false },
  { id: 'src-nasa-stars', label: 'NASA Science — Stars', url: 'https://science.nasa.gov/universe/stars/', accessed: '2026-10-09', checked: false },
  { id: 'src-nasa-big-bang', label: 'NASA Science — The Big Bang', url: 'https://science.nasa.gov/universe/the-big-bang/', accessed: '2026-10-09', checked: false },
  { id: 'src-nasa-redshift', label: 'NASA Science — Hubble Cosmological Redshift', url: 'https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-cosmological-redshift/', accessed: '2026-10-09', checked: true },
  { id: 'src-nasa-cmb', label: 'NASA Science — Cosmic Microwave Background', url: 'https://science.nasa.gov/universe/overview/', accessed: '2026-10-09', checked: false },
  { id: 'src-nasa-dark-matter', label: 'NASA Science — Dark Matter', url: 'https://science.nasa.gov/dark-matter', accessed: '2026-10-09', checked: true },
  { id: 'src-nasa-dark-energy', label: 'NASA Science — What is Dark Energy?', url: 'https://science.nasa.gov/dark-energy', accessed: '2026-10-09', checked: true },
  { id: 'src-nasa-milky-way', label: 'NASA Science — Milky Way', url: 'https://science.nasa.gov/universe/galaxies/milky-way/', accessed: '2026-10-09', checked: false },
  { id: 'src-nasa-andromeda', label: 'NASA Science — Apocalypse When? Hubble Casts Doubt on Certainty of Galactic Collision', url: 'https://science.nasa.gov/missions/hubble/apocalypse-when-hubble-casts-doubt-on-certainty-of-galactic-collision/', accessed: '2026-10-09', checked: true },
  { id: 'src-nasa-light-year', label: 'NASA Space Place — What is a light-year?', url: 'https://spaceplace.nasa.gov/light-year/', accessed: '2026-10-09', checked: false },
];

/**
 * Revised blueprint. The T-015 five-objective *Solar-System* blueprint is
 * superseded by this broader astronomy blueprint covering the 25 owner topics.
 * The 25 items are distributed 8/5/4/6/2 across the five objectives — this is
 * NOT "five items per objective" and is not comparable to the earlier proposal.
 */
export const ASTRONOMY_OBJECTIVES: BankObjective[] = [
  { objectiveId: 'astro-obj-earth-moon-sun', title: t('Earth, Moon and the Solar System', 'Žemė, Mėnulis ir Saulės sistema'), topics: [1, 2, 3, 4, 5, 6, 7, 8] },
  { objectiveId: 'astro-obj-stars', title: t('Stars, light and element origins', 'Žvaigždės, šviesa ir elementų kilmė'), topics: [9, 11, 12, 13, 14] },
  { objectiveId: 'astro-obj-galaxies', title: t('Galaxies and the Milky Way', 'Galaktikos ir Paukščių Takas'), topics: [15, 16, 17, 18] },
  { objectiveId: 'astro-obj-cosmology', title: t('The universe: origin, expansion and composition', 'Visata: kilmė, plėtimasis ir sudėtis'), topics: [19, 20, 21, 22, 23, 24] },
  { objectiveId: 'astro-obj-scale', title: t('Astronomical scale and look-back time', 'Astronominiai masteliai ir žvilgsnis į praeitį'), topics: [10, 25] },
];

const PROVENANCE = {
  author: 'AI-assisted draft (unreviewed)',
  rights:
    'Original EN/LT wording written for Sapiens Metric; no third-party text reproduced. Source links are references, not copied content.',
  notes:
    'Draft for local review. Not calibrated; difficulty is an editorial estimate. Requires independent astronomy and EN/LT language review before any publication.',
};

const REVIEW_DEFAULTS = {
  reviewStatus: { content: 'unreviewed', language: 'unreviewed' },
  reviews: { content: null, language: null },
} as const;

let topicCounter = 0;
function item(input: {
  slug: string;
  objectiveId: string;
  difficulty: BankItem['difficulty'];
  relevance: LocalizedText;
  prompt: LocalizedText;
  options: { id: string; text: LocalizedText }[];
  correct: string;
  explanation: LocalizedText;
  distractors: { optionId: string; reason: LocalizedText }[];
  sources: string[];
}): BankItem {
  topicCounter += 1;
  const topic = topicCounter;
  return {
    itemId: `astro-${String(topic).padStart(2, '0')}-${input.slug}`,
    itemVersion: '1.0.0',
    topic,
    topicSlug: input.slug,
    objectiveId: input.objectiveId,
    kind: 'single-answer',
    languageScope: 'neutral',
    translationVersion: ASTRONOMY_TRANSLATION_VERSION,
    difficulty: input.difficulty,
    relevance: input.relevance,
    prompt: input.prompt,
    options: input.options,
    correctOptionIds: [input.correct],
    explanation: input.explanation,
    distractorRationales: input.distractors,
    sources: input.sources,
    provenance: PROVENANCE,
    ...REVIEW_DEFAULTS,
  };
}

export const ASTRONOMY_ITEMS: BankItem[] = [
  item({
    slug: 'seasons', objectiveId: 'astro-obj-earth-moon-sun', difficulty: 'foundational',
    relevance: t('Explains why a single yearly cycle produces opposite seasons in the two hemispheres.', 'Paaiškina, kodėl vienas metų ciklas sukuria priešingus metų laikus abiejuose pusrutuliuose.'),
    prompt: t('What is the main reason Earth has seasons?', 'Kokia pagrindinė priežastis, kodėl Žemėje kinta metų laikai?'),
    options: [
      { id: 'a', text: t('Earth’s distance from the Sun changes enough to cause the seasons.', 'Žemės atstumas iki Saulės pakankamai kinta, todėl kinta metų laikai.') },
      { id: 'b', text: t('Earth’s rotation axis is tilted relative to its orbital plane.', 'Žemės sukimosi ašis yra pakrypusi orbitos plokštumos atžvilgiu.') },
      { id: 'c', text: t('The Sun’s brightness varies over the year.', 'Saulės ryškumas per metus kinta.') },
      { id: 'd', text: t('Earth’s orbital speed changes, heating it unevenly.', 'Žemės orbitinis greitis kinta ir netolygiai ją šildo.') },
    ],
    correct: 'b',
    explanation: t('Earth’s axis is tilted about 23.5°, so each hemisphere receives sunlight at a steeper angle and for longer each day in its summer. Distance to the Sun varies only slightly and is not the main cause.', 'Žemės ašis pakrypusi apie 23,5°, todėl vasarą kiekvienas pusrutulis gauna statesnį saulės spindulių kampą ir ilgesnę dieną. Atstumas iki Saulės kinta nedaug ir nėra pagrindinė priežastis.'),
    distractors: [
      { optionId: 'a', reason: t('Common misconception: Earth is actually closest to the Sun in northern winter.', 'Paplitusi klaida: Šiaurės pusrutulio žiemą Žemė iš tikrųjų yra arčiausiai Saulės.') },
      { optionId: 'c', reason: t('The Sun’s output is roughly steady on yearly timescales.', 'Saulės spinduliuotė per metus kinta labai nedaug.') },
      { optionId: 'd', reason: t('Orbital speed varies but does not drive the seasons.', 'Orbitinis greitis kinta, bet metų laikų nelemia.') },
    ],
    sources: ['src-nasa-solar-system'],
  }),
  item({
    slug: 'moon-same-face', objectiveId: 'astro-obj-earth-moon-sun', difficulty: 'foundational',
    relevance: t('Illustrates how gravity can synchronise rotation and orbit.', 'Parodo, kaip gravitacija gali sinhronizuoti sukimąsi ir orbitą.'),
    prompt: t('Why do we always see the same side of the Moon from Earth?', 'Kodėl iš Žemės visada matome tą pačią Mėnulio pusę?'),
    options: [
      { id: 'a', text: t('The Moon does not rotate at all.', 'Mėnulis visai nesisuka.') },
      { id: 'b', text: t('The Moon rotates once per orbit (synchronous rotation).', 'Mėnulis apsisuka vieną kartą per orbitą (sinchroninis sukimasis).') },
      { id: 'c', text: t('Earth’s shadow hides the far side.', 'Žemės šešėlis uždengia nukreiptąją pusę.') },
      { id: 'd', text: t('The far side is never lit by the Sun.', 'Nukreiptoji pusė niekada neapšviesta Saulės.') },
    ],
    correct: 'b',
    explanation: t('The Moon’s rotation period equals its orbital period (tidal locking), so the same hemisphere faces Earth. The far side is lit by the Sun too and is not permanently hidden.', 'Mėnulio sukimosi periodas lygus orbitos periodui (potvyninė sankaba), todėl į Žemę atsuktas tas pats pusrutulis. Nukreiptoji pusė taip pat apšviesta Saulės ir nėra visam laikui paslėpta.'),
    distractors: [
      { optionId: 'a', reason: t('The Moon does rotate; its rate just matches its orbit.', 'Mėnulis sukasi; tik jo greitis atitinka orbitą.') },
      { optionId: 'c', reason: t('Earth’s shadow causes eclipses, not the constant near side.', 'Žemės šešėlis sukelia užtemimus, o ne nuolatinę artimąją pusę.') },
      { optionId: 'd', reason: t('The far side gets sunlight; we simply do not see it from Earth.', 'Nukreiptoji pusė gauna saulės šviesą; mes jos tiesiog nematome iš Žemės.') },
    ],
    sources: ['src-nasa-moon'],
  }),
  item({
    slug: 'eclipse-frequency', objectiveId: 'astro-obj-earth-moon-sun', difficulty: 'intermediate',
    relevance: t('Shows how orbital geometry, not just alignment, controls predictable events.', 'Parodo, kaip orbitų geometrija, o ne vien išsirikiavimas, lemia nuspėjamus įvykius.'),
    prompt: t('Why does a solar eclipse not happen at every new Moon?', 'Kodėl Saulės užtemimas įvyksta ne kiekvieno jauno Mėnulio metu?'),
    options: [
      { id: 'a', text: t('The Moon’s orbit is tilted about 5° to Earth’s orbit around the Sun.', 'Mėnulio orbita pakrypusi apie 5° Žemės orbitos aplink Saulę atžvilgiu.') },
      { id: 'b', text: t('The Moon is too small to block the Sun.', 'Mėnulis per mažas, kad uždengtų Saulę.') },
      { id: 'c', text: t('Earth rotates too quickly.', 'Žemė sukasi per greitai.') },
      { id: 'd', text: t('The Sun moves across the sky too fast.', 'Saulė per dangų juda per greitai.') },
    ],
    correct: 'a',
    explanation: t('Because the Moon’s orbit is inclined to the ecliptic, at most new Moons the Moon passes above or below the Sun–Earth line; eclipses occur only near the nodes where the orbits cross.', 'Kadangi Mėnulio orbita pakrypusi ekliptikos atžvilgiu, daugumą jaunų Mėnulių jis praeina virš arba po Saulės–Žemės linija; užtemimai įvyksta tik netoli mazgų, kur orbitos susikerta.'),
    distractors: [
      { optionId: 'b', reason: t('The Moon can fully cover the Sun from Earth; size is not the limiting factor.', 'Mėnulis gali visiškai uždengti Saulę nuo Žemės; dydis nėra ribojantis veiksnys.') },
      { optionId: 'c', reason: t('Earth’s rotation affects visibility times, not eclipse frequency.', 'Žemės sukimasis lemia matomumo laiką, o ne užtemimų dažnį.') },
      { optionId: 'd', reason: t('The Sun’s apparent motion is not why eclipses are rare.', 'Regimasis Saulės judėjimas nėra užtemimų retumo priežastis.') },
    ],
    sources: ['src-nasa-eclipses'],
  }),
  item({
    slug: 'orbital-motion', objectiveId: 'astro-obj-earth-moon-sun', difficulty: 'intermediate',
    relevance: t('Explains why planets and comets speed up and slow down along their paths.', 'Paaiškina, kodėl planetos ir kometos savo kelyje įsibėgėja ir sulėtėja.'),
    prompt: t('According to Kepler’s laws, how does a planet’s speed change along its orbit?', 'Pagal Keplerio dėsnius, kaip kinta planetos greitis jos orbitoje?'),
    options: [
      { id: 'a', text: t('It moves fastest when nearest the Sun.', 'Jis juda greičiausiai, kai yra arčiausiai Saulės.') },
      { id: 'b', text: t('Its speed is constant everywhere.', 'Jo greitis visur pastovus.') },
      { id: 'c', text: t('It moves fastest when farthest from the Sun.', 'Jis juda greičiausiai, kai yra toliausiai nuo Saulės.') },
      { id: 'd', text: t('Its speed depends only on its mass.', 'Jo greitis priklauso tik nuo jo masės.') },
    ],
    correct: 'a',
    explanation: t('A planet sweeps equal areas in equal times, so it moves faster near perihelion (closest to the Sun) and slower near aphelion.', 'Planeta per lygius laiko tarpus nubrėžia lygius plotus, todėl perihelyje (arčiausiai Saulės) juda greičiau, o afelyje — lėčiau.'),
    distractors: [
      { optionId: 'b', reason: t('Constant speed would require a circular orbit at fixed distance.', 'Pastovus greitis reikštų apskritą orbitą pastoviu atstumu.') },
      { optionId: 'c', reason: t('Gravity is weaker farther out, so the planet slows there.', 'Toliau gravitacija silpnesnė, todėl planeta ten sulėtėja.') },
      { optionId: 'd', reason: t('Orbital speed is set by the Sun’s gravity, not the planet’s mass.', 'Orbitos greitį lemia Saulės gravitacija, o ne planetos masė.') },
    ],
    sources: ['src-nasa-solar-system'],
  }),
  item({
    slug: 'planet-structure', objectiveId: 'astro-obj-earth-moon-sun', difficulty: 'foundational',
    relevance: t('Builds a mental model of why planet families differ in size, density and composition.', 'Padeda suprasti, kodėl planetų šeimos skiriasi dydžiu, tankiu ir sudėtimi.'),
    prompt: t('Which statement best distinguishes the inner planets from the outer planets?', 'Kuris teiginys geriausiai skiria vidines planetas nuo išorinių?'),
    options: [
      { id: 'a', text: t('Inner planets are small and rocky; outer planets are large and rich in gas and ice.', 'Vidinės planetos mažos ir uolėtos; išorinės – didelės, turtingos dujų ir ledo.') },
      { id: 'b', text: t('Inner planets are made mostly of ice; outer planets are rocky.', 'Vidinės planetos daugiausia ledinės; išorinės – uolėtos.') },
      { id: 'c', text: t('All planets have the same density but differ only in size.', 'Visų planetų tankis vienodas, skiriasi tik dydis.') },
      { id: 'd', text: t('Outer planets have no moons.', 'Išorinės planetos neturi mėnulių.') },
    ],
    correct: 'a',
    explanation: t('Close to the Sun, only materials that condense at high temperatures (rock, metal) formed the small, dense terrestrial planets; farther out, ices and gas could accumulate into the giant planets.', 'Arti Saulės susidarė tik aukštoje temperatūroje kondensuojančios medžiagos (uolienos, metalai), todėl vidinės planetos mažos ir tankios; toliau galėjo kauptis ledai ir dujos, susidarant milžinėms planetoms.'),
    distractors: [
      { optionId: 'b', reason: t('Reversed: the inner planets are the rocky ones.', 'Atvirkščiai: vidinės planetos yra uolėtos.') },
      { optionId: 'c', reason: t('Densities differ strongly; terrestrial planets are far denser than gas giants.', 'Tankiai labai skiriasi; vidinės planetos daug tankesnės už dujų milžines.') },
      { optionId: 'd', reason: t('The outer planets have many moons.', 'Išorinės planetos turi daug mėnulių.') },
    ],
    sources: ['src-nasa-solar-system'],
  }),
  item({
    slug: 'pluto-classification', objectiveId: 'astro-obj-earth-moon-sun', difficulty: 'foundational',
    relevance: t('Shows how scientific categories are defined and revised as knowledge grows.', 'Parodo, kaip mokslinės kategorijos apibrėžiamos ir tikslinamos augant žinioms.'),
    prompt: t('Why is Pluto classified as a dwarf planet rather than a planet?', 'Kodėl Plutonas priskiriamas nykštukinei planetai, o ne planetai?'),
    options: [
      { id: 'a', text: t('It has not cleared its orbital neighbourhood of other bodies.', 'Jis nėra išvalęs savo orbitos aplinkos nuo kitų kūnų.') },
      { id: 'b', text: t('It is too far from the Sun to receive light.', 'Jis per toli nuo Saulės, kad gautų šviesos.') },
      { id: 'c', text: t('It has no moons.', 'Jis neturi mėnulių.') },
      { id: 'd', text: t('It orbits in a perfect circle.', 'Jis skrieja tobulu apskritimu.') },
    ],
    correct: 'a',
    explanation: t('The IAU definition requires a planet to orbit the Sun, be nearly round, and have cleared its orbital neighbourhood. Pluto is round and orbits the Sun but shares the Kuiper Belt, so it is a dwarf planet.', 'Tarptautinės astronomų sąjungos apibrėžimas reikalauja, kad planeta skrietų apie Saulę, būtų beveik apvali ir išvaliusi savo orbitos aplinką. Plutonas apvalus ir skrieja apie Saulę, bet dalijasi Kuiperio juosta, todėl yra nykštukinė planeta.'),
    distractors: [
      { optionId: 'b', reason: t('Pluto does reflect sunlight and is visible to telescopes.', 'Plutonas atspindi saulės šviesą ir matomas teleskopais.') },
      { optionId: 'c', reason: t('Pluto has several moons; that is not the criterion.', 'Plutonas turi kelis mėnulius; tai nėra kriterijus.') },
      { optionId: 'd', reason: t('Pluto’s orbit is quite eccentric, not a perfect circle.', 'Plutono orbita gana ištęsta, o ne tobulas apskritimas.') },
    ],
    sources: ['src-iau-pluto'],
  }),
  item({
    slug: 'small-body-terms', objectiveId: 'astro-obj-earth-moon-sun', difficulty: 'intermediate',
    relevance: t('Clarifies everyday astronomy vocabulary that is often confused.', 'Paaiškina kasdienę astronomijos terminiją, kuri dažnai painiojama.'),
    prompt: t('Which sequence correctly describes a rocky body that survives to reach the ground?', 'Kuri seka teisingai apibūdina uolėtą kūną, kuris pasiekia žemę?'),
    options: [
      { id: 'a', text: t('meteoroid (in space) → meteor (light in the atmosphere) → meteorite (on the ground)', 'meteoroidas (erdvėje) → meteoras (šviesa atmosferoje) → meteoritas (ant žemės)') },
      { id: 'b', text: t('meteorite (in space) → meteor (in the atmosphere) → meteoroid (on the ground)', 'meteoritas (erdvėje) → meteoras (atmosferoje) → meteoroidas (ant žemės)') },
      { id: 'c', text: t('asteroid (in the atmosphere) → meteoroid (on the ground) → meteor (in space)', 'asteroidas (atmosferoje) → meteoroidas (ant žemės) → meteoras (erdvėje)') },
      { id: 'd', text: t('All three words mean exactly the same thing.', 'Visi trys žodžiai reiškia tą patį.') },
    ],
    correct: 'a',
    explanation: t('A meteoroid is a small rocky/icy body in space; a meteor is the streak of light as it burns through the atmosphere; a meteorite is the part that lands. An asteroid is a much larger body, mostly in the asteroid belt.', 'Meteoroidas – mažas uolėtas/ledinis kūnas erdvėje; meteoras – šviesos ruožas, kūnui degant atmosferoje; meteoritas – nukritusi dalis. Asteroidas – daug didesnis kūnas, daugiausia asteroidų juostoje.'),
    distractors: [
      { optionId: 'b', reason: t('Reversed ordering; "meteorite" is the ground object.', 'Atvirkščia tvarka; „meteoritas“ yra ant žemės.') },
      { optionId: 'c', reason: t('Asteroids are large belt bodies, not atmospheric ones.', 'Asteroidai – dideli juostos kūnai, o ne atmosferos.') },
      { optionId: 'd', reason: t('The terms are related but distinct.', 'Terminai susiję, bet skirtingi.') },
    ],
    sources: ['src-nasa-solar-system'],
  }),
  item({
    slug: 'comet-tails', objectiveId: 'astro-obj-earth-moon-sun', difficulty: 'intermediate',
    relevance: t('Shows how the Sun shapes material far beyond the planets.', 'Parodo, kaip Saulė veikia medžiagą toli už planetų.'),
    prompt: t('How do a comet’s two tails behave?', 'Kaip elgiasi dvi kometos uodegos?'),
    options: [
      { id: 'a', text: t('Both point roughly away from the Sun: the curved dust tail is pushed by sunlight, the straight ion tail by the solar wind.', 'Abi nukreiptos maždaug nuo Saulės: lenktą dulkių uodegą stumia saulės šviesa, tiesią jonų uodegą – saulės vėjas.') },
      { id: 'b', text: t('Both trail straight behind the comet along its direction of motion.', 'Abi tiesiai velkasi paskui kometą jos judėjimo kryptimi.') },
      { id: 'c', text: t('The dust tail points towards the Sun; the ion tail points away.', 'Dulkių uodega nukreipta į Saulę; jonų – nuo jos.') },
      { id: 'd', text: t('A comet has only one tail, made of ice.', 'Kometa turi tik vieną ledo uodegą.') },
    ],
    correct: 'a',
    explanation: t('Sunlight (radiation pressure) pushes dust into a curved, whitish tail; the solar wind (charged particles) drives the straight, bluish ion tail. Both point generally away from the Sun, not simply along the comet’s path.', 'Saulės šviesa (spinduliuotės slėgis) stumia dulkės į lenktą baltą uodegą; saulės vėjas (įkrautos dalelės) formuoja tiesią melsvą jonų uodegą. Abi paprastai nukreiptos nuo Saulės, o ne vien pagal kometos kelią.'),
    distractors: [
      { optionId: 'b', reason: t('Tails are anti-sunward, so they can appear to lead when the comet moves away.', 'Uodegos nukreiptos nuo Saulės, todėl kometai tolstant gali atrodyti priekyje.') },
      { optionId: 'c', reason: t('Neither tail points at the Sun.', 'Nė viena uodega nenukreipta į Saulę.') },
      { optionId: 'd', reason: t('Comets have two tails — dust and ion.', 'Kometos turi dvi uodegas – dulkių ir jonų.') },
    ],
    sources: ['src-nasa-comets', 'src-nasa-comet-tails'],
  }),
  item({
    slug: 'stellar-energy', objectiveId: 'astro-obj-stars', difficulty: 'intermediate',
    relevance: t('Explains the energy source that keeps stars shining for billions of years.', 'Paaiškina energijos šaltinį, dėl kurio žvaigždės šviečia milijardus metų.'),
    prompt: t('What is the main energy source of an ordinary star like the Sun?', 'Koks pagrindinis paprastos žvaigždės, tokios kaip Saulė, energijos šaltinis?'),
    options: [
      { id: 'a', text: t('Nuclear fusion of hydrogen into helium in its core.', 'Vandenilio branduolių sintezė į helį žvaigždės branduolyje.') },
      { id: 'b', text: t('Chemical burning of hydrogen with oxygen.', 'Cheminis vandenilio degimas su deguonimi.') },
      { id: 'c', text: t('Gravitational contraction alone, forever.', 'Vien tik gravitacinis susitraukimas, amžinai.') },
      { id: 'd', text: t('Reflection of light from nearby stars.', 'Šviesos atspindys nuo netoliese esančių žvaigždžių.') },
    ],
    correct: 'a',
    explanation: t('Stars like the Sun fuse hydrogen into helium in their cores, converting a tiny amount of mass into energy. Chemical burning is far too weak and short-lived; contraction only matters before fusion begins.', 'Tokios žvaigždės kaip Saulė branduolyje sulieja vandenilį į helį, virsdamos nedidelę masės dalį energija. Cheminis degimas per silpnas ir trumpalaikis; susitraukimas svarbus tik iki sintezės pradžios.'),
    distractors: [
      { optionId: 'b', reason: t('The Sun is not a chemical fire; chemical energy would last only briefly.', 'Saulė nėra cheminis ugnis; cheminės energijos užtektų trumpai.') },
      { optionId: 'c', reason: t('Contraction cannot power the Sun for billions of years.', 'Susitraukimas negali maitinti Saulės milijardus metų.') },
      { optionId: 'd', reason: t('Stars emit their own light; they do not shine by reflection.', 'Žvaigždės spinduliuoja savo šviesą; jos nešviečia atspindžiu.') },
    ],
    sources: ['src-nasa-sun'],
  }),
  item({
    slug: 'light-year', objectiveId: 'astro-obj-scale', difficulty: 'foundational',
    relevance: t('Gives an intuition for the enormous distances between stars and galaxies.', 'Padeda pajusti milžiniškus atstumus tarp žvaigždžių ir galaktikų.'),
    prompt: t('A light-year is a unit of…', 'Šviesmetis yra … vienetas'),
    options: [
      { id: 'a', text: t('distance', 'atstumo') },
      { id: 'b', text: t('time', 'laiko') },
      { id: 'c', text: t('brightness', 'ryškumo') },
      { id: 'd', text: t('speed', 'greičio') },
    ],
    correct: 'a',
    explanation: t('A light-year is the distance light travels in one year (about 9.46 trillion km). It measures distance, even though the name contains "year".', 'Šviesmetis – atstumas, kurį šviesa nukeliauja per metus (apie 9,46 trilijono km). Tai atstumo matas, nors pavadinime yra „metai“.'),
    distractors: [
      { optionId: 'b', reason: t('It measures distance, not elapsed time.', 'Tai atstumo, o ne praėjusio laiko matas.') },
      { optionId: 'c', reason: t('Brightness (magnitude/luminosity) is separate.', 'Ryškumas (magnitudė/šviesis) yra atskiras dydis.') },
      { optionId: 'd', reason: t('The speed of light is fixed; a light-year is a distance.', 'Šviesos greitis pastovus; šviesmetis – atstumas.') },
    ],
    sources: ['src-nasa-light-year'],
  }),
  item({
    slug: 'twinkling', objectiveId: 'astro-obj-stars', difficulty: 'intermediate',
    relevance: t('Connects a familiar night-sky effect to Earth’s atmosphere.', 'Susieja pažįstamą naktinio dangaus reiškinį su Žemės atmosfera.'),
    prompt: t('Why do stars twinkle (scintillate) but planets usually do not?', 'Kodėl žvaigždės mirga (scintiliuoja), o planetos paprastai ne?'),
    options: [
      { id: 'a', text: t('Turbulence in Earth’s atmosphere bends starlight; planets appear as small discs, which averages the effect.', 'Žemės atmosferos turbulencija laužo žvaigždžių šviesą; planetos matomos kaip maži diskai, todėl efektas išsilygina.') },
      { id: 'b', text: t('Stars physically flicker; planets shine steadily.', 'Žvaigždės fiziškai mirga; planetos šviečia tolygiai.') },
      { id: 'c', text: t('Planets are always brighter than stars.', 'Planetos visada ryškesnės už žvaigždes.') },
      { id: 'd', text: t('Stars are closer than planets.', 'Žvaigždės arčiau nei planetos.') },
    ],
    correct: 'a',
    explanation: t('Atmospheric turbulence makes a point-like source appear to jump and change brightness. A planet is a tiny disc, so the many slightly different paths average out, reducing twinkling.', 'Atmosferos turbulencija verčia taškinį šaltinį regimai šokinėti ir keisti ryškumą. Planeta – mažas diskas, todėl daug šiek tiek skirtingų kelių išsilygina ir mirgėjimas sumažėja.'),
    distractors: [
      { optionId: 'b', reason: t('Stars do not physically flicker; the atmosphere does it.', 'Žvaigždės fiziškai nemirga; tai daro atmosfera.') },
      { optionId: 'c', reason: t('Apparent brightness varies; that is not the cause.', 'Regimasis ryškumas kinta; tai ne priežastis.') },
      { optionId: 'd', reason: t('The planets are far closer than the stars.', 'Planetos daug arčiau nei žvaigždės.') },
    ],
    sources: ['src-nasa-stars'],
  }),
  item({
    slug: 'stellar-remnants', objectiveId: 'astro-obj-stars', difficulty: 'intermediate',
    relevance: t('Shows the life cycle that links stars to exotic compact objects.', 'Parodo gyvavimo ciklą, siejantį žvaigždes su egzotiniais kompaktiškais objektais.'),
    prompt: t('What does a star like the Sun leave behind after it ends its life?', 'Ką palieka tokia kaip Saulė žvaigždė, baigusi gyvavimą?'),
    options: [
      { id: 'a', text: t('A white dwarf (with a planetary nebula).', 'Baltoji nykštukė (su planetiniu ūku).') },
      { id: 'b', text: t('A black hole.', 'Juodoji bedugnė.') },
      { id: 'c', text: t('Nothing at all.', 'Visiškai nieko.') },
      { id: 'd', text: t('A new protostar immediately.', 'Iš karto nauja pirmžvaigždė.') },
    ],
    correct: 'a',
    explanation: t('Low- and medium-mass stars shed their outer layers and leave a dense white dwarf. Only much more massive stars leave neutron stars or black holes.', 'Mažos ir vidutinės masės žvaigždės nusimeta išorinius sluoksnius ir palieka tankią baltąją nykštukę. Tik daug masyvesnės žvaigždės palieka neutronines žvaigždes ar juodąsias bedugnes.'),
    distractors: [
      { optionId: 'b', reason: t('The Sun is not massive enough to leave a black hole.', 'Saulė per mažai masyvi, kad paliktų juodąją bedugnę.') },
      { optionId: 'c', reason: t('A remnant such as a white dwarf remains.', 'Lieka liekana, pavyzdžiui, baltoji nykštukė.') },
      { optionId: 'd', reason: t('Remnants do not immediately reignite as protostars.', 'Liekana iš karto neužsidega kaip pirmžvaigždė.') },
    ],
    sources: ['src-nasa-stars'],
  }),
  item({
    slug: 'heavy-elements', objectiveId: 'astro-obj-stars', difficulty: 'advanced',
    relevance: t('Explains where the atoms in our bodies and planet were made.', 'Paaiškina, kur susidarė mūsų kūną ir planetą sudarantys atomai.'),
    prompt: t('Where were most elements heavier than helium produced?', 'Kur susidarė dauguma už helį sunkesnių elementų?'),
    options: [
      { id: 'a', text: t('Mostly inside stars and in stellar explosions/mergers, then dispersed.', 'Daugiausia žvaigždžių viduje ir žvaigždžių sprogimuose/susiliejimuose, vėliau išsklaidyti.') },
      { id: 'b', text: t('Only during the Big Bang.', 'Tik Didžiojo sprogimo metu.') },
      { id: 'c', text: t('In Earth’s atmosphere.', 'Žemės atmosferoje.') },
      { id: 'd', text: t('In the space between galaxies, from nothing.', 'Erdvėje tarp galaktikų, iš nieko.') },
    ],
    correct: 'a',
    explanation: t('The Big Bang produced mainly hydrogen, helium and traces of lithium. Heavier elements were forged by fusion inside stars and, for the heaviest, in supernovae and neutron-star mergers, then spread into space.', 'Didysis sprogimas sukūrė daugiausia vandenilį, helį ir pėdsakus ličio. Sunkesni elementai susidarė sintezėje žvaigždžių viduje, o sunkiausi – supernovose ir neutroninių žvaigždžių susiliejimuose, vėliau išsisklaidydami erdvėje.'),
    distractors: [
      { optionId: 'b', reason: t('Big Bang nucleosynthesis made almost only H and He.', 'Didžiojo sprogimo nukleosintezė sukūrė beveik vien H ir He.') },
      { optionId: 'c', reason: t('Earth’s atmosphere did not create the elements.', 'Žemės atmosfera elementų nesukūrė.') },
      { optionId: 'd', reason: t('Elements are not created from nothing in empty space.', 'Elementai nesusidaro iš nieko tuščioje erdvėje.') },
    ],
    sources: ['src-nasa-stars'],
  }),
  item({
    slug: 'supernovae', objectiveId: 'astro-obj-stars', difficulty: 'intermediate',
    relevance: t('Connects cosmic explosions to new stars and the chemistry of galaxies.', 'Susieja kosminius sprogimus su naujomis žvaigždėmis ir galaktikų chemija.'),
    prompt: t('Which of these is a major consequence of supernovae?', 'Kuri iš šių yra svarbi supernovų pasekmė?'),
    options: [
      { id: 'a', text: t('They disperse heavy elements and can trigger new star formation.', 'Jos išsklaido sunkius elementus ir gali paskatinti naujų žvaigždžių formavimąsi.') },
      { id: 'b', text: t('They stop all star formation permanently.', 'Jos visam laikui sustabdo žvaigždžių formavimąsi.') },
      { id: 'c', text: t('They create new galaxies directly.', 'Jos tiesiogiai sukuria naujas galaktikas.') },
      { id: 'd', text: t('They have no effect beyond the star itself.', 'Jos neveikia nieko už pačios žvaigždės.') },
    ],
    correct: 'a',
    explanation: t('Supernovae enrich the interstellar medium with heavier elements, can compress nearby gas and trigger star birth, and leave compact remnants. Type Ia supernovae are also used as distance indicators.', 'Supernovos praturtina tarpžvaigždinę terpę sunkesniais elementais, gali suspausti netoliese esančias dujas ir paskatinti žvaigždžių gimimą, o palieka kompaktiškas liekanas. Ia tipo supernovos naudojamos ir atstumams nustatyti.'),
    distractors: [
      { optionId: 'b', reason: t('They can trigger, not stop, star formation.', 'Jos gali paskatinti, o ne sustabdyti žvaigždžių formavimąsi.') },
      { optionId: 'c', reason: t('Galaxies are far larger than a single supernova.', 'Galaktikos daug didesnės už vieną supernovą.') },
      { optionId: 'd', reason: t('They strongly affect the surrounding interstellar medium.', 'Jos stipriai veikia supančią tarpžvaigždinę terpę.') },
    ],
    sources: ['src-nasa-stars'],
  }),
  item({
    slug: 'milky-way-structure', objectiveId: 'astro-obj-galaxies', difficulty: 'foundational',
    relevance: t('Places our Solar System within a much larger structure.', 'Įkurdina mūsų Saulės sistemą daug didesnėje struktūroje.'),
    prompt: t('Where is the Solar System located in the Milky Way?', 'Kur Paukščių Tako galaktikoje yra Saulės sistema?'),
    options: [
      { id: 'a', text: t('In a spiral arm, roughly 26,000 light-years from the galactic centre.', 'Spiralinėje atšakoje, maždaug 26 000 šviesmečių nuo galaktikos centro.') },
      { id: 'b', text: t('At the very centre, near the supermassive black hole.', 'Pačiame centre, netoli supermasyvios juodosios bedugnės.') },
      { id: 'c', text: t('In a spherical halo far outside the disk.', 'Sferiniame halėje, toli už disko.') },
      { id: 'd', text: t('Outside the Milky Way, in a separate galaxy.', 'Už Paukščių Tako, kitoje galaktikoje.') },
    ],
    correct: 'a',
    explanation: t('The Sun lies in the disk, in the Orion Arm, about 26,000 light-years from the centre — well away from the central supermassive black hole (Sagittarius A*).', 'Saulė yra diske, Oriono atšakoje, apie 26 000 šviesmečių nuo centro – toli nuo centrinės supermasyvios juodosios bedugnės (Sagittarius A*).'),
    distractors: [
      { optionId: 'b', reason: t('The centre is a dense, high-radiation region far from us.', 'Centras – tanki, stiprios radiacijos sritis, toli nuo mūsų.') },
      { optionId: 'c', reason: t('The Sun is in the disk, not the halo.', 'Saulė yra diske, o ne halėje.') },
      { optionId: 'd', reason: t('The Solar System is inside the Milky Way.', 'Saulės sistema yra Paukščių Tako viduje.') },
    ],
    sources: ['src-nasa-milky-way'],
  }),
  item({
    slug: 'astronomy-scale-terms', objectiveId: 'astro-obj-galaxies', difficulty: 'foundational',
    relevance: t('Prevents category mistakes when reading astronomy news.', 'Padeda išvengti kategorijų painiavos skaitant astronomijos naujienas.'),
    prompt: t('Which ordering goes from smallest to largest?', 'Kuri seka išdėstyta nuo mažiausio iki didžiausio?'),
    options: [
      { id: 'a', text: t('star → star system → galaxy → universe', 'žvaigždė → žvaigždžių sistema → galaktika → visata') },
      { id: 'b', text: t('galaxy → star → universe → star system', 'galaktika → žvaigždė → visata → žvaigždžių sistema') },
      { id: 'c', text: t('universe → galaxy → star → star system', 'visata → galaktika → žvaigždė → žvaigždžių sistema') },
      { id: 'd', text: t('star system → universe → star → galaxy', 'žvaigždžių sistema → visata → žvaigždė → galaktika') },
    ],
    correct: 'a',
    explanation: t('A star is a single self-luminous body; a star system is a few stars bound together; a galaxy contains billions of stars; the universe contains all galaxies.', 'Žvaigždė – vienas savaiminio švytėjimo kūnas; žvaigždžių sistema – kelios susietos žvaigždės; galaktika turi milijardus žvaigždžių; visata apima visas galaktikas.'),
    distractors: [
      { optionId: 'b', reason: t('A galaxy is far larger than a single star.', 'Galaktika daug didesnė už vieną žvaigždę.') },
      { optionId: 'c', reason: t('Reversed: the universe is the largest.', 'Atvirkščiai: visata yra didžiausia.') },
      { optionId: 'd', reason: t('The universe is larger than a galaxy.', 'Visata didesnė už galaktiką.') },
    ],
    sources: ['src-nasa-milky-way'],
  }),
  item({
    slug: 'galaxy-centres', objectiveId: 'astro-obj-galaxies', difficulty: 'intermediate',
    relevance: t('Links the structure of galaxies to the most extreme objects known.', 'Susieja galaktikų sandarą su ekstremaliausiais žinomais objektais.'),
    prompt: t('What is generally found at the centre of a massive galaxy?', 'Kas paprastai yra masyvios galaktikos centre?'),
    options: [
      { id: 'a', text: t('A supermassive black hole.', 'Supermasyvi juodoji bedugnė.') },
      { id: 'b', text: t('A single ordinary star.', 'Viena paprasta žvaigždė.') },
      { id: 'c', text: t('A planet.', 'Planeta.') },
      { id: 'd', text: t('Empty space with no mass.', 'Tuščia erdvė be masės.') },
    ],
    correct: 'a',
    explanation: t('Dynamical evidence shows a supermassive black hole at the centre of the Milky Way (Sagittarius A*, about four million solar masses) and of most massive galaxies.', 'Dinaminiai duomenys rodo supermasyvią juodąją bedugnę Paukščių Tako centre (Sagittarius A*, apie keturis milijonus Saulės masių) ir daugumos masyvių galaktikų centruose.'),
    distractors: [
      { optionId: 'b', reason: t('The central mass is millions of times the Sun’s mass.', 'Centrinė masė milijonus kartų didesnė už Saulės masę.') },
      { optionId: 'c', reason: t('A planet is far too small.', 'Planeta per maža.') },
      { optionId: 'd', reason: t('Stars orbit a large unseen central mass.', 'Žvaigždės skrieja apie didelę nematomą centrinę masę.') },
    ],
    sources: ['src-nasa-milky-way'],
  }),
  item({
    slug: 'andromeda-encounter', objectiveId: 'astro-obj-galaxies', difficulty: 'advanced',
    relevance: t('Shows how scientific predictions are revised as measurements and models improve.', 'Parodo, kaip mokslinės prognozės tikslinamos gerėjant matavimams ir modeliams.'),
    prompt: t('What do current observations and simulations say about a future Milky Way–Andromeda collision?', 'Ką dabartiniai stebėjimai ir modeliai sako apie būsimą Paukščių Tako ir Andromedos susidūrimą?'),
    options: [
      { id: 'a', text: t('A merger is possible but uncertain: roughly a 50-50 chance within about 10 billion years (recent 2025 analysis).', 'Susiliejimas įmanomas, bet neaiškus: maždaug 50/50 tikimybė per apie 10 milijardų metų (2025 m. analizė).') },
      { id: 'b', text: t('A head-on collision in 4 billion years is certain.', 'Susidūrimas priešpriešiais po 4 milijardų metų yra tikras.') },
      { id: 'c', text: t('Andromeda is moving away and will never meet the Milky Way.', 'Andromeda tolsta ir niekada nesusitiks su Paukščių Taku.') },
      { id: 'd', text: t('They have already collided.', 'Jie jau susidūrė.') },
    ],
    correct: 'a',
    explanation: t('Andromeda is approaching, but the outcome depends on uncertain sideways motion and other masses. A 2025 Hubble/Gaia study found about a 50% chance of merging within ~10 billion years, with only ~2% for a head-on collision in 4–5 billion years — far less certain than earlier predictions.', 'Andromeda artėja, bet baigtis priklauso nuo neaiškaus šoninio judėjimo ir kitų masių. 2025 m. „Hubble“/„Gaia“ tyrimas rado apie 50 % tikimybę susilieti per ~10 milijardų metų, o tik ~2 % – priešpriešiniam susidūrimui po 4–5 milijardų metų — daug neaiškiau nei ankstesnės prognozės.'),
    distractors: [
      { optionId: 'b', reason: t('Earlier certainty (2012) was revised by newer data.', 'Ankstesnis tikrumas (2012) buvo patikslintas naujais duomenimis.') },
      { optionId: 'c', reason: t('Andromeda is approaching, not receding.', 'Andromeda artėja, o ne tolsta.') },
      { optionId: 'd', reason: t('No collision has occurred; it is a future possibility.', 'Susidūrimo nebuvo; tai ateities galimybė.') },
    ],
    sources: ['src-nasa-andromeda'],
  }),
  item({
    slug: 'big-bang-model', objectiveId: 'astro-obj-cosmology', difficulty: 'intermediate',
    relevance: t('Corrects the common picture of the Big Bang as an explosion in space.', 'Pataiso paplitusį Didžiojo sprogimo kaip sprogimo erdvėje vaizdą.'),
    prompt: t('Which statement best describes the Big Bang model?', 'Kuris teiginys geriausiai apibūdina Didžiojo sprogimo modelį?'),
    options: [
      { id: 'a', text: t('The universe expanded from a hot, dense early state about 13.8 billion years ago.', 'Visata plėtėsi iš karštos, tankios ankstyvos būsenos maždaug prieš 13,8 milijardo metų.') },
      { id: 'b', text: t('Matter exploded outward into pre-existing empty space.', 'Medžiaga sprogo į jau egzistavusią tuščią erdvę.') },
      { id: 'c', text: t('It happened at a single point in today’s sky.', 'Tai įvyko viename dabartinio dangaus taške.') },
      { id: 'd', text: t('It replaced gravity with expansion.', 'Jis pakeitė gravitaciją plėtimusi.') },
    ],
    correct: 'a',
    explanation: t('The Big Bang describes the expansion of space itself from a hot, dense early state, not an explosion of matter into a void. It happened everywhere, not at one location.', 'Didysis sprogimas apibūdina pačios erdvės plėtimąsi iš karštos, tankios ankstyvos būsenos, o ne medžiagos sprogimą į tuštumą. Tai įvyko visur, o ne vienoje vietoje.'),
    distractors: [
      { optionId: 'b', reason: t('Space itself expands; there is no pre-existing void.', 'Pati erdvė plečiasi; nėra iš anksto buvusios tuštumos.') },
      { optionId: 'c', reason: t('Expansion has no single centre in space.', 'Plėtimasis neturi vieno centro erdvėje.') },
      { optionId: 'd', reason: t('Gravity still shapes cosmic structure.', 'Gravitacija ir toliau formuoja kosmines struktūras.') },
    ],
    sources: ['src-nasa-big-bang'],
  }),
  item({
    slug: 'cosmic-ages', objectiveId: 'astro-obj-cosmology', difficulty: 'foundational',
    relevance: t('Anchors our place in time relative to the universe.', 'Nustato mūsų vietą laike visatos atžvilgiu.'),
    prompt: t('What are the approximate ages of the universe and the Solar System?', 'Kokie apytikriai visatos ir Saulės sistemos amžiai?'),
    options: [
      { id: 'a', text: t('Universe ~13.8 billion years; Solar System ~4.6 billion years.', 'Visata ~13,8 mlrd. metų; Saulės sistema ~4,6 mlrd. metų.') },
      { id: 'b', text: t('Both about 4.6 billion years.', 'Abi apie 4,6 mlrd. metų.') },
      { id: 'c', text: t('Universe ~4.6 billion years; Solar System ~13.8 billion years.', 'Visata ~4,6 mlrd.; Saulės sistema ~13,8 mlrd. metų.') },
      { id: 'd', text: t('Both about 500 million years.', 'Abi apie 500 mln. metų.') },
    ],
    correct: 'a',
    explanation: t('Cosmic microwave background and expansion measurements give the universe an age of about 13.8 billion years; meteorite dating gives the Solar System about 4.6 billion years.', 'Reliktinės mikrobangų foninės spinduliuotės ir plėtimosi matavimai rodo, kad visatai apie 13,8 mlrd. metų; meteoritų datavimas rodo, kad Saulės sistemai apie 4,6 mlrd. metų.'),
    distractors: [
      { optionId: 'b', reason: t('The universe is much older than the Solar System.', 'Visata daug senesnė už Saulės sistemą.') },
      { optionId: 'c', reason: t('Reversed ages.', 'Sukeisti amžiai.') },
      { optionId: 'd', reason: t('Both are billions, not hundreds of millions, of years old.', 'Abi yra milijardų, o ne šimtų milijonų metų amžiaus.') },
    ],
    sources: ['src-nasa-big-bang', 'src-nasa-solar-system'],
  }),
  item({
    slug: 'cosmological-redshift', objectiveId: 'astro-obj-cosmology', difficulty: 'advanced',
    relevance: t('Clarifies the evidence for cosmic expansion and avoids a common physical mistake.', 'Paaiškina kosminio plėtimosi įrodymus ir padeda išvengti dažnos fizikinės klaidos.'),
    prompt: t('What is the main cause of the cosmological redshift of distant galaxies?', 'Kokia pagrindinė tolimų galaktikų kosmologinio raudonojo poslinkio priežastis?'),
    options: [
      { id: 'a', text: t('Space itself expands, stretching the light’s wavelength as it travels.', 'Pati erdvė plečiasi ir keliaudama šviesa ištempia jos bangos ilgį.') },
      { id: 'b', text: t('Galaxies physically move through space away from a central explosion point.', 'Galaktikos fiziškai tolsta nuo centrinio sprogimo taško.') },
      { id: 'c', text: t('Dust in space reddens the light.', 'Dulkės erdvėje paraudonuoja šviesą.') },
      { id: 'd', text: t('The galaxies cool down and emit redder light.', 'Galaktikos atvėsta ir spinduliuoja raudonesnę šviesą.') },
    ],
    correct: 'a',
    explanation: t('Cosmological redshift arises because expanding space stretches light waves on their journey; it is distinct from a Doppler shift from motion through space. Greater redshift generally means greater distance.', 'Kosmologinis raudonasis poslinkis atsiranda todėl, kad besiplečianti erdvė ištempia šviesos bangas jų kelyje; tai skiriasi nuo Doplerio poslinkio dėl judėjimo erdvėje. Didesnis poslinkis paprastai reiškia didesnį atstumą.'),
    distractors: [
      { optionId: 'b', reason: t('Expansion is of space itself, not motion through a void from a centre.', 'Plečiasi pati erdvė, o ne judėjimas tuštuma nuo centro.') },
      { optionId: 'c', reason: t('Dust reddening exists but is not the cosmological redshift.', 'Dulkių paraudonavimas egzistuoja, bet tai ne kosmologinis poslinkis.') },
      { optionId: 'd', reason: t('Cooling is not what stretches distant light.', 'Atvėsimas nestempia tolimos šviesos.') },
    ],
    sources: ['src-nasa-redshift'],
  }),
  item({
    slug: 'cmb', objectiveId: 'astro-obj-cosmology', difficulty: 'advanced',
    relevance: t('Introduces the strongest single piece of evidence for the hot early universe.', 'Supažindina su stipriausiu karštos ankstyvosios visatos įrodymu.'),
    prompt: t('What is the cosmic microwave background (CMB)?', 'Kas yra reliktinė mikrobangų foninė spinduliuotė (CMB)?'),
    options: [
      { id: 'a', text: t('Relic radiation from when the early universe first became transparent, about 380,000 years after the Big Bang.', 'Reliktinė spinduliuotė iš laiko, kai ankstyvoji visata pirmąkart tapo skaidri, praėjus apie 380 000 metų po Didžiojo sprogimo.') },
      { id: 'b', text: t('Light from the nearest stars.', 'Šviesa iš artimiausių žvaigždžių.') },
      { id: 'c', text: t('Radio noise from Earth’s atmosphere.', 'Radijo triukšmas iš Žemės atmosferos.') },
      { id: 'd', text: t('The glow of the Milky Way’s centre.', 'Paukščių Tako centro švytėjimas.') },
    ],
    correct: 'a',
    explanation: t('About 380,000 years after the Big Bang the universe cooled enough for atoms to form and light to travel freely. That light, stretched by expansion into microwaves, is the CMB — a nearly uniform 2.7 K glow with tiny ripples.', 'Praėjus apie 380 000 metų po Didžiojo sprogimo visata pakankamai atvėso, kad susidarytų atomai ir šviesa galėtų laisvai keliauti. Dėl plėtimosi į mikrobangas ištempta šviesa yra CMB — beveik tolygus 2,7 K švytėjimas su mažais svyravimais.'),
    distractors: [
      { optionId: 'b', reason: t('It comes from the early universe, not nearby stars.', 'Ji kilusi iš ankstyvosios visatos, o ne iš netolimų žvaigždžių.') },
      { optionId: 'c', reason: t('It is cosmic, measured from space and ground, not local noise.', 'Ji kosminė, matuojama iš kosmoso ir Žemės, o ne vietinis triukšmas.') },
      { optionId: 'd', reason: t('It is not the Milky Way’s glow.', 'Tai nėra Paukščių Tako švytėjimas.') },
    ],
    sources: ['src-nasa-cmb'],
  }),
  item({
    slug: 'dark-matter', objectiveId: 'astro-obj-cosmology', difficulty: 'advanced',
    relevance: t('Shows how unseen mass is inferred from its gravitational effects.', 'Parodo, kaip nematoma masė nustatoma pagal gravitacinį poveikį.'),
    prompt: t('What is the main evidence for dark matter, and what is its nature?', 'Kokia pagrindinė tamsiosios medžiagos įrodymas ir kokia jos prigimtis?'),
    options: [
      { id: 'a', text: t('Galaxy rotation curves and gravitational lensing; its nature is still unknown.', 'Galaktikų sukimosi kreivės ir gravitacinis lęšavimas; jos prigimtis vis dar nežinoma.') },
      { id: 'b', text: t('It glows faintly and has been identified as cold gas.', 'Ji silpnai šviečia ir buvo identifikuota kaip šaltos dujos.') },
      { id: 'c', text: t('It is the same as dark energy.', 'Ji yra tas pats, kas tamsioji energija.') },
      { id: 'd', text: t('There is no evidence for it.', 'Nėra jokių jos įrodymų.') },
    ],
    correct: 'a',
    explanation: t('Stars in galaxies orbit faster than visible mass alone predicts, and lensing and cluster motions imply unseen mass. Many independent observations agree, but the particle nature of dark matter is unknown; it is distinct from dark energy.', 'Žvaigždės galaktikose skrieja greičiau, nei leistų vien matoma masė, o gravitacinis lęšavimas ir spiečių judėjimas rodo nematomą masę. Daug nepriklausomų stebėjimų sutampa, bet tamsiosios medžiagos dalelių prigimtis nežinoma; ji skiriasi nuo tamsiosios energijos.'),
    distractors: [
      { optionId: 'b', reason: t('Dark matter is not observed to emit light.', 'Nestebima, kad tamsioji medžiaga skleistų šviesą.') },
      { optionId: 'c', reason: t('Dark matter and dark energy are considered separate.', 'Tamsioji medžiaga ir tamsioji energija laikomos atskiromis.') },
      { optionId: 'd', reason: t('There is strong indirect evidence.', 'Yra stiprių netiesioginių įrodymų.') },
    ],
    sources: ['src-nasa-dark-matter'],
  }),
  item({
    slug: 'dark-energy', objectiveId: 'astro-obj-cosmology', difficulty: 'advanced',
    relevance: t('Introduces the dominant, least-understood component of the cosmos.', 'Supažindina su dominuojančia, mažiausiai suprantama visatos sudedamąja dalimi.'),
    prompt: t('What is dark energy, and what is the evidence for it?', 'Kas yra tamsioji energija ir kokie jos įrodymai?'),
    options: [
      { id: 'a', text: t('An unknown cause of the accelerating expansion, inferred mainly from distant supernovae; its nature is unknown.', 'Nežinoma spartėjančio plėtimosi priežastis, nustatyta daugiausia iš tolimų supernovų; jos prigimtis nežinoma.') },
      { id: 'b', text: t('Cold gas that slows the expansion.', 'Šaltos dujos, kurios lėtina plėtimąsi.') },
      { id: 'c', text: t('It is the same as dark matter.', 'Ji yra tas pats, kas tamsioji medžiaga.') },
      { id: 'd', text: t('It has been directly detected in the laboratory.', 'Ji buvo tiesiogiai aptikta laboratorijoje.') },
    ],
    correct: 'a',
    explanation: t('Observations of distant Type Ia supernovae in the late 1990s showed the expansion is speeding up. The unknown cause is called dark energy (roughly 68–70% of the energy budget); we do not know what it is.', 'Tolimų Ia tipo supernovų stebėjimai 1990-ųjų pabaigoje parodė, kad plėtimasis spartėja. Nežinoma priežastis vadinama tamsiąja energija (maždaug 68–70 % energijos balanso); nežinome, kas ji yra.'),
    distractors: [
      { optionId: 'b', reason: t('Gas gravitates and slows expansion; dark energy accelerates it.', 'Dujos gravituoja ir lėtina plėtimąsi; tamsioji energija jį spartina.') },
      { optionId: 'c', reason: t('Considered separate from dark matter.', 'Laikoma atskira nuo tamsiosios medžiagos.') },
      { optionId: 'd', reason: t('It has not been directly detected.', 'Ji nebuvo tiesiogiai aptikta.') },
    ],
    sources: ['src-nasa-dark-energy'],
  }),
  item({
    slug: 'look-back-time', objectiveId: 'astro-obj-scale', difficulty: 'foundational',
    relevance: t('Explains why telescopes are time machines.', 'Paaiškina, kodėl teleskopai yra laiko mašinos.'),
    prompt: t('What does it mean that looking at distant objects is looking back in time?', 'Ką reiškia, kad žiūrėdami į tolimus objektus matome praeitį?'),
    options: [
      { id: 'a', text: t('Light takes time to travel, so we see objects as they were when the light left them.', 'Šviesa keliauja laike, todėl matome objektus tokius, kokie jie buvo šviesai išvykstant.') },
      { id: 'b', text: t('Distant objects are actually frozen in time.', 'Tolimi objektai iš tikrųjų sustingę laike.') },
      { id: 'c', text: t('It is an illusion caused by Earth’s atmosphere.', 'Tai iliuzija, kurią sukuria Žemės atmosfera.') },
      { id: 'd', text: t('It only applies to the Moon.', 'Tai galioja tik Mėnuliui.') },
    ],
    correct: 'a',
    explanation: t('Because light has a finite speed, the farther away an object is, the older the light we receive. Sunlight takes about 8 minutes to reach Earth; distant galaxies are seen as they were billions of years ago.', 'Kadangi šviesos greitis baigtinis, kuo toliau objektas, tuo senesnę šviesą gauname. Saulės šviesa Žemę pasiekia per apie 8 minutes; tolimos galaktikos matomos tokios, kokios buvo prieš milijardus metų.'),
    distractors: [
      { optionId: 'b', reason: t('Objects evolve normally; only our view is delayed.', 'Objektai kinta normaliai; vėluoja tik mūsų vaizdas.') },
      { optionId: 'c', reason: t('It is a real consequence of light’s finite speed.', 'Tai tikra baigtinio šviesos greičio pasekmė.') },
      { optionId: 'd', reason: t('It applies to all distant objects.', 'Tai galioja visiems tolimiems objektams.') },
    ],
    sources: ['src-nasa-light-year'],
  }),
];

const objectiveIds = new Set(ASTRONOMY_OBJECTIVES.map((o) => o.objectiveId));
const sourceIds = new Set(ASTRONOMY_SOURCES.map((s) => s.id));

export { objectiveIds as ASTRONOMY_OBJECTIVE_IDS, sourceIds as ASTRONOMY_SOURCE_IDS };

/**
 * Build the keyed engine snapshot for the draft form. This is server-only and
 * contains the answer keys; it must never be returned to the client directly.
 */
export function buildAstronomySnapshot(): KeyedFormSnapshot {
  return {
    assessmentId: ASTRONOMY_ASSESSMENT_ID,
    assessmentVersion: '1.0.0',
    formId: ASTRONOMY_FORM_ID,
    formVersion: ASTRONOMY_FORM_VERSION,
    languageScope: 'neutral',
    translationVersion: ASTRONOMY_TRANSLATION_VERSION,
    scoringRuleVersion: ASTRONOMY_SCORING_RULE_VERSION,
    objectives: ASTRONOMY_OBJECTIVES.map((o) => ({ objectiveId: o.objectiveId })),
    items: ASTRONOMY_ITEMS.map((it) => ({
      itemId: it.itemId,
      itemVersion: it.itemVersion,
      objectiveId: it.objectiveId,
      languageScope: it.languageScope,
      translationVersion: it.translationVersion,
      kind: 'single-answer' as const,
      optionIds: it.options.map((o) => o.id),
      correctOptionId: it.correctOptionIds[0],
    })),
  };
}

/** Find a bank item by id and exact version (feedback/content version pinning). */
export function findAstronomyItem(
  itemId: string,
  itemVersion: string,
): BankItem | null {
  return (
    ASTRONOMY_ITEMS.find(
      (it) => it.itemId === itemId && it.itemVersion === itemVersion,
    ) ?? null
  );
}
