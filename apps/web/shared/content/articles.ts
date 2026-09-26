/**
 * Public articles (T-013). Each article exists in English and Lithuanian as an
 * authored variant. Sources are drawn from the repository's recorded sources.
 */
import type { ArticleContent, LocalizedRecord } from './types';
import { SOURCES } from './site';

const UPDATED = '2026-09-26';

const EN: ArticleContent[] = [
  {
    path: 'articles/how-ability-tests-differ-from-knowledge-tests',
    slug: 'how-ability-tests-differ-from-knowledge-tests',
    title: 'How do ability tests differ from knowledge tests?',
    description:
      'Ability tests target reasoning under novel conditions; knowledge tests target learned content. The distinction changes how a score should be read.',
    h1: 'How do ability tests differ from knowledge tests?',
    intro:
      'The two families are often mixed in one sitting, but they answer different questions and are interpreted differently.',
    blocks: [
      {
        heading: 'Ability (reasoning) tests',
        paragraphs: [
          'Ability or reasoning tasks ask you to work out a relation you have not been taught for that specific item: the next figure in a sequence, a numerical rule, or a spatial transformation. The intended difficulty comes from the reasoning, not from prior content.',
          'Because prior content is not the target, many reasoning tasks use figures or numbers and keep language to a minimum. That reduces, but never removes, the influence of culture and schooling.',
        ],
      },
      {
        heading: 'Knowledge tests',
        paragraphs: [
          'Knowledge tasks target what you have learned: vocabulary, facts, or a subject area. Here prior content is the point, so language and culture are part of the measurement, not noise to remove.',
        ],
      },
      {
        heading: 'Why the distinction matters for interpretation',
        paragraphs: [
          'A knowledge score can be reported per language because a Lithuanian and an English knowledge task are different items, not translations (International Test Commission, 2017). A reasoning score, by contrast, is usually intended to be language-light, so it is authored once and shared.',
          'Mixing the two into a single number hides this difference. Standards guidance treats the proposed interpretation and use as what must be justified by evidence (AERA, APA & NCME, 2014).',
        ],
      },
    ],
    sources: [SOURCES['S-001'], SOURCES['S-002']],
    updated: UPDATED,
  },
  {
    path: 'articles/what-an-online-iq-test-can-tell-you',
    slug: 'what-an-online-iq-test-can-tell-you',
    title: 'What can—and cannot—an online IQ test tell you?',
    description:
      'An online IQ test can give you practice and a score on its own tasks. It cannot give you a validated IQ score without evidence, norms, and controlled conditions.',
    h1: 'What can—and cannot—an online IQ test tell you?',
    intro:
      'The phrase “IQ test” carries a scientific promise that most online tests cannot support. It is worth separating what any online test can do from what only a validated instrument can claim.',
    availabilityNote: true,
    blocks: [
      {
        heading: 'What an online test can do',
        paragraphs: [
          'It can present tasks with defined scoring rules and return a score on those tasks. That is useful for practice, for curiosity about a task type, and as a demonstration of how items work.',
        ],
      },
      {
        heading: 'What it cannot do without evidence',
        paragraphs: [
          'An IQ score is an interpretation: it claims that the score reflects a general cognitive ability for a defined population and use. That claim requires representative norms and validity evidence, not just tasks that look like puzzles (AERA, APA & NCME, 2014).',
        ],
        bullets: [
          'No norms: without a representative comparison group, a percentile is not available.',
          'No validity evidence: without evidence, the score is task performance, not an ability estimate.',
          'Uncontrolled conditions: at home, timing, device, and distractions vary, which weakens comparability.',
        ],
      },
      {
        heading: 'The honest reading',
        paragraphs: [
          'A responsible online test can tell you how you did on its own tasks today, under its own conditions. It should say so plainly, and it should not label the result as an IQ score, a diagnosis, or a hiring signal.',
        ],
      },
      {
        heading: 'Where SapiensMetric stands',
        paragraphs: [
          'SapiensMetric assessments are not released yet, and no norms or validity evidence exist. This article is educational; it describes general limits of online testing, not a capability of our product.',
        ],
      },
    ],
    sources: [SOURCES['S-001'], SOURCES['S-004']],
    updated: UPDATED,
  },
  {
    path: 'articles/why-percentage-correct-is-not-a-percentile',
    slug: 'why-percentage-correct-is-not-a-percentile',
    title: 'Why percentage correct is not a percentile',
    description:
      'Percentage correct is a score on the task. A percentile is a position in a comparison group. Confusing them is one of the most common misreadings of results.',
    h1: 'Why percentage correct is not a percentile',
    intro:
      'The two numbers both look like percentages, which is exactly why they get mixed up.',
    blocks: [
      {
        heading: 'Percentage correct is about the task',
        paragraphs: [
          'Percentage correct is the number of points earned divided by the items attempted. It is a property of your response set and the scoring rule. It says nothing about how others performed.',
        ],
      },
      {
        heading: 'A percentile is about a group',
        paragraphs: [
          'A percentile says where a value sits within a defined comparison group: the share of that group scoring at or below it. It is meaningful only when the comparison group is appropriate and representative (AERA, APA & NCME, 2014).',
        ],
      },
      {
        heading: 'A worked contrast',
        paragraphs: [
          'Imagine two groups. On the same tasks, 80% correct might be near the middle of a high-performing group and near the top of another group. The percentage correct is identical; the percentile differs because the group differs.',
        ],
      },
      {
        heading: 'What follows',
        paragraphs: [
          'Report percentage correct as performance on the task. Report percentiles only when representative norms exist, and always state the comparison group. Do not convert one into the other by intuition.',
        ],
      },
    ],
    sources: [SOURCES['S-001']],
    updated: UPDATED,
  },
];

