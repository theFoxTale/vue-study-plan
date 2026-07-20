# Module 1 · Теория: структура приложения на `Vite`

Этот материал закрывает второй теоретический пункт `Module 1`: понять, **из каких частей состоит Vue-проект на Vite**, **как они связаны между собой** и **как приложение запускается от `index.html` до первого компонента на экране**.

Связанный материал: [01 · создание проекта через create-vue](01-create-vue.md)

---

## 1. Что такое `Vite` в Vue-проекте

**Vite** — современный инструмент для frontend-разработки. В Vue-проекте он отвечает за:

- dev-server с hot reload;
- сборку production-версии;
- работу с TypeScript, `.vue`, CSS и assets;
- быстрый старт проекта без долгой webpack-сборки.

`create-vue` создаёт не «Vue-проект сам по себе», а **Vue-проект на Vite**.

Официальные источники:

- [Vite · Getting Started](https://vite.dev/guide/)
- [Why Vite](https://vite.dev/guide/why.html)
- [Tooling · Vue.js Guide RU](https://ru.vuejs.org/guide/scaling-up/tooling.html)

---

## 2. Общая картина проекта

После `npm create vue@latest` ты получаешь примерно такую структуру:

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
  tsconfig.app.json
  tsconfig.node.json
  eslint.config.js
  env.d.ts
```

На раннем этапе важнее всего понять 5 вещей:

1. `index.html` — entry point приложения
2. `src/main.ts` — точка входа Vue
3. `src/App.vue` — корневой компонент
4. `src/components/` — переиспользуемые компоненты
5. `vite.config.ts` — конфигурация Vite

---

## 3. Чем Vite-проект отличается от старого подхода

В старых Vue CLI / webpack проектах `index.html` часто был второстепенным.

В **Vite** всё наоборот:

- `index.html` — **центральная точка входа**;
- Vite обрабатывает его как часть module graph;
- JavaScript подключается как ES module.

Это одна из ключевых особенностей Vite-проекта.

---

## 4. `index.html` — с чего всё начинается

Пример:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + Vue</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### Что здесь важно

- `<div id="app"></div>` — контейнер, куда Vue «монтирует» приложение
- `<script type="module" src="/src/main.ts">` — подключение entry script
- Vite во время разработки сам обслуживает этот файл

### Главная мысль

Браузер загружает `index.html`, а дальше Vite подключает Vue-приложение через `src/main.ts`.

---

## 5. `src/main.ts` — bootstrap Vue-приложения

Пример:

```ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

### Что происходит

1. Импортируется `createApp` из Vue
2. Импортируется корневой компонент `App.vue`
3. Создаётся Vue application
4. Приложение монтируется в `#app`

### Простыми словами

`main.ts` — это «провод между HTML и Vue».

Без него `.vue`-компоненты сами по себе в DOM не появятся.

---

## 6. `App.vue` — корневой компонент

`App.vue` — верхний компонент всего приложения.

Пример:

```vue
<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <main>
    <HelloWorld />
  </main>
</template>

<style scoped>
main {
  padding: 2rem;
}
</style>
```

### Роль `App.vue`

- задаёт верхний layout;
- подключает другие компоненты;
- часто содержит общую обёртку UI;
- позже сюда может добавиться router view или global layout.

На раннем этапе можно думать так:

```text
index.html
   ↓
main.ts
   ↓
App.vue
   ↓
другие components
```

---

## 7. Папка `src/components`

Здесь обычно лежат переиспользуемые UI-компоненты.

Примеры:

```text
src/components/
  HelloWorld.vue
  TodoItem.vue
  AppButton.vue
```

### Правило для Module 1

- `App.vue` — корень приложения
- `components/` — куски интерфейса, которые можно переиспользовать

Позже появятся более зрелые слои (`pages`, `features`, `shared/ui`), но на старте достаточно `App.vue + components`.

---

## 8. Папка `src/assets`

Здесь хранятся ресурсы, которые **импортируются из кода**:

- изображения;
- svg;
- глобальные css/scss;
- шрифты.

Пример:

```vue
<script setup lang="ts">
import logo from '@/assets/logo.svg'
</script>

<template>
  <img :src="logo" alt="Logo" />
</template>
```

### `assets/` vs `public/`

| Папка | Как используется |
|------|------------------|
| `src/assets/` | Импорт из JS/TS/Vue, Vite обрабатывает файл |
| `public/` | Статические файлы по фиксированному URL |

Пример `public/`:

```text
public/
  favicon.ico
  robots.txt
```

Файл `public/favicon.ico` будет доступен как `/favicon.ico`.

---

## 9. `vite.config.ts` — конфигурация сборщика

Пример:

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

### Что здесь важно

- `plugins: [vue()]` — поддержка `.vue`-файлов
- `resolve.alias` — короткие импорты через `@/`
- именно здесь настраиваются Vite-специфичные вещи

### Что обычно настраивают позже

- aliases
- env variables
- proxy для API
- build options
- plugins

На Module 1 достаточно понимать, что **`vite.config.ts` управляет тем, как Vite видит проект**.

---

## 10. `package.json` и scripts

Пример scripts:

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

### Что делает каждая команда

| Script | Что происходит |
|--------|----------------|
| `dev` | запускает Vite dev-server |
| `build` | собирает production-версию |
| `preview` | локально показывает production build |
| `lint` | проверяет код ESLint |
| `format` | форматирует код Prettier |

### Важно понимать

Когда ты запускаешь:

```bash
npm run dev
```

ты запускаешь **не Vue напрямую**, а **Vite dev-server**, который уже обслуживает Vue-приложение.

---

## 11. Как приложение запускается шаг за шагом

### В режиме разработки

1. Ты запускаешь `npm run dev`
2. Vite поднимает dev-server
3. Браузер открывает `index.html`
4. `index.html` подключает `/src/main.ts`
5. `main.ts` создаёт Vue app и монтирует `App.vue`
6. `App.vue` рендерит дочерние компоненты
7. При изменениях файлов Vite делает hot reload

### В production

1. Ты запускаешь `npm run build`
2. Vite собирает и оптимизирует проект
3. Получается папка `dist/`
4. `npm run preview` или deploy показывает итоговую версию

---

## 12. TypeScript-файлы в Vite-проекте

В TypeScript-проекте обычно есть несколько config-файлов:

```text
tsconfig.json
tsconfig.app.json
tsconfig.node.json
env.d.ts
```

### Зачем они нужны

| Файл | Роль |
|------|------|
| `tsconfig.json` | базовая ссылка на остальные configs |
| `tsconfig.app.json` | TypeScript для app code (`src/`) |
| `tsconfig.node.json` | TypeScript для Vite/node configs |
| `env.d.ts` | типы для `.vue` и Vite env |

На Module 1 не нужно глубоко настраивать их вручную. Достаточно понимать, что:

- app code типизируется через `src/`
- `.vue` files поддерживаются через declarations

---

## 13. Как Vite обрабатывает `.vue`

Сам Vite не понимает `.vue` «из коробки».

Для этого используется plugin:

```ts
import vue from '@vitejs/plugin-vue'
```

Он позволяет:

- импортировать `.vue` как модули;
- разбирать `<template>`, `<script>`, `<style>`;
- поддерживать HMR для компонентов.

Поэтому цепочка такая:

```text
.vue file
   ↓
@vitejs/plugin-vue
   ↓
Vite dev server / build pipeline
   ↓
browser-ready JavaScript + CSS
```

---

## 14. Базовая mental model для Module 1

Если упростить до минимума:

```text
index.html
  └─ подключает src/main.ts
       └─ монтирует App.vue
            └─ использует components/*
                 └─ использует assets/*
```

И параллельно:

```text
vite.config.ts → говорит Vite, как работать с проектом
package.json → говорит, какие команды можно запускать
```

Если эта схема понятна, дальше Module 1 идёт гораздо легче.

---

## 15. Что обычно добавляется позже

В простом проекте Module 1 этих папок может ещё не быть, но полезно знать, что они появятся дальше:

| Папка / файл | Когда появится |
|-------------|----------------|
| `src/router/` | Module 5 |
| `src/stores/` | Module 6 |
| `src/composables/` | Module 2 |
| `src/views/` или `src/pages/` | Module 5+ |
| `src/api/` | Module 7 |
| `src/types/` | Module 4 |

Не нужно создавать всё это сразу. На старте лучше держать проект простым.

---

## 16. Частые ошибки новичков

### Путают `main.ts` и `App.vue`

- `main.ts` — bootstrap приложения
- `App.vue` — первый реальный UI-компонент

### Ищут «точку входа» только в `src/`

В Vite entry point — это **`index.html`**, а не только `main.ts`.

### Путают `assets` и `public`

- `assets` — импорт из кода
- `public` — прямой URL без import

### Думают, что `npm run dev` запускает Vue напрямую

На самом деле запускается **Vite dev-server**.

### Сразу усложняют структуру

На Module 1 достаточно:

```text
src/
  components/
  App.vue
  main.ts
```

---

## 17. Что важно понять после этого блока

Проверь себя:

1. Какой файл является entry point Vite-проекта?
2. Зачем нужен `src/main.ts`?
3. Чем `App.vue` отличается от обычного компонента?
4. Что хранится в `src/components/`?
5. Чем `assets/` отличается от `public/`?
6. Зачем нужен `vite.config.ts`?
7. Что реально запускает команда `npm run dev`?

---

## 18. Что почитать

### Официальное

- [Vite · Getting Started](https://vite.dev/guide/)
- [Vite · Why Vite](https://vite.dev/guide/why.html)
- [Vite · index.html and Project Root](https://vite.dev/guide/#index-html-and-project-root)
- [Vue · Quick Start](https://vuejs.org/guide/quick-start.html)
- [Vue · Tooling RU](https://ru.vuejs.org/guide/scaling-up/tooling.html)

### Связанные материалы этого плана

- [01 · create-vue](01-create-vue.md)
- [Module 0 · Node.js, npm, pnpm](../module-0/03-nodejs-npm-pnpm.md)
- [Module 0 · Practice checklist](../module-0/06-practice-checklist.md)

---

## 19. Что посмотреть

### Рекомендуется

1. **Vue 3 фундаментальный курс · Ulbi TV**  
   [YouTube](https://www.youtube.com/watch?v=XzLuMtDelGk)  
   В начале курса хорошо видно, как устроен Vue-проект и из чего он состоит.

2. **Getting started with Vue · MDN**  
   [MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/Vue_getting_started)  
   Полезный обзор project structure и роли `main.js` / `App.vue`.

### Дополнительно

3. **Vite Docs · Getting Started**  
   [vite.dev/guide](https://vite.dev/guide/)  
   Лучший source of truth по структуре Vite-проекта.

---

## 20. Практическое мини-задание

1. Открой свой Vue-проект
2. Найди и прочитай:
   - `index.html`
   - `src/main.ts`
   - `src/App.vue`
   - `vite.config.ts`
   - `package.json`
3. Нарисуй схему:

```text
index.html → main.ts → App.vue → components
```

4. Запусти:

```bash
npm run dev
```

5. Измени текст в `App.vue` и посмотри, как Vite обновляет страницу без full reload

Если ты понимаешь путь от `index.html` до UI на экране — блок усвоен.

---

## 21. Мини-конспект

- Vue-проект от `create-vue` — это Vue + Vite + TypeScript tooling.
- `index.html` — entry point Vite-приложения.
- `main.ts` монтирует Vue app в `#app`.
- `App.vue` — корневой компонент.
- `components/` — переиспользуемые UI-блоки.
- `vite.config.ts` управляет поведением Vite.
- `npm run dev` запускает Vite dev-server, а не «сам Vue».

---

## 22. Что делать дальше

Следующий теоретический блок Module 1:

- **Single File Components**

После этого блока имеет смысл уже не просто смотреть на структуру проекта, а начинать писать свои первые `.vue`-компоненты.
