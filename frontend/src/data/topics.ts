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
    titleTt: "Танышу һәм сәламләү",
    icon: "👋",
    difficulty: 1 as const,
    reward: 35,
    tasks: [
      {"id": "priv-1", "type": "translate", "question": "Как будет «Привет» по-татарски?", "answer": "Сәлам", "options": ["Сәлам", "Рәхмәт", "Кушылыгыз", "Зинһар"], "reward": 5},
      {"id": "priv-2", "type": "translate", "question": "Как будет «Спасибо» по-татарски?", "answer": "Рәхмәт", "options": ["Сәлам", "Рәхмәт", "Зинһар", "Хуш"], "reward": 5},
      {"id": "priv-3", "type": "truefalse", "question": "«Мин исемем Айрат» означает «Меня зовут Айрат»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "priv-4", "type": "compose", "question": "Составь фразу: «Здравствуйте, меня зовут Айрат, очень приятно»", "words": ["Исәнмесез,", "минем", "исемем", "Айрат,", "бик", "шатмын"], "answer": "Исәнмесез, минем исемем Айрат, бик шатмын", "reward": 10},
      {"id": "priv-5", "type": "grammar", "question": "Сәлам! Мин ___ Дания.", "answer": "исемем", "options": ["исемем", "исемең", "исеме", "исемнәр"], "reward": 7},
      {"id": "priv-6", "type": "speak", "question": "Произнеси: «Сәлам, хәлләр ничек?»", "answer": "Сәлам, хәлләр ничек?", "speakText": "Сәлам, хәлләр ничек?", "reward": 10},
    ],
  },
  {
    slug: "eda",
    title: "Еда и напитки",
    titleTt: "Ашамлыклар һәм эчемлекләр",
    icon: "🍽️",
    difficulty: 1 as const,
    reward: 35,
    tasks: [
      {"id": "eda-1", "type": "translate", "question": "Как будет «Хлеб» по-татарски?", "answer": "Ипи", "options": ["Ипи", "Су", "Чәй", "Сөт"], "reward": 5},
      {"id": "eda-2", "type": "translate", "question": "Как будет «Чай» по-татарски?", "answer": "Чәй", "options": ["Су", "Чәй", "Ипи", "Сөт"], "reward": 5},
      {"id": "eda-3", "type": "truefalse", "question": "Инфинитив глагола «есть / кушать» по-татарски — «ашарга»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "eda-4", "type": "compose", "question": "Составь предложение: «Я хочу пить вкусный черный чай»", "words": ["Мин", "тәмле", "кара", "чәй", "эчәргә", "телим"], "answer": "Мин тәмле кара чәй эчәргә телим", "reward": 10},
      {"id": "eda-5", "type": "grammar", "question": "Мин иртән ___ эчәм.", "answer": "тәмле чәй", "options": ["тәмле чәй", "тәмле чәйне", "тәмле чәйдә", "тәмле чәйләр"], "reward": 7},
      {"id": "eda-6", "type": "speak", "question": "Произнеси: «Өчпочмак бик тәмле!»", "answer": "Өчпочмак бик тәмле!", "speakText": "Өчпочмак бик тәмле!", "reward": 10},
    ],
  },
  {
    slug: "chisla",
    title: "Числа и время",
    titleTt: "Саннар һәм вакыт",
    icon: "🔢",
    difficulty: 1 as const,
    reward: 35,
    tasks: [
      {"id": "chis-1", "type": "translate", "question": "Как будет «один» по-татарски?", "answer": "Бер", "options": ["Бер", "Ике", "Өч", "Дүрт"], "reward": 5},
      {"id": "chis-2", "type": "translate", "question": "Как будет «пять» по-татарски?", "answer": "Биш", "options": ["Өч", "Дүрт", "Биш", "Алты"], "reward": 5},
      {"id": "chis-3", "type": "compose", "question": "Составь предложение: «У меня дома живут три пушистые кошки»", "words": ["Өйдә", "минем", "өч", "матур", "мәчегем", "бар"], "answer": "Өйдә минем өч матур мәчегем бар", "reward": 10},
      {"id": "chis-4", "type": "truefalse", "question": "«Сигез» — это число 8", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "chis-5", "type": "listen", "question": "Произнеси «ун» (десять)", "answer": "ун", "reward": 5},
      {"id": "chis-6", "type": "speak", "question": "Произнеси: «Бер, ике, өч, дүрт, биш!»", "answer": "Бер, ике, өч, дүрт, биш!", "speakText": "Бер, ике, өч, дүрт, биш!", "reward": 10},
    ],
  },
  {
    slug: "semya",
    title: "Семья и люди",
    titleTt: "Гаилә һәм туганнар",
    icon: "👨‍👩‍👧",
    difficulty: 2 as const,
    reward: 40,
    tasks: [
      {"id": "sem-1", "type": "translate", "question": "Как будет «мама» по-татарски?", "answer": "Әни", "options": ["Әни", "Әти", "Апа", "Абый"], "reward": 5},
      {"id": "sem-2", "type": "translate", "question": "Как будет «папа» по-татарски?", "answer": "Әти", "options": ["Әни", "Әти", "Угыл", "Кыз"], "reward": 5},
      {"id": "sem-3", "type": "compose", "question": "Составь предложение: «Моя дружная семья живет в Казани»", "words": ["Минем", "тату", "гаиләм", "Казанда", "яши"], "answer": "Минем тату гаиләм Казанда яши", "reward": 10},
      {"id": "sem-4", "type": "truefalse", "question": "Инфинитив глагола «любить» по-татарски — «яратырга»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "sem-5", "type": "grammar", "question": "Минем әнием бик ___.", "answer": "яхшы", "options": ["яхшы", "яхшыны", "яхшыда", "яхшылар"], "reward": 7},
      {"id": "sem-6", "type": "speak", "question": "Произнеси: «Минем гаиләм бик тату!»", "answer": "Минем гаиләм бик тату!", "speakText": "Минем гаиләм бик тату!", "reward": 10},
    ],
  },
  {
    slug: "gorod",
    title: "Город и транспорт",
    titleTt: "Шәһәр һәм транспорт",
    icon: "🏙️",
    difficulty: 2 as const,
    reward: 40,
    tasks: [
      {"id": "gor-1", "type": "translate", "question": "Как будет «город» по-татарски?", "answer": "Шәһәр", "options": ["Шәһәр", "Авыл", "Юл", "Күпер"], "reward": 5},
      {"id": "gor-2", "type": "translate", "question": "Как правильно сказать инфинитив «идти / ехать»?", "answer": "Барырга", "options": ["Барырга", "Бару", "Бара", "Бар"], "reward": 5},
      {"id": "gor-3", "type": "compose", "question": "Составь предложение: «Каждый день я езжу на автобусе в центр города»", "words": ["Һәркөнне", "мин", "автобус", "белән", "шәһәр", "үзәгенә", "барам"], "answer": "Һәркөнне мин автобус белән шәһәр үзәгенә барам", "reward": 12},
      {"id": "gor-4", "type": "truefalse", "question": "«Мәктәп» означает «школа»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "gor-5", "type": "grammar", "question": "Мин автобус ___ утырам.", "answer": "белән", "options": ["белән", "өчен", "турында", "аша"], "reward": 7},
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