const LT: ArticleContent[] = [
  {
    path: 'articles/how-ability-tests-differ-from-knowledge-tests',
    slug: 'how-ability-tests-differ-from-knowledge-tests',
    title: 'Kuo gebėjimų testai skiriasi nuo žinių testų?',
    description:
      'Gebėjimų testai nukreipti į samprotavimą naujomis sąlygomis, o žinių testai — į išmoktą turinį. Šis skirtumas keičia tai, kaip reikia skaityti rezultatą.',
    h1: 'Kuo gebėjimų testai skiriasi nuo žinių testų?',
    intro:
      'Šios dvi šeimos dažnai pateikiamos per vieną sesiją, tačiau jos atsako į skirtingus klausimus ir yra interpretuojamos skirtingai.',
    blocks: [
      {
        heading: 'Gebėjimų (samprotavimo) testai',
        paragraphs: [
          'Gebėjimų arba samprotavimo užduotyse reikia atrasti sąryšį, kurio konkrečiai užduočiai nebuvote mokomi: kitą figūrą sekoje, skaičių taisyklę ar erdvinę transformaciją. Sunkumas turėtų kilti iš samprotavimo, o ne iš iš anksto žinomo turinio.',
          'Kadangi prieš tai žinomas turinys nėra tikslas, daug samprotavimo užduočių naudoja figūras ar skaičius ir kiek įmanoma mažiau kalbos. Tai sumažina, bet nepanaikina kultūros ir mokyklos įtakos.',
        ],
      },
      {
        heading: 'Žinių testai',
        paragraphs: [
          'Žinių užduotys nukreiptos į tai, ką išmokote: žodyną, faktus ar dalykinę sritį. Čia prieš tai žinomas turinys yra esmė, todėl kalba ir kultūra yra matavimo dalis, o ne triukšmas, kurį reikia pašalinti.',
        ],
      },
      {
        heading: 'Kodėl tai svarbu interpretuojant',
        paragraphs: [
          'Žinių balą galima pateikti pagal kalbą, nes lietuvių ir anglų žinių užduotys yra skirtingos užduotys, o ne viena kitos vertimai (International Test Commission, 2017). Samprotavimo balas, priešingai, paprastai turi būti mažai priklausomas nuo kalbos, todėl kuriamas vieną kartą ir naudojamas bendrai.',
          'Abiejų suliejimas į vieną skaičių šį skirtumą paslepia. Standartų gairės reikalauja pagrįsti būtent siūlomą interpretaciją ir paskirtį (AERA, APA & NCME, 2014).',
        ],
      },
    ],
    sources: [SOURCES['S-001'], SOURCES['S-002']],
    updated: UPDATED,
  },
  {
    path: 'articles/what-an-online-iq-test-can-tell-you',
    slug: 'what-an-online-iq-test-can-tell-you',
    title: 'Ką gali ir ko negali pasakyti internetinis IQ testas?',
    description:
      'Internetinis IQ testas gali duoti praktikos ir balą už savo užduotis. Jis negali duoti validaus IQ balo be įrodymų, normų ir kontroliuojamų sąlygų.',
    h1: 'Ką gali ir ko negali pasakyti internetinis IQ testas?',
    intro:
      'Sąvoka „IQ testas“ neša mokslinį pažadą, kurio dauguma internetinių testų negali pagrįsti. Verta atskirti, ką gali bet kuris internetinis testas ir ką gali tik validuotas instrumentas.',
    availabilityNote: true,
    blocks: [
      {
        heading: 'Ką internetinis testas gali',
        paragraphs: [
          'Jis gali pateikti užduotis su apibrėžtomis vertinimo taisyklėmis ir grąžinti balą už tas užduotis. Tai naudinga praktikai, smalsumui apie užduočių tipą ir kaip demonstracija, kaip veikia užduotys.',
        ],
      },
      {
        heading: 'Ko jis negali be įrodymų',
        paragraphs: [
          'IQ balas yra interpretacija: teiginys, kad balas atspindi bendrą kognityvinį gebėjimą apibrėžtai populiacijai ir paskirčiai. Tokiam teiginiui reikia reprezentatyvių normų ir validumo įrodymų, o ne vien užduočių, panašių į galvosūkius (AERA, APA & NCME, 2014).',
        ],
        bullets: [
          'Nėra normų: be reprezentatyvios palyginimo grupės procentilis negalimas.',
          'Nėra validumo įrodymų: be jų balas yra užduočių atlikimas, o ne gebėjimo įvertis.',
          'Nekontroliuojamos sąlygos: namuose laikas, įrenginys ir trukdžiai skiriasi, todėl palyginamumas silpnėja.',
        ],
      },
      {
        heading: 'Sąžiningas skaitymas',
        paragraphs: [
          'Atsakingas internetinis testas gali pasakyti, kaip šiandien atlikote būtent jo užduotis tokiomis sąlygomis, kokios buvo. Jis turėtų tai pasakyti tiesiai ir nevadinti rezultato IQ balu, diagnoze ar įdarbinimo signalu.',
        ],
      },
      {
        heading: 'Kur yra SapiensMetric',
        paragraphs: [
          'SapiensMetric vertinimai dar nepaleisti, normų ir validumo įrodymų nėra. Šis straipsnis yra mokomasis: jis aprašo bendras internetinio testavimo ribas, o ne mūsų produkto galimybę.',
        ],
      },
    ],
    sources: [SOURCES['S-001'], SOURCES['S-004']],
    updated: UPDATED,
  },
  {
    path: 'articles/why-percentage-correct-is-not-a-percentile',
    slug: 'why-percentage-correct-is-not-a-percentile',
    title: 'Kodėl teisingų atsakymų procentas nėra procentilis',
    description:
      'Teisingų atsakymų procentas — tai balas už užduotį. Procentilis — tai padėtis palyginimo grupėje. Jų supainiojimas yra vienas dažniausių rezultatų neteisingų skaitymų.',
    h1: 'Kodėl teisingų atsakymų procentas nėra procentilis',
    intro:
      'Abu skaičiai atrodo kaip procentai — būtent todėl juos taip lengva supainioti.',
    blocks: [
      {
        heading: 'Teisingų atsakymų procentas yra apie užduotį',
        paragraphs: [
          'Teisingų atsakymų procentas — tai surinkti taškai, padalyti iš pateiktų užduočių skaičiaus. Tai jūsų atsakymų rinkinio ir vertinimo taisyklės savybė. Jis nepasako, kaip sekėsi kitiems.',
        ],
      },
      {
        heading: 'Procentilis yra apie grupę',
        paragraphs: [
          'Procentilis nurodo, kur reikšmė yra apibrėžtoje palyginimo grupėje: kokią dalį tos grupės rezultatų ji pasiekia ar viršija. Jis prasmingas tik tada, kai palyginimo grupė tinkama ir reprezentatyvi (AERA, APA & NCME, 2014).',
        ],
      },
      {
        heading: 'Palyginimo pavyzdys',
        paragraphs: [
          'Įsivaizduokite dvi grupes. Atliekant tas pačias užduotis, 80 % teisingų atsakymų gali būti apie vidurį aukštus rezultatus turinčioje grupėje ir ties viršumi kitoje. Teisingų atsakymų procentas toks pats; procentilis skiriasi, nes skiriasi grupė.',
        ],
      },
      {
        heading: 'Išvados',
        paragraphs: [
          'Teisingų atsakymų procentą pateikite kaip užduoties atlikimą. Procentilius pateikite tik kai yra reprezentatyvios normos, ir visada nurodykite palyginimo grupę. Nekonvertuokite vieno į kitą intuityviai.',
        ],
      },
    ],
    sources: [SOURCES['S-001']],
    updated: UPDATED,
  },
];

export const ARTICLES: LocalizedRecord<ArticleContent[]> = { en: EN, lt: LT };

export function articleSlugs(): string[] {
  return EN.map((article) => article.slug);
}
