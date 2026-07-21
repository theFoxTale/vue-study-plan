# Module 14 · Теория: зачем нужен Nuxt 3

Этот материал закрывает второй теоретический пункт Module 14: **зачем Nuxt 3** — что он добавляет поверх Vue + Vite, из каких частей состоит, какие проблемы SSR/SSG решает «из коробки», и чем не является.

Связанные материалы:

- [Module 14 · CSR/SSR/SSG/hybrid](./01-csr-ssr-ssg-hybrid.md)
- [Module 13 · структура папок](../module-13/01-folder-structure.md)

---

## 1. Vue + Vite уже умеет многое

Твой стек Modules 5–13:

```text
Vue 3 + Vite + Vue Router + Pinia + vue-query
+ архитектура pages/features/entities/shared
```

Этого **достаточно** для SPA catalog, admin, внутренних tools.

Nuxt появляется, когда нужны **conventions + server rendering + deploy story**, а не «ещё один UI framework».

Официально:

- [Nuxt · Introduction](https://nuxt.com/docs/getting-started/introduction)
- [Nuxt · What is Nuxt?](https://nuxt.com/docs/getting-started/introduction#what-is-nuxt)

---

## 2. Nuxt 3 одной фразой

```text
Nuxt 3 = Vue 3 meta-framework:
  file-based routing + layouts
  SSR / SSG / hybrid (Nitro)
  data fetching helpers (useFetch / useAsyncData)
  auto-imports, modules ecosystem
  production server / static generate
```

Ты по-прежнему пишешь **Vue SFC + Composition API + TypeScript**. Nuxt добавляет **каркас приложения и runtime**.

---

## 3. Что больно собирать вручную без Nuxt

| Задача | Vue + Vite вручную | Nuxt |
|--------|-------------------|------|
| SSR entry + client entry | сам клеишь | из коробки |
| Serialize data → client | сам | `useAsyncData` / payload |
| `<head>` title/meta | `@unhead` / vue-meta вручную | `useHead` / `useSeoMeta` |
| File → route | пишешь `routes[]` | `pages/` |
| API routes рядом с app | отдельный Express | `server/` + Nitro |
| Hybrid per route | свой middleware | `routeRules` |
| Deploy Node/static/edge | много конфигов | Nitro presets |

Можно повторить на Vue SSR Guide — **недели** glue. Nuxt сжимает это в days/hours для типичного сайта.

---

## 4. Из чего состоит Nuxt 3

```text
┌─────────────────────────────────────┐
│  Your app: pages, components, …     │
├─────────────────────────────────────┤
│  Nuxt (routing, app context, DX)    │
├─────────────────────────────────────┤
│  Vue 3 + Vite                       │
├─────────────────────────────────────┤
│  Nitro (server engine)              │
└─────────────────────────────────────┘
```

| Часть | Роль |
|-------|------|
| **Vue 3** | UI, reactivity |
| **Vite** | dev server, build (client) |
| **Nuxt** | conventions, rendering modes, modules |
| **Nitro** | server routes, deploy targets, prerender |

Понимание слоёв помогает не искать «магию» в неправильном месте.

---

## 5. DX-фичи, ради которых берут Nuxt

### File-based routing

```text
pages/index.vue          → /
pages/products/[id].vue  → /products/:id
```

Подробнее — [урок 03](./03-file-routing.md).

### Layouts

Общий chrome (header/footer) без копипасты в каждый page — [урок 04](./04-layouts.md).

### Auto-imports

```vue
<script setup lang="ts">
// useFetch, useRouter, components из components/ — часто без import
const { data } = await useFetch('/api/products')
</script>
```

Удобно; для Module 13 «явные границы» — помни, откуда символ (docs / `.nuxt` types).

### Modules

`@nuxtjs/tailwindcss`, i18n, image, pinia module — подключение одной строкой в `nuxt.config`.

### Devtools

Nuxt DevTools: routes, modules, payload — рядом с Vue Devtools.

---

## 6. Rendering — главная «зачем»

Из [урока 01](./01-csr-ssr-ssg-hybrid.md): hybrid storefront.

Nuxt даёт переключатели без смены стека:

```ts
// nuxt.config.ts (идея)
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/products/**': { swr: 60 },
    '/account/**': { ssr: false },
  },
})
```

```text
Один репозиторий → landing SSG + product SSR + account CSR
```

Это сильнее аргумент, чем «auto-import кнопок».

---

## 7. Server как часть продукта

```text
server/api/products.get.ts  → GET /api/products
```

BFF (backend-for-frontend), webhooks, скрытие API keys, HTML email preview — **рядом** с UI, один deploy.

Не замена полноценному backend всегда, но для storefront/blog часто хватает.

Подробнее — [урок 08 · server routes](./08-server-routes.md).

---

## 8. Чем Nuxt **не** является

| Не является | Почему важно |
|-------------|--------------|
| Заменой знания Vue | SFC, props, Pinia, perf — всё нужно |
| Обязательным для любого Vue | SPA catalog на Vite ок |
| CMS | контент всё ещё из API/MD/files |
| Гарантией SEO | нужны meta, контент в HTML, не только `ssr: true` |
| «Бесплатным» SSR | hydration, server cost, caching — твои решения |

```text
Nuxt ускоряет правильный rendering + structure.
Плохую архитектуру Module 13 он не вылечит сам.
```

---

## 9. Nuxt 3 vs Nuxt 2 (кратко)

| | Nuxt 2 | Nuxt 3 |
|---|--------|--------|
| Vue | 2 | **3** |
| Bundler | webpack | **Vite** |
| Server | Connect-ish | **Nitro** |
| Engine | — | ESM-first |
| Composition | options-heavy | **first-class** |

Новые проекты → **Nuxt 3**. Nuxt 2 — legacy.

---

## 10. Типичные проекты «да, Nuxt»

```text
✅ Marketing site + blog
✅ Docs / content site
✅ Storefront с SEO product pages
✅ Сайт с публичным контентом + личный кабинет (hybrid)
✅ Нужны API routes рядом с UI
```

## Типичные проекты «Vue + Vite достаточно»

```text
✅ Admin / internal dashboard
✅ SPA за auth wall
✅ Учебный Product Catalog Modules 5–13
✅ Виджеты, встраиваемые apps
✅ Команда уже на SPA и SEO не цель
```

Детальный decision guide — [урок 11](./11-nuxt-vs-vue-vite.md).

---

## 11. Как Nuxt стыкуется с Module 13

| Module 13 | Nuxt аналог |
|-----------|-------------|
| `pages/` | `pages/` (file routing) |
| `features/` | `features/` или modules (сама структура) |
| `shared/ui` | `components/` (+ layers) |
| `shared/api` | `server/api` + `$fetch` / `useFetch` |
| `app/` | `app.vue`, `nuxt.config.ts` |
| env | `runtimeConfig` (build + runtime) |

Границы **pages → features → entities → shared** переносятся; Nuxt не запрещает feature-based папки.

---

## 12. Минимальный mental model старта

```bash
npx nuxi@latest init my-nuxt-app
cd my-nuxt-app
npm run dev
```

```text
app.vue          # root shell
pages/index.vue  # home route
nuxt.config.ts   # modules, routeRules, runtimeConfig
```

Практика Module 14 — собрать маленький проект; теория сейчас — **зачем** эти файлы существуют.

---

## 13. Частые ошибки

### Переписать рабочий SPA на Nuxt «потому что модно»

Без SEO/SSR нужды — стоимость миграции > выгода.

### Ждать, что Nuxt заменит Pinia/vue-query знание

State и server cache всё равно проектируешь ты.

### Смешать Nuxt 2 доки с Nuxt 3

API другое (`asyncData` options vs `useAsyncData`).

### Сложить всю бизнес-логику в `pages/`

Conventions ≠ god pages; Module 13 rules остаются.

### Игнорировать Nitro

«Только frontend» в Nuxt — недоиспользовать server routes / deploy presets.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Nuxt vs Vue — что добавляет meta-framework?
2. Какие 3 задачи больнее всего без Nuxt при SSR?
3. Роль Nitro?
4. Пример hybrid через `routeRules`?
5. Когда Nuxt **не** нужен?
6. Как переносится архитектура Module 13?

---

## 15. Что почитать

### Официальное

- [Nuxt · Introduction](https://nuxt.com/docs/getting-started/introduction)
- [Nuxt · Directory Structure](https://nuxt.com/docs/guide/directory-structure)
- [Nitro](https://nitro.build/)

### Связанные материалы этого плана

- [Module 14 · rendering modes](./01-csr-ssr-ssg-hybrid.md)
- [Module 5 · Vue Router](../module-5/01-vue-router-4.md)
- [Module 13 · layers](../module-13/03-shared-ui-entities-features-pages.md)

---

## 16. Практическое мини-задание

1. Список болей текущего SPA для SEO/share — есть ли они?
2. Открой Nuxt docs → Directory Structure — сопоставь с Module 13 папками.
3. Одна фраза: «Nuxt нужен этому проекту потому что…» или «не нужен потому что…».
4. Optional: `nuxi init` sandbox — открой `/` и View Source (dev SSR HTML).
5. Запиши 2 modules, которые понадобятся storefront (image, pinia, …).

---

## 17. Мини-конспект

- Nuxt 3 = Vue + Vite + **routing/render/server conventions**
- ценность: SSR/SSG/hybrid, file routes, Nitro, data helpers
- не замена Vue-навыков и не обязателен для каждого SPA
- архитектура Module 13 **совместима** с Nuxt
- дальше — **файловый роутинг**

---

## 18. Что делать дальше

Следующий теоретический блок Module 14:

- [Файловый роутинг](./03-file-routing.md)
