# Module 8 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 8**: переписать **server data** catalog app на **`@tanstack/vue-query`** — list + detail + mutation, **query keys**, **invalidation**, cache с **реальной пользой**.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 7 должен быть закрыт

- [ ] catalog + detail + search/filter работают через **api layer** (`src/api/*`)
- [ ] loading / error / empty / success уже были в Module 7
- [ ] **products list не в Pinia** — cart/favorites/session остаются в store
- [ ] parse + `toAppError` (или эквивалент) на месте
- [ ] Router: `/products/:id`, filters в `route.query` *(recommended)*

### Прочитай теорию Module 8

- [01 · server vs client state](01-server-state-vs-client-state.md)
- [02 · vue-query setup](02-vue-query.md)
- [03 · queries](03-queries.md)
- [04 · mutations](04-mutations.md)
- [05 · invalidation](05-invalidation.md)
- [06 · optimistic updates](06-optimistic-updates.md) *(optional в MVP)*
- [07 · retries](07-retries.md)
- [08 · cache lifecycle](08-cache-lifecycle.md)

---

## Шаг 1. Выбрать проект

| Вариант | Когда |
|---------|------|
| **Product Catalog из Module 5–7** | recommended |
| **Users list + detail** | если catalog исчерпан |
| **Blog posts API** | list + detail + edit title |

### Рекомендация

Не начинай новый app. Module 8 — **upgrade data flow** того же catalog: manual composable → vue-query.

### Checklist

- [ ] выбран один проект
- [ ] Module 7 flow понятен *(где был load/abort/retry)*
- [ ] `npm run dev` стартует

---

## Шаг 2. Зафиксировать MVP Module 8

### MVP (критерии README)

- `@tanstack/vue-query` + `QueryClient` + `VueQueryPlugin`
- **`productKeys` factory** (`src/queries/productKeys.ts` или аналог)
- **Catalog list** через `useQuery` *(не manual `ref` + `load()` для products)*
- **Detail by id** через `useQuery` + `enabled: !!id`
- **Filters/pagination/search** в **queryKey** *(из `route.query` или reactive filters)*
- минимум **одна mutation**: create **или** update **или** delete *(mock API ok)*
- **`invalidateQueries`** после mutation *(lists + detail где нужно)*
- **cache решает задачу**: list → detail → **back без full loading** *(staleTime)*
- cart/favorites — **по-прежнему Pinia**
- error UI: **`refetch()`** на list/detail
- Vue Query **Devtools** подключены *(dev)*

### Из README practice — покрытие

| Тема | MVP |
|------|-----|
| список + деталка на vue-query | обязательно |
| обновление данных (mutation) | обязательно |
| query keys + invalidation | обязательно |
| кеш с реальной пользой | обязательно |
| optimistic update | optional stretch |
| полный CRUD admin | stretch |

### Не обязательно в MVP

- переписывать cart на mutation
- optimistic на все actions
- React Query persist plugin
- убрать `src/api/*` — api **остаётся**
- TanStack Query на auth session

### Checklist

- [ ] MVP записан
- [ ] понятно, **какой UX-win даёт cache** (опиши 1 предложением)

---

## Шаг 3. Установить vue-query

```bash
npm install @tanstack/vue-query
npm install -D @tanstack/vue-query-devtools
```

```ts
// main.ts
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})

app.use(VueQueryPlugin, { queryClient })
```

Devtools *(optional, dev only)*:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
  <RouterView />
  <VueQueryDevtools />
</template>
```

### Checklist

- [ ] пакеты установлены
- [ ] `QueryClient` создан с осмысленными defaults
- [ ] plugin до `mount()`
- [ ] Devtools видны в dev

---

## Шаг 4. Query keys factory

```ts
// src/queries/productKeys.ts
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: CatalogFilters) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}
```

Filters должны включать всё, что влияет на ответ API: `page`, `limit`, `q`, `category`, …

### Checklist

- [ ] factory создан
- [ ] list key включает filters из URL/composable
- [ ] detail key включает `id`
- [ ] нет «магических» строк `['products']` разбросанных по pages

---

## Шаг 5. Catalog → `useQuery`

Замени manual flow Module 7:

```ts
// было: composable с load(), isLoading, error, abort
// стало:
const route = useRoute()
const filters = computed(() => parseCatalogFilters(route.query))

