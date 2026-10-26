/**
 * Car makes and models for the dream picker, with the Russian names people
 * actually type. A model is `Name`, `Name/alias/alias` or `Name@Wikipedia title`.
 */
const DB: [make: string, aliases: string, models: string][] = [
  ['Porsche', 'порше порш порщ', '911/девятьсот одиннадцать|Panamera|Cayenne|Cayenne Coupe/кайен купе|Macan|Taycan|718 Boxster/бокстер|718 Cayman/кайман'],
  ['Kia', 'киа кия', 'Rio|Ceed/сид|Cerato|K5|Optima|Sportage/спортейдж|Sorento|Seltos|Soul/соул|Stinger/стингер|Carnival/карнивал|Mohave/мохав|EV6|EV9|Picanto/пиканто'],
  ['Toyota', 'тойота таета тоета', 'Camry|Corolla|RAV4/рав|Land Cruiser/крузак ленд крузер|Land Cruiser Prado/прадо|Highlander/хайлендер|Supra|C-HR|Hilux/хайлюкс|Fortuner/фортунер|Yaris/ярис|Alphard/альфард|GR86|Crown/краун|bZ4X'],
  ['Hyundai', 'хендай хундай хёндай хюндай хендэ хёндэ хунда', 'Solaris|Elantra|Sonata|Creta|Tucson/туссан|Santa Fe/санта фе|Palisade/палисейд|i30|Accent|Getz/гетц|Ioniq 5|Staria/стария|Kona'],
  ['Lada', 'лада ваз жигули', 'Vesta|Granta|Niva Legend@Lada Niva Legend|Niva Travel@Lada Niva Travel|Largus|XRAY/икс рей иксрей|Priora|Kalina|Iskra/искра|2107/семёрка семерка@VAZ-2107|2114/четырнадцатая@Lada Samara|2106/шестёрка шестерка@VAZ-2106'],
  ['Volkswagen', 'фольксваген фольц фольк вв vw', 'Polo|Golf|Passat|Jetta|Tiguan|Touareg|Teramont/терамонт|Arteon/артеон|ID.4|Multivan/мультивен|Amarok/амарок|Taos'],
  ['Škoda', 'шкода skoda', 'Octavia|Rapid|Kodiaq/кодиак|Karoq/карок|Superb/суперб|Fabia|Kamiq/камик'],
  ['Mercedes-Benz', 'мерседес мерс бенц mercedes', 'C-Class/ц класс цешка|E-Class/ешка|S-Class/эска|A-Class|CLA|CLS|GLA|GLB|GLC|GLE|GLS|G-Class/гелик гелендваген гелентваген|AMG GT|EQS|V-Class/виано|Maybach S-Class/майбах|SL'],
  ['BMW', 'бмв бэха беха бумер', '3 Series/трешка тройка|5 Series/пятерка пятёрка|7 Series/семерка семёрка|1 Series|2 Series|4 Series|8 Series|X1|X2|X3|X4|X5|X6|X7|XM|M2|M3|M4|M5|M8|Z4|i4|i7|iX'],
  ['Audi', 'ауди', 'A3|A4|A5|A6|A7|A8|Q3|Q5|Q7|Q8|e-tron GT/етрон|R8|RS6|RS7|TT'],
  ['Lexus', 'лексус', 'RX/рх|NX/нх|LX/лх|ES|IS|GX|LS|UX|LC'],
  ['Land Rover', 'ленд ровер лэнд ровер рендж ровер ренж ровер', 'Range Rover/рендж ренж@Range Rover|Range Rover Sport@Range Rover Sport|Range Rover Velar/велар@Range Rover Velar|Range Rover Evoque/эвок@Range Rover Evoque|Defender/дефендер|Discovery/дискавери|Discovery Sport'],
  ['Tesla', 'тесла', 'Model 3|Model S|Model X|Model Y|Cybertruck/кибертрак'],
  ['Nissan', 'ниссан нисан', 'Qashqai|X-Trail/икстрейл икс трейл|Almera|Juke|Teana/теана|Murano|Patrol|Pathfinder/патфайндер|GT-R/гтр|Leaf/лиф|Note|Terrano'],
  ['Mazda', 'мазда', '3@Mazda3|6@Mazda6|CX-5|CX-30|CX-9|CX-60|MX-5'],
  ['Honda', 'хонда', 'Civic/цивик сивик|Accord|CR-V/црв|Fit/фит|HR-V|Pilot'],
  ['Mitsubishi', 'мицубиси митсубиси мицубиши митсубиши', 'Outlander|Pajero|Pajero Sport|Lancer/лансер|ASX|Eclipse Cross/эклипс|L200'],
  ['Subaru', 'субару', 'Forester|Outback|Impreza|WRX|XV|BRZ'],
  ['Renault', 'рено', 'Logan|Sandero|Duster|Arkana|Kaptur|Megane/меган|Clio/клио'],
  ['Volvo', 'вольво', 'XC90|XC60|XC40|S60|S90|V60|V90'],
  ['Infiniti', 'инфинити', 'QX50|QX60|QX80|Q50'],
  ['Genesis', 'генезис дженезис', 'G70|G80|G90|GV70|GV80'],
  ['Haval', 'хавал хавейл хавэйл', 'Jolion|F7|F7x|H6|H9|Dargo/дарго|M6'],
  ['Chery', 'чери черри', 'Tiggo 4|Tiggo 7 Pro|Tiggo 8 Pro|Tiggo 9|Arrizo 8/арризо'],
  ['Geely', 'джили', 'Coolray/кулрей|Atlas|Monjaro/монжаро|Tugella/тугела|Emgrand/эмгранд|Okavango/окаванго'],
  ['Exeed', 'эксид иксид', 'LX|TXL|VX|RX'],
  ['Omoda', 'омода', 'C5|S5'],
  ['Tank', 'танк', '300|500'],
  ['Changan', 'чанган чанъань', 'CS35 Plus|CS55 Plus|CS75 Plus|UNI-K/юни к|UNI-V/юни в|Alsvin'],
  ['Li Auto', 'ли авто лисян лисянг lixiang li', 'L6|L7|L8|L9'],
  ['Zeekr', 'зикр зекр', '001|007|009|X'],
  ['Hongqi', 'хончи хунцы хончи', 'H5|H9|HS5|E-HS9'],
  ['Jetour', 'джетур', 'X70|X90|Dashing/дашинг'],
  ['Voyah', 'воя войя', 'Free|Dream'],
  ['Moskvich', 'москвич', '3@Moskvich 3|6@Moskvich 6'],
  ['UAZ', 'уаз', 'Patriot|Hunter/хантер|Bukhanka/буханка@UAZ-452'],
  ['GAZ', 'газ', 'Gazelle/газель@GAZelle|Volga/волга@GAZ Volga'],
  ['Chevrolet', 'шевроле шеви шевролет', 'Camaro|Corvette/корвет|Tahoe|Cruze/круз|Aveo|Niva|Cobalt|Malibu|Captiva'],
  ['Ford', 'форд', 'Focus|Mondeo|Mustang/мустанг|Explorer|Kuga|F-150|Fiesta/фиеста|Bronco|Ranger'],
  ['Cadillac', 'кадиллак кадилак', 'Escalade/эскалейд|CT5|XT5|XT6|Lyriq'],
  ['Jeep', 'джип', 'Grand Cherokee/гранд чероки|Wrangler/вранглер рэнглер|Cherokee/чероки|Compass'],
  ['Dodge', 'додж', 'Challenger/челленджер|Charger/чарджер|Durango|Ram@Ram pickup'],
  ['Opel', 'опель', 'Astra|Corsa|Insignia|Zafira|Mokka'],
  ['Peugeot', 'пежо', '208|308|408|3008|5008'],
  ['Citroën', 'ситроен citroen', 'C3|C4|C5 Aircross'],
  ['Mini', 'мини', 'Cooper/купер@Mini Hatch|Countryman/кантримен'],
  ['Suzuki', 'сузуки', 'Vitara|Jimny|SX4|Swift'],
  ['Alfa Romeo', 'альфа ромео', 'Giulia/джулия|Stelvio'],
  ['Jaguar', 'ягуар', 'F-Pace|E-Pace|F-Type|XF|XE|I-Pace'],
  ['Bentley', 'бентли', 'Continental GT|Bentayga/бентайга|Flying Spur'],
  ['Rolls-Royce', 'роллс ройс ролс ройс', 'Cullinan/куллинан|Phantom/фантом|Ghost/гост|Wraith|Spectre'],
  ['Ferrari', 'феррари ферари', 'Roma|Purosangue|296 GTB|SF90 Stradale|F8 Tributo|812 Superfast'],
  ['Lamborghini', 'ламборгини ламборджини ламба', 'Urus/урус|Huracán|Aventador/авентадор|Revuelto'],
  ['Maserati', 'мазерати', 'Levante|Ghibli/гибли|Quattroporte/кватропорте|MC20|Grecale'],
  ['Aston Martin', 'астон мартин', 'DB12|DB11|Vantage|DBX'],
  ['McLaren', 'макларен', '720S|750S|Artura|GT'],
  ['Daewoo', 'дэу деу', 'Nexia|Matiz|Gentra'],
];

