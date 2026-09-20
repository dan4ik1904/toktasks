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
  /** 1 — Начинающий, 2 — Базовый, 3 — Средний, 4 — Продвинутый */
  difficulty: 1 | 2 | 3 | 4;
  reward: number;
  tasks: Task[];
}

export const TOPICS: Topic[] = [
  // ================= УРОВЕНЬ 1 · Начинающий =================
  {
    slug: "alfavit",
    title: "Алфавит и чтение",
    titleTt: "Әлифба һәм уку",
    icon: "🔤",
    difficulty: 1 as const,
    reward: 50,
    tasks: [
      {"id": "alf-1", "type": "translate", "question": "Сколько букв в татарском кириллическом алфавите?", "answer": "39", "options": ["39", "33", "26", "42"], "reward": 5},
      {"id": "alf-2", "type": "translate", "question": "Какой буквы нет в русском, но есть в татарском?", "answer": "Ә", "options": ["Ә", "Б", "М", "Т"], "reward": 5},
      {"id": "alf-3", "type": "truefalse", "question": "«Буква Ң обозначает носовой звук, как в слове „таң“ (заря)»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "alf-4", "type": "grammar", "question": "Выбери пропущенную букву: «к_бәләк» (бабочка)", "answer": "ү", "options": ["ү", "у", "о", "ө"], "reward": 7},
      {"id": "alf-5", "type": "compose", "question": "Составь предложение: «Я люблю маму»", "words": ["Мин", "әнине", "яратам"], "answer": "Мин әнине яратам", "reward": 10},
      {"id": "alf-6", "type": "listen", "question": "Прослушай аудио и напиши букву", "answer": "Ә", "reward": 8},
      {"id": "alf-7", "type": "translate", "question": "Как читается буква «һ»?", "answer": "Как придыхательное h", "options": ["Как придыхательное h", "Как русское Х", "Как русское Г", "Не читается"], "reward": 5},
      {"id": "alf-8", "type": "grammar", "question": "Слово «Сәлам» начинается с буквы ___", "answer": "С", "options": ["С", "Ш", "Ч", "Җ"], "reward": 7},
      {"id": "alf-9", "type": "truefalse", "question": "«Ө и О — один и тот же звук»", "answer": "false", "options": ["true", "false"], "reward": 5},
      {"id": "alf-10", "type": "speak", "question": "Произнеси: «Ә, Ө, Ү, Җ, Ң, Һ»", "answer": "Ә, Ө, Ү, Җ, Ң, Һ", "speakText": "Ә, Ө, Ү, Җ, Ң, Һ", "reward": 10},
    ],
  },
  {
    slug: "privetstviya",
    title: "Привет и знакомство",
    titleTt: "Танышу һәм сәламләшү",
    icon: "👋",
    difficulty: 1 as const,
    reward: 50,
    tasks: [
      {"id": "priv-1", "type": "translate", "question": "Как будет «Привет» по-татарски?", "answer": "Сәлам", "options": ["Сәлам", "Рәхмәт", "Кушылыгыз", "Зинһар"], "reward": 5},
      {"id": "priv-2", "type": "translate", "question": "Как будет «Спасибо» по-татарски?", "answer": "Рәхмәт", "options": ["Сәлам", "Рәхмәт", "Зинһар", "Хуш"], "reward": 5},
      {"id": "priv-3", "type": "truefalse", "question": "«Мин исемем Айрат» означает «Меня зовут Айрат»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "priv-4", "type": "compose", "question": "Составь фразу: «Здравствуйте, меня зовут Айрат, очень приятно»", "words": ["Исәнмесез,", "минем", "исемем", "Айрат,", "бик", "шатмын"], "answer": "Исәнмесез, минем исемем Айрат, бик шатмын", "reward": 10},
      {"id": "priv-5", "type": "grammar", "question": "Сәлам! Мин ___ Дания.", "answer": "исемем", "options": ["исемем", "исемең", "исеме", "исемнәр"], "reward": 7},
      {"id": "priv-6", "type": "listen", "question": "Прослушай аудио и напиши то, что услышал", "answer": "Хәерле иртә", "reward": 8},
      {"id": "priv-7", "type": "translate", "question": "Как сказать «До свидания» (вежливо)?", "answer": "Сау булыгыз", "options": ["Сау булыгыз", "Сәлам", "Хәерле кич", "Рәхмәт"], "reward": 5},
      {"id": "priv-8", "type": "speak", "question": "Произнеси: «Сәлам, хәлләр ничек?»", "answer": "Сәлам, хәлләр ничек?", "speakText": "Сәлам, хәлләр ничек?", "reward": 10},
      {"id": "priv-9", "type": "grammar", "question": "Вежливое «вы» по-татарски — ___", "answer": "сез", "options": ["сез", "син", "без", "алар"], "reward": 7},
      {"id": "priv-10", "type": "compose", "question": "Составь фразу: «Пока, до встречи!»", "words": ["Сау", "бул,", "күрешкәнче!"], "answer": "Сау бул, күрешкәнче!", "reward": 10},
    ],
  },
  {
    slug: "chisla",
    title: "Числа и время",
    titleTt: "Саннар һәм вакыт",
    icon: "🔢",
    difficulty: 1 as const,
    reward: 50,
    tasks: [
      {"id": "chis-1", "type": "translate", "question": "Как будет «один» по-татарски?", "answer": "Бер", "options": ["Бер", "Ике", "Өч", "Дүрт"], "reward": 5},
      {"id": "chis-2", "type": "translate", "question": "Как будет «пять» по-татарски?", "answer": "Биш", "options": ["Өч", "Дүрт", "Биш", "Алты"], "reward": 5},
      {"id": "chis-3", "type": "compose", "question": "Составь предложение: «У меня дома живут три пушистые кошки»", "words": ["Өйдә", "минем", "өч", "матур", "мәчегем", "бар"], "answer": "Өйдә минем өч матур мәчегем бар", "reward": 10},
      {"id": "chis-4", "type": "truefalse", "question": "«Сигез» — это число 8", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "chis-5", "type": "listen", "question": "Прослушай и напиши число", "answer": "Ун", "reward": 8},
      {"id": "chis-6", "type": "translate", "question": "Как будет «два» по-татарски?", "answer": "Ике", "options": ["Бер", "Ике", "Өч", "Биш"], "reward": 5},
      {"id": "chis-7", "type": "speak", "question": "Произнеси: «Бер, ике, өч, дүрт, биш!»", "answer": "Бер, ике, өч, дүрт, биш!", "speakText": "Бер, ике, өч, дүрт, биш!", "reward": 10},
      {"id": "chis-8", "type": "grammar", "question": "«___ китап» (десять книг): выбери числительное", "answer": "Ун", "options": ["Ун", "Егерме", "Йөз", "Мең"], "reward": 7},
      {"id": "chis-9", "type": "truefalse", "question": "«Йөз» — это 100", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "chis-10", "type": "compose", "question": "Составь фразу: «Мне двадцать лет»", "words": ["Миңа", "егерме", "яшь"], "answer": "Миңа егерме яшь", "reward": 10},
    ],
  },
  // ================= УРОВЕНЬ 2 · Базовый =================
  {
    slug: "eda",
    title: "Еда и напитки",
    titleTt: "Ашамлыклар һәм эчемлекләр",
    icon: "🍽️",
    difficulty: 2 as const,
    reward: 60,
    tasks: [
      {"id": "eda-1", "type": "translate", "question": "Как будет «Хлеб» по-татарски?", "answer": "Ипи", "options": ["Ипи", "Су", "Чәй", "Сөт"], "reward": 5},
      {"id": "eda-2", "type": "translate", "question": "Как будет «Чай» по-татарски?", "answer": "Чәй", "options": ["Су", "Чәй", "Ипи", "Сөт"], "reward": 5},
      {"id": "eda-3", "type": "truefalse", "question": "Инфинитив глагола «есть / кушать» по-татарски — «ашу»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "eda-4", "type": "compose", "question": "Составь предложение: «Я хочу пить вкусный черный чай»", "words": ["Мин", "тәмле", "кара", "чәй", "эчәргә", "телим"], "answer": "Мин тәмле кара чәй эчәргә телим", "reward": 10},
      {"id": "eda-5", "type": "grammar", "question": "Мин иртән ___ эчәм.", "answer": "тәмле чәйне", "options": ["тәмле чәй", "тәмле чәйне", "тәмле чәйдә", "тәмле чәйләр"], "reward": 7},
      {"id": "eda-6", "type": "listen", "question": "Прослушай и напиши слово", "answer": "Өчпочмак", "reward": 8},
      {"id": "eda-7", "type": "translate", "question": "Как будет «молоко» по-татарски?", "answer": "Сөт", "options": ["Сөт", "Су", "Чәй", "Айран"], "reward": 5},
      {"id": "eda-8", "type": "speak", "question": "Произнеси: «Өчпочмак бик тәмле!»", "answer": "Өчпочмак бик тәмле!", "speakText": "Өчпочмак бик тәмле!", "reward": 10},
      {"id": "eda-9", "type": "grammar", "question": "«___ ашыйм» (я ем суп): выбери слово «суп»", "answer": "Аш", "options": ["Аш", "Ипи", "Су", "Тоз"], "reward": 7},
      {"id": "eda-10", "type": "compose", "question": "Составь предложение: «Мама печёт вкусный хлеб»", "words": ["Әни", "тәмле", "ипи", "пешерә"], "answer": "Әни тәмле ипи пешерә", "reward": 10},
    ],
  },
  {
    slug: "semya",
    title: "Семья и люди",
    titleTt: "Гаилә һәм туганнар",
    icon: "👨‍👩‍👧",
    difficulty: 2 as const,
    reward: 60,
    tasks: [
      {"id": "sem-1", "type": "translate", "question": "Как будет «мама» по-татарски?", "answer": "Әни", "options": ["Әни", "Әти", "Апа", "Абый"], "reward": 5},
      {"id": "sem-2", "type": "translate", "question": "Как будет «папа» по-татарски?", "answer": "Әти", "options": ["Әни", "Әти", "Угыл", "Кыз"], "reward": 5},
      {"id": "sem-3", "type": "compose", "question": "Составь предложение: «Моя дружная семья живет в Казани»", "words": ["Минем", "тату", "гаиләм", "Казанда", "яша"], "answer": "Минем тату гаиләм Казанда яша", "reward": 10},
      {"id": "sem-4", "type": "truefalse", "question": "Инфинитив глагола «любить» по-татарски — «яратырга»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "sem-5", "type": "grammar", "question": "Минем әнием бик ___.", "answer": "яхшы", "options": ["яхшы", "яхшыны", "яхшыда", "яхшылар"], "reward": 7},
      {"id": "sem-6", "type": "listen", "question": "Прослушай и напиши слово", "answer": "Бабай", "reward": 8},
      {"id": "sem-7", "type": "translate", "question": "Как будет «сестра» по-татарски?", "answer": "Апа", "options": ["Апа", "Эне", "Абый", "Әни"], "reward": 5},
      {"id": "sem-8", "type": "speak", "question": "Произнеси: «Минем гаиләм бик тату!»", "answer": "Минем гаиләм бик тату!", "speakText": "Минем гаиләм бик тату!", "reward": 10},
      {"id": "sem-9", "type": "grammar", "question": "«Безнең ___» (наша бабушка): выбери слово", "answer": "әбиебез", "options": ["әбиебез", "әбием", "әбиең", "әбиләр"], "reward": 7},
      {"id": "sem-10", "type": "compose", "question": "Составь предложение: «У меня есть брат и сестра»", "words": ["Минем", "абыйым", "һәм", "апам", "бар"], "answer": "Минем абыйым һәм апам бар", "reward": 10},
    ],
  },
  {
    slug: "gorod",
    title: "Город и транспорт",
    titleTt: "Шәһәр һәм транспорт",
    icon: "🏙️",
    difficulty: 2 as const,
    reward: 60,
    tasks: [
      {"id": "gor-1", "type": "translate", "question": "Как будет «город» по-татарски?", "answer": "Шәһәр", "options": ["Шәһәр", "Авыл", "Юл", "Күпер"], "reward": 5},
      {"id": "gor-2", "type": "translate", "question": "Как правильно сказать инфинитив «идти / ехать»?", "answer": "Бару", "options": ["Барырга", "Бару", "Бара", "Бар"], "reward": 5},
      {"id": "gor-3", "type": "compose", "question": "Составь предложение: «Каждый день я езжу на автобусе в центр города»", "words": ["Һәркөнне", "мин", "автобус", "белән", "шәһәр", "үзәгенә", "барам"], "answer": "Һәркөнне мин автобус белән шәһәр үзәгенә барам", "reward": 12},
      {"id": "gor-4", "type": "truefalse", "question": "«Мәктәп» означает «школа»", "answer": "true", "options": ["true", "false"], "reward": 5},
      {"id": "gor-5", "type": "grammar", "question": "Мин автобус ___ утырам.", "answer": "белән", "options": ["белән", "өчен", "турында", "аша"], "reward": 7},
      {"id": "gor-6", "type": "listen", "question": "Прослушай и напиши слово", "answer": "Урам", "reward": 8},
      {"id": "gor-7", "type": "translate", "question": "Как будет «магазин» по-татарски?", "answer": "Кибет", "options": ["Кибет", "Мәктәп", "Шәһәр", "Урам"], "reward": 5},
      {"id": "gor-8", "type": "speak", "question": "Произнеси: «Мин Казан урамнары буйлап юрем»", "answer": "Мин Казан урамнары буйлап юрем", "speakText": "Мин Казан урамнары буйлап юрем", "reward": 10},
      {"id": "gor-9", "type": "grammar", "question": "«Мин ___ барам» (я иду в школу): выбери форму", "answer": "мәктәпкә", "options": ["мәктәпкә", "мәктәп", "мәктәптә", "мәктәптән"], "reward": 7},
      {"id": "gor-10", "type": "compose", "question": "Составь предложение: «Автобус остановился у вокзала»", "words": ["Автобус", "вокзал", "янында", "туктады"], "answer": "Автобус вокзал янында туктады", "reward": 12},
    ],
  },
  // ================= УРОВЕНЬ 3 · Средний =================
  {
    slug: "vremena",
    title: "Глаголы и время",
    titleTt: "Заманнар һәм фигыльләр",
    icon: "⏳",
    difficulty: 3 as const,
    reward: 80,
    tasks: [
      {"id": "vre-1", "type": "translate", "question": "Как будет «я иду» (настоящее время)?", "answer": "Мин барам", "options": ["Мин барам", "Мин бардым", "Мин барырмын", "Мин бармадым"], "reward": 6},
      {"id": "vre-2", "type": "translate", "question": "Как будет «я ходил» (прошедшее время)?", "answer": "Мин бардым", "options": ["Мин бардым", "Мин барам", "Мин барачакмын", "Мин йөрим"], "reward": 6},
      {"id": "vre-3", "type": "truefalse", "question": "«Мин укыйм» означает «я читаю»", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "vre-4", "type": "compose", "question": "Составь предложение: «Вчера я читал интересную книгу»", "words": ["Кичә", "мин", "кызыклы", "китап", "укыдым"], "answer": "Кичә мин кызыклы китап укыдым", "reward": 12},
      {"id": "vre-5", "type": "grammar", "question": "Выбери форму будущего времени: «Иртәгә мин Казанга ___» (Завтра я поеду в Казань)", "answer": "барачакмын", "options": ["барачакмын", "бардым", "барам", "бармадым"], "reward": 8},
      {"id": "vre-6", "type": "listen", "question": "Прослушай и напиши глагол", "answer": "Яза", "reward": 8},
      {"id": "vre-7", "type": "translate", "question": "Как будет «мы будем учить»?", "answer": "Без өйрәнербез", "options": ["Без өйрәнербез", "Без өйрәндек", "Без өйрәнәбез", "Без укыйбыз"], "reward": 6},
      {"id": "vre-8", "type": "grammar", "question": "Отрицание настоящего времени: «Мин ___» (я не знаю)", "answer": "белмим", "options": ["белмим", "белдем", "белермен", "беләм"], "reward": 8},
      {"id": "vre-9", "type": "truefalse", "question": "«Алар эшлиләр» — «они работают»", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "vre-10", "type": "speak", "question": "Произнеси: «Мин татарча өйрәнәм!»", "answer": "Мин татарча өйрәнәм!", "speakText": "Мин татарча өйрәнәм!", "reward": 10},
    ],
  },
  {
    slug: "kileshlar",
    title: "Падежи и послелоги",
    titleTt: "Килешләр һәм бәйлекләр",
    icon: "🧭",
    difficulty: 3 as const,
    reward: 80,
    tasks: [
      {"id": "kil-1", "type": "translate", "question": "Какой падеж отвечает на вопросы «кемне? нәрсәне?» (кого? что?)", "answer": "Төшем килеше", "options": ["Төшем килеше", "Баш килеш", "Урын килеше", "Чыгыш килеше"], "reward": 6},
      {"id": "kil-2", "type": "grammar", "question": "«Мин Казан___ яшим» (я живу в Казани): выбери окончание", "answer": "да", "options": ["да", "га", "ны", "дан"], "reward": 8},
      {"id": "kil-3", "type": "compose", "question": "Составь предложение: «Я иду из школы домой»", "words": ["Мин", "мәктәптән", "өйгә", "барам"], "answer": "Мин мәктәптән өйгә барам", "reward": 12},
      {"id": "kil-4", "type": "truefalse", "question": "Послелог «белән» означает «с, вместе с»", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "kil-5", "type": "grammar", "question": "«Дустым ___ килдем» (я пришёл с другом): выбери послелог", "answer": "белән", "options": ["белән", "өчен", "турында", "аша"], "reward": 8},
      {"id": "kil-6", "type": "translate", "question": "Как сказать «для тебя»?", "answer": "Синең өчен", "options": ["Синең өчен", "Син белән", "Синдә", "Синнән"], "reward": 6},
      {"id": "kil-7", "type": "listen", "question": "Прослушай и напиши слово", "answer": "Өстәл", "reward": 8},
      {"id": "kil-8", "type": "grammar", "question": "«Мин дустым ___ сөйләштем» (я поговорил о друге): выбери послелог", "answer": "турында", "options": ["турында", "белән", "өчен", "аша"], "reward": 8},
      {"id": "kil-9", "type": "truefalse", "question": "«Өйгә» — это форма направления (куда?)", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "kil-10", "type": "speak", "question": "Произнеси: «Мин мәктәптән өйгә барам»", "answer": "Мин мәктәптән өйгә барам", "speakText": "Мин мәктәптән өйгә барам", "reward": 10},
    ],
  },
  {
    slug: "dialogi",
    title: "Повседневные диалоги",
    titleTt: "Көндәлек сөйләшү",
    icon: "💬",
    difficulty: 3 as const,
    reward: 80,
    tasks: [
      {"id": "dia-1", "type": "translate", "question": "Как спросить «Сколько это стоит»?", "answer": "Бу күпме тора?", "options": ["Бу күпме тора?", "Бу нәрсә?", "Син кем?", "Кайда барасың?"], "reward": 6},
      {"id": "dia-2", "type": "grammar", "question": "Лучший ответ на «Хәлләр ничек?» — ___", "answer": "Әйбәт, рәхмәт!", "options": ["Әйбәт, рәхмәт!", "Сау бул!", "Тукта!", "Юк!"], "reward": 8},
      {"id": "dia-3", "type": "compose", "question": "Составь мини-диалог: «Где вокзал? Вокзал рядом»", "words": ["Вокзал", "кайда?", "Вокзал", "якында"], "answer": "Вокзал кайда? Вокзал якында", "reward": 12},
      {"id": "dia-4", "type": "truefalse", "question": "«Зинһар, кабатлагыз әле» — вежливая просьба повторить", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "dia-5", "type": "translate", "question": "Как сказать «Я не понимаю»?", "answer": "Мин аңламыйм", "options": ["Мин аңламыйм", "Мин беләм", "Мин сөйләшәм", "Мин ашыйм"], "reward": 6},
      {"id": "dia-6", "type": "listen", "question": "Прослушай и напиши фразу", "answer": "Хәерле көн", "reward": 8},
      {"id": "dia-7", "type": "grammar", "question": "«___, кибет кайда?» (Извините, где магазин?): выбери вежливое обращение", "answer": "Гафу итегез", "options": ["Гафу итегез", "Тукта", "Кит", "Бир"], "reward": 8},
      {"id": "dia-8", "type": "compose", "question": "Составь фразу: «Меня зовут Дания, я из Казани»", "words": ["Минем", "исемем", "Дания,", "мин", "Казаннан"], "answer": "Минем исемем Дания, мин Казаннан", "reward": 12},
      {"id": "dia-9", "type": "truefalse", "question": "«Ярдәм итегез әле» означает «помогите, пожалуйста»", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "dia-10", "type": "speak", "question": "Произнеси: «Гафу итегез, вокзал кайда?»", "answer": "Гафу итегез, вокзал кайда?", "speakText": "Гафу итегез, вокзал кайда?", "reward": 10},
    ],
  },
  // ================= УРОВЕНЬ 4 · Продвинутый =================
  {
    slug: "makallar",
    title: "Пословицы и идиомы",
    titleTt: "Мәкальләр һәм идиомалар",
    icon: "📜",
    difficulty: 4 as const,
    reward: 100,
    tasks: [
      {"id": "mak-1", "type": "translate", "question": "Что означает пословица «Белем — нур»?", "answer": "Знание — свет", "options": ["Знание — свет", "Дружба — богатство", "Терпение — ключ", "Слово — серебро"], "reward": 6},
      {"id": "mak-2", "type": "grammar", "question": "В пословице «Эшләгән — ___, эшләмәгән — карап торыр» пропущено слово", "answer": "ашар", "options": ["ашар", "йоклар", "карар", "барыр"], "reward": 8},
      {"id": "mak-3", "type": "compose", "question": "Составь пословицу: «Дружба — самое большое богатство»", "words": ["Дуслык", "—", "иң", "зур", "байлык"], "answer": "Дуслык — иң зур байлык", "reward": 14},
      {"id": "mak-4", "type": "truefalse", "question": "«Телең белән таш ярырсың» — пословица о силе слова", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "mak-5", "type": "translate", "question": "Что значит идиома «күз явын алырлык»?", "answer": "Ослепительно, глаз не оторвать", "options": ["Ослепительно, глаз не оторвать", "Очень громко", "Очень быстро", "Очень горько"], "reward": 6},
      {"id": "mak-6", "type": "listen", "question": "Прослушай и напиши слово", "answer": "Мәкаль", "reward": 10},
      {"id": "mak-7", "type": "grammar", "question": "«Бер ___» (в один голос): выбери слово", "answer": "авыздан", "options": ["авыздан", "күздән", "кулдан", "телдән"], "reward": 8},
      {"id": "mak-8", "type": "truefalse", "question": "«Сабырлык — җиңү ачкычы» означает «Терпение — ключ к победе»", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "mak-9", "type": "translate", "question": "Что значит «сүзнең кыскасы»?", "answer": "Короче говоря", "options": ["Короче говоря", "Длинная история", "Громкие слова", "Тихий голос"], "reward": 6},
      {"id": "mak-10", "type": "speak", "question": "Произнеси: «Белем — нур, белмәү — хур!»", "answer": "Белем — нур, белмәү — хур!", "speakText": "Белем — нур, белмәү — хур!", "reward": 12},
    ],
  },
  {
    slug: "madaniyat",
    title: "Культура и литература",
    titleTt: "Мәдәният һәм әдәбият",
    icon: "🏛️",
    difficulty: 4 as const,
    reward: 100,
    tasks: [
      {"id": "mad-1", "type": "translate", "question": "Кто автор сказок «Шүрәле» и «Су анасы»?", "answer": "Габдулла Тукай", "options": ["Габдулла Тукай", "Муса Җәлил", "Каюм Насыйри", "Һади Такташ"], "reward": 6},
      {"id": "mad-2", "type": "grammar", "question": "Муса Җәлил — автор ___ : выбери произведение", "answer": "«Моабит дәфтәре»", "options": ["«Моабит дәфтәре»", "«Шүрәле»", "«Су анасы»", "«Кисекбаш»"], "reward": 8},
      {"id": "mad-3", "type": "compose", "question": "Составь фразу: «Тукай — великий татарский поэт»", "words": ["Тукай", "—", "бөек", "татар", "шагыйре"], "answer": "Тукай — бөек татар шагыйре", "reward": 14},
      {"id": "mad-4", "type": "truefalse", "question": "Сабантуй — татарский народный праздник плуга", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "mad-5", "type": "translate", "question": "Как переводится «шагыйрь»?", "answer": "Поэт", "options": ["Поэт", "Писатель", "Певец", "Учёный"], "reward": 6},
      {"id": "mad-6", "type": "listen", "question": "Прослушай и напиши слово", "answer": "Казан", "reward": 10},
      {"id": "mad-7", "type": "translate", "question": "Столица Татарстана — ___", "answer": "Казан", "options": ["Казан", "Уфа", "Чабаксар", "Самара"], "reward": 6},
      {"id": "mad-8", "type": "grammar", "question": "«Казан ___ елда нигезләнгән» (Казань основана в 1005 году): выбери числительное", "answer": "мең бишенче", "options": ["мең бишенче", "мең тугызынчы", "унсигезенче", "егерменче"], "reward": 8},
      {"id": "mad-9", "type": "truefalse", "question": "«Ак Барс» — белый барс, символ Татарстана", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "mad-10", "type": "speak", "question": "Произнеси: «Мин Тукай шигырьләрен яратам!»", "answer": "Мин Тукай шигырьләрен яратам!", "speakText": "Мин Тукай шигырьләрен яратам!", "reward": 12},
    ],
  },
  {
    slug: "katlau",
    title: "Сложные предложения",
    titleTt: "Катлаулы җөмләләр",
    icon: "🧠",
    difficulty: 4 as const,
    reward: 100,
    tasks: [
      {"id": "kat-1", "type": "translate", "question": "Выбери правильный перевод: «Укыган саен, белемең арта»", "answer": "Чем больше читаешь, тем больше знаешь", "options": ["Чем больше читаешь, тем больше знаешь", "Кто читает, тот спит", "Чтение — это скучно", "Книга на столе"], "reward": 6},
      {"id": "kat-2", "type": "grammar", "question": "Деепричастие причины: «___ өчен, мин өйдә калдым» (Так как заболел, я остался дома)", "answer": "Авырган", "options": ["Авырган", "Авырый", "Авырыр", "Авыр"], "reward": 10},
      {"id": "kat-3", "type": "compose", "question": "Составь сложное предложение: «Когда я приду, мы будем пить чай»", "words": ["Мин", "килгәч,", "без", "чәй", "эчәрбез"], "answer": "Мин килгәч, без чәй эчәрбез", "reward": 15},
      {"id": "kat-4", "type": "truefalse", "question": "«Мин килгәнче, көтегез» означает «Подождите, пока я приду»", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "kat-5", "type": "translate", "question": "Что означает союз «чөнки»?", "answer": "Потому что", "options": ["Потому что", "Хотя", "Если", "Когда"], "reward": 6},
      {"id": "kat-6", "type": "grammar", "question": "Условная форма: «___ булса, барабыз» (Если будет время, пойдём)", "answer": "Вакыт", "options": ["Вакыт", "Китап", "Аш", "Юл"], "reward": 10},
      {"id": "kat-7", "type": "listen", "question": "Прослушай и напиши союз", "answer": "Чөнки", "reward": 10},
      {"id": "kat-8", "type": "compose", "question": "Составь предложение: «Хотя устал, он продолжил работать»", "words": ["Арыса", "да,", "ул", "эшләвен", "дәвам", "итте"], "answer": "Арыса да, ул эшләвен дәвам итте", "reward": 15},
      {"id": "kat-9", "type": "truefalse", "question": "«Әгәр яңгыр яуса, өйдә калабыз» — условие («если пойдёт дождь»)", "answer": "true", "options": ["true", "false"], "reward": 6},
      {"id": "kat-10", "type": "speak", "question": "Произнеси: «Мин килгәч, без чәй эчәрбез!»", "answer": "Мин килгәч, без чәй эчәрбез!", "speakText": "Мин килгәч, без чәй эчәрбез!", "reward": 12},
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
