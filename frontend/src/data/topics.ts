export interface Task {
  id: string;
  type: "translate" | "compose" | "listen" | "grammar" | "truefalse" | "speak";
  question: string;
  questionTt?: string;
  answer: string;
  options?: string[];
  words?: string[];
  reward: number;
  speakText?: string;
}

export interface Topic {
  slug: string;
  title: string;
  titleTt: string;
  icon: string;
  difficulty: 1 | 2 | 3;
  reward: number;
  tasks: Task[];
}

export const TOPICS: Topic[] = [
  {
    slug: "privetstviya",
    title: "Привет и знакомство",
    titleTt: "Тәнридәмле",
    icon: "👋",
    difficulty: 1 as const,
    reward: 30,
    tasks: [
      {"id": "priv-1", "type": "translate", "question": "Как будет «Привет» по-татарски?", "answer": "Сәлам", "options": ["Сәлам", "Рәхмәт", "Кушылыгыз", "Зинһар"], "reward": 5},
      {"id": "priv-2", "type": "translate", "question": "Как будет «Спасибо» по-татарски?", "answer": "Рәхмәт", "options": ["Сәлам", "Рәхмәт", "Зинһар", "Ок"], "reward": 5},
      {"id": "priv-3", "type": "truefalse", "question": "«Мин Дания» означает «Меня зовут Дания»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "priv-4", "type": "compose", "question": "Составь фразу «Меня зовут Айрат»", "words": ["Мин", "исемем", "Айрат"], "answer": "Мин исемем Айрат", "reward": 8},
      {"id": "priv-5", "type": "grammar", "question": "Сәлам! Мин ___ Дания.", "answer": "исемем", "options": ["исемем", "исемең", "исеме", "исемнәр"], "reward": 7},
      {"id": "priv-6", "type": "speak", "question": "Произнеси: «Сәлам, хәлләр ничек?»", "answer": "Сәлам, хәлләр ничек?", "speakText": "Сәлам, хәлләр ничек?", "reward": 10},
    ],
  },
  {
    slug: "eda",
    title: "Еда и напитки",
    titleTt: "Ашамлыклар",
    icon: "🍽️",
    difficulty: 1 as const,
    reward: 30,
    tasks: [
      {"id": "eda-1", "type": "translate", "question": "Как будет «Хлеб» по-татарски?", "answer": "Ипек", "options": ["Ипек", "Су", "Чәй", "Сөт"], "reward": 5},
      {"id": "eda-2", "type": "translate", "question": "Как будет «Чай» по-татарски?", "answer": "Чәй", "options": ["Су", "Чәй", "Ипек", "Сөт"], "reward": 5},
      {"id": "eda-3", "type": "truefalse", "question": "«Эчпочмак» — это татарское мороженое", "answer": "false", "options": ["true", "false"], "reward": 5},
      {"id": "eda-4", "type": "compose", "question": "Составь «Я хочу хлеб»", "words": ["Мин", "ипек", "телим"], "answer": "Мин ипек телим", "reward": 8},
      {"id": "eda-5", "type": "grammar", "question": "Мин ___ эчәм.", "answer": "чәй", "options": ["чәй", "чәйнең", "чәйдә", "чәйләр"], "reward": 7},
      {"id": "eda-6", "type": "speak", "question": "Произнеси: «Чәй эчәбез! Тәмле булсын!»", "answer": "Чәй эчәбез! Тәмле булсын!", "speakText": "Чәй эчәбез! Тәмле булсын!", "reward": 10},
    ],
  },
  {
    slug: "chisla",
    title: "Числа и время",
    titleTt: "Саннар",
    icon: "🔢",
    difficulty: 1 as const,
    reward: 35,
    tasks: [
      {"id": "chis-1", "type": "translate", "question": "Как будет «один» по-татарски?", "answer": "Бер", "options": ["Бер", "Ике", "Өч", "Дүрт"], "reward": 5},
      {"id": "chis-2", "type": "translate", "question": "Как будет «пять» по-татарски?", "answer": "Биш", "options": ["Өч", "Дүрт", "Биш", "Алты"], "reward": 5},
      {"id": "chis-3", "type": "compose", "question": "Составь «У меня три кошки»", "words": ["Минем", "өч", "мәчкәм", "бар"], "answer": "Минем өч мәчкәм бар", "reward": 8},
      {"id": "chis-4", "type": "truefalse", "question": "«Алты» — это число 7", "answer": "false", "options": ["true", "false"], "reward": 5},
      {"id": "chis-5", "type": "listen", "question": "Произнеси «сигез» (восемь)", "answer": "сигез", "reward": 5},
      {"id": "chis-6", "type": "speak", "question": "Произнеси: «Бер, ике, өч, дүрт, биш!»", "answer": "Бер, ике, өч, дүрт, биш!", "speakText": "Бер, ике, өч, дүрт, биш!", "reward": 10},
    ],
  },
  {
    slug: "semya",
    title: "Семья и люди",
    titleTt: "Гаилә",
    icon: "👨‍👩‍👧",
    difficulty: 2 as const,
    reward: 35,
    tasks: [
      {"id": "sem-1", "type": "translate", "question": "Как будет «мама» по-татарски?", "answer": "Әни", "options": ["Әни", "Әти", "Апа", "Абый"], "reward": 5},
      {"id": "sem-2", "type": "translate", "question": "Как будет «папа» по-татарски?", "answer": "Әти", "options": ["Әни", "Әти", "Оныд", "Абылай"], "reward": 5},
      {"id": "sem-3", "type": "compose", "question": "Составь «Моя семья большая»", "words": ["Минем", "гаиләм", "зур"], "answer": "Минем гаиләм зур", "reward": 8},
      {"id": "sem-4", "type": "truefalse", "question": "«Апа» означает «брат»", "answer": "false", "options": ["true", "false"], "reward": 5},
      {"id": "sem-5", "type": "grammar", "question": "Минем ___ олы.", "answer": "әнием", "options": ["әнием", "әниемнең", "әниемдә", "әниемнәр"], "reward": 7},
      {"id": "sem-6", "type": "speak", "question": "Произнеси: «Минем гаиләм зур!»", "answer": "Минем гаиләм зур!", "speakText": "Минем гаиләм зур!", "reward": 10},
    ],
  },
  {
    slug: "zhivotnye",
    title: "Животные",
    titleTt: "Хайваннар",
    icon: "🐾",
    difficulty: 1 as const,
    reward: 30,
    tasks: [
      {"id": "zhiv-1", "type": "translate", "question": "Как будет «кошка» по-татарски?", "answer": "Мәчә", "options": ["Мәчә", "Эт", "Куян", "Бәркет"], "reward": 5},
      {"id": "zhiv-2", "type": "translate", "question": "Как будет «собака» по-татарски?", "answer": "Эт", "options": ["Мәчә", "Эт", "Куян", "Бәрән"], "reward": 5},
      {"id": "zhiv-3", "type": "compose", "question": "Составь «Большая кошка»", "words": ["Зур", "мәчә"], "answer": "Зур мәчә", "reward": 5},
      {"id": "zhiv-4", "type": "truefalse", "question": "«Куян» означает «медведь»", "answer": "false", "options": ["true", "false"], "reward": 5},
      {"id": "zhiv-5", "type": "listen", "question": "Произнеси «бәләкәй» (маленький)", "answer": "бәләкәй", "reward": 5},
    ],
  },
  {
    slug: "gorod",
    title: "Город и транспорт",
    titleTt: "Шәһәр",
    icon: "🏙️",
    difficulty: 2 as const,
    reward: 35,
    tasks: [
      {"id": "gor-1", "type": "translate", "question": "Как будет «город» по-татарски?", "answer": "Шәһәр", "options": ["Шәһәр", "авыл", "юл", "күпер"], "reward": 5},
      {"id": "gor-2", "type": "translate", "question": "Как будет «автобус» по-татарски?", "answer": "Автобус", "options": ["Автобус", "поезд", "очкын", "велосипед"], "reward": 5},
      {"id": "gor-3", "type": "compose", "question": "Составь «Я иду в школу»", "words": ["Мин", "мәктәпкә", "барам"], "answer": "Мин мәктәпкә барам", "reward": 8},
      {"id": "gor-4", "type": "truefalse", "question": "«Юл» означает «дом»", "answer": "false", "options": ["true", "false"], "reward": 5},
      {"id": "gor-5", "type": "grammar", "question": "Мин ___ барам.", "answer": "шәһәргә", "options": ["шәһәргә", "шәһәрдә", "шәһәрне", "шәһәрләр"], "reward": 7},
    ],
  },
  {
    slug: "priroda",
    title: "Природа и животные",
    titleTt: "Табигать",
    icon: "🌿",
    difficulty: 2 as const,
    reward: 35,
    tasks: [
      {"id": "prir-1", "type": "translate", "question": "Как будет «вода» по-татарски?", "answer": "Су", "options": ["Су", "Ут", "Җир", "Күк"], "reward": 5},
      {"id": "prir-2", "type": "translate", "question": "Как будет «дерево» по-татарски?", "answer": "Агач", "options": ["Агач", "Чәчәк", "Таш", "Су"], "reward": 5},
      {"id": "prir-3", "type": "compose", "question": "Составь «Красивый цветок»", "words": ["Гүзәл", "чәчәк"], "answer": "Гүзәл чәчәк", "reward": 5},
      {"id": "prir-4", "type": "truefalse", "question": "«Күк» означает «небо»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "prir-5", "type": "listen", "question": "Произнеси «әремә» (река)", "answer": "әремә", "reward": 5},
    ],
  },
  {
    slug: "tsveta",
    title: "Цвета и формы",
    titleTt: "Төсләр",
    icon: "🎨",
    difficulty: 1 as const,
    reward: 30,
    tasks: [
      {"id": "tsv-1", "type": "translate", "question": "Как будет «красный» по-татарски?", "answer": "Кызыл", "options": ["Кызыл", "Зәңгәр", "Яшел", "Сары"], "reward": 5},
      {"id": "tsv-2", "type": "translate", "question": "Как будет «зелёный» по-татарски?", "answer": "Яшел", "options": ["Кызыл", "Зәңгәр", "Яшел", "Сары"], "reward": 5},
      {"id": "tsv-3", "type": "compose", "question": "Составь «Синее небо»", "words": ["Зәңгәр", "күк"], "answer": "Зәңгәр күк", "reward": 5},
      {"id": "tsv-4", "type": "truefalse", "question": "«Сары» означает «синий»", "answer": "false", "options": ["true", "false"], "reward": 5},
      {"id": "tsv-5", "type": "grammar", "question": "Бу ___ төс.", "answer": "кызыл", "options": ["кызыл", "кызылны", "кызылда", "кызыллар"], "reward": 7},
    ],
  },
  {
    slug: "odezhda",
    title: "Одежда",
    titleTt: "Кием-күлмәк",
    icon: "👔",
    difficulty: 2 as const,
    reward: 30,
    tasks: [
      {"id": "od-1", "type": "translate", "question": "Как будет «рубашка» по-татарски?", "answer": "Күлмәк", "options": ["Күлмәк", "Бәйләвәк", "Итәк", "Баш киеме"], "reward": 5},
      {"id": "od-2", "type": "translate", "question": "Как будет «шапка» по-татарски?", "answer": "Баш киеме", "options": ["Күлмәк", "Бәйләвәк", "Баш киеме", "Итәк"], "reward": 5},
      {"id": "od-3", "type": "compose", "question": "Составь «Красивая одежда»", "words": ["Гүзәл", "кием"], "answer": "Гүзәл кием", "reward": 5},
      {"id": "od-4", "type": "truefalse", "question": "«Итәк» означает «юбка»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "od-5", "type": "grammar", "question": "Мин яңа ___ алдым.", "answer": "күлмәк", "options": ["күлмәк", "күлмәкне", "күлмәктә", "күлмәкләр"], "reward": 7},
    ],
  },
  {
    slug: "dom",
    title: "Дом и быт",
    titleTt: "Өй",
    icon: "🏠",
    difficulty: 2 as const,
    reward: 35,
    tasks: [
      {"id": "dom-1", "type": "translate", "question": "Как будет «дом» по-татарски?", "answer": "Өй", "options": ["Өй", "Ишек", "Тәрәзә", "Комната"], "reward": 5},
      {"id": "dom-2", "type": "translate", "question": "Как будет «кухня» по-татарски?", "answer": "Аш бүлмәсе", "options": ["Аш бүлмәсе", "Очлы бүлмә", "Уку бүлмәсе", "Оч бүлмәсе"], "reward": 5},
      {"id": "dom-3", "type": "compose", "question": "Составь «Мой дом большой»", "words": ["Минем", "өйем", "зур"], "answer": "Минем өйем зур", "reward": 8},
      {"id": "dom-4", "type": "truefalse", "question": "«Ишек» означает «окно»", "answer": "false", "options": ["true", "false"], "reward": 5},
      {"id": "dom-5", "type": "grammar", "question": "Минем ___ яхшы.", "answer": "өйем", "options": ["өйем", "өең", "өе", "өйләр"], "reward": 7},
    ],
  },
  {
    slug: "prazdnik",
    title: "Праздники и традиции",
    titleTt: "Бәйрәмнәр",
    icon: "🎉",
    difficulty: 3 as const,
    reward: 40,
    tasks: [
      {"id": "pr-1", "type": "translate", "question": "Как будет «Сабантуй» по-татарски?", "answer": "Сабантуй", "options": ["Сабантуй", "Навруз", "Рамазан", "Кыдыр"], "reward": 5},
      {"id": "pr-2", "type": "translate", "question": "Как будет «праздник» по-татарски?", "answer": "Бәйрәм", "options": ["Бәйрәм", "Көн", "Ай", "Ел"], "reward": 5},
      {"id": "pr-3", "type": "compose", "question": "Составь «Счастливого праздника»", "words": ["Бәйрәм", "белән", "котлыйм"], "answer": "Бәйрәм белән котлыйм", "reward": 8},
      {"id": "pr-4", "type": "truefalse", "question": "Сабантуй — весенний татарский праздник", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "pr-5", "type": "listen", "question": "Произнеси «бәйрәм» (праздник)", "answer": "бәйрәм", "reward": 5},
    ],
  },
  {
    slug: "muzyka",
    title: "Музыка и искусство",
    titleTt: "Музыка",
    icon: "🎵",
    difficulty: 3 as const,
    reward: 35,
    tasks: [
      {"id": "muz-1", "type": "translate", "question": "Как будет «музыка» по-татарски?", "answer": "Музыка", "options": ["Музыка", "Шагырь", "Бии", "Уен"], "reward": 5},
      {"id": "muz-2", "type": "translate", "question": "Как будет «песня» по-татарски?", "answer": "Шагырь", "options": ["Музыка", "Шагырь", "Бии", "Уен"], "reward": 5},
      {"id": "muz-3", "type": "compose", "question": "Составь «Красивая песня»", "words": ["Гүзәл", "шагырь"], "answer": "Гүзәл шагырь", "reward": 5},
      {"id": "muz-4", "type": "truefalse", "question": "«Бии» означает «танец»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "muz-5", "type": "grammar", "question": "Мин ___ яратам.", "answer": "музыка", "options": ["музыка", "музыканы", "музыкада", "музыкалар"], "reward": 7},
    ],
  },
  {
    slug: "sport",
    title: "Спорт и игры",
    titleTt: "Спорт",
    icon: "⚽",
    difficulty: 2 as const,
    reward: 30,
    tasks: [
      {"id": "sp-1", "type": "translate", "question": "Как будет «футбол» по-татарски?", "answer": "Футбол", "options": ["Футбол", "Баскетбол", "Теннис", "Хоккей"], "reward": 5},
      {"id": "sp-2", "type": "translate", "question": "Как будет «играть» по-татарски?", "answer": "Уйнарга", "options": ["Уйнарга", "Биирга", "Озарга", "Көзәргә"], "reward": 5},
      {"id": "sp-3", "type": "compose", "question": "Составь «Я играю в футбол»", "words": ["Мин", "футбол", "уйныйм"], "answer": "Мин футбол уйныйм", "reward": 8},
      {"id": "sp-4", "type": "truefalse", "question": "«Уен» означает «игра»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "sp-5", "type": "grammar", "question": "Балалар ___ уйныйлар.", "answer": "футбол", "options": ["футбол", "футболны", "футболда", "футболлар"], "reward": 7},
    ],
  },
  {
    slug: "professii",
    title: "Профессии",
    titleTt: "Һөнәрләр",
    icon: "👨‍⚕️",
    difficulty: 2 as const,
    reward: 35,
    tasks: [
      {"id": "prf-1", "type": "translate", "question": "Как будет «учитель» по-татарски?", "answer": "Укытучы", "options": ["Укытучы", "Табиб", "Полиция", "Инженер"], "reward": 5},
      {"id": "prf-2", "type": "translate", "question": "Как будет «врач» по-татарски?", "answer": "Табиб", "options": ["Укытучы", "Табиб", "Полиция", "Инженер"], "reward": 5},
      {"id": "prf-3", "type": "compose", "question": "Составь «Я хочу быть учителем»", "words": ["Мин", "укытучы", "булырга", "тилем"], "answer": "Минукытучы булырга телим", "reward": 10},
      {"id": "prf-4", "type": "truefalse", "question": "«Табиб» означает «врач»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "prf-5", "type": "grammar", "question": "Минем атам — ___.", "answer": "укытучы", "options": ["укытучы", "укытучыны", "укытучыда", "укытучылар"], "reward": 7},
    ],
  },
  {
    slug: "emotsii",
    title: "Эмоции и характер",
    titleTt: "Хисләр",
    icon: "😊",
    difficulty: 3 as const,
    reward: 40,
    tasks: [
      {"id": "em-1", "type": "translate", "question": "Как будет «счастливый» по-татарски?", "answer": "Бәхетле", "options": ["Бәхетле", "Гамәмсез", "Ачулы", "Күңелле"], "reward": 5},
      {"id": "em-2", "type": "translate", "question": "Как будет «грустный» по-татарски?", "answer": "Мәңгәле", "options": ["Бәхетле", "Мәңгәле", "Ачулы", "Күңелле"], "reward": 5},
      {"id": "em-3", "type": "compose", "question": "Составь «Я счастлив»", "words": ["Мин", "бәхетлемен"], "answer": "Мин бәхетлемен", "reward": 5},
      {"id": "em-4", "type": "truefalse", "question": "«Күңелле» означвесело»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "em-5", "type": "grammar", "question": "Бүген мин ___.", "answer": "бәхетлемен", "options": ["бәхетлемен", "бәхетлең", "бәхетле", "бәхетлеләр"], "reward": 7},
    ],
  },
  {
    slug: "puteshestviya",
    title: "Путешествия",
    titleTt: "Сәяхәт",
    icon: "✈️",
    difficulty: 3 as const,
    reward: 40,
    tasks: [
      {"id": "put-1", "type": "translate", "question": "Как будет «дорога» по-татарски?", "answer": "Юл", "options": ["Юл", "Шәһәр", "Авыл", "Күпер"], "reward": 5},
      {"id": "put-2", "type": "translate", "question": "Как будет «поезд» по-татарски?", "answer": "Поезд", "options": ["Поезд", "Автобус", "Очкын", "Көймә"], "reward": 5},
      {"id": "put-3", "type": "compose", "question": "Составь «Я еду в Казань»", "words": ["Мин", "Казанга", "baraм"], "answer": "Мин Казанга барам", "reward": 8},
      {"id": "put-4", "type": "truefalse", "question": "«Сәяхәт» означает «путешествие»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "put-5", "type": "grammar", "question": "Мин ___ китәм.", "answer": "юлга", "options": ["юлга", "юлда", "юлны", "юллар"], "reward": 7},
    ],
  },
];

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function topicProgress(slug: string, completedTasks: string[]): { done: number; total: number; pct: number } {
  const topic = getTopic(slug);
  if (!topic) return { done: 0, total: 0, pct: 0 };
  const done = topic.tasks.filter((t) => completedTasks.includes(t.id)).length;
  return { done, total: topic.tasks.length, pct: Math.round((done / topic.tasks.length) * 100) };
}