export interface CarPick {
  make: string;
  model: string;
  /** what the car is called on the screen */
  title: string;
  /** English Wikipedia article for the photo */
  wiki: string;
}

const RU: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'u', я: 'a',
};

/** Spelling-blind form: Cyrillic and Latin end up the same, so «камри» meets «Camry». */
export function norm(s: string) {
  let t = s.toLowerCase().replace(/х(?=\d)/g, 'x'); // «Х5» is BMW X5
  t = [...t].map((c) => RU[c] ?? c).join('');
  t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
  t = t
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/[cq]/g, 'k')
    .replace(/w/g, 'v')
    .replace(/j/g, 'dzh')
    .replace(/ee/g, 'i')
    .replace(/y/g, 'i')
    .replace(/oo|ou/g, 'u')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/([a-z])\1+/g, '$1');
  return t.trim().replace(/\s+/g, ' ');
}

/** Edit distance where swapping two neighbours counts once («прош» for «порш»). */
export function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

interface Entry extends CarPick {
  rank: number;
  makeWords: string[];
  modelWords: string[];
  compact: string;
}

const ENTRIES: Entry[] = DB.flatMap(([make, aliases, models], mi) => {
  const makeWords = [...norm(make).split(' '), ...norm(aliases).split(' ')];
  return models.split('|').map((m, i) => {
    const [names, wiki] = m.split('@');
    const [model, ...alias] = names.split('/');
    const modelWords = [...norm(model).split(' '), ...alias.flatMap((a) => norm(a).split(' '))];
    const title = `${make} ${model}`;
    return { make, model, title, wiki: wiki ?? title, rank: mi * 100 + i, makeWords, modelWords, compact: norm(title).replace(/ /g, '') };
  });
});

