export interface Word {
  tt: string;
  ru: string;
  transcription?: string;
}

export interface Lesson {
  id: string;
  title: string;
  titleRu: string;
  words: Word[];
}

export interface Island {
  slug: string;
  title: string;
  titleRu: string;
  description: string;
  /** Дух-хранитель острова */
  guide: string;
  level: "Башлангыч" | "Дәвам";
  icon: "wave" | "hash" | "home" | "apple" | "paw" | "building" | "tree" | "compass" | "palette" | "clock";
  lessons: Lesson[];
}

export const ISLANDS: Island[] = [
  {
    slug: "salem",
    title: "Привет",
    titleRu: "Сәлам",
    description: "Первый остров: здороваемся, знакомимся, прощаемся.",
    guide: "Ак бабай",
    level: "Башлангыч",
    icon: "wave",
    lessons: [
      {
        id: "salem-1",
        title: "Сәламләшү",
        titleRu: "Приветствие",
        words: [
          { tt: "Сәлам!", ru: "Привет!", transcription: "сә-лам" },
          { tt: "Исәнмесез!", ru: "Здравствуйте!", transcription: "и-сән-ме-сез" },
          { tt: "Хәерле иртә!", ru: "Доброе утро!", transcription: "хә-ер-ле ир-тә" },
          { tt: "Хәерле көн!", ru: "Добрый день!", transcription: "хә-ер-ле көн" },
          { tt: "Сау булыгыз!", ru: "До свидания!", transcription: "сау бу-лы-гыз" },
        ],
      },
      {
        id: "salem-2",
        title: "Танышу",
        titleRu: "Знакомство",
        words: [
          { tt: "Минем исемем …", ru: "Меня зовут …", transcription: "ми-нем и-се-мем" },
          { tt: "Синең исемең ничек?", ru: "Как тебя зовут?", transcription: "си-нең и-се-мең ни-чек" },
          { tt: "Шатмын!", ru: "Рад знакомству!", transcription: "шат-мын" },
          { tt: "Син кайдан?", ru: "Ты откуда?", transcription: "син кай-дан" },
          { tt: "Мин Казаннан", ru: "Я из Казани", transcription: "мин ка-зан-нан" },
        ],
      },
    ],
  },
  {
    slug: "ashamlyk",
    title: "Еда",
    titleRu: "Ашамлыклар",
    description: "Чай, өчпочмак и всё самое вкусное.",
    guide: "Шүрәле",
    level: "Башлангыч",
    icon: "apple",
    lessons: [
      {
        id: "ashamlyk-1",
        title: "Чәй табыны",
        titleRu: "Чаепитие",
        words: [
          { tt: "Исәнмесез!", ru: "Здравствуйте!", transcription: "и-сән-ме-сез" },
          { tt: "чәй", ru: "чай", transcription: "чәй" },
          { tt: "икмәк", ru: "хлеб", transcription: "ик-мәк" },
          { tt: "сөт", ru: "молоко", transcription: "сөт" },
          { tt: "бал", ru: "мёд", transcription: "бал" },
          { tt: "чәкчәк", ru: "чак-чак", transcription: "чәк-чәк" },
          { tt: "өчпочмак", ru: "треугольник (эчпочмак)", transcription: "өч-поч-мак" },
        ],
      },
    ],
  },
  {
    slug: "sannar",
    title: "Числа",
    titleRu: "Саннар",
    description: "Считаем до десяти и спрашиваем возраст.",
    guide: "Кыш бабай",
    level: "Башлангыч",
    icon: "hash",
    lessons: [
      {
        id: "sannar-1",
        title: "Бердән бишкә",
        titleRu: "От одного до пяти",
        words: [
          { tt: "бер", ru: "один", transcription: "бер" },
          { tt: "ике", ru: "два", transcription: "и-ке" },
          { tt: "өч", ru: "три", transcription: "өч" },
          { tt: "дүрт", ru: "четыре", transcription: "дүрт" },
          { tt: "биш", ru: "пять", transcription: "биш" },
        ],
      },
      {
        id: "sannar-2",
        title: "Алтыдан унға",
        titleRu: "От шести до десяти",
        words: [
          { tt: "алты", ru: "шесть", transcription: "ал-ты" },
          { tt: "җиде", ru: "семь", transcription: "җи-де" },
          { tt: "сигез", ru: "восемь", transcription: "си-гез" },
          { tt: "тугыз", ru: "девять", transcription: "ту-гыз" },
          { tt: "ун", ru: "десять", transcription: "ун" },
        ],
      },
    ],
  },
  {
    slug: "gaila",
    title: "Семья",
    titleRu: "Гаилә",
    description: "Рассказываем о близких и родных.",
    guide: "Әби",
    level: "Башлангыч",
    icon: "home",
    lessons: [
      {
        id: "gaila-1",
        title: "Якыннар",
        titleRu: "Близкие",
        words: [
          { tt: "әни", ru: "мама", transcription: "ә-ни" },
          { tt: "әти", ru: "папа", transcription: "ә-ти" },
          { tt: "апа", ru: "сестра", transcription: "а-па" },
          { tt: "абый", ru: "брат", transcription: "а-бый" },
          { tt: "бабай", ru: "дедушка", transcription: "ба-бай" },
          { tt: "әби", ru: "бабушка", transcription: "ә-би" },
        ],
      },
    ],
  },
  {
    slug: "hayvannar",
    title: "Животные",
    titleRu: "Хайваннар",
    description: "Бүре, аю һәм урман дуслары.",
    guide: "Бүре",
    level: "Башлангыч",
    icon: "paw",
    lessons: [
      {
        id: "hayvannar-1",
        title: "Урман дуслары",
        titleRu: "Лесные друзья",
        words: [
          { tt: "бүре", ru: "волк", transcription: "бү-ре" },
          { tt: "аю", ru: "медведь", transcription: "а-ю" },
          { tt: "төлке", ru: "лиса", transcription: "төл-ке" },
          { tt: "куян", ru: "заяц", transcription: "ку-ян" },
          { tt: "ат", ru: "лошадь", transcription: "ат" },
          { tt: "песи", ru: "кошка", transcription: "пе-си" },
        ],
      },
    ],
  },
  {
    slug: "shahar",
    title: "Город",
    titleRu: "Шәһәр",
    description: "Казан урамнары буйлап сәяхәт.",
    guide: "Салих абый",
    level: "Башлангыч",
    icon: "building",
    lessons: [
      {
        id: "shahar-1",
        title: "Шәһәрдә",
        titleRu: "В городе",
        words: [
          { tt: "урам", ru: "улица", transcription: "у-рам" },
          { tt: "мәйдан", ru: "площадь", transcription: "мәй-дан" },
          { tt: "күпер", ru: "мост", transcription: "кү-пер" },
          { tt: "вокзал", ru: "вокзал", transcription: "вок-зал" },
          { tt: "музей", ru: "музей", transcription: "му-зей" },
          { tt: "Казан кремле", ru: "Казанский кремль", transcription: "ка-зан крем-ле" },
        ],
      },
    ],
  },
  {
    slug: "tabigat",
    title: "Природа",
    titleRu: "Табигать",
    description: "Идел, урман һәм болытлар турында.",
    guide: "Су анасы",
    level: "Дәвам",
    icon: "tree",
    lessons: [
      {
        id: "tabigat-1",
        title: "Әйләнә-тирә",
        titleRu: "Вокруг нас",
        words: [
          { tt: "кояш", ru: "солнце", transcription: "ко-яш" },
          { tt: "ай", ru: "луна", transcription: "ай" },
          { tt: "су", ru: "вода", transcription: "су" },
          { tt: "урман", ru: "лес", transcription: "ур-ман" },
          { tt: "чәчәк", ru: "цветок", transcription: "чә-чәк" },
          { tt: "кош", ru: "птица", transcription: "кош" },
        ],
      },
    ],
  },
  {
    slug: "sayahet",
    title: "Путешествие",
    titleRu: "Сәяхәт",
    description: "Юлга җыенабыз: юнәлешләр һәм транспорт.",
    guide: "Юлчы бабай",
    level: "Дәвам",
    icon: "compass",
    lessons: [
      {
        id: "sayahet-1",
        title: "Юлда",
        titleRu: "В пути",
        words: [
          { tt: "юл", ru: "дорога", transcription: "юл" },
          { tt: "поезд", ru: "поезд", transcription: "по-езд" },
          { tt: "очкыч", ru: "самолёт", transcription: "оч-кыч" },
          { tt: "уңга", ru: "направо", transcription: "уң-га" },
          { tt: "сулга", ru: "налево", transcription: "сул-га" },
          { tt: "туры", ru: "прямо", transcription: "ту-ры" },
        ],
      },
    ],
  },
  {
    slug: "tosler",
    title: "Цвета",
    titleRu: "Төсләр",
    description: "Яшел урман, зәңгәр күк, алтын көн.",
    guide: "Алтын кош",
    level: "Дәвам",
    icon: "palette",
    lessons: [
      {
        id: "tosler-1",
        title: "Төсләр",
        titleRu: "Цвета",
        words: [
          { tt: "кызыл", ru: "красный", transcription: "кы-зыл" },
          { tt: "яшел", ru: "зелёный", transcription: "я-шель" },
          { tt: "зәңгәр", ru: "синий", transcription: "зәң-гәр" },
          { tt: "сары", ru: "жёлтый", transcription: "са-ры" },
          { tt: "ак", ru: "белый", transcription: "ак" },
          { tt: "кара", ru: "чёрный", transcription: "ка-ра" },
        ],
      },
    ],
  },
  {
    slug: "vakyt",
    title: "Время",
    titleRu: "Вакыт",
    description: "Көн, атна, ел — вакытны өйрәнәбез.",
    guide: "Ай бабай",
    level: "Дәвам",
    icon: "clock",
    lessons: [
      {
        id: "vakyt-1",
        title: "Кайчан?",
        titleRu: "Когда?",
        words: [
          { tt: "бүген", ru: "сегодня", transcription: "бү-ген" },
          { tt: "иртәгә", ru: "завтра", transcription: "ир-тә-гә" },
          { tt: "кичә", ru: "вчера", transcription: "ки-чә" },
          { tt: "иртә", ru: "утро", transcription: "ир-тә" },
          { tt: "кич", ru: "вечер", transcription: "кич" },
          { tt: "төн", ru: "ночь", transcription: "төн" },
        ],
      },
    ],
  },
];

export function getIsland(slug: string): Island | undefined {
  return ISLANDS.find((i) => i.slug === slug);
}

export type IslandStatus = "done" | "open" | "locked";

export function islandProgress(
  island: Island,
  completedLessons: string[],
): { done: number; total: number; pct: number } {
  const total = island.lessons.length;
  const done = island.lessons.filter((l) => completedLessons.includes(l.id)).length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** Остров открыт, если это первый остров или предыдущий полностью пройден. */
export function islandStatus(
  index: number,
  completedLessons: string[],
): IslandStatus {
  if (index === 0) {
    const p = islandProgress(ISLANDS[0], completedLessons);
    return p.done === p.total ? "done" : "open";
  }
  const prev = islandProgress(ISLANDS[index - 1], completedLessons);
  if (prev.done < prev.total) return "locked";
  const cur = islandProgress(ISLANDS[index], completedLessons);
  return cur.done === cur.total ? "done" : "open";
}
