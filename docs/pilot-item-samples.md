# Pilot item samples — astronomy knowledge (T-015 review drafts)

Status: **unpublished review drafts**. These are **not** a production item bank,
**not** approved, and **not** eligible for any live presentation. They are stored
in `docs/` so they are **outside** public content (`apps/web/shared/content/`),
public assets (`apps/web/public/`), and the static export.

- **Authorship:** AI-drafted from written rule specifications, then edited for
  this proposal. **AI drafting and editing is not independent subject-matter or
  language review.**
- **Relevance:** each item carries a **"Why this matters"** note applying the
  owner-approved content-selection principle (understanding the subject helps a
  person make sense of the world).
- **Rights/provenance:** original drafts; no text, prompt, distractor, or visual is
  copied or paraphrased from any protected instrument or third-party item bank.
  Only publicly accessible, authoritative **factual** sources (S-009…S-013) are
  used to key the answers. No IP review (O-007) has occurred and no clearance is
  claimed.
- **Validation:** neither the EN nor the LT version is validated. Translation
  creates a distinct versioned item, not equivalence (S-002).
- **Difficulty:** all "intended difficulty" values are **uncalibrated guesses**.
- **Review status:** every item is `draft — not reviewed`.

Shared rule labels: **scope** `en` / `lt` (authored variants); **type** as shown.
Sources are those in `docs/assessment-sources.md`.

---

## ITEM AST-A1-001

- **Draft ID / revision:** AST-A1-001 / r1
- **Objective:** A1 — Solar System structure and scale
- **Why this matters:** a basic map of the planetary neighbourhood is the frame for
  almost all later astronomy (seasons, eclipses, scale); without it the facts have
  nowhere to sit.
- **Item type:** Ordering (sequence six terrestrial/giant planets from the Sun)
- **Language scope:** `en`, `lt` (distinct authored variants)
- **Prompt (EN):** Place these bodies in order of distance from the Sun, nearest
  first: **Earth, Mercury, Jupiter, Mars, Saturn, Venus**.
- **Prompt (LT):** Išdėliokite šiuos kūnus pagal atstumą nuo Saulės, artimiausią
  pirmą: **Žemė, Merkurijus, Jupiteris, Marsas, Saturnas, Venera**.
- **Correct answer:** Mercury → Venus → Earth → Mars → Jupiter → Saturn.
- **Explanation:** The planets orbit the Sun; in order outward the first four are
  Mercury, Venus, Earth, Mars (terrestrial), then the giant planets, with Jupiter
  before Saturn (S-011).
- **Distractor rationale:** N/A (ordering). Partial orders receive 0 (all-or-
  nothing, `docs/knowledge-pilot-spec.md` §8).
- **Source:** S-011 (NASA Science, "Solar System Facts").
- **Provenance/rights:** original, AI-drafted; no third-party expression used.
- **Intended difficulty:** basic recall/sequencing *(uncalibrated).*
- **Concerns:** ordering interaction needs an accessible (keyboard) alternative;
  LT planet names must use the standard Lithuanian forms (Merkurijus, Venera,
  Žemė, Marsas, Jupiteris, Saturnas). No cultural content.
- **Review status:** `draft — not reviewed`.

## ITEM AST-A2-002

- **Draft ID / revision:** AST-A2-002 / r1
- **Objective:** A2 — Earth's motions and seasons
- **Why this matters:** the seasons are a daily-life and climate topic riddled with
  the distance misconception; correcting it shows how one geometric fact explains
  a familiar experience.
- **Item type:** Single-answer ("best explanation")
- **Language scope:** `en`, `lt`
- **Prompt (EN):** Which statement best explains why the Northern and Southern
  hemispheres have opposite seasons at the same time of year?
  - A. Earth's distance from the Sun changes through the year, warming one hemisphere.
  - B. Earth's axis is tilted, so sunlight strikes the two hemispheres at different angles across the year.
  - C. Earth spins faster during summer.
  - D. The Moon's shadow falls on one hemisphere.
- **Prompt (LT):** Kuris teiginys geriausiai paaiškina, kodėl šiaurės ir pietų
  pusrutuliuose tuo pačiu metų laiku būna priešingi sezonai?
  - A. Žemės atstumas iki Saulės per metus kinta ir labiau šildo vieną pusrutulį.
  - B. Žemės ašis yra pasvirusi, todėl saulės šviesa į abu pusrutulius per metus krinta skirtingais kampais.
  - C. Vasarą Žemė sukasi greičiau.
  - D. Mėnulio šešėlis krinta ant vieno pusrutulio.
- **Correct answer:** B.
- **Explanation:** Seasons result from Earth's axial tilt and the resulting
  differential intensity of sunlight over the year, not from changing distance
  (S-012).