/** 3 for a word that starts the same, 2 for one that is close, 0 for none. */
function wordScore(q: string, words: string[]) {
  let best = 0;
  for (const w of words) {
    if (w.startsWith(q)) return 3;
    if (q.length >= 3) {
      const allowed = q.length >= 6 ? 2 : 1;
      if (distance(q, w.slice(0, q.length)) <= allowed || distance(q, w) <= allowed) best = 2;
    }
  }
  return best;
}

/**
 * Cars that fit what was typed: «порш пан», «прош панамера», «киа», «камри».
 * Every typed word must hit the make or the model; models of the same make stay in order.
 */
export function searchCars(query: string, limit = 8): CarPick[] {
  const words = norm(query).split(' ').filter(Boolean);
  if (!words.length) return POPULAR.map((t) => ENTRIES.find((e) => e.title === t)!).slice(0, limit);
  const hits: { e: Entry; score: number }[] = [];
  for (const e of ENTRIES) {
    let score = 0;
    let ok = true;
    for (const q of words) {
      // a hit on the model counts a little more than on the make
      const onModel = wordScore(q, e.modelWords);
      const s = onModel ? onModel + 0.5 : wordScore(q, e.makeWords) || (e.compact.includes(q) ? 1 : 0);
      if (!s) {
        ok = false;
        break;
      }
      score += s;
    }
    if (ok) hits.push({ e, score });
  }
  hits.sort((a, b) => b.score - a.score || a.e.rank - b.e.rank);
  return hits.slice(0, limit).map(({ e }) => ({ make: e.make, model: e.model, title: e.title, wiki: e.wiki }));
}

/** The best guess for a name saved earlier, e.g. «Porsche Panamera». */
export function carFromName(name: string): CarPick | null {
  const exact = ENTRIES.find((e) => norm(e.title) === norm(name));
  if (exact) return { make: exact.make, model: exact.model, title: exact.title, wiki: exact.wiki };
  return searchCars(name, 1)[0] ?? null;
}

const POPULAR = ['Porsche Panamera', 'Porsche 911', 'Mercedes-Benz G-Class', 'BMW M5', 'Toyota Land Cruiser', 'Kia Rio', 'Lada Vesta', 'Tesla Model S'];
