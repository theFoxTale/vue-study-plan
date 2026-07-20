# Module 1 · Теория: создание проекта через `create-vue`

Этот материал закрывает первый теоретический пункт `Module 1`: понять, **что такое `create-vue`**, **как им пользоваться**, **какие опции выбирать на старте** и **что происходит после создания проекта**.

---

## 1. Что такое `create-vue`

**`create-vue`** — официальный инструмент Vue для создания нового проекта на базе **Vite**.

Это не сам Vue и не dev-server. Это **scaffolding tool**: он генерирует стартовую структуру проекта, подключает нужные зависимости и настраивает базовый tooling.

Официальные источники:

- [create-vue · GitHub](https://github.com/vuejs/create-vue)
- [Quick Start · Vue.js](https://vuejs.org/guide/quick-start.html)
- [Quick Start · Vue.js RU](https://ru.vuejs.org/guide/quick-start.html)

---

## 2. Зачем использовать `create-vue`

Вместо ручной настройки Vite + Vue + TypeScript + ESLint + Prettier ты получаешь:

- готовую структуру проекта;
- актуальные версии пакетов;
- рабочие scripts;
- примеры компонентов;
- базовую конфигурацию tooling.

Для обучения и реальных проектов это **рекомендуемый способ старта**.

### Чем `create-vue` не является

- это не замена `Vue CLI` из старых tutorial;
- это не backend framework;
- это не production deploy tool.

`create-vue` только **создаёт проект**. Дальше ты работаешь с обычным Vue + Vite приложением.

---

## 3. Базовая команда

```bash
npm create vue@latest
```

Альтернативы:

```bash
pnpm create vue@latest
yarn create vue@latest
bun create vue@latest
```

### Почему важно писать `@latest`

Официальная документация прямо предупреждает: **`@latest` нельзя опускать**.

Если написать просто:

```bash
npm create vue
```

npm может взять **устаревшую закешированную версию** scaffolding tool.

Правильно:

```bash
npm create vue@latest
```

---

## 4. Что происходит после запуска команды

`create-vue` запускается в **интерактивном режиме** и задаёт несколько вопросов.

Типичный сценарий:

```text
✔ Project name: … my-vue-app
✔ Add TypeScript? … No / Yes
✔ Add JSX Support? … No / Yes
✔ Add Vue Router for Single Page Application development? … No / Yes
✔ Add Pinia for state management? … No / Yes
✔ Add Vitest for Unit testing? … No / Yes
✔ Add an End-to-End Testing Solution? … No / Cypress / Nightwatch / Playwright
✔ Add ESLint for code quality? … No / Yes
✔ Add Prettier for code formatting? … No / Yes
✔ Add Vue DevTools 7 extension for debugging? (experimental) … No / Yes

Scaffolding project in ./my-vue-app...
Done.
```

После этого нужно:

```bash
cd my-vue-app
npm install
npm run dev
```

---

## 5. Что выбирать на этапе Module 1

Для первых проектов по этому плану рекомендуется такой набор:

| Опция | Рекомендация | Почему |
|------|-------------|--------|
| **TypeScript** | Yes | Весь план строится на TS |
| **JSX Support** | No | На старте достаточно обычных SFC |
| **Vue Router** | No | Будет в Module 5 |
| **Pinia** | No | Будет в Module 6 |
| **Vitest** | Optional | Можно включить заранее, но не обязательно |
| **E2E Testing** | No | Пока рано |
| **ESLint** | Yes | Полезно с первого дня |
| **Prettier** | Yes | Единый стиль кода |
| **Vue DevTools plugin** | Optional | Browser extension уже достаточно для старта |

### Главная идея

На Module 1 тебе нужен **простой Vue 3 проект**, а не full-stack setup.

Если сомневаешься — выбирай **No** и добавляй фичи позже, когда дойдёшь до соответствующего модуля.

---

## 6. Неинтерактивный режим через feature flags

`create-vue` можно запускать без вопросов, передавая флаги.

Пример минимального учебного проекта:

```bash
npm create vue@latest my-vue-app -- --typescript --eslint --prettier
```

Пример более полного проекта:

```bash
npm create vue@latest my-vue-app -- --typescript --router --pinia --eslint --prettier --vitest
```

### Полезные флаги

| Флаг | Что добавляет |
|------|---------------|
| `--typescript` | TypeScript |
| `--jsx` | JSX support |
| `--router` | Vue Router |
| `--pinia` | Pinia |
| `--vitest` | Vitest |
| `--eslint` | ESLint |
| `--prettier` | Prettier |
| `--bare` | Минимальный проект без example code |
| `--default` | Конфигурация по умолчанию |
| `--force` | Создать проект даже в непустой папке |

Посмотреть все опции:

```bash
npm create vue@latest -- --help
```

### Важно для PowerShell на Windows

В PowerShell двойной `--` иногда нужно брать в кавычки:

```powershell
npm create vue@latest '--' --help
```

---

## 7. Что создаёт `create-vue`

После scaffolding у тебя появляется обычный Vite + Vue проект.

Типичная структура:

```text
my-vue-app/
  public/
  src/
    assets/
    components/
    App.vue
    main.ts
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  eslint.config.js
  .prettierrc.json
```

### Ключевые файлы

| Файл | Зачем нужен |
|------|------------|
| `index.html` | HTML entry point |
| `src/main.ts` | Точка входа Vue-приложения |
| `src/App.vue` | Корневой компонент |
| `vite.config.ts` | Конфигурация Vite |
| `package.json` | Scripts и зависимости |
| `tsconfig.json` | TypeScript config |

---

## 8. Что важно знать про сгенерированный проект

### 1. Он уже использует Composition API

Примеры в новом проекте обычно написаны через:

```vue
<script setup lang="ts">
```

Это современный стиль, который используется во всём учебном плане.

### 2. Это Vite-проект, а не Vue CLI

Старые материалы часто показывают:

```bash
vue create my-app
```

Для Vue 3 сейчас рекомендуется:

```bash
npm create vue@latest
```

### 3. Dev-server запускается через script

```bash
npm run dev
```

А не через отдельную global-команду `vue`.

---

## 9. Базовый lifecycle нового проекта

### Шаг 1. Создать проект

```bash
npm create vue@latest
```

### Шаг 2. Перейти в папку

```bash
cd my-vue-app
```

### Шаг 3. Установить зависимости

```bash
npm install
```

### Шаг 4. Запустить dev-server

```bash
npm run dev
```

### Шаг 5. Открыть в браузере

Обычно:

```text
http://localhost:5173
```

### Шаг 6. Проверить tooling

```bash
npm run lint
npm run build
```

---

## 10. Как `create-vue` связан с остальным стеком

`create-vue` — это только точка входа. Дальше ты работаешь уже с обычным набором инструментов:

```text
create-vue
   ↓
Vue 3 app
   ↓
Vite dev server / build
   ↓
TypeScript / ESLint / Prettier
   ↓
Vue Devtools
   ↓
Router / Pinia / Tests — позже по плану
```

Поэтому важно понимать:

- `create-vue` создаёт проект один раз;
- дальше ты живёшь внутри обычного Vue-проекта;
- новые возможности добавляются либо при создании, либо позже вручную.

---

## 11. `create-vue` vs Vue CLI

| | `create-vue` | Vue CLI |
|--|-------------|---------|
| **Статус** | Актуальный рекомендуемый способ | Legacy / maintenance mode |
| **Сборщик** | Vite | webpack |
| **Скорость dev-server** | Обычно выше | Обычно ниже |
| **Для новых проектов Vue 3** | Да | Нет |

Если в tutorial встречается `vue create`, это почти наверняка старый материал.

---

## 12. Частые ошибки

### Команда создаёт не тот проект

Проверь, что используешь:

```bash
npm create vue@latest
```

а не старый Vue CLI.

### После создания проект не запускается

Частая причина — пропущен шаг:

```bash
npm install
```

### PowerShell не понимает `--help`

Используй:

```powershell
npm create vue@latest '--' --help
```

### Сразу включили слишком много опций

Для Module 1 это не ошибка, но может усложнить старт. Лучше начать проще и добавлять Router/Pinia позже по плану.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Что делает `create-vue`?
2. Почему нужно писать `@latest`?
3. Какие опции стоит включить на Module 1?
4. Чем `npm create vue@latest` отличается от старого Vue CLI?
5. Какие команды нужны сразу после создания проекта?
6. Где находится entry point Vue-приложения?

---

## 14. Что почитать

### Официальное

- [Quick Start · Vue.js](https://vuejs.org/guide/quick-start.html)
- [Quick Start · Vue.js RU](https://ru.vuejs.org/guide/quick-start.html)
- [create-vue · GitHub](https://github.com/vuejs/create-vue)
- [create-vue · npm](https://www.npmjs.com/package/create-vue)
- [Tooling · Vue.js Guide RU](https://ru.vuejs.org/guide/scaling-up/tooling.html)

### Связанные материалы этого плана

- [Module 0 · Node.js, npm, pnpm](../module-0/03-nodejs-npm-pnpm.md)
- [Module 0 · Vue Devtools](../module-0/04-vue-devtools.md)
- [Module 0 · Editor setup](../module-0/05-editor-setup-for-vue.md)
- [Module 0 · Practice checklist](../module-0/06-practice-checklist.md)

---

## 15. Что посмотреть

### Рекомендуется

1. **Vue 3 фундаментальный курс · Ulbi TV**  
   [YouTube](https://www.youtube.com/watch?v=XzLuMtDelGk)  
   В начале курса обычно показывают создание Vue 3 проекта и первый запуск.

2. **Quick Start · Vue.js RU**  
   [ru.vuejs.org/guide/quick-start.html](https://ru.vuejs.org/guide/quick-start.html)  
   Официальный и самый точный reference по `create-vue`.

### Дополнительно

3. **create-vue README**  
   [GitHub](https://github.com/vuejs/create-vue)  
   Полезно для feature flags и неинтерактивного создания проекта.

---

## 16. Практическое мини-задание

1. Создай проект:

```bash
npm create vue@latest
```

2. Выбери:
   - TypeScript → Yes
   - ESLint → Yes
   - Prettier → Yes
   - Router/Pinia → No

3. Запусти:

```bash
cd <project-name>
npm install
npm run dev
```

4. Открой `src/main.ts`, `src/App.vue`, `vite.config.ts`
5. Своими словами объясни, за что отвечает каждый файл

Если проект запустился и ты понимаешь базовую структуру — блок можно считать усвоенным.

---

## 17. Мини-конспект

- `create-vue` — официальный способ создать Vue 3 + Vite проект.
- Команда: `npm create vue@latest`
- `@latest` обязателен.
- На Module 1 лучше не перегружать проект Router/Pinia.
- После создания всегда нужны: `npm install` → `npm run dev`
- Сгенерированный проект уже использует `<script setup>` и современный Vue 3 stack.

---

## 18. Что делать дальше

Следующий теоретический блок Module 1:

- **структура приложения на Vite**

Практически после этого материала имеет смысл создать свой первый учебный проект и подготовиться к pet-project уровня `easy`: `Todo List`, `Notes App` или `Habit Tracker`.