- **Distractor rationale:** A is the common distance misconception; C confuses
  rotation speed; D confuses eclipses with seasons.
- **Source:** S-012 (NGSS MS-ESS1-1, ESS1.B).
- **Provenance/rights:** original, AI-drafted.
- **Intended difficulty:** comprehension/application *(uncalibrated).*
- **Concerns:** wording uses "Northern/Southern" hemispheres without requiring
  local knowledge; no location-specific dates. LT wording keeps "sezonai".
- **Review status:** `draft — not reviewed`.

## ITEM AST-A3-003

- **Draft ID / revision:** AST-A3-003 / r1
- **Objective:** A3 — Moon phases and eclipses
- **Why this matters:** the Moon's cycle underpins calendars and cultural
  references and is the most observable demonstration of how geometry produces
  changing appearances.
- **Item type:** Single-answer (comprehension of cause)
- **Language scope:** `en`, `lt`
- **Prompt (EN):** Why does the **visible illuminated portion** of the Moon change
  over about a month?
  - A. Earth's shadow falls on the Moon.
  - B. The Moon makes its own light, which fades and returns.
  - C. The Sun always illuminates half the Moon, and as the Moon orbits Earth we see different fractions of that illuminated half.
  - D. Clouds hide parts of the Moon.
- **Prompt (LT):** Kodėl per maždaug mėnesį kinta **matoma apšviesta Mėnulio
  dalis**?
  - A. Žemės šešėlis krinta ant Mėnulio.
  - B. Mėnulis pats šviečia, jo šviesa silpnėja ir vėl stiprėja.
  - C. Saulė visada apšviečia pusę Mėnulio, o Mėnuliui skriejant aplink Žemę matome vis kitą apšviestos pusės dalį.
  - D. Debesys uždengia dalį Mėnulio.
- **Correct answer:** C.
- **Explanation:** The Moon is always half-lit by the Sun; phases are the changing
  visible fraction of the illuminated half (S-010).
- **Distractor rationale:** A is the lunar-eclipse misconception; B invents
  self-illumination; D invents a weather cause.
- **Source:** S-010 (NASA Science, "Moon Phases").
- **Provenance/rights:** original, AI-drafted.
- **Intended difficulty:** comprehension *(uncalibrated).*
- **Concerns:** the wording is now **"visible illuminated portion"**, so it does
  not imply the Moon physically changes shape; the LT variant mirrors this. Any
  further "shape" shorthand in feedback must be avoided.
- **Review status:** `draft — not reviewed`.

## ITEM AST-A4-004

- **Draft ID / revision:** AST-A4-004 / **r2 (T-016 correction: removes the
  misleading "orbits a planet, not the Sun" implication)**
- **Objective:** A4 — Object classification
- **Why this matters:** the everyday word "planet" is a defined category with
  conditions (orbit the Sun; roughly round; cleared neighbourhood) and explicit
  exclusions (satellites); knowing why the Moon is a natural satellite clarifies
  how scientific categories are built.
- **Item type:** Single-answer (application of a definition)
- **Language scope:** `en`, `lt`
- **Prompt (EN):** The Moon is Earth's natural satellite and is roughly round.
  Under the IAU definition, why is the Moon classified as a **moon (natural
  satellite)** rather than a planet?
  - A. It is a natural satellite that orbits Earth, and the definition of a planet excludes satellites.
  - B. It is not large enough to be roughly round.
  - C. It has no atmosphere.
  - D. It produces its own light.
- **Prompt (LT):** Mėnulis yra natūralus Žemės palydovas ir yra beveik rutulio
  formos. Pagal IAU apibrėžimą, kodėl Mėnulis priskiriamas **mėnuliui (natūraliam
  palydovui)**, o ne planetai?
  - A. Jis yra natūralus palydovas, skriejantis aplink Žemę, o planetos apibrėžimas neapima palydovų.
  - B. Jis nėra pakankamai didelis, kad būtų beveik rutulio formos.
  - C. Jis neturi atmosferos.
  - D. Jis skleidžia savo pačio šviesą.
- **Correct answer:** A.
- **Explanation:** The IAU defines a planet as a body that orbits the Sun and
  explicitly **excludes satellites**; the Moon is Earth's natural satellite, so it
  is a moon, not a planet (S-009; S-013; S-014). Note precisely: the Earth and the
  Moon **together orbit the Sun** — the reason the Moon is not a planet is that it
  is gravitationally bound to Earth as its satellite, not that it never travels
  around the Sun. B is false (the Moon is roughly round); C is not a criterion; D
  is false (the Moon reflects sunlight).
- **Distractor rationale:** B inverts the roundness fact; C introduces an
  irrelevant property; D repeats the "makes its own light" misconception.
