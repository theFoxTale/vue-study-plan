# Module 0 · Теория: `Node.js`, `npm`, `pnpm`

Этот материал закрывает третий теоретический пункт `Module 0`: понять, **зачем Vue-разработчику нужны `Node.js`, `npm` и `pnpm`**, как они связаны между собой и как не путаться в базовых командах.

---

## 1. Коротко: что есть что

| Инструмент | Что это | Зачем нужен во Vue-проекте |
|-----------|---------|---------------------------|
| **Node.js** | Среда выполнения JavaScript вне браузера | Запускает `Vite`, сборку, dev-сервер, CLI, тесты, линтеры |
| **npm** | Менеджер пакетов, идёт вместе с Node.js | Установка зависимостей, scripts, публикация пакетов |
| **pnpm** | Альтернативный менеджер пакетов | То же, что npm, но быстрее и экономнее по диску |

Важно: **Vue работает в браузере**, но **разработка современного Vue-проекта почти всегда идёт через Node.js-инструменты**.

---

## 2. Зачем Vue-разработчику Node.js

`Node.js` нужен не для того, чтобы «писать backend на Vue». Vue — это frontend-фреймворк.

Но без Node.js вы не сможете нормально:

- создать проект через `create-vue`;
- запустить dev-сервер через `Vite`;
- установить `Vue Router`, `Pinia`, `Vitest`, `ESLint`;
- собрать production-версию (`npm run build`);
- запускать тесты и линтер в CI.

Типичная цепочка:

```text
Node.js
   ↓
npm / pnpm
   ↓
Vite + Vue + TypeScript + ESLint + Vitest
   ↓
готовое приложение для браузера
```

То есть **Node.js — это инфраструктура разработки**, а не сам Vue.

---

## 3. Что такое npm

**npm** (*Node Package Manager*) — стандартный менеджер пакетов для JavaScript-экосистемы.

Он решает три главные задачи:

1. **Устанавливать библиотеки** — `vue`, `pinia`, `axios` и т.д.
2. **Управлять версиями** — через `package.json` и lock-файл.
3. **Запускать scripts** — `dev`, `build`, `lint`, `test`.

### Что такое npm registry

