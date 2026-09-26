/**
 * Public page content (T-013). English and Lithuanian are authored as parallel
 * natural-language variants (not machine translation of each other).
 */
import type { LocalizedRecord, PageContent } from './types';
import { PUBLIC_CONTACT_EMAIL, SOURCES } from './site';

export type PageKey =
  | 'home'
  | 'assessment-guide'
  | 'understanding-results'
  | 'about'
  | 'contact'
  | 'privacy';

export const PAGE_PATHS: Record<PageKey, string> = {
  home: '',
  'assessment-guide': 'assessment-guide',
  'understanding-results': 'understanding-results',
  about: 'about',
  contact: 'contact',
  privacy: 'privacy',
};

const UPDATED = '2026-09-26';

const en: Record<PageKey, PageContent> = {
  home: {
    path: '',
    title: 'SapiensMetric — educational material about assessments',
    description:
      'SapiensMetric is a developing assessment project. Read plain-language guides to reasoning, knowledge, attention, and memory assessments, and to interpreting results. No assessments are released yet.',
    h1: 'Understand assessments before you take one',
    intro:
      'SapiensMetric is a developing assessment project. We are building careful, original cognitive-ability and knowledge tasks — but they are not released yet. In the meantime, this site explains how assessments work so you can read any test result more critically.',
    availabilityNote: true,
    blocks: [
      {
        heading: 'Start here',
        paragraphs: [
          'The assessment guide surveys the main kinds of tasks — reasoning, knowledge, attention, and memory — and explains what each is usually meant to tell you.',
          'Understanding results walks through raw scores, percentage correct, percentiles, reliability, and validity, and explains why those ideas are easy to confuse.',
        ],
      },
      {
        heading: 'Where the project is now',
        paragraphs: [
          'We are in a pre-release phase: the task formats and scoring rules are being designed, and no norms, reliability, or validity evidence exist yet. Until that evidence exists, nothing here or on a released product would be described as measuring intelligence or as supporting clinical or hiring decisions.',
          'We publish only original material and cite the standards and research that inform it.',
        ],
      },
    ],
    updated: UPDATED,
  },

  'assessment-guide': {
    path: 'assessment-guide',
    title: 'Assessment guide — reasoning, knowledge, attention, and memory',
    description:
      'A plain-language overview of reasoning, knowledge, attention, and memory assessments, how they differ in purpose, and how their results are usually interpreted.',
    h1: 'Assessment guide',
    intro:
      'Assessments are structured tasks with defined scoring rules. Different families of tasks are built for different purposes, and a result means different things depending on the family and the evidence behind it.',
    availabilityNote: true,
    blocks: [
      {
        heading: 'Reasoning assessments',
        paragraphs: [
          'Reasoning tasks ask you to work out relations: patterns in figures, numerical sequences, or spatial transformations. They are often designed to be language-light so that the task is about the relation, not about vocabulary.',
          'Interpretation: a reasoning score summarises how you performed on those specific tasks. Reading it as a general ability estimate requires reliability and validity evidence for that interpretation — evidence that does not exist just because the tasks look plausible.',
        ],
      },
      {
        heading: 'Knowledge assessments',
        paragraphs: [
          'Knowledge tasks ask about facts, vocabulary, or domain content. By design they depend on language, culture, and education.',
          'Interpretation: understanding the CHC taxonomy (McGrew, 2009) can help describe what knowledge tasks target, but the taxonomy is a vocabulary for describing abilities, not a licence to claim that a particular set of tasks measures them.',
        ],
        bullets: [
          'Language-scoped: a Lithuanian and an English knowledge task are distinct authored items, not translations of one another.',
          'Separate reporting: knowledge results should not be merged into a reasoning score.',
        ],
      },
      {
        heading: 'Attention and memory assessments',
        paragraphs: [
          'Attention and memory tasks usually depend on controlled presentation and timing: recalling or reordering a briefly shown sequence, or sustaining focus under a rule. Fair delivery needs careful timing and device control.',
          'Interpretation: timing-sensitive results are especially sensitive to device and environment, so they are only meaningful with a documented fairness plan.',
        ],
      },
      {
        heading: 'Purpose changes the reading',
        paragraphs: [
          'The same score can be appropriate for one use and inappropriate for another. A practice task score is useful for learning; a norm-referenced decision requires representative norms; a selection decision requires validity evidence for that specific use (AERA, APA & NCME, 2014).',
        ],
      },
      {
        heading: 'Go deeper',
        paragraphs: [
          'The articles below explain specific points in more detail: how ability tests differ from knowledge tests, what an online IQ test can and cannot tell you, and why percentage correct is not a percentile.',
        ],
      },
    ],
    sources: [SOURCES['S-001'], SOURCES['S-004']],
    updated: UPDATED,
  },

  'understanding-results': {
    path: 'understanding-results',
    title: 'Understanding results — raw scores, percentiles, reliability, validity',
    description:
      'What raw scores, percentage correct, percentiles, comparison groups, reliability, and validity mean, and what they do not tell you.',
    h1: 'Understanding results',
    intro:
      'Assessment results are only as meaningful as the interpretation placed on them. These ideas are commonly confused, so it helps to separate them.',
    availabilityNote: true,
    blocks: [
      {
        heading: 'Raw scores and percentage correct',
        paragraphs: [
          'A raw score is simply the number of points earned under a scoring rule. Percentage correct is the raw score divided by the number of items.',
          'Neither says how common that performance is. Two people can both score 70% correct and be at very different places relative to a comparison group.',
        ],
      },
      {
        heading: 'Percentiles and comparison groups',
        paragraphs: [
          'A percentile describes a position within a defined comparison group: the share of that group scoring at or below a value. It is a statement about a group, not a property of the task.',
          'A percentile is only as meaningful as the comparison group is appropriate and representative. Percentile ranks for a specific population require representative norms (AERA, APA & NCME, 2014).',
        ],
      },
      {
        heading: 'Reliability',
        paragraphs: [
          'Reliability describes the consistency of scores — for example, how closely repeated measurements agree. It is a precondition for interpreting a score precisely, but it is not evidence that the score means what you hope it means.',
        ],
      },
      {
        heading: 'Validity',
        paragraphs: [
          'Validity is the degree to which evidence and theory support a proposed interpretation of scores for a proposed use. It is a property of an interpretation and a use, not a fixed property of a task (AERA, APA & NCME, 2014).',
          'Practical consequence: “this task measures reasoning” is an interpretation that needs evidence for the intended use. The evidence cannot be assumed because the tasks appear sensible.',
        ],
      },
      {
        heading: 'What this means for SapiensMetric',
        paragraphs: [
          'SapiensMetric has no released assessments, no norms, and no reliability or validity evidence yet. When assessments are released, results will be presented as performance on specified, versioned tasks, with an explicit statement of what the number does and does not mean.',
          'We will not label a result as an intelligence estimate, use it for clinical purposes, or recommend it for hiring before the relevant evidence and governance exist.',
        ],
      },
    ],
    sources: [SOURCES['S-001']],
    updated: UPDATED,
  },

  about: {
    path: 'about',
    title: 'About SapiensMetric — purpose, stage, and limits',
    description:
      'Why SapiensMetric exists, its pre-release development stage, its original-content principles, and its transparent limits.',
    h1: 'About the project',
    intro:
      'SapiensMetric is a developing cognitive-ability and knowledge-assessment platform for Lithuanian and English speakers.',
    availabilityNote: true,
    blocks: [
      {
        heading: 'Purpose',
        paragraphs: [
          'The long-term aim is an assessment product whose results are explainable and reproduceable, and whose claims follow evidence rather than precede it. Today the project offers educational material while the assessments themselves are designed and tested.',
        ],
      },
      {
        heading: 'Development stage',
        paragraphs: [
          'Pre-release. Task formats, scoring rules, and reporting are being designed. No item pool has been released, no administration data exist, and there are no norms, reliability estimates, or validity evidence.',
        ],
      },
      {
        heading: 'Original-content principles',
        paragraphs: [
          'We do not copy or reconstruct protected instruments. Material is authored originally, sources are recorded, and educational explanations are separated from claims about our own product.',
        ],
        bullets: [
          'No copying or reconstruction of proprietary test items.',
          'Sources recorded for factual statements.',
          'Educational discussion kept distinct from product claims.',
        ],
      },
      {
        heading: 'Transparent limits',
        paragraphs: [
          'We do not claim that these tasks measure intelligence, provide a clinical diagnosis, or should inform hiring decisions. Until validation and representative norming exist, results are described as task performance only.',
        ],
      },
    ],
    updated: UPDATED,
  },

  contact: {
    path: 'contact',
    title: 'Contact SapiensMetric',
    description: `How to reach the SapiensMetric project. Email us at ${PUBLIC_CONTACT_EMAIL}.`,
    h1: 'Contact',
    intro: `We would like to hear from educators, researchers, and reviewers. Write to us at ${PUBLIC_CONTACT_EMAIL}.`,
    blocks: [
      {
        heading: 'Email',
        paragraphs: [
          `For questions about the project, contact ${PUBLIC_CONTACT_EMAIL}. This mailbox is monitored.`,
        ],
      },
      {
        heading: 'What will not happen here',
        paragraphs: [
          'This page has no contact form, and it does not send email from the website. Existing account emails (such as verification and password reset) are separate flows on the account pages.',
        ],
      },
    ],
    updated: UPDATED,
  },

  privacy: {
    path: 'privacy',
    title: 'Privacy — what the public site does and does not do',
    description:
      'What the SapiensMetric public website does with data: no analytics or tracking, public pages need no account, and account features store only what they require.',
    h1: 'Privacy',
    intro:
      'This page describes the behaviour that is actually implemented today. It is not legal advice, and it does not claim compliance with any regulation.',
    blocks: [
      {
        heading: 'Public browsing',
        paragraphs: [
          'Browsing the public pages requires no account and sets no analytics or advertising cookies. The site does not load analytics or tracking scripts, and it does not sell or share browsing data.',
        ],
      },
      {
        heading: 'Your language preference',
        paragraphs: [
          'If you choose a language, that preference is stored locally in your browser so the site can remember it. It is not sent to a server and it is not used for tracking.',
        ],
      },
      {
        heading: 'Accounts',
        paragraphs: [
          'Account features exist and are separate from public browsing. Creating an account stores your email address, a securely hashed password (never the password itself), a record of email verification, the account role and status, and session records used to keep you signed in. Verification and password-reset links use single-use tokens that are stored only as hashes.',
        ],
      },
      {
        heading: 'Privacy contact',
        paragraphs: [
          `For privacy questions about this site or your account, contact ${PUBLIC_CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: 'Still to be decided',
        paragraphs: [
          'Retention specifics, the responsible operator identity, and consent details are policy decisions recorded as pre-publication inputs. They will be stated here once decided; nothing is asserted now that is not implemented.',
        ],
      },
    ],
    updated: UPDATED,
  },
};

const lt: Record<PageKey, PageContent> = {
  home: {
    path: '',
    title: 'SapiensMetric — mokomoji medžiaga apie vertinimus',
    description:
      'SapiensMetric — besivystantis vertinimo projektas. Paprastai paaiškiname samprotavimo, žinių, dėmesio ir atminties vertinimus bei rezultatų interpretavimą. Vertinimai dar nepaleisti.',
    h1: 'Supraskite vertinimus anksčiau, nei juos atliekate',
    intro:
      'SapiensMetric — besivystantis vertinimo projektas. Kuriame kruopščias, originalias kognityvinių gebėjimų ir žinių užduotis, tačiau jos dar nepaleistos. Kol kas šioje svetainėje paaiškiname, kaip veikia vertinimai, kad bet kokį rezultatą galėtumėte vertinti kritiškiau.',
    availabilityNote: true,
    blocks: [
      {
        heading: 'Nuo ko pradėti',
        paragraphs: [
          'Vertinimų vadovas apžvelgia pagrindines užduočių rūšis — samprotavimą, žinias, dėmesį ir atmintį — ir paaiškina, ką kiekviena jų paprastai siekia parodyti.',
          'Kaip suprasti rezultatus paaiškina neapdorotus balus, teisingų atsakymų procentą, procentilius, patikimumą ir validumą bei kodėl šias sąvokas lengva supainioti.',
        ],
      },
      {
        heading: 'Kur šiuo metu yra projektas',
        paragraphs: [
          'Esame priešpaleidimo stadijoje: užduočių formatai ir vertinimo taisyklės dar kuriami, o normų, patikimumo ir validumo įrodymų dar nėra. Kol tokių įrodymų nėra, nieko čia ar paleistame produkte nevadinsime intelekto matavimu ar pagrindu klinikiniams arba įdarbinimo sprendimams.',
          'Skelbiame tik originalią medžiagą ir nurodome standartus bei tyrimus, kuriais grindžiame teiginius.',
        ],
      },
    ],
    updated: UPDATED,
  },

  'assessment-guide': {
    path: 'assessment-guide',
    title: 'Vertinimų vadovas — samprotavimas, žinios, dėmesys ir atmintis',
    description:
      'Paprasta samprotavimo, žinių, dėmesio ir atminties vertinimų apžvalga: kuo jie skiriasi pagal paskirtį ir kaip paprastai interpretuojami rezultatai.',
    h1: 'Vertinimų vadovas',
    intro:
      'Vertinimai — tai struktūruotos užduotys su apibrėžtomis vertinimo taisyklėmis. Skirtingos užduočių šeimos kuriamos skirtingiems tikslams, o rezultatas reiškia skirtingus dalykus priklausomai nuo šeimos ir ją pagrindžiančių įrodymų.',
    availabilityNote: true,
    blocks: [
      {
        heading: 'Samprotavimo vertinimai',
        paragraphs: [
          'Samprotavimo užduotyse reikia atrasti sąryšius: dėsningumus figūrose, skaičių sekose ar erdvinėse transformacijose. Jos dažnai kuriamos taip, kad kuo mažiau priklausytų nuo kalbos.',
          'Interpretacija: samprotavimo balas apibendrina tai, kaip atlikote būtent tas užduotis. Kad jį būtų galima laikyti bendro gebėjimo įverčiu, reikia tos interpretacijos patikimumo ir validumo įrodymų — jie neatsiranda vien dėl to, kad užduotys atrodo logiškos.',
        ],
      },
      {
        heading: 'Žinių vertinimai',
        paragraphs: [
          'Žinių užduotyse klausiama apie faktus, žodyną ar dalykinį turinį. Pagal savo prigimtį jos priklauso nuo kalbos, kultūros ir išsilavinimo.',
          'Interpretacija: CHC taksonomija (McGrew, 2009) padeda apibūdinti, į ką nukreiptos žinių užduotys, tačiau tai yra gebėjimų aprašymo žodynas, o ne leidimas teigti, kad konkretus užduočių rinkinys juos matuoja.',
        ],
        bullets: [
          'Pririšta prie kalbos: lietuvių ir anglų žinių užduotys yra atskiros sukurtos užduotys, o ne viena kitos vertimai.',
          'Atskiras pateikimas: žinių rezultatų nereikėtų sulieti su samprotavimo balu.',
        ],
      },
      {
        heading: 'Dėmesio ir atminties vertinimai',
        paragraphs: [
          'Dėmesio ir atminties užduotys paprastai priklauso nuo kontroliuojamo pateikimo ir laiko: trumpai parodytos sekos atkūrimo ar perrikiavimo, dėmesio išlaikymo pagal taisyklę. Sąžiningam pateikimui reikia kruopštaus laiko ir įrenginio kontrolės.',
          'Interpretacija: nuo laiko priklausantys rezultatai ypač jautrūs įrenginiui ir aplinkai, todėl jie prasmingi tik turint dokumentuotą sąžiningumo planą.',
        ],
      },
      {
        heading: 'Paskirtis keičia skaitymą',
        paragraphs: [
          'Tas pats balas gali tikti vienai paskirčiai ir netikti kitai. Mokymosi užduoties balas naudingas mokantis; normomis grindžiamam sprendimui reikia reprezentatyvių normų; atrankos sprendimui reikia būtent tai paskirčiai pagrįsto validumo (AERA, APA & NCME, 2014).',
        ],
      },
      {
        heading: 'Gilinkitės',
        paragraphs: [
          'Toliau pateikti straipsniai detaliau paaiškina konkrečius dalykus: kuo gebėjimų testai skiriasi nuo žinių testų, ką gali ir ko negali pasakyti internetinis IQ testas, ir kodėl teisingų atsakymų procentas nėra procentilis.',
        ],
      },
    ],
    sources: [SOURCES['S-001'], SOURCES['S-004']],
    updated: UPDATED,
  },

  'understanding-results': {
    path: 'understanding-results',
    title: 'Kaip suprasti rezultatus — balai, procentiliai, patikimumas, validumas',
    description:
      'Ką reiškia neapdorotas balas, teisingų atsakymų procentas, procentilis, palyginimo grupė, patikimumas ir validumas bei ko jie nepasako.',
    h1: 'Kaip suprasti rezultatus',
    intro:
      'Vertinimo rezultatai yra tokie prasmingi, kokia yra jiems suteikiama interpretacija. Šios sąvokos dažnai painiojamos, todėl verta jas atskirti.',
    availabilityNote: true,
    blocks: [
      {
        heading: 'Neapdoroti balai ir teisingų atsakymų procentas',
        paragraphs: [
          'Neapdorotas balas — tai pagal vertinimo taisyklę surinktų taškų skaičius. Teisingų atsakymų procentas — neapdorotas balas, padalytas iš užduočių skaičiaus.',
          'Nė vienas iš jų nepasako, kiek toks rezultatas dažnas. Du žmonės gali surinkti po 70 % ir būti labai skirtingose vietose palyginimo grupės atžvilgiu.',
        ],
      },
      {
        heading: 'Procentiliai ir palyginimo grupės',
        paragraphs: [
          'Procentilis apibūdina padėtį apibrėžtoje palyginimo grupėje: kokią dalį tos grupės rezultatų reikšmė pasiekia ar viršija. Tai teiginys apie grupę, o ne užduoties savybė.',
          'Procentilis yra toks prasmingas, kiek tinkama ir reprezentatyvi yra palyginimo grupė. Konkrečios populiacijos procentilių rangams reikia reprezentatyvių normų (AERA, APA & NCME, 2014).',
        ],
      },
      {
        heading: 'Patikimumas',
        paragraphs: [
          'Patikimumas apibūdina rezultatų nuoseklumą — pavyzdžiui, kaip sutampa pakartotini matavimai. Tai būtina sąlyga rezultatą interpretuoti tiksliai, bet tai nėra įrodymas, kad rezultatas reiškia tai, ko tikimės.',
        ],
      },
      {
        heading: 'Validumas',
        paragraphs: [
          'Validumas — tai, kiek įrodymai ir teorija pagrindžia siūlomą rezultatų interpretaciją numatytai paskirčiai. Tai interpretacijos ir paskirties savybė, o ne fiksuota užduoties savybė (AERA, APA & NCME, 2014).',
          'Praktinė išvada: „ši užduotis matuoja samprotavimą“ yra interpretacija, kuriai reikia numatytą paskirtį pagrindžiančių įrodymų. Jų negalima numanyti vien dėl to, kad užduotys atrodo prasmingos.',
        ],
      },
      {
        heading: 'Ką tai reiškia SapiensMetric',
        paragraphs: [
          'SapiensMetric neturi paleistų vertinimų, normų, patikimumo ar validumo įrodymų. Kai vertinimai bus paleisti, rezultatai bus pateikiami kaip konkrečių, versijuotų užduočių atlikimas, aiškiai nurodant, ką skaičius reiškia ir ko ne.',
          'Rezultato nevadinsime intelekto įverčiu, nenaudosime klinikiniams tikslams ir nerekomenduosime įdarbinimui, kol nebus atitinkamų įrodymų ir valdysenos.',
        ],
      },
    ],
    sources: [SOURCES['S-001']],
    updated: UPDATED,
  },

  about: {
    path: 'about',
    title: 'Apie SapiensMetric — paskirtis, stadija ir ribos',
    description:
      'Kodėl egzistuoja SapiensMetric, jo priešpaleidimo stadija, originalaus turinio principai ir skaidrios ribos.',
    h1: 'Apie projektą',
    intro:
      'SapiensMetric — besivystantis kognityvinių gebėjimų ir žinių vertinimo platforma lietuvių ir anglų kalbomis.',
    availabilityNote: true,
    blocks: [
      {
        heading: 'Paskirtis',
        paragraphs: [
          'Ilgalaikis tikslas — vertinimo produktas, kurio rezultatai paaiškinami ir atkuriami, o teiginiai seka įrodymus, o ne juos lenkia. Šiandien projektas siūlo mokomąją medžiagą, kol vertinimai kuriami ir tikrinami.',
        ],
      },
      {
        heading: 'Kūrimo stadija',
        paragraphs: [
          'Priešpaleidimo. Užduočių formatai, vertinimo taisyklės ir ataskaitos dar kuriami. Nėra paleisto užduočių rinkinio, administravimo duomenų, normų, patikimumo ar validumo įrodymų.',
        ],
      },
      {
        heading: 'Originalaus turinio principai',
        paragraphs: [
          'Nekopijuojame ir neatkuriame saugomų instrumentų. Medžiaga kuriama originaliai, šaltiniai fiksuojami, o mokomieji paaiškinimai atskiriami nuo teiginių apie mūsų produktą.',
        ],
        bullets: [
          'Jokių saugomų testo užduočių kopijavimo ar atkūrimo.',
          'Faktiniams teiginiams fiksuojami šaltiniai.',
          'Mokomieji paaiškinimai atskiriami nuo produkto teiginių.',
        ],
      },
      {
        heading: 'Skaidrios ribos',
        paragraphs: [
          'Neteigiame, kad šios užduotys matuoja intelektą, teikia klinikinę diagnozę ar turėtų lemti įdarbinimo sprendimus. Kol nėra validavimo ir reprezentatyvaus normavimo, rezultatai apibūdinami tik kaip užduočių atlikimas.',
        ],
      },
    ],
    updated: UPDATED,
  },

  contact: {
    path: 'contact',
    title: 'Susisiekti su SapiensMetric',
    description: `Kaip susisiekti su SapiensMetric projektu. Rašykite mums ${PUBLIC_CONTACT_EMAIL}.`,
    h1: 'Kontaktai',
    intro: `Norime išgirsti iš pedagogų, tyrėjų ir recenzentų. Rašykite mums adresu ${PUBLIC_CONTACT_EMAIL}.`,
    blocks: [
      {
        heading: 'El. paštas',
        paragraphs: [
          `Jei turite klausimų apie projektą, rašykite ${PUBLIC_CONTACT_EMAIL}. Šis pašto adresas stebimas.`,
        ],
      },
      {
        heading: 'Ko čia nebus',
        paragraphs: [
          'Šiame puslapyje nėra kontaktų formos ir svetainė nesiunčia el. laiškų. Esami paskyros laiškai (patvirtinimo, slaptažodžio atkūrimo) yra atskiri srautai paskyros puslapiuose.',
        ],
      },
    ],
    updated: UPDATED,
  },

  privacy: {
    path: 'privacy',
    title: 'Privatumas — ką vieša svetainė daro ir ko ne',
    description:
      'Ką SapiensMetric vieša svetainė daro su duomenimis: jokios analitikos ar sekimo, viešiems puslapiams paskyros nereikia, paskyros funkcijos saugo tik tai, ką būtina.',
    h1: 'Privatumas',
    intro:
      'Šis puslapis aprašo elgseną, kuri iš tiesų įgyvendinta šiandien. Tai nėra teisinė konsultacija ir nepretenduoja į atitiktį jokiam reglamentui.',
    blocks: [
      {
        heading: 'Viešas naršymas',
        paragraphs: [
          'Viešiems puslapiams naršyti paskyros nereikia ir nustatomi jokie analitikos ar reklamos slapukai. Svetainė nekrauna analitikos ar sekimo scenarijų ir neparduoda bei neperduoda naršymo duomenų.',
        ],
      },
      {
        heading: 'Jūsų kalbos nuostata',
        paragraphs: [
          'Pasirinkus kalbą, ši nuostata saugoma vietiniame naršyklės saugykloje, kad svetainė ją atsimintų. Ji nesiunčiama į serverį ir nenaudojama sekimui.',
        ],
      },
      {
        heading: 'Paskyros',
        paragraphs: [
          'Paskyros funkcijos egzistuoja ir yra atskiros nuo viešo naršymo. Susikūrus paskyrą saugomas el. pašto adresas, saugiai su maišos funkcija apsaugotas slaptažodis (niekada ne pats slaptažodis), el. pašto patvirtinimo žymė, paskyros vaidmuo ir būsena bei sesijų įrašai, reikalingi prisijungimui palaikyti. Patvirtinimo ir slaptažodžio atkūrimo nuorodos naudoja vienkartinius žymenis, saugomus tik kaip maišos reikšmės.',
        ],
      },
      {
        heading: 'Privatumo kontaktai',
        paragraphs: [
          `Jei turite privatumo klausimų apie šią svetainę ar savo paskyrą, rašykite ${PUBLIC_CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: 'Dar neapspręsta',
        paragraphs: [
          'Saugojimo terminai, atsakingo operatoriaus tapatybė ir sutikimo detalės yra sprendimai, fiksuojami kaip priešpaleidimo informacija. Jie bus nurodyti čia, kai bus apspręsti; dabar neteigiama nieko, kas neįgyvendinta.',
        ],
      },
    ],
    updated: UPDATED,
  },
};

export const PAGES: LocalizedRecord<Record<PageKey, PageContent>> = { en, lt };
