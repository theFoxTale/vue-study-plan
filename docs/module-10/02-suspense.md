# Module 10 · Теория: Suspense

Этот материал закрывает второй теоретический пункт `Module 10`: **`Suspense`** — async components, **`async setup`**, slots `#default` / `#fallback`, loading boundaries и связь с Router / vue-query.

Связанные материалы:

- [Module 10 · Teleport](./01-teleport.md)
- [Module 5 · lazy loading routes](../module-5/11-lazy-loading-routes.md)
- [Module 8 · vue-query](../module-8/02-vue-query.md)

---

## 1. Зачем Suspense

```text
CatalogPage mount → lazy chunk load → blank screen?
ProductDetails   → async setup fetch → flash empty?
```

**Suspense** — встроенный boundary: пока async dependency **не resolved**, показывается **fallback** UI.

```vue
<Suspense>
  <AsyncPanel />
  <template #fallback>
    <p>Loading…</p>
  </template>
</Suspense>
```

```text
default slot   → async child (component / async setup)
fallback slot  → placeholder пока ждём
```

Официально:

- [Suspense · Vue Guide](https://vuejs.org/guide/built-ins/suspense.html)

---

## 2. Когда Suspense срабатывает

Suspense «ждёт», если child:

1. **`defineAsyncComponent`** — lazy component ещё не загружен
2. **`async setup()`** в `<script setup>` — Promise не resolved
3. Nested async components в default tree

```text
Suspense НЕ ждёт:
  useQuery isPending     → это data layer (Module 8)
  fetch в onMounted      → без async setup
  setTimeout в mounted   → не suspends
```

| Loading | Инструмент |
|---------|------------|
| JS chunk / async component | **Suspense** |
| API data | **vue-query** `isPending` |
| User action | local `ref` loading |

Не смешивай без причины — два spinner на одном экране.

---

## 3. Базовый пример: lazy component

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent(
  () => import('@/components/HeavyChart.vue'),
)
</script>

<template>
  <Suspense>
    <HeavyChart :data="chartData" />
    <template #fallback>
      <div class="skeleton skeleton-chart" />
    </template>
  </Suspense>
</template>
```

Пока chunk `HeavyChart.vue` грузится — skeleton.

Module 5 lazy **routes** — тот же механизм на уровне page component.

---

## 4. `async setup`

```vue
<!-- ProductRecommendations.vue -->
<script setup lang="ts">
const props = defineProps<{ productId: string }>()

const recommendations = await fetchRecommendations(props.productId)
</script>

<template>
  <ul>
    <li v-for="item in recommendations" :key="item.id">{{ item.title }}</li>
  </ul>
</template>
```

Parent **обязан** обернуть в Suspense:

```vue
<Suspense>
  <ProductRecommendations :product-id="id" />
  <template #fallback>
    <RecommendationsSkeleton />
  </template>
</Suspense>
```

`await` top-level в `<script setup>` = async setup → suspends.

### Когда использовать

| | async setup | vue-query |
|---|-------------|-----------|
| Pet catalog | редко | **default** |
| Nested widget без query client | ok | — |
| SSR data prefetch | advanced | — |

Module 8 уже учит server state через query — **не** переписывай catalog list на async setup.

---

## 5. `#default` и `#fallback`

```vue
<Suspense>
  <template #default>
    <DashboardWidgets />
  </template>
  <template #fallback>
    <DashboardSkeleton />
  </template>
</Suspense>
```

Если default — один root component, shorthand:

```vue
<Suspense>
  <DashboardWidgets />
  <template #fallback>…</template>
</Suspense>
```

Fallback — любая разметка: spinner, skeleton, «Loading recommendations…».

---

## 6. Router + Suspense

Lazy route из Module 5:

```ts
{
  path: '/catalog',
  component: () => import('@/pages/CatalogPage.vue'),
}
```

App shell:

```vue
<template>
  <AppHeader />
  <Suspense>
    <RouterView />
    <template #fallback>
      <PageLoader />
    </template>
  </Suspense>
</template>
```

```text
Navigate → old page unmount → new chunk loading → fallback → new page
```

Header/footer **вне** Suspense — не мигают при смене route.

---

## 7. Suspense + vue-query на одной page

```vue
<!-- CatalogPage.vue — recommended split -->
<template>
  <Suspense>
    <CatalogFiltersPanel />  <!-- lazy async component -->
    <template #fallback>
      <FiltersSkeleton />
    </template>
  </Suspense>

  <!-- data loading — query, NOT Suspense -->
  <div v-if="isPending">Loading products…</div>
  <ProductGrid v-else-if="data" :products="data.items" />
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
const { data, isPending } = useQuery({ … })
</script>
```

```text
Suspense  → code / async setup widget
useQuery  → server data
```

---

## 8. Nested Suspense

```vue
<Suspense>
  <ProductDetailsPage />
  <template #fallback>
    <PageSkeleton />
  </template>
</Suspense>
```

Inside page:

```vue
<Suspense>
  <ProductReviews :product-id="id" />  <!-- async setup -->
  <template #fallback>
    <ReviewsSkeleton />
  </template>
</Suspense>
```

Outer fallback — page chunk; inner — reviews block. Granular UX.

---

## 9. `#default` несколько roots

Vue 3 Suspense ожидает **один** async root в default *(или fragment с async)*.

Несколько sibling async — оберни:

```vue
<Suspense>
  <div class="dashboard">
    <AsyncWidgetA />
    <AsyncWidgetB />
  </div>
  <template #fallback>…</template>
</Suspense>
```

Или отдельный Suspense per widget — independent fallbacks.

---

## 10. Events: `@pending` / `@resolve` / `@fallback`

```vue
<Suspense
  @pending="onPending"
  @resolve="onResolve"
  @fallback="onFallback"
>
  …
</Suspense>
```

| Event | Когда |
|-------|--------|
| `pending` | async dependency pending |
| `resolve` | default content ready |
| `fallback` | fallback shown |

Analytics / debug — optional.

---

## 11. Error handling — limits

Suspense **не** error boundary как React.

Async reject в setup → **unhandled** без обработки:

```vue
<script setup lang="ts">
try {
  const data = await fetchSomething()
} catch (e) {
  // handle — show error UI in template
  error.value = e
}
</script>
```

Или **`onErrorCaptured`** в parent, **`errorComponent`** в `defineAsyncComponent`:

```ts
defineAsyncComponent({
  loader: () => import('./Panel.vue'),
  errorComponent: PanelLoadError,
  delay: 200,
  timeout: 10_000,
})
```

Server errors catalog — **vue-query** `isError`, не Suspense.

---

## 12. `defineAsyncComponent` options

```ts
defineAsyncComponent({
  loader: () => import('@/components/AdminPanel.vue'),
  loadingComponent: PanelSpinner,
  delay: 150,           // ms before loadingComponent
  timeout: 30_000,
  suspensible: true,    // participate in Suspense (default)
})
```

| Option | Зачем |
|--------|--------|
| `loadingComponent` | mini-spinner без outer Suspense |
| `delay` | avoid flash on fast network |
| `timeout` | fail after N ms |
| `suspensible: false` | handle loading only locally |

---

## 13. Suspense status в Vue 3

Suspense **documented** и используется в production, но API помечен как evolving.

Pet-project: **RouterView + Suspense** и **lazy widgets** — safe.

Не строй всё app на async setup — query + explicit loading проще поддерживать.

---

## 14. Catalog app — практические сценарии

| Сценарий | Suspense? |
|----------|-----------|
| Lazy `/catalog` page | ✓ RouterView wrapper |
| Products list API | ✗ `useQuery` |
| Lazy `ProductGallery` carousel chunk | ✓ |
| Admin import heavy editor | ✓ |
| Login form | ✗ sync |
| Modal Teleport | ✗ *(урок 01)* |

---

## 15. Частые ошибки

### async setup child без Suspense parent

Warning + неожиданный blank.

### Suspense для useQuery pending

Double loading; query уже has `isPending`.

### fetch в onMounted вместо async setup

Suspense never triggers — fallback useless.

### Entire app in one Suspense including header

Header мигает on navigation.

### Unhandled reject in async setup

White screen — try/catch or errorComponent.

### Ожидать Suspense при client-only navigation + cached chunk

Fallback только первый load — ok.

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Что показывает `#fallback`?
2. async setup vs onMounted fetch?
3. Suspense vs vue-query — граница?
4. Зачем Suspense вокруг `RouterView`?
5. Как обработать ошибку lazy load?
6. Nested Suspense — зачем?

---

## 17. Что почитать

### Официальное

- [Suspense](https://vuejs.org/guide/built-ins/suspense.html)
- [Async Components](https://vuejs.org/guide/components/async.html)

### Связанные материалы этого плана

- [Module 5 · lazy loading](../module-5/11-lazy-loading-routes.md)
- [Module 8 · async UI](../module-7/04-async-ui-states.md)

---

## 18. Практическое мини-задание

1. `Suspense` + `RouterView` + `PageLoader` fallback
2. Lazy widget on detail page with skeleton
3. Catalog list loading — **only** vue-query, not Suspense
4. `defineAsyncComponent` with `delay: 200` — observe behavior
5. Document in comment: why Suspense here vs query

---

## 19. Мини-конспект

- Suspense = loading boundary for async **components/setup**
- `#fallback` until default resolves
- Router lazy routes + Suspense = page-level loader
- server data → vue-query; code split → Suspense
- errors: try/catch, errorComponent, not Suspense alone
- дальше — **transitions**

---

## 20. Что делать дальше

Следующий теоретический блок Module 10:

- [transitions](./03-transitions.md)