- **Source:** S-009 (IAU Resolution B5), S-013 (NASA, "What is a Planet?"),
  S-014 (NASA, "Top Moon Questions").
- **Provenance/rights:** original, AI-drafted.
- **Intended difficulty:** comprehension/application *(uncalibrated).*
- **Concerns:** r2 removes the earlier misleading option wording; it deliberately
  avoids the "cleared the neighbourhood" concept that AST-A4-005 tests, so the two
  items do not duplicate knowledge or cue each other. LT terms need reviewer
  confirmation. **Not independently reviewed.**
- **Review status:** `draft — not reviewed`.

## ITEM AST-A4-005

- **Draft ID / revision:** AST-A4-005 / r1
- **Objective:** A4 — Object classification
- **Why this matters:** this explains **why** the dwarf-planet category exists — a
  case study in how evidence (orbital neighbourhood) drives classification and why
  a well-known body's label changed. It replaces an earlier draft that asked for
  the exhaustive list of dwarf planets, which tested list memorisation and is
  weaker under the approved principle.
- **Item type:** Multiple-select — **select all that apply** (all-or-nothing)
- **Language scope:** `en`, `lt`
- **Prompt (EN):** Which statements explain why Pluto is classified as a **dwarf
  planet** rather than a planet? Select all that apply.
  - A. It orbits the Sun.
  - B. It has not cleared the neighbourhood around its orbit.
  - C. It shares its orbital region with many similar Kuiper Belt objects.
  - D. It is not roughly round.
- **Prompt (LT):** Kurie teiginiai paaiškina, kodėl Plutonas priskiriamas
  **nykštukinėms planetoms**, o ne planetoms? Pasirinkite visus tinkamus.
  - A. Jis skrieja aplink Saulę.
  - B. Jis neišvalė savo orbitos apylinkių.
  - C. Jis dalijasi savo orbitos sritimi su daugeliu panašių Kuiperio juostos objektų.
  - D. Jis nėra beveik rutulio formos.
- **Correct answer:** B and C.
- **Explanation:** Both planets and dwarf planets orbit the Sun (A is true of
  both, so it does not explain the distinction); what makes Pluto a dwarf planet
  is that it has **not cleared** its orbital neighbourhood and shares that region
  with many Kuiper Belt objects (S-009; S-013). Pluto is in fact near-round, so D
  is false.
- **Distractor rationale:** A is a shared property (non-discriminating); D is a
  plausible-sounding but false roundness claim.
- **Source:** S-009 (IAU Resolution B5), S-013 (NASA, "What is a Planet?").
- **Provenance/rights:** original, AI-drafted.
- **Intended difficulty:** comprehension/application *(uncalibrated).*
- **Concerns:** all-or-nothing scoring may feel harsh; the item requires
  understanding that A is true-but-non-discriminating; LT terms (Kuiperio juosta,
  nykštukinė planeta) need reviewer confirmation.
- **Review status:** `draft — not reviewed`.

## ITEM AST-A5-006

- **Draft ID / revision:** AST-A5-006 / r1
- **Objective:** A5 — Scale and light-time application
- **Why this matters:** astronomical scale and light-time connect to everyday
  reasoning about distance and to reading news about distant objects (and that
  looking out is looking back in time).
- **Item type:** Short numeric/application (single-answer)
- **Language scope:** `en`, `lt`
- **Prompt (EN):** One astronomical unit (AU) — the average Earth–Sun distance —
  is about 150 million km. Light travels at about 300,000 km per second.
  Roughly how long does sunlight take to reach Earth?
  - A. About 8 seconds · B. About 8 minutes · C. About 8 hours · D. About 1 day
- **Prompt (LT):** Vienas astronominis vienetas (AU) — vidutinis atstumas nuo
  Žemės iki Saulės — yra apie 150 mln. km. Šviesa sklinda apie 300 000 km per
  sekundę. Maždaug per kiek laiko Saulės šviesa pasiekia Žemę?
  - A. Apie 8 sekundes · B. Apie 8 minutes · C. Apie 8 valandas · D. Apie 1 dieną
- **Correct answer:** B (≈500 s ≈ 8.3 min).
- **Explanation:** 150,000,000 ÷ 300,000 = 500 seconds ≈ 8 minutes (S-011 for the
  AU; the speed of light is given in the item so the task is self-contained).
- **Distractor rationale:** A confuses the scale with near-Earth distances; C/D
  overestimate by orders of magnitude.
- **Source:** S-011 (AU value).
- **Provenance/rights:** original, AI-drafted.
- **Intended difficulty:** application/calculation *(uncalibrated).*
- **Concerns:** numeric items need unit clarity and a stated tolerance; keep
  "about". LT "mln." and number formatting must be checked by a reviewer.
- **Review status:** `draft — not reviewed`.

