# Module 12 · Теория: lazy components

Этот материал закрывает восьмой теоретический пункт Module 12: **lazy components** — `defineAsyncComponent`, loading/error states, связь с **code splitting** и **Suspense**, и когда отложенная загрузка компонента оправдана в catalog app.

Связанные материалы:

- [Module 12 · code splitting](./07-code-splitting.md)
- [Module 10 · Suspense](../module-10/02-suspense.md)
- [Module 5 · lazy loading routes](../module-5/11-lazy-loading-routes.md)

---

## 1. Route lazy vs component lazy

```text
Route lazy       → () => import('@/pages/CatalogPage.vue')     // Router
Component lazy   → defineAsyncComponent(() => import('…'))   // Vue render
```

Оба используют **`import()`** и создают **async chunk** ([урок 07](./07-code-splitting.md)).

| | Route lazy | Component lazy |
|---|------------|----------------|
| Когда грузится | navigation | mount / v-if true |
| Кто ждёт | Router + `<RouterView>` | Vue async machinery |
| UX | page-level loading | tab/modal/section loading |
| Пример | `/admin` | Reviews tab, CSV import modal |

**Route lazy** — baseline. **Component lazy** — тяжёлый кусок **внутри** уже загруженной page.

Официально:

- [Async Components · Vue Guide](https://vuejs.org/guide/components/async.html)
- [defineAsyncComponent API](https://vuejs.org/api/general.html#defineasynccomponent)

---

## 2. `defineAsyncComponent` — базовый синтаксис

```ts
import { defineAsyncComponent } from 'vue'

const ProductReviewsPanel = defineAsyncComponent(() =>
  import('@/features/reviews/ProductReviewsPanel.vue'),
)
```

```vue
<template>
  <ProductReviewsPanel v-if="tab === 'reviews'" :product-id="productId" />
</template>
```

```text
Первый render ProductReviewsPanel
  → fetch chunk
  → resolve component
  → mount
```

Chunk **не** грузится, пока компонент **не нужен** в дереве *(v-if false — often no fetch until true)*.

---

## 3. Loader function и options

```ts
const AdminImportWizard = defineAsyncComponent({
  loader: () => import('@/features/admin/ImportWizard.vue'),
  loadingComponent: ImportWizardSkeleton,
  errorComponent: ImportWizardError,
  delay: 200,       // ms before show loading (avoid flash)
  timeout: 30_000,  // ms → errorComponent
  suspensible: true, // delegate to Suspense if ancestor exists
})
```

| Option | Назначение |
|--------|------------|
| `loader` | `() => import(...)` — обязателен |
| `loadingComponent` | UI пока chunk грузится |
| `errorComponent` | fail load / timeout |
| `delay` | не мигать skeleton на fast network |
| `timeout` | не висеть вечно |
| `onError(retry, fail, attempts)` | custom retry logic |
| `suspensible` | передать управление `<Suspense>` |

---

## 4. Loading UX: без «белого провала»

```vue
<template>
  <Suspense>
    <ProductReviewsPanel :product-id="id" />
    <template #fallback>
      <ReviewsSkeleton />
    </template>
  </Suspense>
</template>
```

```vue
<script setup lang="ts">
const ProductReviewsPanel = defineAsyncComponent({
  loader: () => import('@/features/reviews/ProductReviewsPanel.vue'),
  suspensible: true,
})
</script>
```

**Suspense** *(Module 10)* — fallback для async setup / async component.

**loadingComponent** — fallback **внутри** async component boundary без Suspense ancestor.

```text
Pet-project rule:
  chunk > 200ms perceived → skeleton или spinner
  fast 3G test обязателен
```

---

## 5. `onError` и retry

```ts
const HeavyChart = defineAsyncComponent({
  loader: () => import('@/features/analytics/SalesChart.vue'),
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) retry()
    else fail()
    console.error('Chart chunk failed', error)
  },
})
```

Network flake на mobile — retry перед error UI.

---

## 6. Catalog: когда lazy component

### ✅ Хорошие кандидаты

| Component | Почему |
|-----------|--------|
| `ProductReviewsPanel` | markdown + moderation, не все открывают tab |
| `ImportWizard` | admin-only, heavy form |
| `SalesChart` | chart.js bundle |
| `RichTextEditor` | checkout gift message optional |
| `MapPickupSelector` | map SDK |

### ❌ Плохие кандидаты

| Component | Почему |
|-----------|--------|
| `ProductCard` | 200× в list — 200 potential loads if misused |
| `TextField`, `AppButton` | everywhere, tiny |
| Above-the-fold hero | hurts LCP |
| Critical checkout fields | delay blocks conversion |

**Не lazy'ить** то, что видно **сразу** на first paint page.

---

## 7. Паттерн: tab / accordion

```vue
<script setup lang="ts">
const tab = ref<'details' | 'reviews' | 'specs'>('details')

const ReviewsPanel = defineAsyncComponent(() =>
  import('@/features/reviews/ProductReviewsPanel.vue'),
)
</script>

<template>
  <Tabs v-model="tab" />
  <ProductSpecs v-if="tab === 'specs'" />
  <ReviewsPanel v-if="tab === 'reviews'" :product-id="id" />
</template>
```

```text
Chunk reviews грузится один раз при первом открытии tab
Vue кеширует module — повторное открытие без fetch
```

---

## 8. Паттерн: modal / disclosure

```vue
<script setup lang="ts">
const open = ref(false)

const CsvImportModal = defineAsyncComponent(() =>
  import('@/features/admin/CsvImportModal.vue'),
)

async function openImport() {
  open.value = true
  // chunk starts when CsvImportModal mounts (v-if open)
}
</script>

<template>
  <button type="button" @click="openImport">Import CSV</button>
  <CsvImportModal v-if="open" @close="open = false" />
</template>
```

Module 10 `useModal` + lazy component — natural combo.

---

## 9. Dynamic `:is` + async

```vue
<script setup lang="ts">
const panels = {
  details: defineAsyncComponent(() => import('./DetailsPanel.vue')),
  reviews: defineAsyncComponent(() => import('./ReviewsPanel.vue')),
} as const

const active = ref<keyof typeof panels>('details')
</script>

<template>
  <component :is="panels[active]" />
</template>
```

Каждый panel — свой chunk; активный только один.

---

## 10. Lazy component ≠ не грузить в main

`defineAsyncComponent` **только** в файле, который уже в graph:

```ts
// ✅ ProductDetailPage.vue (lazy route) imports async ReviewsPanel
// ❌ main.ts imports ReviewsPanel eager wrapper everywhere
```

Проверяй **`npm run build`**: chunk появился отдельно?

---

## 11. Async `<script setup>` vs lazy component

```vue
<!-- Async setup in normal (eager) component -->
<script setup lang="ts">
const data = await fetchProduct(id) // Suspense needed
</script>
```

```text
Lazy component     = отложить загрузку .vue файла / JS chunk
Async setup        = component уже loaded, ждём promise в setup
```

Можно совместить: lazy route page + `await useQuery` в setup + Suspense.

---

## 12. RouterView и lazy pages

```ts
component: () => import('@/pages/ProductDetailsPage.vue')
```

Router **уже** async component под капотом — **не** оборачивай route в второй `defineAsyncComponent` без need.

Внутри `ProductDetailsPage` — lazy **sections** (reviews, chart).

---

## 13. Prefetch on intent

```vue
<RouterLink
  :to="{ name: 'product', params: { id } }"
  @mouseenter="prefetchReviews"
>
  View
</RouterLink>
```

```ts
function prefetchReviews() {
  import('@/features/reviews/ProductReviewsPanel.vue')
}
```

Hover / focus **до** click — chunk ready к открытию tab.

---

## 14. Частые ошибки

### Lazy `ProductCard` в grid

200 cards ≠ 200 loads *(one chunk)*, но mount pattern wrong if each creates new loader — use **one** shared async def.

### No loading state

User clicks tab — 2s blank.

### `v-show` вместо `v-if` для heavy lazy

`v-show` mounts (loads) even hidden — use **`v-if`** for on-demand.

### Eager re-export

```ts
export { default as Reviews } from './ProductReviewsPanel.vue' // in barrel
import { Reviews } from '@/features' // eager
```

### Double lazy

Route lazy + redundant wrapper — ok but redundant; keep one split point clear.

### Error boundary forgotten

Ad blockers / CDN fail — need `errorComponent`.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Route lazy vs `defineAsyncComponent`?
2. `v-if` vs `v-show` для lazy tab?
3. Зачем `delay` и `loadingComponent`?
4. Когда Suspense vs built-in loading?
5. Пример lazy section в product detail?
6. Почему не lazy `ProductCard` в grid?

---

## 16. Что почитать

### Официальное

- [Async Components](https://vuejs.org/guide/components/async.html)
- [defineAsyncComponent](https://vuejs.org/api/general.html#defineasynccomponent)
- [Suspense](https://vuejs.org/guide/built-ins/suspense.html)

### Связанные материалы этого плана

- [Module 12 · code splitting](./07-code-splitting.md)
- [Module 10 · Suspense](../module-10/02-suspense.md)
- [Module 5 · lazy routes](../module-5/11-lazy-loading-routes.md)

---

## 17. Практическое мини-задание

1. Выбери one heavy section (reviews/admin/chart) → `defineAsyncComponent`.
2. `npm run build` — новый chunk?
3. Throttle network — добавь skeleton (`loadingComponent` or Suspense).
4. Tab with `v-if` — chunk грузится только при первом open?
5. Simulate load fail — покажи error UI.

---

## 18. Мини-конспект

- **lazy component** = Vue + **`import()`** chunk on demand
- routes lazy — pages; **defineAsyncComponent** — sections/modals/tabs
- **v-if** + loading/error UX обязательны
- Suspense / `loadingComponent` / `delay` / `timeout`
- не lazy critical above-the-fold UI
- дальше — **оптимизация загрузки страниц**

---

## 19. Что делать дальше

Следующий теоретический блок Module 12:

- [Оптимизация загрузки страниц](./09-page-load-optimization.md)
