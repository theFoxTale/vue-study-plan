# Дополнительные ресурсы: статьи и видео

Кураторский список **внешних** материалов к плану. Основной путь обучения — уроки в `docs/module-*` и **официальная документация**. Здесь — поддержка: углубление, альтернативные объяснения, видео.

```text
Как пользоваться:
1. Сначала урок модуля + официальные ссылки в конце урока
2. Если застрял — видео/статья из этого файла по номеру модуля
3. Не смотри всё подряд — это не обязательный backlog
```

Связанные файлы плана:

- [Playgrounds и демо](./DEMOS.md)
- [Cheatsheet Vue 3](./CHEATSHEET.md)
- [README · официальные ресурсы](../README.md#официальные-ресурсы)

---

## Сквозные (весь план)

### Документация

| Ресурс | Зачем |
|--------|--------|
| [Vue 3 Guide (EN)](https://vuejs.org/guide/introduction.html) | первоисточник |
| [Vue 3 Guide (RU)](https://ru.vuejs.org/guide/introduction.html) | тот же гайд на русском |
| [Vue RFCs](https://github.com/vuejs/rfcs) | «почему так спроектировали» |
| [Awesome Vue](https://github.com/vuejs/awesome-vue) | каталог экосистемы (с фильтром качества) |

### Видео / каналы

| Ресурс | Зачем |
|--------|--------|
| [Vue.js Docs · YouTube](https://www.youtube.com/@VueMastery) *(Vue Mastery / conference talks — фильтруй)* | доклады и паттерны |
| [Ulbi TV · Vue 3 курс](https://www.youtube.com/watch?v=XzLuMtDelGk) | длинный RU-обзор стека |
| [Vue.js Conferences](https://vuejs.org/about/community.html) | актуальные talks |

### Статьи / обзоры

| Ресурс | Зачем |
|--------|--------|
| [The State of Vue](https://www.vuemastery.com/blog/) / community surveys | тренды экосистемы |
| [Vue Land Discord](https://chat.vuejs.org/) | вопросы сообществу |

---

## Module 0 · Окружение

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [Vite · Getting Started](https://vitejs.dev/guide/) | сборка рядом с Vue |
| Docs | [VS Code · Vetur/Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) | редактор |
| Video | см. [module-0/01](./module-0/01-vue-role-in-modern-frontend.md) блок «Видео» | уже курировано в уроке |
| Article | [Vue vs React (обзорно)](https://www.builder.io/blog/vue-vs-react) | сравнение без священных войн |

---

## Module 1–2 · Основы Vue + Composition API

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) | ref/reactive |
| Docs | [Template Syntax](https://vuejs.org/guide/essentials/template-syntax.html) | директивы |
| Docs | [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) | зачем Composition |
| Video | [Vue 3 Docs · Composition API](https://vuejs.org/tutorial/#step-1) *(interactive)* | лучше любого длинного видео для старта |
| Article | [Vue 3 — A New Beginning? (Anthony Fu)](https://antfu.me/) *(поиск Vue на блоге)* | современный DX / ecosystem |

---

## Module 3–4 · Components, TypeScript

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [Components Basics](https://vuejs.org/guide/essentials/component-basics.html) | props/emits |
| Docs | [Slots](https://vuejs.org/guide/components/slots.html) | named/scoped |
| Docs | [Vue + TypeScript](https://vuejs.org/guide/typescript/overview.html) | typing SFC |
| Docs | [Script Setup](https://vuejs.org/api/sfc-script-setup.html) | `<script setup>` |
| Article | [Vue TypeScript Tips](https://vuejs.org/guide/typescript/composition-api.html) | props/emits types |

---

## Module 5 · Vue Router

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [Vue Router Guide](https://router.vuejs.org/guide/) | первоисточник |
| Docs | [Lazy Loading Routes](https://router.vuejs.org/guide/advanced/lazy-loading.html) | code split |
| Docs | [Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html) | auth flows |
| Video | см. блок **«Видео»** в [01-vue-router-4](./module-5/01-vue-router-4.md) | Eduardo talks + Ulbi |

---

## Module 6 · Pinia

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [Pinia Introduction](https://pinia.vuejs.org/introduction.html) | stores |
| Docs | [Composing Stores](https://pinia.vuejs.org/cookbook/composing-stores.html) | границы stores |
| Docs | [Testing stores](https://pinia.vuejs.org/cookbook/testing.html) | Module 11 prep |
| Article | [Pinia vs Vuex](https://pinia.vuejs.org/introduction.html#comparison-with-vuex-a-name-comparison-a) | зачем не Vuex 4 |
| Video | см. блок **«Видео»** в [04-pinia](./module-6/04-pinia.md) | Disasterclass + DejaVue |

---

## Module 7–8 · API + Server state

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [TanStack Query Vue](https://tanstack.com/query/latest/docs/framework/vue/overview) | vue-query |
| Docs | [Important Defaults](https://tanstack.com/query/latest/docs/framework/vue/guides/important-defaults) | staleTime mindset |
| Docs | [MDN · Fetch](https://developer.mozilla.org/docs/Web/API/Fetch_API) | основы HTTP client |
| Article | [React Query as a State Manager](https://tkdodo.eu/blog/react-query-as-a-state-manager) *(идеи переносятся на Vue)* | server vs client state |
| Article | [Practical React Query](https://tkdodo.eu/blog/practical-react-query) | паттерны кеша (фреймворк-агностично) |
| Video | см. блок **«Видео»** в [02-vue-query](./module-8/02-vue-query.md) | Tanner + TkDodo |

---

## Module 9 · Forms

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [VeeValidate](https://vee-validate.logaretm.com/v4/) | form library |
| Docs | [Zod](https://zod.dev/) | schemas |
| Docs | [Vue · Form input bindings](https://vuejs.org/guide/essentials/forms.html) | v-model basics |
| Article | [Schema-based validation mindset](https://zod.dev/?id=introduction) | single source of truth для форм |

---

## Module 10 · Reusable UI

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [Teleport](https://vuejs.org/guide/built-ins/teleport.html) | overlays |
| Docs | [Transition](https://vuejs.org/guide/built-ins/transition.html) | motion |
| Docs | [Custom Directives](https://vuejs.org/guide/reusability/custom-directives.html) | directives |
| Docs | [Suspense](https://vuejs.org/guide/built-ins/suspense.html) | async trees |
| Article | [Headless UI ideas](https://www.radix-vue.com/) *(Radix Vue)* | a11y patterns без визуала |

---

## Module 11 · Testing

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [Vitest](https://vitest.dev/guide/) | runner |
| Docs | [Vue Test Utils](https://test-utils.vuejs.org/) | component tests |
| Docs | [Pinia testing](https://pinia.vuejs.org/cookbook/testing.html) | stores |
| Docs | [Playwright](https://playwright.dev/docs/intro) | e2e stretch |
| Article | [Testing Library guiding principles](https://testing-library.com/docs/guiding-principles/) | behavior > implementation |
| Video | см. блок **«Видео»** в [01-vitest](./module-11/01-vitest.md) | Anthony Fu + testing philosophy |

---

## Module 12 · Performance

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [Vue · Performance](https://vuejs.org/guide/best-practices/performance.html) | v-once, v-memo, … |
| Docs | [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html) | track/trigger |
| Docs | [Web Vitals](https://web.dev/articles/vitals) | LCP/INP/CLS |
| Docs | [Vue Devtools](https://devtools.vuejs.org/) | highlight updates |
| Article | [web.dev · Optimize LCP](https://web.dev/articles/optimize-lcp) | load perf |

---

## Module 13 · Architecture

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [Vue Style Guide](https://vuejs.org/style-guide/) | naming / structure |
| Docs | [Feature-Sliced Design](https://feature-sliced.design/) | layers inspiration |
| Article | [Bulletproof React](https://github.com/alan2207/bulletproof-react) *(идеи слоёв, не копипаст)* | feature folders mindset |
| Article | [Anthony Fu · Destack Vue](https://antfu.me/posts/categorize-deps) | deps hygiene |

---

## Module 14 · Nuxt / SSR

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Docs | [Nuxt Docs](https://nuxt.com/docs/getting-started/introduction) | первоисточник |
| Docs | [Rendering Modes](https://nuxt.com/docs/guide/concepts/rendering) | CSR/SSR/SSG |
| Docs | [Data Fetching](https://nuxt.com/docs/getting-started/data-fetching) | useFetch / useAsyncData |
| Docs | [Nitro](https://nitro.build/) | server engine |
| Docs | [SEO and Meta](https://nuxt.com/docs/getting-started/seo-meta) | useSeoMeta |
| Video | см. блок **«Видео»** в [02-why-nuxt](./module-14/02-why-nuxt.md) | Daniel Roe talks |
| Article | [web.dev · Rendering on the Web](https://web.dev/articles/rendering-on-the-web) | CSR/SSR/SSG без фреймворка |

---

## Module 15 · Финальный проект

| Тип | Ссылка | Зачем |
|-----|--------|--------|
| Plan | [Module 15 practice checklist](./module-15/01-practice-checklist.md) | DoD финалки |
| Demos | [DEMOS.md](./DEMOS.md) | стартовые playgrounds |
| Deploy | [Nuxt Deployment](https://nuxt.com/docs/getting-started/deployment) / [Vite Static Deploy](https://vitejs.dev/guide/static-deploy.html) | выкладка |

---

## Правила курации

```text
✅ Официальные docs всегда выше случайных Medium-постов
✅ 1–2 внешних материала на затык, не плейлист на 40 часов
❌ Не заменяй практику просмотром видео
❌ Не копируй устаревшие Vue 2 / Nuxt 2 гайды вслепую
```

Нашёл отличный ресурс? Добавь в этот файл рядом с модулем + одну строку «зачем» — и ссылку из соответствующего урока в «Что почитать», если он must-have.