## ITEM AST-A3-007

- **Draft ID / revision:** AST-A3-007 / r1
- **Objective:** A3 — Moon phases and eclipses
- **Why this matters:** eclipses are culturally significant, observable events;
  linking them to phase geometry turns a spectacle into something predictable
  rather than mysterious.
- **Item type:** Single-answer (application)
- **Language scope:** `en`, `lt`
- **Prompt (EN):** A solar eclipse (the Moon covering the Sun) can occur only
  when the Moon is in which phase?
  - A. Full Moon · B. First quarter · C. New Moon · D. Any phase
- **Prompt (LT):** Saulės užtemimas (kai Mėnulis uždengia Saulę) gali įvykti tik
  kokioje Mėnulio fazėje?
  - A. Pilnatis · B. Pirmasis ketvirtis · C. Jaunatis · D. Bet kuri fazė
- **Correct answer:** C (New Moon — the Moon is between Earth and the Sun).
- **Explanation:** A solar eclipse requires the Moon to lie between Earth and the
  Sun, which is the new-Moon alignment; a full Moon is the lunar-eclipse
  alignment (S-010, S-012).
- **Distractor rationale:** A is the lunar-eclipse alignment (opposite); B/D
  ignore the required alignment.
- **Source:** S-010, S-012.
- **Provenance/rights:** original, AI-drafted.
- **Intended difficulty:** application *(uncalibrated).*
- **Concerns:** eclipses require a near-exact alignment (orbital inclination), so
  wording says "can occur only when" rather than "always occurs".
- **Review status:** `draft — not reviewed`.

## ITEM AST-A2-008

- **Draft ID / revision:** AST-A2-008 / r1
- **Objective:** A2 — Earth's motions
- **Why this matters:** distinguishing rotation (a day) from revolution (a year) is
  foundational time-keeping and corrects a common conflation.
- **Item type:** Single-answer (comprehension)
- **Language scope:** `en`, `lt`
- **Prompt (EN):** Why does a year last about 365 days?
  - A. Earth rotates once on its axis.
  - B. Earth orbits the Sun once.
  - C. The Moon orbits Earth.
  - D. Earth's axis is tilted.
- **Prompt (LT):** Kodėl metai trunka apie 365 dienas?
  - A. Žemė vieną kartą apsisuka apie savo ašį.
  - B. Žemė vieną kartą apskrieja Saulę.
  - C. Mėnulis apskrieja Žemę.
  - D. Žemės ašis yra pasvirusi.
- **Correct answer:** B.
- **Explanation:** A day corresponds to Earth's rotation; a year corresponds to
  one revolution around the Sun (S-012 for the Earth–Sun system).
- **Distractor rationale:** A confuses rotation (day) with revolution (year);
  C is a month-scale cycle; D causes seasons, not the year.
- **Source:** S-012.
- **Provenance/rights:** original, AI-drafted.
- **Intended difficulty:** comprehension *(uncalibrated).*
- **Concerns:** none specific; keep "about" to allow the ~365.25-day value.
- **Review status:** `draft — not reviewed`.

---

## Sample coverage summary

| Objective | Items | Types present |
| --- | --- | --- |
| A1 Structure & scale | AST-A1-001 | ordering |
| A2 Motions & seasons | AST-A2-002, AST-A2-008 | best-explanation, comprehension |
| A3 Phases & eclipses | AST-A3-003, AST-A3-007 | comprehension, application |
| A4 Classification | AST-A4-004, AST-A4-005 | application, multiple-select (understanding) |
| A5 Scale & light-time | AST-A5-006 | numeric application |

- These 8 items are **review samples**, not a form. The proposed first form is
  **25 items (5 per objective)** (`docs/knowledge-pilot-spec.md`).
- **Balance:** factual recall is retained only where it is a prerequisite for
  reasoning (AST-A1-001, planet order); the rest are comprehension (AST-A2-002,
  AST-A3-003, AST-A2-008) or application (AST-A4-004, AST-A4-005, AST-A5-006,
  AST-A3-007). No objective is assessed by recall alone, and no item is forced to
  measure all three.
- **A4 de-duplication:** AST-A4-004 tests the planet/**satellite** distinction;
  AST-A4-005 tests the planet/**dwarf-planet** reasoning. They no longer share the
  "cleared the neighbourhood" concept, and neither cues the other's answer.
- Every objective has at least one item that is **more than factual recall**, and
  all factual keys come from the authoritative sources in
  `docs/assessment-sources.md`. None of these items is approved for use, and none
  is validated in EN or LT.
- **Independent review pending:** assignment and completion of an independent
  subject-matter reviewer (astronomy) and independent EN/LT language reviewer(s)
  are **prerequisites before publication**. None is assigned or completed, and no
  review is claimed.
