# Playgrounds, starters и демо

Этот план — **документация без своего monorepo-приложения**. Вместо копирования больших демо в git используй **официальные playgrounds** и **готовые starters**: быстро проверить идею, не отвлекаясь на scaffold.

```text
Урок → мини-практика в своём репо
Затык по API → playground / StackBlitz ниже
Нужен референс архитектуры → open-source sample (осторожно с качеством)
```

Связанные файлы:

- [RESOURCES.md](./RESOURCES.md) — статьи и видео
- [Module 15 checklist](./module-15/01-practice-checklist.md)

---

## 1. Интерактивные playgrounds (ежедневно)

| Инструмент | URL | Когда |
|------------|-----|--------|
| **Vue SFC Playground** | [play.vuejs.org](https://play.vuejs.org/) | директивы, ref/reactive, маленький компонент |
| **Vue SFC Playground (RU docs links)** | из [ru.vuejs.org](https://ru.vuejs.org/) кнопки Play | то же |
| **Vue Router examples** | [router.vuejs.org](https://router.vuejs.org/) → Examples | guards, nested, lazy |
| **Pinia docs examples** | [pinia.vuejs.org](https://pinia.vuejs.org/) | store patterns |
| **Vitest StackBlitz** | из [vitest.dev](https://vitest.dev/guide/) | быстрый test runner |
| **Nuxt** | `npx nuxi@latest init` + [nuxt.new](https://nuxt.new/) | SSR/pages/server |

```text
Совет: сохрани permalink playground в конспекте модуля —
«вот минимальный repro бага с v-model».
```

---

## 2. Официальные / рекомендованные starters

| Starter | Команда / URL | Модули |
|---------|---------------|--------|
| Vite + Vue + TS | `npm create vite@latest -- --template vue-ts` | 0–13 SPA |
| Vue Router + Pinia template | Vite official templates / `create-vue` | 5–6 |
| create-vue | `npm create vue@latest` | полный чеклист опций (router, pinia, vitest) |
| Nuxt | `npx nuxi@latest init` / [nuxt.new](https://nuxt.new/) | 14 |
| VeeValidate examples | [vee-validate docs](https://vee-validate.logaretm.com/v4/examples/checkboxes/) | 9 |
| TanStack Query Vue examples | [TanStack Vue examples](https://tanstack.com/query/latest/docs/framework/vue/examples/basic) | 8 |

**create-vue** — лучший «демо-скелет» для Modules 5–11: сразу router + pinia + vitest без ручной боли.

---

## 3. Демо по темам плана (внешние)

Не форкай всё. Открывай, **сравнивай с уроком**, копируй только идею.

### Основы (Module 1–3)

| Демо | Зачем |
|------|--------|
| [Vue Tutorial](https://vuejs.org/tutorial/) | пошаговый SFC |
| [Vue Examples (guide)](https://vuejs.org/examples/#hello-world) | markdown examples в доке |

### Router / Pinia (Module 5–6)

| Демо | Зачем |
|------|--------|
| Router GitHub examples | репозиторий `vuejs/router` → `packages/router/examples` *(локальный clone)* |
| Pinia cookbook | composable stores, testing |

### Server state (Module 8)

| Демо | Зачем |
|------|--------|
| [TanStack Query Vue · Basic](https://tanstack.com/query/latest/docs/framework/vue/examples/basic) | queries |
| [Optimistic Updates examples](https://tanstack.com/query/latest/docs/framework/vue/guides/optimistic-updates) | Module 8 stretch |

### Forms (Module 9)

| Демо | Зачем |
|------|--------|
| VeeValidate + Zod examples в доке | schema forms |
| [VueUse](https://vueuse.org/) *(не формы, но composables)* | reuse patterns Module 10 |

### Testing (Module 11)

| Демо | Зачем |
|------|--------|
| [VTU examples](https://test-utils.vuejs.org/guide/) | mount / find |
| [Vitest examples](https://github.com/vitest-dev/vitest/tree/main/examples) | configs |

### Nuxt (Module 14)

| Демо | Зачем |
|------|--------|
| [Nuxt Examples](https://nuxt.com/docs/examples/hello-world) | hello, routing, data fetching |
| [Nuxt Hub / templates](https://nuxt.com/templates) | blog, portfolio starters |
| [atinux/nuxt-todos-edge](https://github.com/atinux) *(ищи актуальные Nuxt 3 demos)* | fullstack vibe — смотри критически |

---

## 4. «Сквозной» Product Catalog — как собирать демо самому

План сознательно **не** кладёт один готовый catalog в этот репозиторий (чтобы не подменять практику копипастой).

Рекомендуемый путь:

```text
Module 2–4   → components catalog UI
Module 5     → routes /catalog /product/:id
Module 6     → Pinia cart
Module 7–8   → api + vue-query
Module 9–10  → forms + modal/toast
Module 11    → tests
Module 12    → perf pass
Module 13    → folders + ARCHITECTURE.md
Module 14    → отдельный Nuxt mini-storefront (не merge в SPA)
Module 15    → финалка на базе лучшего pet-project
```

Чеклисты практики в каждом `docs/module-N/*-practice-checklist.md` — и есть твой «демо-скрипт».

---

## 5. Как оформить своё демо для портфолио

```text
repo/
  README.md          — что за app, стек, Why Vite/Nuxt
  docs/ARCHITECTURE.md
  live demo URL      — Vercel/Netlify/Pages
  screenshots/
```

В README финалки укажи:

- ссылку на **этот study plan** (какие модули закрыты)
- 3 решения, которыми гордишься (не «поставил Vue»)

---

## 6. Чего избегать

```text
❌ Скачать «vue admin template 50k stars» и сдать как свой
❌ Vue 2 / Nuxt 2 demo как референс для нового кода
❌ Держать node_modules демо внутри vue-study-plan git
✅ Отдельный репозиторий на каждый pet-project
✅ Минимальный repro в play.vuejs.org для вопросов
```

---

## 7. Быстрый выбор «мне нужно …»

| Хочу… | Открой |
|-------|--------|
| Проверить `v-model` за 2 минуты | [play.vuejs.org](https://play.vuejs.org/) |
| Новый учебный SPA | `npm create vue@latest` |
| Nuxt SSR page | [nuxt.new](https://nuxt.new/) |
| Пример vue-query | TanStack Vue basic example |
| Пример тестов | Vitest + VTU guides |
| Статьи/видео | [RESOURCES.md](./RESOURCES.md) |
