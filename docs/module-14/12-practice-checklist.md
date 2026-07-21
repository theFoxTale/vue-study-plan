# Module 14 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 14**: собрать **небольшой проект на Nuxt 3** (контент / blog / docs / mini-storefront), понять **pages vs layouts vs server routes**, сделать **SEO или prerender-friendly** страницу и письменно объяснить, **почему выбран Nuxt**.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Modules 5–13

- [ ] SPA catalog на Vue + Vite уже пройден *(остаётся отдельным проектом)*
- [ ] понимаешь CSR vs SSR vs SSG ([01](01-csr-ssr-ssg-hybrid.md))
- [ ] decision: Nuxt для **этого** practice, Vite catalog не обязан мигрировать ([11](11-nuxt-vs-vue-vite.md))

### Прочитай теорию Module 14

- [01 · CSR/SSR/SSG/hybrid](01-csr-ssr-ssg-hybrid.md)
- [02 · зачем Nuxt](02-why-nuxt.md)
- [03 · file routing](03-file-routing.md)
- [04 · layouts](04-layouts.md)
- [05 · pages](05-pages.md)
- [06 · useFetch](06-use-fetch.md)
- [07 · useAsyncData](07-use-async-data.md)
- [08 · server routes](08-server-routes.md)
- [09 · SEO](09-seo-basics.md)
- [10 · deployment](10-deployment.md)
- [11 · Nuxt vs Vite](11-nuxt-vs-vue-vite.md)

---

## Шаг 1. Выбрать тип проекта

| Вариант | Когда |
|---------|--------|
| **Mini storefront** | products list + detail + mock `/api` |
| **Blog / content** | posts list + `[slug]` + markdown или JSON |
| **Docs-like** | несколько content pages + nav |
| **Hybrid landing** | SSG home + 1–2 dynamic pages |

### Рекомендация

**Mini storefront** или **blog** — лучше всего закрывают README criteria (pages, layouts, server/api или content, SEO).

### Checklist

- [ ] тип проекта выбран
- [ ] scope в 1 экран «MVP» записан (не весь Amazon)

---

## Шаг 2. Зафиксировать MVP Module 14

### MVP (критерии README)

- проект на **Nuxt 3** создан и запускается (`npm run dev`)
- используются **`pages/`** и минимум **один layout**
- есть **server route** *или* явный prerender/content pipeline (для blog — `server/api` mock posts **или** Nuxt Content)
- **SEO или prerender-friendly** страница (meta + HTML в View Source)
- в README есть блок **«Why Nuxt»**
- `npm run build` (+ желательно `preview`) проходит

### Минимальный storefront MVP

| URL | Что |
|-----|-----|
| `/` | landing + links |
| `/products` | list via `useFetch('/api/products')` |
| `/products/[id]` | detail + `useSeoMeta` + 404 |
| layout `default` | header/footer |
| layout `blank` | optional login stub |
| `GET /api/products` | Nitro mock |
| `GET /api/products/:id` | Nitro mock |

### Минимальный blog MVP

| URL | Что |
|-----|-----|
| `/` | posts list |
| `/blog/[slug]` | post + SEO |
| `default` layout | nav |
| data | `server/api/posts` **или** content files |
| prerender | home + posts (optional) |

### Не обязательно в MVP

- полный ecommerce (checkout, payments)
- auth production-ready
- vue-query + useFetch одновременно
- деплой на все облака (хватит `preview` или один host)
- миграция Modules 5–13 catalog в Nuxt

### Checklist

- [ ] MVP scope записан
- [ ] «Why Nuxt» черновик из 3–5 предложений

---

## Шаг 3. Создать проект

```bash
npx nuxi@latest init vue-module-14-nuxt
cd vue-module-14-nuxt
npm install
npm run dev
```

- [ ] TypeScript включён
- [ ] `app.vue` с `<NuxtLayout><NuxtPage /></NuxtLayout>`
- [ ] git init / branch для practice

---

## Шаг 4. Layouts

- [ ] `layouts/default.vue` — header + `<slot />` + footer
- [ ] `NuxtLink` на главные разделы
- [ ] optional: `layouts/blank.vue` для простой secondary page
- [ ] одна page с `definePageMeta({ layout: 'blank' })` **или** документированный отказ

### Checklist

- [ ] можешь объяснить: layout vs page vs nested `NuxtPage`

---

## Шаг 5. Pages (file routing)

### Storefront

- [ ] `pages/index.vue`
- [ ] `pages/products/index.vue`
- [ ] `pages/products/[id].vue` с reactive `key` / `watch` на id
- [ ] optional: `pages/cart.vue` с `ssr: false` или `noindex`

### Blog

- [ ] `pages/index.vue` или `pages/blog/index.vue`
- [ ] `pages/blog/[slug].vue`
- [ ] 404 для unknown slug

### Checklist

- [ ] тонкие pages — UI в `components/`
- [ ] navigation через `NuxtLink` работает

---

## Шаг 6. Server routes *(storefront / mock API)*

- [ ] `server/api/products.get.ts` — список mock
- [ ] `server/api/products/[id].get.ts` — detail + `createError(404)`
- [ ] optional: zod/validate query
- [ ] `runtimeConfig` — хотя бы `public.siteUrl` для canonical later

