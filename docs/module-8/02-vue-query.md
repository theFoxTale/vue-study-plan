# Module 8 · Теория: `@tanstack/vue-query`

Этот материал закрывает второй теоретический пункт `Module 8`: установить **TanStack Vue Query**, подключить **QueryClient**, и написать **первый `useQuery`** поверх api-слоя из Module 7.

Связанные материалы:

- [Module 8 · server vs client state](./01-server-state-vs-client-state.md)
- [Module 7 · data layer](../module-7/09-data-layer.md)
- [Module 7 · api/products pattern](../module-7/01-fetch.md)

---

## 1. Что такое `@tanstack/vue-query`

**TanStack Query** (Vue-адаптер — `@tanstack/vue-query`) — библиотека для **server state**:

- cache по **query keys**
- статусы loading/error автоматически
- refetch, retry, dedupe in-flight
- mutations + invalidation *(уроки дальше)*

```bash
npm install @tanstack/vue-query
```

Официально:

- [Installation · Vue Query](https://tanstack.com/query/latest/docs/framework/vue/installation)
- [Overview](https://tanstack.com/query/latest/docs/framework/vue/overview)

Не заменяет `src/api/*` — **оборачивает** вызовы api.

---

## 2. Подключение в app

```ts
// main.ts
import { createApp } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min — данные «свежие» без refetch
      retry: 1,
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, { queryClient })

app.mount('#app')
```

Порядок: Query plugin до mount; Pinia/Router — как в Module 5–6.

`QueryClient` — глобальный cache + scheduler запросов для всего app.

---

## 3. Первый `useQuery`

```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { fetchProducts } from '@/api/products'

const {
  data: products,
  isPending,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: ['products'],
  queryFn: () => fetchProducts(),
})
</script>

<template>
  <p v-if="isPending">Loading…</p>
  <p v-else-if="isError" role="alert">
    {{ error?.message }}
    <button type="button" @click="() => refetch()">Retry</button>
  </p>
  <p v-else-if="!products?.length">No products</p>
  <ProductList v-else :products="products" />
</template>
```

Сравни с Module 7 composable:

```text
Module 7: isLoading, error, load(), watch, abort — вручную
Module 8: useQuery — status + data из коробки
```

---

## 4. `queryKey` и `queryFn`

| | Назначение |
|---|------------|
| **queryKey** | identity cache entry (массив, serializable) |
| **queryFn** | async функция, возвращает data *(обычно вызов api)* |

```ts
useQuery({
  queryKey: ['products', { page: 2, category: 'phones' }],
  queryFn: () => fetchProductsPage({ page: 2, category: 'phones' }),
})
```

Правила keys:

- стабильный порядок
- включай **все параметры**, от которых зависит ответ
- один resource — общий prefix: `['products']`, `['product', id]`

Смена key → новый cache slot → новый fetch.

---

## 5. Статусы (Vue Query v5)

Часто используемые:

| Поле | Смысл |
|------|--------|
| `isPending` | нет data yet, первый fetch |
| `isFetching` | любой fetch в процессе *(в т.ч. background)* |
| `isError` | последний fetch failed |
| `isSuccess` | есть data, нет error |
| `data` | результат queryFn |
| `error` | ошибка |
| `refetch()` | ручной повтор |

```vue
<p v-if="isFetching && !isPending">Updating…</p>
```

Для Module 8 MVP часто хватает `isPending` + `isError` + empty check на `data`.

---

## 6. Связка с api layer Module 7

```text
api/products.ts     → fetchProducts, fetchProductById (parse внутри)
composable/page     → useQuery({ queryFn: () => fetchProducts() })
Pinia cart          → без изменений (client state)
```

```ts
// ✅ queryFn тонкий
queryFn: () => fetchProductById(id.value)

// ❌ parse + axios + UI toast в queryFn
```

`queryFn` throw'ит → Query помечает `isError`.
Используй `toAppError` в api или пробрасывай дальше.

---

## 7. Reactive query keys

Когда id/filters из route:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'

const route = useRoute()
const productId = computed(() => String(route.params.id))

const { data: product, isPending, isError } = useQuery({
  queryKey: computed(() => ['product', productId.value]),
  queryFn: () => fetchProductById(productId.value),
  enabled: computed(() => productId.value.length > 0),
})
</script>
```

`enabled: false` — не fetch, пока id пустой.

Abort при смене key — Query **сам** отменяет устаревшие in-flight *(через signal в queryFn — optional, см. docs)*.

---

## 8. `QueryClient` default options

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000, // formerly cacheTime
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})
```

Не копируй в каждый `useQuery` — настрой разумные defaults один раз.
Детали lifecycle — урок **cache lifecycle**.

---

## 9. Devtools *(optional)*

```bash
npm install @tanstack/vue-query-devtools
```

```vue
<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
  <VueQueryDevtools />
</template>
```

Полезно видеть cache keys, stale/fresh, refetch — рекомендуется на practice Module 8.

---

## 10. Pinia + Vue Query вместе

```text
CatalogPage     → useQuery(['products'])
ProductDetails  → useQuery(['product', id])
Header          → useCartStore()  // Pinia
```

Не мигрируй cart в Query.
Не держи products в Pinia «на всякий случай».

---

## 11. Частые ошибки

### `queryFn` без return / throw

Query не знает success vs failure.

### Один key `['data']` на всё

Invalidate/refetch ломает unrelated screens.

### Дублировать fetch в Pinia и Query

Один source — Query для server list.

### Игнорировать `enabled`

Fetch с пустым id → лишние 404.

### Забыть `VueQueryPlugin`

`useQuery` вне контекста — runtime error.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Зачем `QueryClient`?
2. Чем `queryKey` отличается от `queryFn`?
3. Что заменяет `useQuery` из Module 7 composable?
4. Где остаётся `fetchProducts`?
5. Что такое `isPending` vs `isFetching`?
6. Почему cart не в `useQuery`?

---

## 13. Что почитать

### Официальное

- [Installation](https://tanstack.com/query/latest/docs/framework/vue/installation)
- [Quick Start](https://tanstack.com/query/latest/docs/framework/vue/quick-start)
- [Query Options](https://tanstack.com/query/latest/docs/framework/vue/guides/query-options)

### Связанные материалы этого плана

- [Module 8 · server vs client state](./01-server-state-vs-client-state.md)
- [Module 7 · data layer](../module-7/09-data-layer.md)

---

## 14. Видео для этого блока

`@tanstack/vue-query` делит модель с React Query: видео часто на React, **идеи переносятся** (queryKey, cache, staleTime). API смотри в Vue docs.

### Рекомендуется

1. **Tanner Linsley — TanStack ecosystem (React Universe On Air #50)**  
   [YouTube](https://www.youtube.com/watch?v=2L4tlUIqLho)  
   Автор TanStack: откуда взялся server-state mindset и зачем query library ≠ global store. Слушай куски про Query / server state.

2. **Практический текст (must-read рядом с видео)**  
   [TkDodo · Practical React Query](https://tkdodo.eu/blog/practical-react-query)  
   Лучший «курс» по паттернам cache — применяй к `useQuery` во Vue один в один по смыслу.

### Дополнительно

3. **Eduardo — DejaVue · Pinia and Data Loaders**  
   [YouTube](https://www.youtube.com/watch?v=dUztjolNZig)  
   Как во Vue-экосистеме думают про loading data рядом с Pinia (границы Module 6 vs 8).

### Короткий маршрут

| Время | Что |
|------|-----|
| ~20 мин | TkDodo article (важнее длинного стрима) |
| ~30–40 мин | куски Tanner про Query / server state |
| практика | один `useQuery` на catalog list |

---

## 15. Практическое мини-задание

1. Установи `@tanstack/vue-query`, подключи plugin
2. Перепиши **один** экран (catalog list) с `useQuery`
3. `queryKey: ['products']`, `queryFn: fetchProducts`
4. Сохрани 4 UI ветки: pending / error / empty / list
5. Открой Devtools — найди cache entry

---

## 16. Мини-конспект

- `@tanstack/vue-query` = server state cache + status API
- `QueryClient` + `VueQueryPlugin` в main.ts
- `useQuery({ queryKey, queryFn })` — замена ручного load composable
- api layer из Module 7 остаётся; Pinia — client state
- дальше — **queries** (углубление keys, options, dependent queries)

---

## 17. Что делать дальше

Следующий теоретический блок Module 8:

- [queries](./03-queries.md)