const {
  data,
  isPending,
  isError,
  error,
  isFetching,
  refetch,
} = useQuery({
  queryKey: computed(() => productKeys.list(filters.value)),
  queryFn: ({ signal }) =>
    fetchProductsPage(toApiParams(filters.value), { signal }),
})
```

UI states:

```vue
<div v-if="isPending">Loading…</div>
<div v-else-if="isError" role="alert">
  <p>{{ error?.message }}</p>
  <button @click="() => refetch()">Try again</button>
</div>
<div v-else-if="!data?.items.length">Empty</div>
<div v-else>…cards…</div>
<p v-if="isFetching && !isPending" class="muted">Updating…</p>
```

### Checklist

- [ ] catalog page на `useQuery`
- [ ] `queryFn` вызывает **существующий** api, не fetch в template
- [ ] `signal` передан в api *(если axios/fetch поддерживает)*
- [ ] empty отделён от error
- [ ] старый manual `load()` для list **удалён** или не используется

---

## Шаг 6. Detail → `useQuery` + `enabled`

```ts
const route = useRoute()
const productId = computed(() => String(route.params.id ?? ''))

const { data: product, isPending, isError, error, refetch } = useQuery({
  queryKey: computed(() => productKeys.detail(productId.value)),
  queryFn: ({ signal }) => fetchProductById(productId.value, { signal }),
  enabled: computed(() => productId.value.length > 0),
  retry: false, // 404 не долбить
})
```

### Checklist

- [ ] detail на `useQuery`
- [ ] смена `:id` меняет key → новый fetch
- [ ] invalid id → error UI + refetch button
- [ ] нет stale product от прошлого id *(проверь быстрый клик по cards)*

---

## Шаг 7. Убрать дубли server state

| Данные | Где после Module 8 |
|--------|---------------------|
| products list/detail | vue-query cache |
| cart / favorites | Pinia |
| modal open / draft input | local `ref` |
| filters source of truth | URL `route.query` *(recommended)* |

### Checklist

- [ ] нет `products` в Pinia store
- [ ] нет второго parallel fetch того же list в header и page
- [ ] composable Module 7 либо удалён, либо thin wrapper над query *(осознанно)*

---

## Шаг 8. Mutation + invalidation

Выбери **один** сценарий минимум:

| Сценарий | mutationFn | invalidate |
|----------|------------|------------|
| Create product | `createProduct` | `productKeys.lists()` |
| Update title/price | `updateProduct` | `detail(id)` + `lists()` |
| Delete row | `deleteProduct` | `removeQueries(detail)` + `lists()` |

```ts
// composables/useProductMutations.ts — recommended
export function useDeleteProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
```

Mock: MSW, json-server, или local delay + in-memory array — ok для учебного проекта.

### Checklist

- [ ] mutation composable или inline в admin UI
- [ ] `isPending` блокирует double submit
- [ ] error message на failed mutation
- [ ] list обновляется после success *(invalidate/refetch)*
- [ ] detail sync после update *(если есть update flow)*

---

## Шаг 9. Cache — докажи пользу

Настрой и **продемонстрируй**:

```ts
staleTime: 60_000, // global или per list query
```

Сценарий QA:

1. Open catalog → wait load  
2. Open product detail  
3. Browser Back  
4. **List появляется сразу** *(cached)*, без skeleton  

Опиши в заметке/README проекта:

> Cache нужен для … *(back navigation / меньше GET / instant pagination)*

### Checklist

- [ ] `staleTime` настроен осмысленно
- [ ] back navigation проверен
- [ ] в Devtools видно fresh/stale
- [ ] можешь объяснить, почему не «просто fetch + Pinia»

---

## Шаг 10. Pagination / search UX *(recommended)*

```ts
useQuery({
  queryKey: computed(() => productKeys.list(filters.value)),
  queryFn: …,
  placeholderData: (previousData) => previousData,
})
```

При смене page — старый list как placeholder, меньше мигания.

### Checklist

- [ ] filters в queryKey синхронны с URL
- [ ] быстрая смена page/filter не показывает чужие данные
- [ ] `placeholderData` или accept brief loading *(осознанный выбор)*

---

## Шаг 11. Retries и refetch

- global `retry: 1` для queries
- detail `retry: false` или policy без 404
- User Retry = `refetch()`, не новый manual load

### Checklist

- [ ] нет `fetchWithRetry` **внутри** queryFn *(double retry)*
- [ ] error state + refetch button работает

---

## Шаг 12. Структура проекта (ориентир)

```text
src/
  api/
    products.ts          # HTTP + parse (Module 7)
  queries/
    productKeys.ts
  composables/
    useProductMutations.ts   # optional
  pages/
    CatalogPage.vue      # useQuery list
    ProductDetailsPage.vue
  stores/
    cart.ts              # Pinia — client only
  main.ts                # QueryClient