Для **blog без api**: content files + `useAsyncData` loader — отметь как альтернативу server routes и всё равно опиши разницу pages/layouts/server в README *(server route можно сделать `server/routes/health.ts` или `server/api/posts.get.ts`)*.

### Checklist

- [ ] `curl` / browser `/api/...` отвечает
- [ ] page использует `useFetch` или `useAsyncData`, не `onMounted(fetch)` для публичных данных

---

## Шаг 7. Data fetching

- [ ] list: `await useFetch('/api/…')` или `useAsyncData` + loader
- [ ] detail: dynamic key для slug/id
- [ ] pending / error UI на page
- [ ] missing entity → `createError({ statusCode: 404 })`

### Checklist

- [ ] View Source (dev SSR) или `preview` — данные/title видны в HTML на публичной page

---

## Шаг 8. SEO / prerender-friendly

- [ ] `titleTemplate` в `nuxt.config` `app.head`
- [ ] `useSeoMeta` на detail/post (title, description)
- [ ] optional: `ogImage` + absolute URL через `siteUrl`
- [ ] `noindex` на cart/login/account stub *(если есть)*
- [ ] `htmlAttrs.lang`
- [ ] optional: `routeRules` prerender `/` и list; **или** nitro prerender routes

### Checklist

- [ ] базовый SEO **или** prerender-friendly сценарий выполнен (README criteria)

---

## Шаг 9. Why Nuxt (обязательно)

В корневом `README.md` проекта:

```markdown
## Why Nuxt

This project needs …
We use Nuxt because …
Vue + Vite SPA would be worse here because …
Rendering: … (SSR / prerender / hybrid)
```

### Checklist

- [ ] абзац честный (не «потому что в модуле сказали»)
- [ ] связан с реальными URL проекта

---

## Шаг 10. Build & preview

```bash
npm run build
npm run preview
```

- [ ] build green
- [ ] preview: list + detail кликабельны
- [ ] View Source на detail в preview — meta/content ok
- [ ] optional: deploy one platform ([10](10-deployment.md))

### Checklist

- [ ] production-grade path «build → preview» пройден

---

## Шаг 11. Самопроверка «pages / layouts / server»

Своими словами (в README или заметке):

1. Что делает файл в `pages/`?
2. Зачем `layouts/default.vue` и `<slot />`?
3. Чем `server/api/products.get.ts` отличается от page?
4. Почему публичный product не с `ssr: false`?

### Checklist

- [ ] 4 ответа записаны — критерий README «понятна разница»

---

## Шаг 12. Финальная самопроверка Module 14

1. CSR vs SSR vs SSG — что использует твой MVP?
2. Где hydration мог бы сломаться в твоём коде?
3. `useFetch` vs `$fetch` — где что у тебя?
4. Почему catalog Modules 5–13 остаётся на Vite?
5. Что бы добавил в stretch (sitemap, auth, deploy)?

### Checklist

- [ ] ответы своими словами

---

## Финальный checklist Module 14

Module 14 можно считать завершённым, если:

### README criteria

- [ ] маленький **Nuxt 3** проект собран и запущен
- [ ] понятна разница **pages / layouts / server routes**
- [ ] есть **SEO или prerender-friendly** страница
- [ ] можно объяснить, **почему выбран Nuxt**

### Quality bar

- [ ] нет god-page на 500 строк
- [ ] публичные данные через Nuxt data fetching (не только `onMounted`)
- [ ] 404 для missing content
- [ ] `build` (+ `preview`) ok

---

## Stretch goals *(optional)*

- deploy (Vercel/Netlify/Railway)
- `sitemap.xml` + `robots.txt`
- `routeRules` hybrid (prerender `/`, SSR product, CSR cart)
- Nuxt Content для blog
- Pinia cart на storefront
- JSON-LD Product
- `middleware/auth` stub для `/account`

---

## Если что-то пошло не так

### Hydration mismatch

- нет `window`/`localStorage` в SSR path; random/Date в template

### `/api` 404

- имя файла method suffix (`.get.ts`); restart dev server

### Detail показывает старый product

- `key` / `watch` на param ([06](06-use-fetch.md))

### View Source пустой

- page с `ssr: false`; или смотришь только CSR navigate — проверь full load / preview

### Build падает на env

- задай `NUXT_PUBLIC_SITE_URL` или default в `runtimeConfig`

### Слишком большой scope

- урежь до 3 pages + 2 api routes; stretch потом

---

## Что делать после Module 14

Переходи к **Module 15 · Финальный проект**:

- Vue 3 + TS + Router + Pinia + API + forms + tests + a11y + README + deploy
- выбери вариант (ecommerce, dashboard, …)
- стек: Vite SPA **или** Nuxt — по требованиям SEO/HTML (урок 11)

Module 14 дал вторую опору: **когда** выносить витрину на Nuxt.

- [Module 15 в README](../../README.md#module-15-финальный-проект)

---

## Мини-конспект

- Module 14 practice = **маленький Nuxt app**, не миграция всего плана
- pages + layouts + server (или content) + SEO/prerender
- **Why Nuxt** письменно
- build → preview
- дальше — **Module 15 final project**
