export const languages = ['de', 'en'] as const;
export type Language = (typeof languages)[number];

const de = {
  meta: {
    title: 'IT Career Academy – Programmieren lernen',
  },
  header: {
    homeLabel: 'IT Career Academy – Startseite',
    mainNav: 'Hauptnavigation',
    bookConsultation: 'Beratung buchen',
    openMenu: 'Menü öffnen',
    closeMenu: 'Menü schließen',
    languageSwitcher: 'Sprache wählen',
  },
  nav: {
    courses: 'Kurse',
    stories: 'Erfolgsgeschichten',
    process: 'Ablauf',
    about: 'Über Yuri',
  },
  hero: {
    imageAlt: 'Yuri, IT-Experte und Trainer, lächelt in die Kamera',
    eyebrow: 'Online-Training · Praxis · Persönliche Betreuung',
    title: 'Programmieren lernen.',
    titleAccent: 'Auch ohne Vorkenntnisse.',
    lead: 'Starte deine IT-Karriere mit einem praxisnahen Online-Training und der Erfahrung eines echten IT-Experten.',
    features: ['Online-Training', 'Praxisprojekte', 'Persönliche Betreuung'],
    fundingTitle: 'Förderung durch die Agentur für Arbeit geplant',
    fundingText: 'Eine Finanzierung über einen Bildungsgutschein ist in Vorbereitung.',
  },
  common: {
    startTrial: 'Kostenlose Probestunde starten',
  },
  audience: {
    eyebrow: '02 / Für wen ist das Training?',
    title: 'Ist das Training das Richtige',
    titleAccent: 'für dich?',
    lead: 'Egal, wo du gerade stehst – wir helfen dir, den passenden Einstieg in die IT zu finden.',
    items: [
      {
        title: 'Berufseinsteiger',
        text: 'Du suchst nach der Schule oder Ausbildung eine moderne und zukunftssichere Perspektive.',
      },
      {
        title: 'Quereinsteiger',
        text: 'Du möchtest dich beruflich neu orientieren und in die IT einsteigen.',
      },
      {
        title: 'Berufstätige',
        text: 'Du willst deine digitalen Fähigkeiten erweitern und dir neue Karrierechancen sichern.',
      },
      {
        title: 'IT-Interessierte',
        text: 'Du möchtest Programmieren von Grund auf lernen und eigene Ideen umsetzen.',
      },
      {
        title: 'Studierende',
        text: 'Du willst dein theoretisches Wissen durch praktische Projekte vertiefen.',
      },
      {
        title: 'Arbeitsuchende',
        text: 'Du möchtest deine Chancen auf dem Arbeitsmarkt deutlich verbessern.',
      },
    ],
    bannerTitle: 'Du bist dir noch unsicher?',
    bannerText: 'Sprich in einem kostenlosen Beratungsgespräch mit Yuri und finde heraus, welcher Einstieg zu dir passt.',
    bannerButton: 'Kostenlose Beratung buchen',
  },
  testimonials: {
    eyebrow: '03 / Echte Geschichten',
    title: 'Sie haben es geschafft.',
    titleAccent: 'Warum nicht auch du?',
    prev: 'Vorherige Geschichte',
    next: 'Nächste Geschichte',
    quoteOpen: '„',
    quoteClose: '“',
    items: [
      {
        title: 'Vom Postboten zum Entwickler',
        quote:
          'Allein bin ich nicht weitergekommen. Nach dem Training bei Yuri arbeite ich jetzt seit 2 Jahren in einem großen IT-Unternehmen.',
        name: 'Teilnehmer 1',
      },
      {
        title: 'Nach der Armee in die IT',
        quote:
          'Ich habe lange nach einer klaren Richtung gesucht. Der Kurs hat mir den Einstieg in die IT ermöglicht – heute arbeite ich als Programmierer.',
        name: 'Teilnehmer 2',
      },
      {
        title: 'Von der Uni in den Job',
        quote:
          'Nach meinem Studium an der TUHH fehlte mir die Praxis. Durch das Training konnte ich mein Wissen anwenden und habe schnell eine Stelle gefunden.',
        name: 'Teilnehmer 3',
      },
    ],
  },
  training: {
    eyebrow: '04 / Ausbildung',
    title: 'Wie haben sie',
    titleAccent: 'das gelernt?',
    steps: [
      {
        title: 'Du lernst die Grundlagen',
        text: 'Verständliche Videolektionen und Unterstützung in jeder Phase.',
      },
      {
        title: 'Du löst praktische Aufgaben',
        text: 'Du festigst dein Wissen an echten Aufgaben und bekommst Feedback.',
      },
      {
        title: 'Du entwickelst eigene Projekte',
        text: 'Du baust ein Portfolio auf, das deinem zukünftigen Arbeitgeber deine Fähigkeiten zeigt.',
      },
    ],
    mockup: {
      label: 'Vorschau der Lernplattform: Lektion 4 im Kurs „Grundlagen der Programmierung“',
      menu: ['Mein Kurs', 'Lektionen', 'Aufgaben', 'Tests', 'Projekte', 'Community'],
      breadcrumbCourse: 'Kurs:',
      courseName: 'Grundlagen der Programmierung',
      lesson: 'Lektion 4',
      lessonTitle: 'Arbeiten mit Bedingungen (if / else)',
      codeAllowed: 'Zugriff erlaubt',
      codeDenied: 'Zugriff verweigert',
      progress: 'Kursfortschritt',
      topics: ['Einführung', 'Variablen', 'Bedingungen (if / else)', 'Schleifen', 'Funktionen'],
      taskTitle: 'Praktische Aufgabe',
      taskText: 'Schreibe ein Programm mit einer Bedingung und teste es mit verschiedenen Daten.',
      testTitle: 'Test',
      testText: 'Prüfe, wie gut du den Stoff verstanden hast.',
    },
  },
  programs: {
    eyebrow: '05 / Programme',
    title: 'Womit solltest du anfangen?',
    lead: 'Wähle das Programm, das zu deinem Niveau und Ziel passt – von den ersten Schritten in der IT bis zu echten Projekten für dein Portfolio.',
    level: 'Niveau:',
    skills: 'Wichtige Skills:',
    duration: 'Dauer:',
    more: 'Mehr zum Kurs',
    items: [
      {
        title: 'Grundlagen der Programmierung',
        description: 'Der Einstiegskurs für alle, die ohne Vorkenntnisse in die IT starten möchten.',
        level: 'Einsteiger',
        levelNote: '(ohne Vorkenntnisse)',
        skills: 'Logik-Grundlagen, Algorithmen, Arbeit mit Code, Git',
        duration: '8 Wochen',
      },
      {
        title: 'Webentwicklung',
        description: 'Moderne Websites und Webanwendungen erstellen.',
        level: 'Grundkenntnisse',
        levelNote: '(Basiswissen oder Kurs „Grundlagen“)',
        skills: 'HTML, CSS, JavaScript, Arbeit mit Frameworks',
        duration: '12 Wochen',
      },
      {
        title: 'Praxisprojekte',
        description: 'Von der Idee bis zum fertigen Projekt für Portfolio und Vorstellungsgespräche.',
        level: 'Fortgeschritten',
        levelNote: '(nach dem Grundkurs)',
        skills: 'Entwicklung echter Projekte, Teamarbeit, Vorbereitung auf Vorstellungsgespräche',
        duration: '12 Wochen',
      },
    ],
  },
  benefits: {
    eyebrow: '06 / Warum bei Yuri lernen?',
    title: 'Warum solltest du',
    titleAccent: 'bei Yuri',
    titleEnd: ' lernen?',
    lead: 'Lerne von einem erfahrenen IT-Experten, der sein Wissen aus der Praxis weitergibt und dich persönlich auf deinem Weg in die IT begleitet.',
    items: [
      {
        title: 'Langjährige IT-Praxis',
        text: 'Über viele Jahre Erfahrung in der Softwareentwicklung und in realen Projekten.',
      },
      {
        title: 'Praxis statt trockener Theorie',
        text: 'Du lernst das, was in der Arbeitswelt wirklich zählt – mit vielen praktischen Übungen und echten Beispielen.',
      },
      {
        title: 'Persönliche Betreuung',
        text: 'Direkter Austausch, individuelles Feedback und Unterstützung während der gesamten Lernzeit.',
      },
      {
        title: 'Ein Lernweg, der zu dir passt',
        text: 'Gemeinsam finden wir den passenden Einstieg – abgestimmt auf deine Ziele, Vorkenntnisse und Lebenssituation.',
      },
    ],
  },
  consultation: {
    imageAlt: 'Yuri, IT-Experte, lehnt mit verschränkten Armen an einer Wand und lächelt',
    eyebrow: 'Dein erster Schritt in die IT',
    title: 'Du weißt nicht,',
    titleAccent: 'wo du anfangen sollst?',
    text: 'Sprich mit Yuri – einem IT-Experten mit über 20 Jahren Erfahrung. In 15 Minuten besprecht ihr deine Ziele und deinen möglichen Lernweg.',
    button: 'Kostenlose Beratung buchen',
    facts: ['15 Minuten', 'Online', 'Unverbindlich'],
  },
  footer: {
    imprint: 'Impressum',
    privacy: 'Datenschutz',
  },
};

