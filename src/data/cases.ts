import type { CaseFile, CellCoord, Clue, Suspect } from '../types'

type CellRef = readonly [number, number]

type ClueDraft = {
  title: string
  body: string
  hint: string
  cells: readonly CellRef[]
}

type CaseSeed = Omit<CaseFile, 'killerId' | 'clues'> & {
  clueDrafts: readonly ClueDraft[]
}

const suspect = (
  id: string,
  name: string,
  role: string,
  detail: string,
  color: string,
): Suspect => ({ id, name, role, detail, color })

const defaultGivens: CellCoord[] = [
  { row: 0, col: 0 },
  { row: 1, col: 2 },
  { row: 2, col: 4 },
  { row: 3, col: 1 },
  { row: 4, col: 3 },
]

const clueLayouts: readonly (readonly CellRef[])[] = [
  [
    [0, 0],
    [0, 2],
    [1, 1],
  ],
  [
    [0, 4],
    [1, 3],
    [2, 0],
  ],
  [
    [2, 2],
    [3, 4],
  ],
  [
    [4, 1],
    [3, 0],
    [2, 4],
  ],
  [
    [1, 4],
    [4, 3],
  ],
  [
    [3, 2],
    [4, 0],
    [0, 1],
  ],
  [
    [2, 1],
    [3, 3],
  ],
  [
    [1, 0],
    [4, 4],
  ],
]

const makeClues = (solution: string[][], drafts: readonly ClueDraft[]): Clue[] =>
  drafts.map((draft, index) => ({
    id: `clue-${index + 1}`,
    title: draft.title,
    body: draft.body,
    hint: draft.hint,
    constraints: draft.cells.map(([row, col]) => ({
      type: 'exact',
      row,
      col,
      suspectId: solution[row][col],
    })),
  }))

const buildCase = (seed: CaseSeed): CaseFile => ({
  ...seed,
  killerId: seed.solution[seed.murderCell.row][seed.murderCell.col],
  clues: makeClues(seed.solution, seed.clueDrafts),
})

const flow = (caseTitle: string, murderLabel: string): string[] => [
  `Zet eerst alle directe spoor-koppelingen in het raster van ${caseTitle}.`,
  'Controleer elke rij: zodra vier verschillende verdachten vaststaan, valt de vijfde vanzelf.',
  'Controleer daarna de kolommen op dezelfde manier; een naam mag per kolom maar een keer voorkomen.',
  'Werk heen en weer tussen rijen en kolommen tot alle open vakken logisch gedwongen zijn.',
  `Lees het gemarkeerde vak "${murderLabel}" als finale ontmoeting: de verdachte in dat vak is de dader.`,
]

const draft = (
  title: string,
  body: string,
  hint: string,
  cells: readonly CellRef[],
): ClueDraft => ({ title, body, hint, cells })

