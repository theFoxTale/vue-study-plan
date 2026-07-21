# Module 15 · Финальный проект · checklist

Пошаговый чеклист для закрытия **Module 15**: собрать **законченное** приложение на современном Vue-стеке, закрыть DoD из README и выложить demo + README.

Это не теория — **ship the product**. Опирайся на Modules 0–14 и свои pet-projects.

Связанные материалы:

- [README · Module 15](../../README.md#module-15-финальный-проект)
- [DEMOS.md](../DEMOS.md) — starters / playgrounds
- [RESOURCES.md](../RESOURCES.md) — внешние ссылки
- [Module 14 · Nuxt vs Vite](../module-14/11-nuxt-vs-vue-vite.md)
- [Module 13 · practice](../module-13/10-practice-checklist.md)

---

## Перед стартом

- [ ] Modules 0–14 теория прочитана; практики 0–14 хотя бы в MVP-виде
- [ ] выбран **один** продукт (не три сразу)
- [ ] решено: **Vue + Vite SPA** или **Nuxt 3** ([decision](../module-14/11-nuxt-vs-vue-vite.md))
- [ ] отдельный git-репозиторий (не внутрь `vue-study-plan`)

---

## Шаг 1. Выбрать вариант

Из README или свой:

| Вариант | Сильные модули |
|---------|----------------|
| Task manager | 5–6, 9, 11 |
| Ecommerce frontend | 5–10, 12–14 |
| Admin dashboard | 5–8, 10–13 |
| Movie explorer | 5, 7–8, 11 |
| Note-taking app | 5–6, 9–11 |
| Swagger-like API client | 7–9, 11, 13 |
| Свой (из [идей README](../../README.md)) | — |

### Checklist

- [ ] название + one-liner «для кого»
- [ ] стек зафиксирован (Vite или Nuxt + список libs)

---

## Шаг 2. MVP scope (1 страница)

Запиши **must-have** (не stretch):

```markdown
## MVP
- entities: …
- screens: list, detail, …
- auth?: yes/no
- API: mock / public API / own server
- deploy target: …
```

Правило: MVP закрывается за **2–4 недели** регулярной работы. Остальное — backlog.

### Checklist

- [ ] MVP ≤ то, что реально закончить
- [ ] есть list + detail + create/edit **или** эквивалент продукта

---

## Шаг 3. DoD из README — карта требований

Финальный проект **должен** включать:

| Требование | Как закроешь | Done |
|------------|--------------|------|
| Vue 3 | SFC + Composition API | [ ] |
| TypeScript | strict-ish, минимум `any` | [ ] |
| Composition API | `<script setup>` | [ ] |
| Vue Router *(или Nuxt pages)* | ≥ 3 meaningful routes | [ ] |
| Pinia | ≥ 1 store с реальным смыслом | [ ] |
| Работа с API | fetch/axios/query/server | [ ] |
| Формы и валидация | VeeValidate/Zod или эквивалент | [ ] |
| Тесты | Vitest + критические сценарии | [ ] |
| Адаптивная вёрстка | mobile + desktop | [ ] |
| Accessibility базового уровня | labels, focus, semantic HTML | [ ] |
| README | описание, setup, stack, Why | [ ] |
| Deploy | публичный URL | [ ] |

### Оценивать будут (README)

- [ ] архитектура (Module 13)
- [ ] типизация
- [ ] UX (loading/error/empty)
- [ ] читаемость
- [ ] тесты на критические сценарии

---

## Шаг 4. Каркас проекта

```bash
# SPA path
npm create vue@latest

# или Nuxt path
npx nuxi@latest init my-final-project
```

- [ ] ESLint + Prettier
- [ ] path alias `@/`
- [ ] `.env.example`
- [ ] scripts: `dev`, `build`, `preview`, `test:run`, `lint`

---

## Шаг 5. Архитектура

- [ ] папки: `pages` / `features` / `entities` / `shared` **или** упрощённый аналог
- [ ] короткий `ARCHITECTURE.md` (правила импортов + naming)
- [ ] API layer не в UI components
- [ ] server state (query) vs client state (Pinia) разделены, если оба есть

См. [Module 13 checklist](../module-13/10-practice-checklist.md).

---

## Шаг 6. Фичи по вертикали

Делай **вертикальными слайсами**, не «сначала все компоненты»:

1. [ ] List + API + loading/error/empty  
2. [ ] Detail  
3. [ ] Create/Edit form + validation  
4. [ ] Store feature (cart/favorites/session…)  
5. [ ] Filters/search  
6. [ ] Polish UI kit / responsive  

После каждого слайса — `build` + ручной QA.

---

## Шаг 7. Тесты (минимум)

- [ ] unit: schema/parse/util  
- [ ] store **или** composable test  
- [ ] component: critical form или list state  
- [ ] `npm run test:run` green  
- [ ] optional: 1 e2e happy path  

См. [Module 11 checklist](../module-11/10-practice-checklist.md).

---

## Шаг 8. UX / a11y / perf sanity

- [ ] loading / error / empty на главных экранах  
- [ ] формы: ошибки видны, submit disabled логично  
- [ ] focus на inputs, `label` / `aria` где нужно  
- [ ] картинки: размеры / alt  
- [ ] нет index-key багов в списках  
- [ ] optional: Devtools highlight — нет mass rerender на простой action  

---

## Шаг 9. README продукта

```markdown
# Project name

## What
## Why this stack (Vite or Nuxt)
## Features (MVP)
## Setup
## Scripts
## Architecture (link)
## Tests
## Demo URL
## Study plan coverage (modules used)
```

- [ ] README достаточен для чужого clone → run  
- [ ] Demo URL кликабелен  

---

## Шаг 10. Deploy

- [ ] `npm run build` (+ `preview`) локально ok  
- [ ] задеплоено (Pages / Netlify / Vercel / Railway…)  
- [ ] prod env без localhost в публичных URL  
- [ ] критические routes работают на проде  

См. [Module 14 deployment](../module-14/10-deployment.md) если Nuxt.

---

## Шаг 11. Финальная самопроверка

1. Могу объяснить архитектуру за 5 минут?  
2. Где API boundary? Где Pinia?  
3. Какие тесты ловят регрессию критического сценария?  
4. Что сознательно не вошло в MVP и почему ok?  
5. Чем проект лучше «туториал-клона»?  
6. Готов показать demo на созвоне без «сейчас починю»?

### Checklist

- [ ] ответы своими словами в `docs/REFLECTION.md` *(optional, но полезно)*

---

## Финальный checklist Module 15

Модуль / план можно считать завершённым на уровне финалки, если:

### README Module 15 DoD

- [ ] все обязательные пункты таблицы шага 3 закрыты  
- [ ] публичный deploy  
- [ ] README + понятная архитектура  

### Качество

- [ ] нет критичного lint/`any`-хаоса  
- [ ] UX состояний на месте  
- [ ] тесты на критический путь  
- [ ] код можно защищать устно  

---

## Stretch (после сдачи MVP)

- Nuxt migration витрины / SSR product pages  
- e2e CI  
- i18n  
- PWA  
- design system / Storybook  
- real backend  

---

## Если что-то пошло не так

### Scope creep

- вернись к MVP-странице; stretch в Issues  

### «Не знаю с чего начать»

- `create vue` → list из mock JSON → detail → form  

### Нет идей API

- [JSONPlaceholder](https://jsonplaceholder.typicode.com/), [DummyJSON](https://dummyjson.com/), [TMDB](https://www.themoviedb.org/documentation/api), свой `server/api` на Nuxt  

### Нет времени на Nuxt и Vite

- один стек; SEO не нужен → Vite; публичный контент → Nuxt  

### Тесты в конце «некогда»

- хотя бы schema + store; лучше 3 теста, чем 0  

---

## После Module 15 (финальный этап плана)

Из README:

- [ ] техническое интервью по Vue (mock)  
- [ ] рефакторинг 1–2 старых учебных проектов  
- [ ] портфолио: 2–3 законченных app  
- [ ] свой короткий Vue 3 cheatsheet  

Полезные ссылки: [RESOURCES.md](../RESOURCES.md), [DEMOS.md](../DEMOS.md), [CHEATSHEET.md](../CHEATSHEET.md).

---

## Мини-конспект

- Module 15 = **ship**, не ещё одна теория  
- один продукт, жёсткий MVP, вертикальные слайсы  
- DoD README обязателен: router, pinia, api, forms, tests, a11y, deploy  
- отдельный репозиторий + публичный URL  
- план Modules 0–14 — фундамент; финалка — доказательство  