Это огромный каталог JavaScript-пакетов: [npmjs.com](https://www.npmjs.com/)

Когда вы делаете `npm install pinia`, npm:

- находит пакет в registry;
- скачивает нужную версию;
- кладёт его в `node_modules`;
- обновляет `package.json` и lock-файл.

---

## 4. Базовые файлы, которые нужно узнать

### `package.json`

Главный манифест проекта. В нём обычно есть:

- имя и версия проекта;
- scripts;
- dependencies — нужны в production;
- devDependencies — нужны только для разработки.

Пример:

```json
{
  "name": "my-vue-app",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "typescript": "^5.0.0"
  }
}
```

### `node_modules`

Папка со всеми установленными пакетами и их зависимостями.

Правила:

- **не коммитить** в git;
- **не редактировать вручную**;
- если что-то сломалось — часто помогает удалить `node_modules` и lock-файл, затем переустановить зависимости.

### Lock-файлы

- `package-lock.json` — для npm
- `pnpm-lock.yaml` — для pnpm

Lock-файл фиксирует **точные версии** всех зависимостей. Это нужно, чтобы у всех в команде и в CI устанавливались одинаковые пакеты.

---

## 5. Основные npm-команды для Vue-проекта

| Команда | Что делает |
|---------|-----------|
| `node -v` | Показывает версию Node.js |
| `npm -v` | Показывает версию npm |
| `npm install` | Устанавливает зависимости из `package.json` |
| `npm install vue` | Добавляет пакет в `dependencies` |
| `npm install -D eslint` | Добавляет пакет в `devDependencies` |
| `npm run dev` | Запускает script `dev` |
| `npm run build` | Собирает production-версию |
| `npm create vue@latest` | Создаёт новый Vue-проект |

### Что означает `npm run`

Scripts в `package.json` — это **короткие алиасы** для частых команд.

Вместо того чтобы каждый раз писать длинную команду, вы запускаете:

```bash
npm run dev
npm run lint
npm run test
```

Для Vue-проекта на Vite почти всегда важны:

- `dev` — локальная разработка
- `build` — production-сборка
- `preview` — проверка собранного приложения

---

## 6. Что такое pnpm

**pnpm** (*performant npm*) — альтернативный менеджер пакетов.

Он делает то же самое, что npm, но по-другому хранит пакеты:

- npm часто дублирует одни и те же библиотеки в каждом проекте;
- pnpm хранит пакеты в **глобальном content-addressable store** и связывает их с проектом через hard links / symlinks.

### Плюсы pnpm

- быстрее установка на больших проектах;
- меньше занимает места на диске;
- строже изоляция зависимостей;
- удобнее для monorepo.

### Минусы / нюансы

- нужно ставить отдельно;
- иногда legacy-пакеты ведут себя иначе из-за strict dependency rules;
- в команде важно договориться: **один менеджер на проект**, не смешивать npm и pnpm.

---

## 7. npm vs pnpm — что выбрать

| Критерий | npm | pnpm |
|---------|-----|------|
| **Установка** | Уже есть с Node.js | Ставится отдельно |
| **Совместимость** | Максимальная | Очень высокая, но иногда нужны workarounds |
| **Скорость** | Хорошая | Часто быстрее |
| **Диск** | Больше дублирования | Экономнее |
| **Для новичка** | Проще начать | Тоже норм, но нужно понимать отличия |
| **Для Vue-проекта** | Отлично подходит | Отлично подходит |

### Практическая рекомендация для этого плана

- Если вы только начинаете — **можно спокойно использовать npm**.
- Если уже работаете с несколькими проектами или хотите более быстрый и аккуратный workflow — **pnpm тоже отличный выбор**.
- Главное правило: **выберите один менеджер и придерживайтесь его в проекте**.

---

## 8. Как npm и pnpm соотносятся с Vue-стеком

Для современного Vue-проекта менеджер пакетов нужен почти на каждом шаге:

| Задача | Что ставится через npm/pnpm |
|--------|---------------------------|
| Создание проекта | `@vue/create` через `npm create vue@latest` |
| Dev-сервер и сборка | `vite`, `@vitejs/plugin-vue` |
| TypeScript | `typescript`, `vue-tsc` |
| Router | `vue-router` |
| Store | `pinia` |
| Tests | `vitest`, `@vue/test-utils` |
| Lint/format | `eslint`, `prettier` |
| SSR/meta-framework | `nuxt` |

Без понимания npm/pnpm сложно даже просто **клонировать чужой Vue-проект и запустить его**.

---

## 9. Типовой workflow Vue-разработчика

### Первый запуск чужого проекта

```bash
git clone <repo>
cd <project>
npm install
npm run dev
```

Если проект использует pnpm:

```bash
pnpm install
pnpm dev
```

### Создание нового Vue-проекта

```bash
npm create vue@latest
cd my-vue-app
npm install
npm run dev
```

### Перед коммитом или deploy

```bash
npm run lint
npm run build
```

---

## 10. Установка на Windows

### Node.js

1. Скачай LTS-версию с [nodejs.org](https://nodejs.org/)
2. Установи через installer
3. Проверь:

```bash
node -v
npm -v
```

### pnpm (опционально)

После установки Node.js:

```bash
npm install -g pnpm
pnpm -v
```

Или через Corepack (если включён в вашей версии Node.js):

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

---

## 11. Частые ошибки новичков

### «Я установил Vue, но команда vue не работает»

В современных проектах Vue обычно ставится **локально в проект**, а не глобально. Запуск идёт через scripts:

```bash
npm run dev
```

### «У меня разные версии пакетов, чем у автора tutorial»

Смотри lock-файл и используй тот же менеджер пакетов, что и проект.

### «Я смешал npm и pnpm в одном проекте»

Так лучше не делать. Выбери один инструмент и удали:

- `node_modules`
- `package-lock.json` или `pnpm-lock.yaml`

После этого установи зависимости заново одним менеджером.

### «Зачем devDependencies, если приложение работает в браузере?»

Потому что `vite`, `eslint`, `vitest`, `typescript` нужны **для разработки и сборки**, но не обязаны попадать в runtime браузера.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Зачем Vue-разработчику нужен Node.js?
2. Чем npm отличается от pnpm?
3. Что хранится в `package.json`?
4. Зачем нужен lock-файл?
5. Чем `dependencies` отличаются от `devDependencies`?
6. Как запустить Vue-проект после `git clone`?

---

## 13. Что почитать

### Официальное

- [Node.js · Download](https://nodejs.org/en/download)
- [npm Docs · About npm](https://docs.npmjs.com/about-npm)
- [npm Docs · package.json](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
- [pnpm · Introduction](https://pnpm.io/)
- [pnpm vs npm feature comparison](https://pnpm.io/feature-comparison)
- [Vite · Getting Started](https://vite.dev/guide/)

### Полезный контекст

- [create-vue · GitHub](https://github.com/vuejs/create-vue) — официальный способ создать Vue-проект
- [Node.js Docs · Introduction](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)

---

## 14. Что посмотреть

### Рекомендуется в первую очередь

1. **Node.js · Ulbi TV — начало курса (установка Node.js и npm)**  
   [YouTube](https://www.youtube.com/watch?v=243pQXC5Ebs)  
   Для этого блока достаточно первых ~10–15 минут: что такое Node.js, зачем npm и как это выглядит на практике.

2. **NPM для начинающих · Friendly Frontend (Александр Ламков)**  
   [YouTube-канал](https://www.youtube.com/@AleksanderLamkov)  
   На канале есть отдельный гайд по npm: `package.json`, команды, scripts и версионирование.

3. **Введение в NPM · ITVDN**  
   [ITVDN](https://itvdn.com/ru/channel/video/it-nodejs-07)  
   Короткое и спокойное объяснение менеджера пакетов в контексте Node.js.

### Дополнительно

4. **JS с нуля · NPM Scripts**  
   [YouTube](https://www.youtube.com/watch?v=I-n0k3E7pvA)  
   Полезно, если хочется лучше понять, зачем нужны `npm run dev`, `npm run build` и другие scripts.

5. **pnpm · official docs / FAQ**  
   [pnpm.io/faq](https://pnpm.io/faq)  
   Если решишь использовать pnpm вместо npm.

### Короткий маршрут (~45–60 минут)

| Время | Что делать |
|------|-----------|
| ~10 мин | Прочитать этот файл |
| ~15 мин | Посмотреть начало Ulbi TV про Node.js и npm |
| ~15 мин | Посмотреть видео про npm / package.json |
| ~10 мин | Установить Node.js и проверить `node -v`, `npm -v` |

---

## 15. Мини-конспект

- `Node.js` нужен для инструментов разработки, а не для работы Vue в браузере.
- `npm` — стандартный менеджер пакетов, идёт вместе с Node.js.
- `pnpm` — быстрая и экономная альтернатива npm.
- `package.json` описывает проект и scripts.
- lock-файл фиксирует точные версии зависимостей.
- Для Vue-проекта базовый цикл: `install → dev → build → preview`.

---

## 16. Что делать дальше

После этого материала переходи к следующим пунктам `Module 0`:

- установка `Vue Devtools`;
- базовая настройка редактора для `.vue`.

Практический шаг: установи Node.js, проверь `node -v` и `npm -v`, затем создай первый проект через `npm create vue@latest`.
