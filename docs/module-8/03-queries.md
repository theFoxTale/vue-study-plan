# Module 8 · Теория: queries

Этот материал закрывает третий теоретический пункт `Module 8`: углубиться в **`useQuery`** — **query keys**, **фильтры/pagination**, **`enabled`**, **`select`**, **dependent queries**.

Связанные материалы:

- [Module 8 · vue-query setup](./02-vue-query.md)
- [Module 7 · query params](../module-7/06-query-params.md)
- [Module 7 · пагинация](../module-7/05-pagination.md)

---

## 1. Query = cache entry + fetch lifecycle

Каждый `useQuery` — подписка на **cache entry**, идентифицируемую **queryKey**.

```ts
useQuery({
  queryKey: ['products', { page: 1, category: 'phones' }],
  queryFn: () => fetchProductsPage({ page: 1, category: 'phones' }),
})
```

```text
queryKey  →  «какой кусок server state»
queryFn   →  «как его загрузить, если нет / stale»
```

Официально:

- [Query Keys](https://tanstack.com/query/latest/docs/framework/vue/guides/query-keys)
- [Queries](https://tanstack.com/query/latest/docs/framework/vue/guides/queries)

---

## 2. Query keys — правила

1. **Массив**, serializable (JSON-like)
2. **Уникален** для данных: все params, влияющие на ответ, в key
3. **Иерархия** сверху вниз: `['products']` → `['products', { page: 2 }]`

```ts
// list
['products']
['products', { page: 2, limit: 20 }]
['products', { category: 'phones', page: 1 }]

// detail
['product', productId]

// search
['products', 'search', { q: 'phone', page: 1 }]
```

### Factory pattern (рекомендуется)

```ts
// src/queries/productKeys.ts
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: CatalogFilters) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  search: (q: string, page: number) =>
    [...productKeys.all, 'search', { q, page }] as const,
}
```

```ts
useQuery({
  queryKey: productKeys.list(filters.value),
  queryFn: () => fetchProductsPage(toApiParams(filters.value)),
})
```

Invalidate позже: `queryKey: productKeys.lists()` — все lists *(урок invalidation)*.

---

## 3. Catalog + route query (Module 7 → 8)

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { parseCatalogQuery, toApiParams } from '@/api/catalogQuery'
import { fetchProductsPage } from '@/api/products'
import { productKeys } from '@/queries/productKeys'

const route = useRoute()
const filters = computed(() => parseCatalogQuery(route.query))

const {
  data,
  isPending,
  isError,
  error,
  isFetching,
  refetch,
} = useQuery({
  queryKey: computed(() => productKeys.list(filters.value)),
  queryFn: () => fetchProductsPage(toApiParams(filters.value)),
})
</script>
```

Смена `?page=` / `?category=` → **новый key** → новый fetch (или cache hit, если уже был).

`computed` для `queryKey` в Vue Query — reactive binding.

---

## 4. Detail query

```ts
const productId = computed(() => String(route.params.id))

const { data: product, isPending, isError } = useQuery({
  queryKey: computed(() => productKeys.detail(productId.value)),
  queryFn: () => fetchProductById(productId.value),
  enabled: computed(() => productId.value.length > 0),
})
```

`enabled: false` — query «paused», пока id невалиден.

---

## 5. Dependent queries

Второй query ждёт data первого:

```ts
const { data: product } = useQuery({
  queryKey: computed(() => productKeys.detail(productId.value)),
  queryFn: () => fetchProductById(productId.value),
})

const categoryId = computed(() => product.value?.categoryId ?? '')

const { data: category } = useQuery({
  queryKey: computed(() => ['category', categoryId.value]),
  queryFn: () => fetchCategoryById(categoryId.value),
  enabled: computed(() => Boolean(categoryId.value)),
})
```

Без `enabled` второй fetch уйдёт с пустым id.

---

## 6. Полезные options

### `staleTime`

```ts
staleTime: 60_000 // 1 min — не refetch при remount, пока fresh
```

List catalog: 30–60s часто ok.
Detail product: можно меньше или больше — по UX.

### `gcTime` *(ранее cacheTime)*

Сколько держать **неиспользуемый** cache после unmount всех observers.
Default ~5 min — обычно не трогают на старте.

### `refetchOnWindowFocus`

Default `true` — при возврате на вкладку refetch stale queries.
Для demo можно `false` в QueryClient defaults.

### `retry`

```ts
retry: 1,
retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
```

Пересечение с [Module 7 retries](../module-7/08-retries.md) — теперь на уровне Query.

---

## 7. `select` — производное без лишних rerender

```ts
const { data: productTitles } = useQuery({
  queryKey: productKeys.list(filters.value),
  queryFn: () => fetchProductsPage(params),
  select: (data) => data.items.map((p) => p.title),
})
```

`select` мемоизирует transform — component получает только titles.
Аналог getter, но внутри query subscription.

---

## 8. `placeholderData` и `initialData`

### `placeholderData`

Показать **временные** data пока идёт fetch *(skeleton list shape, предыдущая page)*:

```ts
placeholderData: (previousData) => previousData,
```

При pagination: UI не мигает empty при смене page — **keepPreviousData pattern** *(v5 через placeholderData)*.

### `initialData`

Seed cache начальными data *(редко на client SPA)* — чаще SSR.
Module 8 practice: знай опцию, не обязательно использовать.

---

## 9. `useQueries` — несколько параллельных

```ts
import { useQueries } from '@tanstack/vue-query'

const ids = ['1', '2', '3']

const results = useQueries({
  queries: ids.map((id) => ({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProductById(id),
  })),
})
```

Для compare/wishlist preview — niche; list+detail хватает отдельных `useQuery`.

---

## 10. UI mapping (Module 7 states → Query)

| Module 7 | Vue Query |
|----------|-----------|
| `isLoading` (first) | `isPending` |
| background reload | `isFetching && !isPending` |
| `error` | `isError`, `error` |
| empty `[]` | `isSuccess && !data?.items.length` |
| Retry button | `refetch()` |

```vue
<p v-if="isPending">Loading…</p>
<p v-else-if="isError" role="alert">{{ error?.message }}</p>
<p v-else-if="isFetching">Updating…</p>
<p v-else-if="!data?.items.length">No products</p>
<ProductList v-else :products="data.items" />
```

---

## 11. Composable wrapper *(optional)*

```ts
// composables/useCatalogProductsQuery.ts
export function useCatalogProductsQuery(filters: Ref<CatalogFilters>) {
  return useQuery({
    queryKey: computed(() => productKeys.list(filters.value)),
    queryFn: () => fetchProductsPage(toApiParams(filters.value)),
  })
}
```

Page остаётся тонкой; keys/fn — в одном месте.

---

## 12. Частые ошибки

### Key без filters

Page 2 перезаписывает cache page 1.

### `queryFn` замыкает stale filters

Используй актуальные values из closure или передавай через key sync.

### `enabled: true` с пустым id

Лишние 404.

### Дублировать list и search keys

Разные endpoints — разные key prefixes (`list` vs `search`).

### `select` с side effects

Только pure transform.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Что должно войти в queryKey?
2. Зачем `productKeys` factory?
3. Когда `enabled: false`?
4. Чем `isPending` от `isFetching`?
5. Зачем `select`?
6. Как route.query связан с queryKey?

---

## 14. Что почитать

### Официальное

- [Query Keys](https://tanstack.com/query/latest/docs/framework/vue/guides/query-keys)
- [Dependent Queries](https://tanstack.com/query/latest/docs/framework/vue/guides/dependent-queries)
- [Placeholder Query Data](https://tanstack.com/query/latest/docs/framework/vue/guides/placeholder-query-data)

### Связанные материалы этого плана

- [Module 8 · vue-query](./02-vue-query.md)
- [Module 7 · query params](../module-7/06-query-params.md)

---

## 15. Практическое мини-задание

1. Создай `productKeys.ts`
2. Catalog: `useQuery` с key из `route.query` filters
3. Details: `useQuery` + `enabled`
4. Добавь `placeholderData: (prev) => prev` на pagination *(optional)*
5. В Devtools — несколько keys, переключи page/category

---

## 16. Мини-конспект

- queryKey = identity; все params в key; factory для invalidate
- reactive `computed` key + `enabled` для detail/dependent
- `select`, `staleTime`, `placeholderData` — тонкая настройка UX
- list + detail + search = отдельные keys
- дальше — **mutations** (изменение server data)

---

## 17. Что делать дальше

Следующий теоретический блок Module 8:

- [mutations](./04-mutations.md)
