# Module 0 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 0**: установить окружение, создать первый Vue 3 проект, настроить tooling и убедиться, что всё работает.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

Сначала желательно прочитать теорию:

- [01 · роль Vue во frontend](01-vue-role-in-modern-frontend.md)
- [02 · Vue vs React vs Angular](02-vue-vs-react-vs-angular.md)
- [03 · Node.js, npm, pnpm](03-nodejs-npm-pnpm.md)
- [04 · Vue Devtools](04-vue-devtools.md)
- [05 · настройка редактора](05-editor-setup-for-vue.md)

---

## Шаг 1. Установить Node.js

### Что сделать

1. Скачай **LTS**-версию с [nodejs.org](https://nodejs.org/)
2. Установи через installer
3. Открой терминал и проверь:

```bash
node -v
npm -v
```

### Ожидаемый результат

- `node -v` показывает версию, например `v22.x.x` или `v20.x.x`
- `npm -v` показывает версию npm

### Checklist

- [ ] Node.js установлен
- [ ] `node -v` работает
- [ ] `npm -v` работает

---

## Шаг 2. Выбрать менеджер пакетов

Для Module 0 достаточно **npm**. Если хочешь использовать **pnpm**, это тоже нормально — но выбери один инструмент и придерживайся его.

### npm (рекомендуется для старта)

Ничего дополнительно ставить не нужно.

### pnpm (опционально)

```bash
npm install -g pnpm
pnpm -v
```

### Checklist

- [ ] Выбран один менеджер пакетов: `npm` или `pnpm`
- [ ] Команда версии менеджера работает

---

## Шаг 3. Настроить редактор

Подробнее: [05 · настройка редактора](05-editor-setup-for-vue.md)

### Что установить

- **Vue - Official** (`Vue.volar`)
- **ESLint**
- **Prettier**

### Что отключить

- **Vetur**, если он установлен

### Checklist

- [ ] Vue - Official установлен
- [ ] ESLint установлен
- [ ] Prettier установлен
- [ ] Vetur отключён, если был

---

## Шаг 4. Установить Vue Devtools

Подробнее: [04 · Vue Devtools](04-vue-devtools.md)

### Что сделать

1. Установи browser extension **Vue.js devtools**
2. Закрепи иконку расширения при необходимости

Chrome Web Store: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)

### Checklist

- [ ] Vue Devtools extension установлен
- [ ] Расширение включено

---

## Шаг 5. Создать первый Vue 3 проект

### Команда

```bash
npm create vue@latest
```

Если используешь pnpm:

```bash
pnpm create vue@latest
```

### Рекомендуемые ответы для Module 0

| Вопрос | Рекомендация |
|--------|-------------|
| Project name | `vue-study-setup` или любое своё имя |
| TypeScript | **Yes** |
| JSX Support | No |
| Vue Router | No *(пока рано, будет в Module 5)* |
| Pinia | No *(пока рано, будет в Module 6)* |
| Vitest | Optional *(можно Yes, но не обязательно)* |
| ESLint | **Yes** |
| Prettier | **Yes** |

### После создания

```bash
cd vue-study-setup
npm install
npm run dev
```

### Ожидаемый результат

- dev-server запускается без ошибок
- в браузере открывается стартовая страница Vue
- адрес обычно `http://localhost:5173`

### Checklist

- [ ] Проект создан через `create-vue`
- [ ] Зависимости установлены
- [ ] `npm run dev` запускается
- [ ] Приложение открывается в браузере

---

## Шаг 6. Проверить Vue Devtools на живом проекте

### Что сделать

1. Открой приложение в браузере
2. Нажми `F12`
3. Перейди на вкладку **Vue**
4. Найди дерево компонентов

### Ожидаемый результат

- вкладка `Vue` видна
- отображается component tree
- можно inspect state/props компонента

### Checklist

- [ ] Vue Devtools видит приложение
- [ ] Дерево компонентов отображается

---

## Шаг 7. Настроить editor settings в проекте

Создай файлы в корне проекта.

### `.vscode/settings.json`

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ]
}
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "Vue.volar",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

### Проверка

1. Открой любой `.vue`-файл
2. Убедись, что есть подсветка синтаксиса
3. Сохрани файл и проверь автоформатирование

### Checklist

- [ ] `.vscode/settings.json` создан
- [ ] `.vscode/extensions.json` создан
- [ ] `.vue`-файлы подсвечиваются корректно
- [ ] format on save работает

---

## Шаг 8. Настроить alias `@`

Alias нужен, чтобы импортировать файлы короче и понятнее.

### Пример `vite.config.ts`

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

### Пример `tsconfig.app.json`

Убедись, что есть paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

В проектах `create-vue` это часто уже настроено — просто проверь.

### Тест alias

Создай файл `src/utils/hello.ts`:

```ts
export function hello(name: string) {
  return `Hello, ${name}`
}
```

Импортируй его в `App.vue`:

```ts
import { hello } from '@/utils/hello'
```

### Checklist

- [ ] alias `@` настроен в Vite
- [ ] alias `@` настроен в TypeScript
- [ ] импорт через `@/...` работает без ошибок

---

## Шаг 9. Настроить `.env`

### Что сделать

1. Создай `.env`
2. Создай `.env.example`
3. Добавь `.env` в `.gitignore`, если его там ещё нет

### Пример `.env`

```env
VITE_APP_TITLE=Vue Study Setup
VITE_API_URL=http://localhost:3000
```

### Пример `.env.example`

```env
VITE_APP_TITLE=My App
VITE_API_URL=
```

### Пример использования

```ts
const appTitle = import.meta.env.VITE_APP_TITLE
```

Важно: в Vite только переменные с префиксом `VITE_` доступны клиенту.