```

### Checklist

- [ ] api отделён от vue-query hooks
- [ ] keys factory в одном месте
- [ ] pages не содержат raw axios

---

## Шаг 13. Ручной QA

1. Catalog first load — success  
2. Detail valid id — success  
3. Detail invalid id — error, no infinite retry  
4. Network fail — error → refetch works  
5. Empty search — empty UI, not error  
6. Create/update/delete — list reflects change  
7. Catalog → detail → back — instant list *(within staleTime)*  
8. Cart add — badge works, **без** сброса query cache  
9. Devtools — keys, observers, invalidate visible  
10. Fast filter change — correct data, no stale wrong page  

### Checklist

- [ ] все пункты пройдены

---

## Шаг 14. Финальная самопроверка

1. Чем server state в query cache отличается от cart в Pinia?
2. Зачем query key factory?
3. Что делает `invalidateQueries` vs `removeQueries`?
4. Почему mutation default `retry: 0`?
5. Fresh vs stale — что видит user?
6. Где бы ты **не** использовал vue-query в этом app?

### Checklist

- [ ] ответы своими словами

---

## Финальный checklist Module 8

Module 8 можно считать завершённым, если:

### Проект

- [ ] catalog на `useQuery`
- [ ] detail на `useQuery` + `enabled`
- [ ] mutation + invalidation работают
- [ ] app собирается и работает

### Критерии README

- [ ] хотя бы один экран **переписан** с Module 7 manual flow
- [ ] query keys + invalidation + mutation flow
- [ ] **кеш решает реальную проблему** *(не formal staleTime: 0 везде)*
- [ ] можешь объяснить «зачем vue-query, а не fetch + store»

### Архитектура

- [ ] `src/api/*` сохранён
- [ ] Pinia не хранит products list
- [ ] mutation invalidate в одном месте *(composable)*

---

## Stretch goals *(optional)*

- optimistic toggle favorite или delete row ([урок 06](06-optimistic-updates.md))
- admin page: full CRUD
- `setQueryData` для detail после PATCH без extra GET
- prefetch detail on card hover
- custom `retry` policy (no 4xx)
- второй resource (`users`) с отдельным `userKeys` factory
- integration test: productKeys + parse *(без mount component)*

---

## Если что-то пошло не так

### List refetch на каждый back navigation

- подними `staleTime`
- проверь, не `staleTime: 0` override

### Detail показывает прошлый product

- key должен включать `id`
- `enabled` при пустом id

### После mutation list не обновляется

- `invalidateQueries` key prefix — `lists()` vs `list(oneFilter)`
- mutation `onSuccess` вызывается?
- mock API реально меняет data?

### Double fetch на mount

- Strict Mode double mount в dev — норма
- два `useQuery` с разными keys на одной page — bug

### `fetchWithRetry` + Query retry

- убери retry из api layer для queryFn

### Всё снова в Pinia «потому что проще»

- products → query; cart → Pinia

### isPending мигает при pagination

- `placeholderData: (prev) => prev`
- или показывай `isFetching` subtle indicator

### CORS / api errors

- см. [Module 7 checklist](../module-7/10-practice-checklist.md) — vue-query не чинит CORS

---

## Что делать после Module 8

Переходи к **Module 9 · Формы и валидация**:

- [сложный v-model](../module-9/01-complex-v-model.md)
- кастомные поля, VeeValidate + Zod
- login / register / profile forms

Catalog уже на vue-query — Module 9 добавит **формы** поверх mutation flow *(create/edit product, auth)*.

---

## Мини-конспект

- Module 8 = server state toolkit: cache, keys, mutations, invalidation
- api layer остаётся; vue-query orchestrates reads/writes
- Pinia = client state; Query = server copy
- cache win = back nav / меньше GET / stable pagination UX
- Module 9 = формы и validation на том же app
