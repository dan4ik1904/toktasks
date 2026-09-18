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
  level: "Башлангыч" | "Дәвам";
  icon: "wave" | "hash" | "home" | "apple" | "tree" | "compass";
  lessons: Lesson[];
}

export const ISLANDS: Island[] = [
  {
    slug: "salem",
    title: "Сәлам",
    titleRu: "Приветствия",
    description: "Первый остров: здороваемся, знакомимся, прощаемся.",
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
    slug: "sannar",
    title: "Саннар",
    titleRu: "Числа",
    description: "Считаем до десяти и спрашиваем возраст.",
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
    title: "Гаилә",
    titleRu: "Семья",
    description: "Рассказываем о близких и родных.",
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
    slug: "ashamlyk",
    title: "Ашамлыклар",
    titleRu: "Еда",
    description: "Чай, өчпочмак и всё самое вкусное.",
    level: "Башлангыч",
    icon: "apple",
    lessons: [
      {
        id: "ashamlyk-1",
        title: "Чәй табыны",
        titleRu: "Чаепитие",
        words: [
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
    slug: "tabigat",
    title: "Табигать",
    titleRu: "Природа",
    description: "Идел, урман һәм болытлар турында.",
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
    title: "Сәяхәт",
    titleRu: "Путешествие",
    description: "Казан урамнары буйлап сәяхәт.",
    level: "Дәвам",
    icon: "compass",
    lessons: [
      {
        id: "sayahet-1",
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
];

export function getIsland(slug: string): Island | undefined {
  return ISLANDS.find((i) => i.slug === slug);
}
