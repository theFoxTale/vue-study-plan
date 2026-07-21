# Module 12 · Теория: оптимизация загрузки страниц

Этот материал закрывает девятый теоретический пункт Module 12: **оптимизация загрузки страниц** — метрики (LCP, INP, CLS), critical path, assets, API waterfall и практический checklist для catalog SPA на Vite.

Связанные материалы:

- [Module 12 · code splitting](./07-code-splitting.md)
- [Module 12 · lazy components](./08-lazy-components.md)
- [Module 8 · vue-query](../module-8/02-vue-query.md)

---

## 1. Два вида «медленно»

```text
Runtime perf (Module 12 уроки 01–06)  → уже на странице, rerender, lists
Load perf (этот урок)                 → до interactive catalog
```

Пользователь видит белый экран / skeleton / layout shift — это **load**, не `v-memo`.

**Цель:** быстрее **полезный контент** (catalog grid, product hero), меньше **блокирующего** JS/CSS, предсказуемый **data fetch**.

Официально / reference:

- [Web Vitals](https://web.dev/vitals/)
- [Vite · Performance](https://vitejs.dev/guide/performance.html)
- [Vue · Performance · General](https://vuejs.org/guide/best-practices/performance.html)

---

## 2. Core Web Vitals (практически для Vue SPA)

| Метрика | Что измеряет | Catalog пример |
|---------|--------------|----------------|
| **LCP** | Largest Contentful Paint — главный контент | hero image / first product row |
| **INP** | Interaction to Next Paint *(раньше FID)* | click «Add to cart» → feedback |
| **CLS** | Cumulative Layout Shift | skeleton → grid прыгает |

```text
Не гонись за 100 Lighthouse в dev.
Гонись за: catalog usable быстро на Slow 4G + real API
```

Chrome DevTools → **Lighthouse** / **Performance** / **Network** throttling.

---

## 3. Critical rendering path

```text
HTML → parse
CSS  → blocking render (by default)
JS   → parse + compile + execute → Vue mount → fetch data → paint content
```

```html
<!-- index.html -->
<div id="app"></div>
<script type="module" src="/src/main.ts"></script>
```

```text
1. Download index + main chunk
2. Execute Vue bootstrap (router, pinia, query client)
3. Route match → lazy chunk page?
4. Component mount → useQuery → API
5. Products render
```

**Waterfall** — когда шаги **строго последовательны**. Оптимизация = **parallelize** safe steps + **defer** non-critical.

---

## 4. JS budget и code splitting

Baseline из [уроков 07–08](./07-code-splitting.md):

- lazy **routes**
- lazy **heavy sections**
- не тянуть chart/editor в main

```bash
npm run build
```

Targets для pet-project *(ориентир, не dogma)*:

```text
Main entry gzip     < ~150–250 KB  (зависит от stack)
First route chunk   отдельно
Total first visit   main + page + css
```

**Tree-shaking:** named imports

```ts
// ❌
import _ from 'lodash'

// ✅
import debounce from 'lodash-es/debounce'
```

---

## 5. CSS и fonts

### CSS

Vite inject CSS из SFC — обычно один bundle или split by route.

```text
- избегай @import chains в runtime CSS
- critical above-the-fold — не прячь за lazy modal
- unused global CSS — audit periodically
```

### Fonts

```css
@font-face {
  font-family: 'Catalog';
  src: url('/fonts/catalog.woff2') format('woff2');
  font-display: swap; /* текст виден fallback → swap */
}
```

```html
<link rel="preload" href="/fonts/catalog.woff2" as="font" type="font/woff2" crossorigin>
```

**CLS:** резервируй высоту строк (`line-height`, min-height header), не прыгай когда font load.

---

## 6. Изображения — частый LCP в catalog

```vue
<template>
  <img
    :src="product.imageUrl"
    :alt="product.title"
    width="320"
    height="320"
    loading="lazy"
    decoding="async"
  >
</template>
```

| Практика | Зачем |
|----------|--------|
| `width` / `height` | резерв места → меньше CLS |
| `loading="lazy"` | below-the-fold не конкурирует с LCP |
| `fetchpriority="high"` | **только** hero/LCP image |
| WebP/AVIF srcset | меньше bytes |
| CDN + resize params | `?w=640` не отдавать 4K thumbnail |

**Above-the-fold** product grid first row — **не** lazy; остальные — lazy.

```vue
<!-- LCP candidate — first card -->
<img
  :src="product.imageUrl"
  fetchpriority="high"
  width="320"
  height="320"
  :alt="product.title"
>
```

Placeholder: blur hash / dominant color box — perceived speed.

---

## 7. API и vue-query: perceived load

```ts
const { data: products, isPending } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => fetchProducts(filters),
  staleTime: 60_000,
  placeholderData: (prev) => prev,
})
```

```text
staleTime        → не refetch каждый mount (меньше spinner)
placeholderData  → старый список пока новый fetch (меньше flash)
prefetchQuery    → hover category → data ready
parallel queries → detail: product + reviews keys параллельно
```

### Waterfall anti-pattern

```text
❌ mount → fetch categories → then fetch products
✅ Promise.all или independent useQuery on same page
```

### SSR note *(optional)*

Nuxt/SSR даёт HTML с data — LCP лучше для SEO-heavy catalog. Этот план — CSR SPA; знай trade-off.

---

## 8. Skeleton vs spinner vs empty

```vue
<template>
  <ProductGridSkeleton v-if="isPending && !products" />
  <ProductGrid v-else-if="products?.length" :products="products" />
  <EmptyState v-else />
</template>
```

```text
Skeleton matching layout → ниже CLS чем generic spinner
Не блокируй header/footer на query — только content area
```

Module 10 UI + Module 8 query states — combine for load UX.

---

## 9. Preload / prefetch / preconnect

```html
<!-- index.html -->
<link rel="preconnect" href="https://api.catalog.example" crossorigin>
```

```ts
// prefetch next likely route chunk
import('@/pages/CatalogPage.vue')
```

| Hint | Когда |
|------|--------|
| `preconnect` | API domain, CDN |
| `dns-prefetch` | lighter than preconnect |
| `modulepreload` | Vite inject для entry |
| dynamic `import()` on intent | hover RouterLink |

Не prefetch **всё** — bandwidth waste.

---

## 10. Defer non-critical work

```ts
onMounted(() => {
  // analytics, non-critical third-party
  requestIdleCallback?.(() => initAnalytics()) ?? setTimeout(initAnalytics, 0)
})
```

```text
Не в main.ts:
  - full locale packs all languages
  - admin widgets
  - debug plugins
```

Vue plugins в `main.ts` — только **critical path** (router, pinia, i18n core).

---

## 11. Caching и deploy

```text
Vite build → hashed filenames (index-a1b2.js)
  → long cache immutable для assets
index.html → short cache / no-cache
```

API responses: `Cache-Control`, ETag — server side; vue-query `staleTime` — client side.

**Service Worker / PWA** — optional stretch (Module 14+ territory); не обязателен для MVP.

---

## 12. Catalog: load checklist

### First visit `/catalog`

- [ ] main + route chunk measured (build)
- [ ] LCP image prioritized, sized
- [ ] grid skeleton same dimensions
- [ ] products query not blocked by categories waterfall
- [ ] fonts `font-display: swap`
- [ ] preconnect API

### Product detail `/product/:id`

- [ ] route lazy chunk
- [ ] product query + optional reviews **parallel**
- [ ] reviews tab **component lazy** ([урок 08](./08-lazy-components.md))
- [ ] hero image LCP

### Repeat visit

- [ ] vue-query cache / staleTime — instant list
- [ ] browser cache hashed assets

---

## 13. Измерение workflow

```text
1. Lighthouse (mobile, throttled) — baseline scores + LCP element
2. Network Slow 4G — waterfall screenshot
3. npm run build — chunk sizes
4. Vue DevTools perf (runtime) — после load ([урок 10](./10-vue-devtools.md))
5. Fix one bottleneck → repeat
```

**One change at a time** — иначе не знаешь, что помогло.

---

## 14. Частые ошибки

### Оптимизировать runtime до load audit

`v-memo` при 2MB main bundle.

### Lazy LCP image

Hero с `loading="lazy"` — LCP хуже.

### Giant JSON в initial state

Prefetch 10MB catalog в localStorage on boot.

### Blocking font without fallback metrics

Invisible text (FOIT) или layout jump.

### Spinner на весь viewport 3s

No skeleton; bad CLS when content appears.

### Every page refetch on mount

`staleTime: 0` everywhere — ощущение «always loading».

---

## 15. Что важно понять после этого блока

Проверь себя:

1. LCP vs INP vs CLS — по one catalog example?
2. Critical path steps от `index.html` до product grid?
3. Зачем `width/height` на `<img>`?
4. Как vue-query улучшает **perceived** load?
5. `preconnect` vs dynamic `import()` prefetch?
6. Что defer до `onMounted` / idle?

---

## 16. Что почитать

### Официальное

- [Web Vitals](https://web.dev/vitals/)
- [Optimize LCP](https://web.dev/articles/optimize-lcp)
- [Vite · Building for Production](https://vitejs.dev/guide/build.html)

### Связанные материалы этого плана

- [Module 12 · code splitting](./07-code-splitting.md)
- [Module 8 · queries](../module-8/03-queries.md)
- [Module 10 · Suspense](../module-10/02-suspense.md)

---

## 17. Практическое мини-задание

1. Lighthouse mobile — запиши LCP element и time.
2. One waterfall fix: parallel queries или preconnect API.
3. First row images: `fetchpriority` + dimensions; rest `lazy`.
4. Product list: skeleton вместо full-page spinner.
5. `staleTime` 60s — repeat navigation feels instant?

---

## 18. Мини-конспект

- **Load perf** = до interactive + LCP/CLS/INP
- split JS, optimize **images** и **fonts**
- vue-query: **staleTime**, **placeholder**, parallel fetch
- skeletons, preconnect, defer non-critical
- measure Lighthouse + Network + build sizes
- дальше — **Vue Devtools** profiling

---

## 19. Что делать дальше

Следующий теоретический блок Module 12:

- [Vue Devtools · performance](./10-vue-devtools.md)