export type Messages = typeof de;

const en: Messages = {
  meta: {
    title: 'IT Career Academy – Learn to Code',
  },
  header: {
    homeLabel: 'IT Career Academy – Home',
    mainNav: 'Main navigation',
    bookConsultation: 'Book a consultation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    languageSwitcher: 'Choose language',
  },
  nav: {
    courses: 'Courses',
    stories: 'Success stories',
    process: 'How it works',
    about: 'About Yuri',
  },
  hero: {
    imageAlt: 'Yuri, IT expert and trainer, smiling at the camera',
    eyebrow: 'Online training · Practice · Personal mentoring',
    title: 'Learn to code.',
    titleAccent: 'No prior experience needed.',
    lead: 'Kick-start your IT career with hands-on online training and the experience of a real IT professional.',
    features: ['Online training', 'Real-world projects', 'Personal mentoring'],
    fundingTitle: 'Funding by the German Federal Employment Agency planned',
    fundingText: 'Financing via an education voucher (Bildungsgutschein) is being prepared.',
  },
  common: {
    startTrial: 'Start your free trial lesson',
  },
  audience: {
    eyebrow: '02 / Who is the training for?',
    title: 'Is the training',
    titleAccent: 'right for you?',
    lead: "Wherever you are right now – we'll help you find the right way into IT.",
    items: [
      {
        title: 'School leavers',
        text: 'After school or vocational training, you are looking for a modern, future-proof career.',
      },
      {
        title: 'Career changers',
        text: 'You want to reorient yourself professionally and move into IT.',
      },
      {
        title: 'Working professionals',
        text: 'You want to expand your digital skills and secure new career opportunities.',
      },
      {
        title: 'Tech enthusiasts',
        text: 'You want to learn programming from scratch and bring your own ideas to life.',
      },
      {
        title: 'Students',
        text: 'You want to deepen your theoretical knowledge through practical projects.',
      },
      {
        title: 'Job seekers',
        text: 'You want to significantly improve your chances on the job market.',
      },
    ],
    bannerTitle: 'Still not sure?',
    bannerText: 'Talk to Yuri in a free consultation and find out which starting point suits you best.',
    bannerButton: 'Book a free consultation',
  },
  testimonials: {
    eyebrow: '03 / Real stories',
    title: 'They made it.',
    titleAccent: 'Why not you?',
    prev: 'Previous story',
    next: 'Next story',
    quoteOpen: '“',
    quoteClose: '”',
    items: [
      {
        title: 'From mail carrier to developer',
        quote:
          "I couldn't make progress on my own. After training with Yuri, I've now been working at a large IT company for 2 years.",
        name: 'Participant 1',
      },
      {
        title: 'From the army into IT',
        quote:
          'I spent a long time looking for a clear direction. The course gave me my start in IT – today I work as a programmer.',
        name: 'Participant 2',
      },
      {
        title: 'From university to the job',
        quote:
          'After graduating from TUHH, I lacked practical experience. The training helped me apply my knowledge, and I found a job quickly.',
        name: 'Participant 3',
      },
    ],
  },
  training: {
    eyebrow: '04 / Training',
    title: 'How did they',
    titleAccent: 'learn it?',
    steps: [
      {
        title: 'You learn the fundamentals',
        text: 'Clear video lessons and support at every stage.',
      },
      {
        title: 'You solve practical tasks',
        text: 'You reinforce your knowledge on real tasks and get feedback.',
      },
      {
        title: 'You build your own projects',
        text: 'You create a portfolio that shows your skills to your future employer.',
      },
    ],
    mockup: {
      label: 'Preview of the learning platform: lesson 4 of the “Programming Fundamentals” course',
      menu: ['My course', 'Lessons', 'Assignments', 'Tests', 'Projects', 'Community'],
      breadcrumbCourse: 'Course:',
      courseName: 'Programming Fundamentals',
      lesson: 'Lesson 4',
      lessonTitle: 'Working with conditions (if / else)',
      codeAllowed: 'Access granted',
      codeDenied: 'Access denied',
      progress: 'Course progress',
      topics: ['Introduction', 'Variables', 'Conditions (if / else)', 'Loops', 'Functions'],
      taskTitle: 'Practical assignment',
      taskText: 'Write a program with a condition and test it with different inputs.',
      testTitle: 'Test',
      testText: 'Check how well you understood the material.',
    },
  },
  programs: {
    eyebrow: '05 / Programs',
    title: 'Where should you start?',
    lead: 'Choose the program that fits your level and goal – from your first steps in IT to real projects for your portfolio.',
    level: 'Level:',
    skills: 'Key skills:',
    duration: 'Duration:',
    more: 'Learn more',
    items: [
      {
        title: 'Programming Fundamentals',
        description: 'The entry-level course for anyone who wants to start in IT from scratch.',
        level: 'Beginner',
        levelNote: '(no prior experience)',
        skills: 'Logic basics, algorithms, working with code, Git',
        duration: '8 weeks',
      },
      {
        title: 'Web Development',
        description: 'Build modern websites and web applications.',
        level: 'Basic',
        levelNote: '(basic knowledge or the “Fundamentals” course)',
        skills: 'HTML, CSS, JavaScript, working with frameworks',
        duration: '12 weeks',
      },
      {
        title: 'Real-World Projects',
        description: 'From idea to finished project for your portfolio and job interviews.',
        level: 'Intermediate',
        levelNote: '(after the fundamentals course)',
        skills: 'Building real projects, teamwork, interview preparation',
        duration: '12 weeks',
      },
    ],
  },
  benefits: {
    eyebrow: '06 / Why learn with Yuri?',
    title: 'Why should you',
    titleAccent: 'learn with Yuri',
    titleEnd: '?',
    lead: 'Learn from an experienced IT expert who passes on real-world knowledge and personally supports you on your way into IT.',
    items: [
      {
        title: 'Years of IT experience',
        text: 'Many years of experience in software development and real-world projects.',
      },
      {
        title: 'Practice over dry theory',
        text: 'You learn what really matters at work – with lots of hands-on exercises and real examples.',
      },
      {
        title: 'Personal mentoring',
        text: 'Direct contact, individual feedback and support throughout your entire learning journey.',
      },
      {
        title: 'A learning path that fits you',
        text: 'Together we find the right starting point – tailored to your goals, prior knowledge and life situation.',
      },
    ],
  },
  consultation: {
    imageAlt: 'Yuri, IT expert, leaning against a wall with arms crossed and smiling',
    eyebrow: 'Your first step into IT',
    title: 'Not sure',
    titleAccent: 'where to start?',
    text: "Talk to Yuri – an IT expert with more than 20 years of experience. In 15 minutes, you'll discuss your goals and a possible learning path.",
    button: 'Book a free consultation',
    facts: ['15 minutes', 'Online', 'No obligation'],
  },
  footer: {
    imprint: 'Legal notice',
    privacy: 'Privacy policy',
  },
};

export const translations: Record<Language, Messages> = { de, en };