### Checklist

- [ ] `.env` создан
- [ ] `.env.example` создан
- [ ] `.env` не попадает в git
- [ ] переменная читается через `import.meta.env`

---

## Шаг 10. Проверить scripts проекта

Открой `package.json` и убедись, что есть базовые scripts.

Обычно это:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "run-p type-check \"build-only {@}\" --",
    "preview": "vite preview",
    "lint": "eslint . --fix",
    "format": "prettier --write src/"
  }
}
```

Точный набор может немного отличаться — это нормально.

### Что должны делать команды

| Команда | Назначение |
|---------|-----------|
| `dev` | локальная разработка |
| `build` | production-сборка |
| `preview` | просмотр production-сборки локально |
| `lint` | проверка и исправление lint-ошибок |
| `format` | форматирование кода |

### Checklist

- [ ] понятно, что делает `dev`
- [ ] понятно, что делает `build`
- [ ] понятно, что делает `preview`
- [ ] `lint` работает
- [ ] `format` работает

---

## Шаг 11. Прогнать lint, type-check и build

### Команды

```bash
npm run lint
npm run format
npx vue-tsc --noEmit
npm run build
npm run preview
```

Если в проекте есть отдельный script `type-check`, можно использовать его вместо прямого вызова `vue-tsc`.

### Ожидаемый результат

- lint проходит или показывает только осмысленные замечания
- format не ломает проект
- type-check проходит без ошибок
- build завершается успешно
- preview открывает собранное приложение

### Checklist

- [ ] `lint` выполнен
- [ ] `format` выполнен
- [ ] type-check проходит
- [ ] `build` проходит
- [ ] `preview` работает

---

## Шаг 12. Понять разницу между `dev`, `build` и `preview`

Это важная часть Module 0.

### `dev`

- режим разработки;
- hot reload;
- подробные ошибки;
- Vue Devtools работает;
- код не оптимизирован для production.

### `build`

- production-сборка;
- минификация и оптимизация;
- подготовка файлов для deploy;
- DevTools в production обычно не нужен.

### `preview`

- локальный просмотр **уже собранного** production-build;
- помогает проверить, что build реально работает.

### Мини-проверка понимания

Своими словами ответь:

1. Зачем нужен `dev`?
2. Зачем нужен `build`?
3. Чем `preview` отличается от `dev`?

### Checklist

- [ ] могу объяснить `dev`
- [ ] могу объяснить `build`
- [ ] могу объяснить `preview`

---

## Шаг 13. Сделать маленькую практическую проверку

Чтобы убедиться, что setup действительно рабочий, измени стартовый проект минимально.

### Что сделать

1. В `App.vue` выведи заголовок из `.env`:

```vue
<script setup lang="ts">
const appTitle = import.meta.env.VITE_APP_TITLE
</script>

<template>
  <main>
    <h1>{{ appTitle }}</h1>
    <p>Module 0 setup is working</p>
  </main>
</template>
```

2. Сохрани файл
3. Проверь UI в браузере
4. Проверь Vue Devtools
5. Запусти `npm run lint` и `npm run build`

### Checklist

- [ ] UI обновился
- [ ] `.env` значение видно в приложении
- [ ] DevTools показывает компонент
- [ ] lint/build проходят после изменений

---

## Финальный checklist Module 0

Module 0 можно считать завершённым, если выполнены все пункты ниже.

### Окружение

- [ ] Node.js установлен
- [ ] npm или pnpm работает
- [ ] editor настроен для `.vue`
- [ ] Vue Devtools установлен и проверен

### Проект

- [ ] создан Vue 3 проект через `create-vue`
- [ ] подключены TypeScript, ESLint, Prettier
- [ ] проект запускается через `npm run dev`
- [ ] alias `@` работает
- [ ] `.env` и `.env.example` настроены

### Качество и сборка

- [ ] `lint` работает
- [ ] `format` работает
- [ ] type-check проходит
- [ ] `build` проходит
- [ ] `preview` работает

### Понимание

- [ ] понимаю роль Vue во frontend
- [ ] понимаю отличие Vue от React и Angular на базовом уровне
- [ ] понимаю, зачем нужны Node.js, npm/pnpm
- [ ] понимаю, зачем нужен Vue Devtools
- [ ] понимаю разницу между `dev`, `build`, `preview`

---

## Если что-то пошло не так

### Проект не запускается

Проверь:

```bash
node -v
npm -v
rm -rf node_modules
npm install
npm run dev
```

На Windows в PowerShell вместо `rm -rf` можно использовать:

```powershell
Remove-Item -Recurse -Force node_modules
```

### Нет вкладки Vue в DevTools

- приложение должно быть запущено через `npm run dev`
- используй Vue 3, не Vue 2
- перезагрузи страницу после установки extension

### TypeScript ругается на `@/...`

Проверь:

- `vite.config.ts`
- `tsconfig.app.json`
- перезапуск TS server / reload window

### `build` падает

Сначала проверь по отдельности:

```bash
npm run lint
npx vue-tsc --noEmit
npm run build
```

Так проще понять, это lint/type error или проблема сборки.

---

## Что делать после Module 0

Когда checklist закрыт, переходи к **Module 1 · Основы Vue 3**:

- директивы;
- events;
- forms;
- первый pet-project уровня `easy`.

Хороший первый проект после Module 0:

- `Todo List`
- `Notes App`
- `Habit Tracker`

---

## Мини-конспект

- Module 0 — это не «просто установить Node», а собрать **рабочую среду разработки**.
- Цель — получить проект, который запускается, lint-ится, type-check-ится, собирается и открывается в DevTools.
- После этого можно спокойно переходить к изучению самого Vue, а не бороться с tooling.