export const cases: CaseFile[] = [
  buildCase({
    id: 'reading-room',
    number: 1,
    title: 'Het stilte-uur in de leeszaal',
    subtitle: 'Een uitgever viel tussen de eerste drukken, precies toen de club zweeg.',
    difficulty: 'Warm-up',
    intro:
      'Tijdens het wekelijkse stilte-uur van boekclub De Fluwelen Rand wordt uitgever Lotte Vale gevonden naast een open vitrine. Vijf leden hadden elk een route door de leeszaal, maar de alibi-kaarten spreken elkaar subtiel tegen.',
    victim: 'Lotte Vale, uitgever van kleine mysteries',
    sceneNote:
      'Plaats elke verdachte in het dossierrooster. Elke rij en kolom gebruikt elke verdachte precies een keer.',
    rows: ['Haardhoek', 'Archiefnis', 'Poezietafel', 'Serrebank', 'Catalogusbalie'],
    columns: ['Fluwelen lint', 'Theekopje', 'Voetnoot', 'Lampkoord', 'Boekenlegger'],
    suspects: [
      suspect('ada', 'Ada Roos', 'boekbinder', 'rook naar amandelpapier', '#8f2f45'),
      suspect('bea', 'Bea Verne', 'podcasthost', 'nam overal stemnotities op', '#2f6f73'),
      suspect('celine', 'Celine Frost', 'literair agent', 'droeg messing oorbellen', '#405c8a'),
      suspect('mara', 'Mara Finch', 'theesommelier', 'kende elk kopje bij naam', '#9a6a2f'),
      suspect('noor', 'Noor Vale', 'zeldzame-boekhandelaar', 'kwam met een lege tas', '#5b7653'),
    ],
    givens: defaultGivens,
    solution: [
      ['ada', 'bea', 'celine', 'mara', 'noor'],
      ['bea', 'celine', 'mara', 'noor', 'ada'],
      ['celine', 'mara', 'noor', 'ada', 'bea'],
      ['mara', 'noor', 'ada', 'bea', 'celine'],
      ['noor', 'ada', 'bea', 'celine', 'mara'],
    ],
    murderCell: { row: 4, col: 4, label: 'laatste boekenlegger' },
    clueDrafts: [
      draft('De stille plank', 'De lintkaart van de haardhoek, de voetnoot bij dezelfde hoek en de theevlek in de archiefnis waren al door drie verschillende handen afgetekend.', 'Begin linksboven. Deze drie vakken geven je de toonladder van de eerste twee rijen.', clueLayouts[0]),
      draft('Een kopje zonder rand', 'Aan het einde van de haardhoek lag de boekenlegger. Het lampkoord in de archiefnis en het lint bij de poezietafel sluiten daarop aan.', 'Vul de buitenste sporen eerst in; daarna blijven de binnenste kolommen strak over.', clueLayouts[1]),
      draft('De open vitrine', 'De voetnoot op de poezietafel en de boekenlegger bij de serrebank vormden samen het eerste echte patroon.', 'Deze twee vakken breken de symmetrie in het midden van het rooster.', clueLayouts[2]),
      draft('Kruimels van marsepein', 'Het theekopje bij de catalogusbalie, het lint van de serrebank en de laatste kaart in de poezietafelmap wezen naar dezelfde looproute.', 'De onderste rij krijgt hiermee genoeg ankers om de rest af te maken.', clueLayouts[3]),
      draft('De roodfluwelen strik', 'De boekenlegger uit de archiefnis paste niet bij de lampkoordnotitie van de catalogusbalie.', 'Let op: twee vaste plekken in verre hoeken maken een kolom bijna compleet.', clueLayouts[4]),
      draft('Notitie in potlood', 'De voetnoot op de serrebank, het lint bij de catalogusbalie en het theekopje in de haardhoek waren in hetzelfde potlood genoteerd.', 'Gebruik deze clue om de eerste kolom en de middelste serreplek samen te controleren.', clueLayouts[5]),
      draft('De klok sloeg negen', 'Het theespoor van de poezietafel en het lampkoord op de serrebank bleken de laatste twee kruisingen voor het patroon.', 'Als een kolom al vier namen heeft, is raden niet nodig.', clueLayouts[6]),
      draft('De laatste bladzijde', 'De lintkaart in de archiefnis en de boekenlegger bij de catalogusbalie sluiten het dossier af.', 'Het laatste vak is ook je beschuldiging: lees het pas als je grid klopt.', clueLayouts[7]),
    ],
    deduction: flow('de leeszaal', 'laatste boekenlegger'),
    verdict:
      'De laatste boekenlegger zat in Mara Finch haar dossiermap. Zij had het stilte-uur gebruikt om Lotte te ontmoeten zonder dat iemand durfde te fluisteren.',
  }),
  buildCase({
    id: 'midnight-club',
    number: 2,
    title: 'De middernachtsclub',
    subtitle: 'Een podcastaflevering eindigde met een klik die niemand wilde herkennen.',
    difficulty: 'Slim',
    intro:
      'In een studio boven een nachtcafe neemt de club een true-crime special op. Producent Jules Mertens wordt gevonden tussen kabels en cassettehoesjes. De opname liep door; alleen het rooster legt de alibi-stemmen op hun plek.',
    victim: 'Jules Mertens, podcastproducent',
    sceneNote:
      'Elke rij is een studioplek, elke kolom een opname-spoor. Elke verdachte verschijnt precies een keer per rij en kolom.',
    rows: ['Regiekamer', 'Nachtbar', 'Dakluik', 'Tapehoek', 'Luisterbank'],
    columns: ['Intro-take', 'Koffievlek', 'Ruisband', 'Sleutelbos', 'Outro-take'],
    suspects: [
      suspect('mina', 'Mina Kade', 'stemcoach', 'fluisterde zonder kraak', '#7c3144'),
      suspect('rose', 'Rose Daan', 'researcher', 'had indexkaarten', '#2e7664'),
      suspect('ivy', 'Ivy Noor', 'sounddesigner', 'kende elke ruis', '#3d5d8b'),
      suspect('esther', 'Esther Bloom', 'sponsor', 'kwam met gouden oortjes', '#9b6d32'),
      suspect('cleo', 'Cleo Arens', 'nachtbarista', 'had de reservesleutel', '#637447'),
    ],
    givens: defaultGivens,
    solution: [
      ['mina', 'rose', 'ivy', 'esther', 'cleo'],
      ['cleo', 'mina', 'rose', 'ivy', 'esther'],
      ['esther', 'cleo', 'mina', 'rose', 'ivy'],
      ['ivy', 'esther', 'cleo', 'mina', 'rose'],
      ['rose', 'ivy', 'esther', 'cleo', 'mina'],
    ],
    murderCell: { row: 3, col: 3, label: 'stille sleutelbos' },
    clueDrafts: [
      draft('Koude intro', 'De eerste intro-take, de ruiskaart in de regie en de koffiecirkel bij de nachtbar lagen keurig op volgorde.', 'Deze drie startpunten raken twee rijen en drie kolommen.', clueLayouts[0]),
      draft('Band zonder label', 'De outro van de regiekamer, de sleutelbos in de nachtbar en de intro bij het dakluik waren in hetzelfde mapje geklemd.', 'Werk van buiten naar binnen; de outrokolom wordt snel beperkend.', clueLayouts[1]),
      draft('Een tik in de kabel', 'De ruisband bij het dakluik en de outro-take in de tapehoek konden niet toevallig naast elkaar liggen.', 'Het midden en de rechterrand zetten de tapehoek vast.', clueLayouts[2]),
      draft('De late cappuccino', 'De koffievlek op de luisterbank, de intro van de tapehoek en de outro bij het dakluik delen een alibi-lijn.', 'Gebruik de onderste rij als anker en sluit daarna het dakluik af.', clueLayouts[3]),
      draft('Reservekoptelefoon', 'De outro van de nachtbar en de sleutelbos op de luisterbank waren door dezelfde hand gesorteerd.', 'Twee verre vakken kunnen een hele kolom oplossen.', clueLayouts[4]),
      draft('Het fluisterspoor', 'Ruis in de tapehoek, intro bij de luisterbank en koffie in de regie vertellen samen wie niet bij de microfoon was.', 'Dit is de beste clue om de eerste twee kolommen te controleren.', clueLayouts[5]),
      draft('Afgebroken jingle', 'De koffievlek bij het dakluik en de sleutelbos in de tapehoek zijn de laatste ritmische kruisingen.', 'Kijk welke namen in die twee kolommen nog ontbreken.', clueLayouts[6]),
      draft('Klik na middernacht', 'De intro in de nachtbar en de outro op de luisterbank maken het patroon compleet.', 'De beschuldiging hoort pas na een volledig raster.', clueLayouts[7]),
    ],
    deduction: flow('de podcaststudio', 'stille sleutelbos'),
    verdict:
      'Mina Kade stond bij de stille sleutelbos. Haar stemtraining maakte haar afwezigheid hoorbaar: precies te gecontroleerd, precies te laat.',
  }),
  buildCase({
    id: 'bookshop-balcony',
    number: 3,
    title: 'Het balkon van de boekwinkel',
    subtitle: 'Een signeersessie, een gesloten trap en een balkon vol zachte leugens.',
    difficulty: 'Slim',
    intro:
      'Bij Boekwinkel Brons valt schrijver Elian Voss tijdens een besloten signeeravond van het balkon. Iedereen had een reden om zijn nieuwe hoofdstuk te vrezen; de routekaart van winkelsporen blijft over.',
    victim: 'Elian Voss, cozy-crime auteur',
    sceneNote: 'Vul het rooster met vijf verdachten. Per rij en kolom mag elke naam maar een keer voorkomen.',
    rows: ['Kassa-eiland', 'Balkontrap', 'Kinderhoek', 'Etalagebank', 'Achtermagazijn'],
    columns: ['Gesigneerd boek', 'Regendruppel', 'Traplint', 'Bonrol', 'Leeslamp'],
    suspects: [
      suspect('liv', 'Liv Marant', 'boekverkoper', 'kende de trapcode', '#8d3447'),
      suspect('saar', 'Saar Bex', 'recensent', 'had rode penstrepen', '#2c706d'),
      suspect('nina', 'Nina Woud', 'illustrator', 'tekende in de marge', '#3c5f90'),
      suspect('freya', 'Freya Moes', 'evenementplanner', 'droeg gouden clips', '#9b7033'),
      suspect('tess', 'Tess Calder', 'fanclubbeheerder', 'had de gastenlijst', '#5f794e'),
    ],
    givens: defaultGivens,
    solution: [
      ['liv', 'freya', 'saar', 'tess', 'nina'],
      ['saar', 'tess', 'nina', 'liv', 'freya'],
      ['nina', 'liv', 'freya', 'saar', 'tess'],
      ['freya', 'saar', 'tess', 'nina', 'liv'],
      ['tess', 'nina', 'liv', 'freya', 'saar'],
    ],
    murderCell: { row: 1, col: 3, label: 'bonrol bij de trap' },
    clueDrafts: [
      draft('De eerste handtekening', 'Bij de kassa lagen het gesigneerde boek en het traplint al vast; in de balkontrap zat de regendruppelkaart ertussen.', 'De eerste rij krijgt direct twee ankers.', clueLayouts[0]),
      draft('Nat papier', 'De leeslamp aan de kassa, de bonrol bij de balkontrap en het gesigneerde boek in de kinderhoek vormden de natte route.', 'Werk de rechterrand en de eerste kolom samen af.', clueLayouts[1]),
      draft('Gesloten hekwerk', 'Het traplint in de kinderhoek en de leeslamp bij de etalagebank deelden dezelfde messing clip.', 'Midden en rand helpen elkaar hier.', clueLayouts[2]),
      draft('Bon zonder aankoop', 'De regendruppel in het magazijn, het gesigneerde boek bij de etalage en de leeslamp in de kinderhoek stonden niet los van elkaar.', 'Kijk naar de onderste rij en de linker kolom.', clueLayouts[3]),
      draft('Een pen in de marge', 'De leeslamp bij de balkontrap en de bonrol in het magazijn vulden twee opvallende gaten.', 'Deze clue sluit straks de finale kolom.', clueLayouts[4]),
      draft('Stille traploper', 'Het traplint bij de etalage, het gesigneerde boek in het magazijn en de regendruppel bij de kassa zijn betrouwbare sporen.', 'Gebruik deze drie om rij vier en vijf te ordenen.', clueLayouts[5]),
      draft('Etalage na sluit', 'De regendruppel in de kinderhoek en de bonrol bij de etalage laten geen tweede interpretatie toe.', 'Als je hier twijfelt, check eerst kolom twee.', clueLayouts[6]),
      draft('Laatste kassabon', 'Het gesigneerde boek bij de balkontrap en de leeslamp in het magazijn maken de winkelroute rond.', 'De trap-bonrol is de beschuldigingscel.', clueLayouts[7]),
    ],
    deduction: flow('de boekwinkel', 'bonrol bij de trap'),
    verdict:
      'Liv Marant stond in de bonrolcel bij de balkontrap. De code voor het hek was niet gelekt; zij had hem nooit uit handen gegeven.',
  }),
  buildCase({
    id: 'tea-salon',
    number: 4,
    title: 'De theesalon zonder suiker',
    subtitle: 'Vijf kopjes, nul suikerklontjes en een alibi dat te netjes roerde.',
    difficulty: 'Stevig',
    intro:
      'In Salon Mirabelle overlijdt patissier Remy op de avond dat zijn nieuwe dessertkaart wordt onthuld. De zaak wil geen spektakel, alleen stilte, thee en een rooster dat precies genoeg verklapt.',
    victim: 'Remy Dors, patissier',
    sceneNote: 'Elke rij is een hoek van de salon, elke kolom een alibi-object. Elke naam komt per rij en kolom eenmaal voor.',
    rows: ['Rozentafel', 'Serrekast', 'Kaneelbank', 'Baliehoek', 'Privenis'],
    columns: ['Suikerpot', 'Citroenlepel', 'Kassabon', 'Receptkaart', 'Roomkan'],
    suspects: [
      suspect('lotte', 'Lotte Prins', 'salonhouder', 'kende de voorraadkast', '#8a3045'),
      suspect('vera', 'Vera Nox', 'dessertblogger', 'fotografeerde alles', '#2f746c'),
      suspect('jules', 'Jules Marin', 'barista', 'maakte geen lawaai', '#405f88'),
      suspect('amelie', 'Amelie Vos', 'bloemist', 'bracht serretakken', '#9c6d31'),
      suspect('fien', 'Fien Daal', 'boekhouder', 'had de kas sleutel', '#5f794c'),
    ],
    givens: defaultGivens,
    solution: [
      ['amelie', 'lotte', 'fien', 'vera', 'jules'],
      ['lotte', 'fien', 'vera', 'jules', 'amelie'],
      ['fien', 'vera', 'jules', 'amelie', 'lotte'],
      ['vera', 'jules', 'amelie', 'lotte', 'fien'],
      ['jules', 'amelie', 'lotte', 'fien', 'vera'],
    ],
    murderCell: { row: 0, col: 3, label: 'receptkaart op de rozentafel' },
    clueDrafts: [
      draft('Ongezoete start', 'De suikerpot bij de rozentafel, de kassabon daar en de citroenlepel in de serrekast waren al geordend.', 'Begin bij de rozentafel en de serrekast.', clueLayouts[0]),
      draft('Lepel in linnen', 'De roomkan op de rozentafel, de receptkaart bij de serrekast en de suikerpot op de kaneelbank vormden het linnen spoor.', 'De buitenkolommen zijn sterker dan ze lijken.', clueLayouts[1]),
      draft('Kruimel op koper', 'De kassabon van de kaneelbank en de roomkan bij de baliehoek brengen het centrum in balans.', 'Twee vakken kunnen genoeg zijn als de kolom bijna rond is.', clueLayouts[2]),
      draft('Serre zonder schaduw', 'De citroenlepel in de privenis, de suikerpot bij de balie en de roomkan op de kaneelbank sluiten elkaar aan.', 'Dit anker voorkomt een spiegeloplossing.', clueLayouts[3]),
      draft('Kasverschil', 'De roomkan in de serrekast en de receptkaart in de privenis stonden in dezelfde kasnotitie.', 'Deze clue werkt vooral door eliminatie in kolommen vier en vijf.', clueLayouts[4]),
      draft('Kaneelrandje', 'De kassabon bij de baliehoek, de suikerpot in de privenis en de citroenlepel op de rozentafel geven drie vaste smaken.', 'Controleer of geen naam dubbel in de eerste kolom valt.', clueLayouts[5]),
      draft('Laat roeren', 'De citroenlepel op de kaneelbank en de receptkaart bij de balie vormen de laatste zachte draai.', 'Als vier namen in een rij staan, schrijf de vijfde.', clueLayouts[6]),
      draft('Geen klontje over', 'De suikerpot in de serrekast en de roomkan in de privenis maken het servies compleet.', 'De receptkaart op de rozentafel is je finale cel.', clueLayouts[7]),
    ],
    deduction: flow('de theesalon', 'receptkaart op de rozentafel'),
    verdict:
      'Vera Nox stond bij de receptkaart op de rozentafel. Haar foto\'s waren net iets te perfect gekadreerd: het bewijs lag buiten beeld.',
  }),
  buildCase({
    id: 'garden-house',
    number: 5,
    title: 'Het tuinhuis met de fluwelen strik',
    subtitle: 'Onder een regenjas hing een strik die niemand op de foto wilde zien.',
    difficulty: 'Stevig',
    intro:
      'Na de jaarlijkse plantenruil wordt botanist Ilse Greve gevonden bij het afgesloten tuinhuis. De regen waste voetsporen weg, maar niet de volgorde van handschoenen, linten en glaslabels.',
    victim: 'Ilse Greve, botanist',
    sceneNote: 'Los het 5x5 alibi-rooster op. Elke verdachte past exact eenmaal per rij en kolom.',
    rows: ['Kruidentafel', 'Tuinhuisdeur', 'Compostpad', 'Oranjerie', 'Zaadkast'],
    columns: ['Glaslabel', 'Gieter', 'Lintstrik', 'Handschoen', 'Zaadzakje'],
    suspects: [
      suspect('maud', 'Maud Elzen', 'tuinontwerper', 'bond linten strak', '#873244'),
      suspect('elsa', 'Elsa Kroon', 'zaadverzamelaar', 'droeg linnen zakjes', '#2e7467'),
      suspect('rita', 'Rita Sol', 'fotograaf', 'bleef onder de luifel', '#3d5f8c'),
      suspect('lena', 'Lena Brant', 'buurvrouw', 'wist waar de sleutel hing', '#9b6c31'),
      suspect('sanne', 'Sanne Moer', 'vrijwilliger', 'had modder aan de zoom', '#647a4e'),
    ],
    givens: defaultGivens,
    solution: [
      ['sanne', 'maud', 'elsa', 'rita', 'lena'],
      ['rita', 'lena', 'sanne', 'maud', 'elsa'],
      ['elsa', 'rita', 'lena', 'sanne', 'maud'],
      ['maud', 'elsa', 'rita', 'lena', 'sanne'],
      ['lena', 'sanne', 'maud', 'elsa', 'rita'],
    ],
    murderCell: { row: 1, col: 0, label: 'glaslabel bij de deur' },
    clueDrafts: [
      draft('Label in de regen', 'Bij de kruidentafel lagen het glaslabel en de lintstrik vast; de gieter aan de tuinhuisdeur vulde het eerste gat.', 'De bovenste rij vertelt hoe de symbolen roteren.', clueLayouts[0]),
      draft('Nat touw', 'Het zaadzakje op de kruidentafel, de handschoen bij de deur en het glaslabel op het compostpad waren samen opgeborgen.', 'Gebruik de rechterrand om de deur-rij te beperken.', clueLayouts[1]),
      draft('Gebroken pot', 'De lintstrik op het compostpad en het zaadzakje in de oranjerie geven de route naar achteren.', 'Deze twee vakken verbinden midden en onderkant.', clueLayouts[2]),
      draft('Schaduw in de kas', 'De gieter bij de zaadkast, het glaslabel in de oranjerie en het zaadzakje op het compostpad waren niet door de regen verplaatst.', 'Dit anker voorkomt een spiegeloplossing.', clueLayouts[3]),
      draft('Droge handschoen', 'Het zaadzakje bij de deur en de handschoen in de zaadkast zaten in dezelfde linnen tas.', 'Kijk vooral naar kolom vijf.', clueLayouts[4]),
      draft('Een strik te veel', 'De lintstrik in de oranjerie, het glaslabel bij de zaadkast en de gieter aan de kruidentafel lagen te schoon.', 'Vul deze drie voor je de laatste rij afmaakt.', clueLayouts[5]),
      draft('Kaslicht', 'De gieter op het compostpad en de handschoen in de oranjerie vormen een diagonale controle.', 'Gebruik rij drie en vier tegen elkaar.', clueLayouts[6]),
      draft('Sleutel aan touw', 'Het glaslabel bij de tuinhuisdeur en het zaadzakje in de zaadkast blijven over als finale lijn.', 'De glaslabel-deurcel is de beschuldiging.', clueLayouts[7]),
    ],
    deduction: flow('het tuinhuis', 'glaslabel bij de deur'),
    verdict:
      'Rita Sol stond bij het glaslabel aan de deur. De foto\'s waren beschut genomen, maar haar alibi stond juist in de regen.',
  }),
  buildCase({
    id: 'quay-bookclub',
    number: 6,
    title: 'De leesclub aan de kade',
    subtitle: 'Een hoofdstukbespreking, vijf paraplu\'s en een verdronken geheim.',
    difficulty: 'Slim',
    intro:
      'In cafe De Kadekamer zakt criticus Bram Linde tijdens een stormavond in elkaar. Buiten slaan boten tegen de wal; binnen valt alleen het alibi-rooster nog strak te lezen.',
    victim: 'Bram Linde, literair criticus',
    sceneNote: 'Elke plek en elk bewijsstuk kruist met precies een verdachte volgens sudoku-logica.',
    rows: ['Raamtafel', 'Barbank', 'Kapstok', 'Achterdeur', 'Kadehoek'],
    columns: ['Paraplu', 'Boekbon', 'Kurkstop', 'Nat kaartje', 'Kaarsvet'],
    suspects: [
      suspect('ellen', 'Ellen Moors', 'boekclubvoorzitter', 'noteerde citaten', '#8b3145'),
      suspect('yara', 'Yara Prins', 'journalist', 'kwam met natte mouwen', '#2e746f'),
      suspect('kim', 'Kim Ravel', 'wijninkoper', 'kende de kurken', '#3e5d88'),
      suspect('puck', 'Puck Meer', 'illustrator', 'schetste de storm', '#9b6f35'),
      suspect('dina', 'Dina Smit', 'havenmeester', 'had de achterdeurpas', '#63784d'),
    ],
    givens: defaultGivens,
    solution: [
      ['kim', 'dina', 'ellen', 'yara', 'puck'],
      ['puck', 'kim', 'dina', 'ellen', 'yara'],
      ['yara', 'puck', 'kim', 'dina', 'ellen'],
      ['ellen', 'yara', 'puck', 'kim', 'dina'],
      ['dina', 'ellen', 'yara', 'puck', 'kim'],
    ],
    murderCell: { row: 3, col: 1, label: 'boekbon bij de achterdeur' },
    clueDrafts: [
      draft('Storm op glas', 'De paraplu en de kurkstop bij de raamtafel en de boekbon aan de barbank stonden al op de serveerbon.', 'Deze drie feiten openen de route rond het raam.', clueLayouts[0]),
      draft('Kaars in tocht', 'Kaarsvet bij de raamtafel, het natte kaartje aan de bar en de paraplu bij de kapstok vormen het tochtspoor.', 'Buitenste kolommen eerst.', clueLayouts[1]),
      draft('Kurk zonder fles', 'De kurkstop bij de kapstok en het kaarsvet aan de achterdeur delen dezelfde lade.', 'Plaats deze twee en check de kolommen.', clueLayouts[2]),
      draft('Achterdeur op een kier', 'De boekbon in de kadehoek, de paraplu aan de achterdeur en het kaarsvet bij de kapstok leggen de onderkant vast.', 'Deze clue is sterk voor de finale achterdeur-rij.', clueLayouts[3]),
      draft('Natte jas', 'Kaarsvet aan de barbank en het natte kaartje in de kadehoek maken twee alibi\'s onmogelijk.', 'Zet deze voor je de achterdeur beschuldigt.', clueLayouts[4]),
      draft('Kadebonnetje', 'De kurkstop aan de achterdeur, de paraplu in de kadehoek en de boekbon bij het raam vullen drie stille kruisingen.', 'Controleer kolom een na deze stap.', clueLayouts[5]),
      draft('Het laatste hoofdstuk', 'De boekbon bij de kapstok en het natte kaartje aan de achterdeur volgen elkaar logisch op.', 'Als de achterdeur rij vier namen heeft, is de vijfde gedwongen.', clueLayouts[6]),
      draft('Touw om de stoel', 'De paraplu aan de barbank en het kaarsvet in de kadehoek sluiten de stormavond.', 'De boekbon aan de achterdeur is de finale cel.', clueLayouts[7]),
    ],
    deduction: flow('de kadeclub', 'boekbon bij de achterdeur'),
    verdict:
      'Yara Prins stond bij de boekbon aan de achterdeur. Haar natte mouwen kwamen niet van de kade, maar van een te laat bedacht alibi.',
  }),
  buildCase({
    id: 'suite-six',
    number: 7,
    title: 'Het manuscript in suite 6',
    subtitle: 'Een hotelkamer vol proefdrukken en een sleutelkaart die te zacht piepte.',
    difficulty: 'Stevig',
    intro:
      'Op een literair festival wordt redacteur Celia Park gevonden in suite 6. De liftcamera hapert, maar de kamermeisjeslijst, proefdrukken en sleutelkaarten vormen een sluitend patroon.',
    victim: 'Celia Park, hoofdredacteur',
    sceneNote: 'Los het dossierrooster op met rij/kolom-uniciteit. Geen vak vraagt om gokken.',
    rows: ['Suite 6', 'Liftlobby', 'Ontbijtzaal', 'Perskamer', 'Dakterras'],
    columns: ['Sleutelkaart', 'Proefdruk', 'Koffiekop', 'Bloemvaas', 'Badge'],
    suspects: [
      suspect('iris', 'Iris Dane', 'debutant', 'droeg festivalgroen', '#843144'),
      suspect('mila', 'Mila Beck', 'agent', 'belde voortdurend', '#2d746c'),
      suspect('rune', 'Rune Holt', 'drukker', 'had inktvingers', '#3f5f8c'),
      suspect('sylvie', 'Sylvie Ren', 'hotelmanager', 'kende alle passen', '#9b6f31'),
      suspect('talia', 'Talia Noor', 'columnist', 'verzamelde badges', '#62784d'),
    ],
    givens: defaultGivens,
    solution: [
      ['talia', 'sylvie', 'rune', 'mila', 'iris'],
      ['iris', 'talia', 'sylvie', 'rune', 'mila'],
      ['mila', 'iris', 'talia', 'sylvie', 'rune'],
      ['rune', 'mila', 'iris', 'talia', 'sylvie'],
      ['sylvie', 'rune', 'mila', 'iris', 'talia'],
    ],
    murderCell: { row: 0, col: 0, label: 'sleutelkaart van suite 6' },
    clueDrafts: [
      draft('Piep om 22:14', 'De sleutelkaart en koffiekop van suite 6, plus de proefdruk in de liftlobby, zijn zeker.', 'De finale cel is een gegeven, maar bewijs hem met het hele rooster.', clueLayouts[0]),
      draft('Proefdruk in linnen', 'De badge van suite 6, de vaas in de liftlobby en de sleutelkaart in de ontbijtzaal vormden een schoonmaaklijn.', 'Werk de bovenrand af.', clueLayouts[1]),
      draft('Koffie zonder room', 'De koffiekop in de ontbijtzaal en de badge in de perskamer waren door hetzelfde personeelslid gemeld.', 'Midden naar rechts.', clueLayouts[2]),
      draft('Dakterraswind', 'De proefdruk op het dakterras, de sleutelkaart in de perskamer en de badge bij het ontbijt leggen de achterroute vast.', 'Deze clue draait de onderste rijen open.', clueLayouts[3]),
      draft('Bloemenbon', 'De badge in de liftlobby en de bloemvaas op het dakterras lagen in een klachtenmap.', 'Gebruik de badgekolom.', clueLayouts[4]),
      draft('Inkt aan de lift', 'De koffiekop in de perskamer, de sleutelkaart op het dakterras en de proefdruk in suite 6 geven de stille driehoek.', 'Let op dubbele namen in kolom een.', clueLayouts[5]),
      draft('Festivalkoord', 'De proefdruk in de ontbijtzaal en de bloemvaas in de perskamer sluiten de personeelsroute.', 'Hierna blijft in de perskamer nog maar weinig open.', clueLayouts[6]),
      draft('Badge zonder foto', 'De sleutelkaart in de liftlobby en de badge op het dakterras maken het hotelpatroon af.', 'Als alles klopt, wijst suite 6 terug naar de dader.', clueLayouts[7]),
    ],
    deduction: flow('suite 6', 'sleutelkaart van suite 6'),
    verdict:
      'Talia Noor stond op de sleutelkaart van suite 6. Haar badgeverzameling was charmant, maar een sleutelkaart laat geen recensie schrijven.',
  }),
  buildCase({
    id: 'auction-brooch',
    number: 8,
    title: 'De veiling van de vermiste broche',
    subtitle: 'Een salondiner, een lege vitrine en biednummers die elkaar te mooi volgden.',
    difficulty: 'Meesterlijk',
    intro:
      'Tijdens een stille veiling verdwijnt een erfstukbroche, en taxateur Otto Hale overlijdt achter de schermen. De champagne blijft koud; het biedrooster niet.',
    victim: 'Otto Hale, taxateur',
    sceneNote: 'Elke verdachte verschijnt exact eenmaal per rij en kolom. De gemarkeerde cel onthult de dader.',
    rows: ['Vitrinezaal', 'Biedbalie', 'Champagnetafel', 'Achterkamer', 'Portretwand'],
    columns: ['Biednummer', 'Brochedoos', 'Fluwelen doek', 'Taxatiekaart', 'Glasbel'],
    suspects: [
      suspect('nora', 'Nora Vale', 'erfgename', 'kende de brochegeschiedenis', '#8b3044'),
      suspect('elise', 'Elise Veen', 'veilingmeester', 'sprak in zachte hamerklopjes', '#2d7468'),
      suspect('hana', 'Hana Roest', 'restaurator', 'droeg katoenen handschoenen', '#3e5f89'),
      suspect('margo', 'Margo Lief', 'societyverslaggever', 'had twee biednummers', '#9a6d34'),
      suspect('ophelia', 'Ophelia Zwart', 'verzamelaar', 'liet geen glas aanraken', '#5f784d'),
    ],
    givens: defaultGivens,
    solution: [
      ['elise', 'hana', 'margo', 'ophelia', 'nora'],
      ['margo', 'ophelia', 'nora', 'elise', 'hana'],
      ['nora', 'elise', 'hana', 'margo', 'ophelia'],
      ['hana', 'margo', 'ophelia', 'nora', 'elise'],
      ['ophelia', 'nora', 'elise', 'hana', 'margo'],
    ],
    murderCell: { row: 2, col: 4, label: 'glasbel aan de champagnetafel' },
    clueDrafts: [
      draft('Hamer in stilte', 'Het biednummer en het fluwelen doek in de vitrinezaal, plus de brochedoos bij de biedbalie, stonden vast.', 'De vitrinezaal geeft twee ijkpunten.', clueLayouts[0]),
      draft('Druppel op kristal', 'De glasbel in de vitrinezaal, de taxatiekaart bij de biedbalie en het biednummer aan de champagnetafel vormen een biedlijn.', 'Werk de eerste en laatste kolom samen af.', clueLayouts[1]),
      draft('Doek zonder stof', 'Het fluwelen doek bij de champagnetafel en de glasbel in de achterkamer delen dezelfde handschoen.', 'Midden naar rechterrand.', clueLayouts[2]),
      draft('Achterkamerbon', 'De brochedoos bij de portretwand, het biednummer in de achterkamer en de glasbel aan de champagnetafel waren op een foto zichtbaar.', 'De champagnetafel is belangrijk voor de finale.', clueLayouts[3]),
      draft('Tweede biednummer', 'De glasbel bij de biedbalie en de taxatiekaart aan de portretwand sluiten twee valse biedingen uit.', 'Gebruik kolom vier en vijf.', clueLayouts[4]),
      draft('De zachte doek', 'Het fluwelen doek in de achterkamer, het biednummer aan de portretwand en de brochedoos in de vitrinezaal waren in hetzelfde logboek gemarkeerd.', 'Drie rijen krijgen nu hun ontbrekende namen.', clueLayouts[5]),
      draft('Portret met scheur', 'De brochedoos aan de champagnetafel en de taxatiekaart in de achterkamer maken de biedreeks logisch.', 'Controleer de achterkamer tegen de kolommen.', clueLayouts[6]),
      draft('Laatste kavel', 'Het biednummer bij de biedbalie en de glasbel aan de portretwand sluiten de veiling.', 'De glasbel aan de champagnetafel is de beschuldiging.', clueLayouts[7]),
    ],
    deduction: flow('de veiling', 'glasbel aan de champagnetafel'),
    verdict:
      'Ophelia Zwart stond onder de glasbel aan de champagnetafel. Ze raakte zogenaamd nooit glas aan, behalve toen niemand keek.',
  }),
  buildCase({
    id: 'winter-market',
    number: 9,
    title: 'De wintermarkt-alibi\'s',
    subtitle: 'Een kraam vol kaarsen, warme cider en een spoor van koperkleurige muntjes.',
    difficulty: 'Slim',
    intro:
      'Op de eerste avond van de wintermarkt wordt organisator Pim Noord gevonden achter de wensboom. De markt blijft open, maar Vera Lens vraagt jou het alibi-rooster te sluiten.',
    victim: 'Pim Noord, marktorganisator',
    sceneNote: 'Vul de verdachten in. Iedere rij en kolom bevat elke verdachte precies eenmaal.',
    rows: ['Wensboom', 'Kaarsenkraam', 'Ciderhoek', 'Boekenkraam', 'Muziektent'],
    columns: ['Kopermunt', 'Waxinelicht', 'Bonnetje', 'Sjaalspeld', 'Ciderbeker'],
    suspects: [
      suspect('fleur', 'Fleur Maas', 'kraamhulp', 'droeg wollen wanten', '#8a3144'),
      suspect('mirte', 'Mirte Zee', 'zangeres', 'kwam na de encore', '#2e746b'),
      suspect('lana', 'Lana Rook', 'kaarsenmaker', 'had bijenwas aan haar tas', '#3f5e88'),
      suspect('olga', 'Olga Veld', 'penningmeester', 'telde kopermuntjes', '#9b6f33'),
      suspect('riva', 'Riva Laan', 'boekenkramer', 'verkocht winterthrillers', '#63794e'),
    ],
    givens: defaultGivens,
    solution: [
      ['riva', 'fleur', 'mirte', 'lana', 'olga'],
      ['olga', 'riva', 'fleur', 'mirte', 'lana'],
      ['lana', 'olga', 'riva', 'fleur', 'mirte'],
      ['mirte', 'lana', 'olga', 'riva', 'fleur'],
      ['fleur', 'mirte', 'lana', 'olga', 'riva'],
    ],
    murderCell: { row: 4, col: 0, label: 'kopermunt bij de muziektent' },
    clueDrafts: [
      draft('Munt in de sneeuw', 'Bij de wensboom lagen de kopermunt en het bonnetje vast; het waxinelicht aan de kaarsenkraam volgde kort erna.', 'Open met de eerste rij.', clueLayouts[0]),
      draft('Cider zonder kaneel', 'De ciderbeker bij de wensboom, de sjaalspeld aan de kaarsenkraam en de kopermunt in de ciderhoek vormden de warme route.', 'Buitenste sporen helpen elkaar.', clueLayouts[1]),
      draft('Kaarsvet op papier', 'Het bonnetje in de ciderhoek en de ciderbeker bij de boekenkraam brengen het middendeel tot rust.', 'Vul midden en rechterrand.', clueLayouts[2]),
      draft('Encore in mist', 'Het waxinelicht bij de muziektent, de kopermunt aan de boekenkraam en de ciderbeker in de ciderhoek lagen in een markttas.', 'De onderkant krijgt nu vorm.', clueLayouts[3]),
      draft('Speld op fluweel', 'De ciderbeker aan de kaarsenkraam en de sjaalspeld bij de muziektent lagen niet in de verloren-voorwerpenbak.', 'Controleer kolom vier en vijf.', clueLayouts[4]),
      draft('Bonnetje met ster', 'Het bonnetje bij de boekenkraam, de kopermunt bij de muziektent en het waxinelicht aan de wensboom vormen de stille driehoek.', 'Deze clue raakt de finale rij.', clueLayouts[5]),
      draft('Zacht refrein', 'Het waxinelicht in de ciderhoek en de sjaalspeld bij de boekenkraam zijn de laatste twee randnoten.', 'Na deze stap kan rij vier bijna dicht.', clueLayouts[6]),
      draft('Laatste muntje', 'De kopermunt bij de kaarsenkraam en de ciderbeker bij de muziektent sluiten de markt.', 'De kopermunt in de muziektent is de finale cel.', clueLayouts[7]),
    ],
    deduction: flow('de wintermarkt', 'kopermunt bij de muziektent'),
    verdict:
      'Fleur Maas stond bij de kopermunt in de muziektent. Haar wollen wanten hielden haar handen warm, maar niet haar verhaal.',
  }),
  buildCase({
    id: 'archive-letter',
    number: 10,
    title: 'De brief in het stadsarchief',
    subtitle: 'Een vergeten liefdesbrief, vijf leeshandschoenen en een deur die alleen zacht dichtviel.',
    difficulty: 'Meesterlijk',
    intro:
      'Archivaris Renee Vos wordt gevonden tussen genealogieen en verzegelde dozen. Er is geen spektakel, alleen papierstof, een verdwenen brief en een rooster vol elegante tegenstrijdigheden.',
    victim: 'Renee Vos, stadsarchivaris',
    sceneNote: 'Plaats iedere verdachte in het 5x5-rooster. Elke rij en kolom bevat alle vijf verdachten precies eenmaal.',
    rows: ['Leeszaal A', 'Kaartenkamer', 'Depottrap', 'Microfilmhoek', 'Verzegelde kast'],
    columns: ['Handschoen', 'Brieflint', 'Leeskaart', 'Lampknop', 'Lakzegel'],
    suspects: [
      suspect('alma', 'Alma Reed', 'genealoog', 'zocht een familienaam', '#8b3145'),
      suspect('els', 'Els Veur', 'conservator', 'droeg witte handschoenen', '#2e746a'),
      suspect('romy', 'Romy Hart', 'podcastmaker', 'nam archiefgeluid op', '#3d5f89'),
      suspect('kato', 'Kato Lin', 'historicus', 'kende de sleutelcatalogus', '#9a6e33'),
      suspect('sela', 'Sela Brink', 'vrijwilliger', 'bracht dozen terug', '#60794f'),
    ],
    givens: defaultGivens,
    solution: [
      ['romy', 'alma', 'els', 'sela', 'kato'],
      ['alma', 'els', 'sela', 'kato', 'romy'],
      ['els', 'sela', 'kato', 'romy', 'alma'],
      ['sela', 'kato', 'romy', 'alma', 'els'],
      ['kato', 'romy', 'alma', 'els', 'sela'],
    ],
    murderCell: { row: 4, col: 4, label: 'lakzegel in de verzegelde kast' },
    clueDrafts: [
      draft('Papierstof', 'De handschoen en leeskaart in leeszaal A, plus het brieflint in de kaartenkamer, zijn betrouwbaar.', 'De eerste twee rijen krijgen hun eerste ankers.', clueLayouts[0]),
      draft('Lint zonder doos', 'Het lakzegel in leeszaal A, de lampknop in de kaartenkamer en de handschoen bij de depottrap stonden in het logboek.', 'Werk van links en rechts naar binnen.', clueLayouts[1]),
      draft('Microfilm tikte', 'De leeskaart bij de depottrap en het lakzegel in de microfilmhoek delen dezelfde tijdstempel.', 'Midden en rechterrand zetten de microfilmhoek vast.', clueLayouts[2]),
      draft('Traplicht', 'Het brieflint in de verzegelde kast, de handschoen bij de microfilmhoek en het lakzegel aan de depottrap lagen in een verzendmap.', 'De onderste rij en finale kolom worden belangrijk.', clueLayouts[3]),
      draft('Lampknop koud', 'Het lakzegel in de kaartenkamer en de lampknop bij de verzegelde kast sluiten twee valse routes uit.', 'Controleer kolom vier voordat je de kast sluit.', clueLayouts[4]),
      draft('Leeskaart zonder naam', 'De leeskaart in de microfilmhoek, de handschoen in de verzegelde kast en het brieflint in leeszaal A maken een stille driehoek.', 'Na deze drie kun je kolom een sterk beperken.', clueLayouts[5]),
      draft('Doos 14B', 'Het brieflint bij de depottrap en de lampknop in de microfilmhoek volgen elkaar in het archiefregister.', 'Twee vakken, maar grote gevolgen voor rij drie en vier.', clueLayouts[6]),
      draft('Laatste zegel', 'De handschoen in de kaartenkamer en het lakzegel in de verzegelde kast sluiten het archief.', 'De lakzegelcel is je beschuldiging.', clueLayouts[7]),
    ],
    deduction: flow('het stadsarchief', 'lakzegel in de verzegelde kast'),
    verdict:
      'Sela Brink stond bij het lakzegel in de verzegelde kast. Ze bracht dozen terug, maar een brief had ze al gelezen.',
  }),
]

export const getCaseById = (caseId: string): CaseFile =>
  cases.find((caseFile) => caseFile.id === caseId) ?? cases[0]
