# Module 14 · Теория: `useFetch`

Этот материал закрывает шестой теоретический пункт Module 14: **`useFetch`** — SSR-friendly data fetching в Nuxt, URL/`$fetch`, ключи, статус, ошибки, refresh, отличие от голого `fetch` в `onMounted` и от vue-query.

Связанные материалы:

- [Module 14 · pages](./05-pages.md)
- [Module 8 · queries](../module-8/03-queries.md)
- [Module 13 · API layer](../module-13/05-api-layer.md)

---

## 1. Зачем `useFetch`, а не `onMounted(fetch)`

```ts
// ❌ типичный SPA-паттерн — на SSR HTML без данных
onMounted(async () => {
  products.value = await $fetch('/api/products')
})
```

```ts
// ✅ Nuxt
const { data: products, status, error } = await useFetch('/api/products')
```

```text
useFetch:
  1. на сервере выполняет запрос → данные в HTML/payload
  2. на клиенте при гидрации — reuse payload (без лишнего refetch по умолчанию)
  3. при client navigation — fetch по правилам key/watch
```

Официально:

- [useFetch](https://nuxt.com/docs/api/composables/use-fetch)
- [Data Fetching](https://nuxt.com/docs/getting-started/data-fetching)

---

## 2. Базовый синтаксис

```ts
const { data, status, error, refresh, clear } = await useFetch<Product[]>(
  '/api/products',
)
```

| Поле | Смысл |
|------|--------|
| `data` | `Ref` с результатом (или `null`) |
| `status` | `'idle' \| 'pending' \| 'success' \| 'error'` |
| `error` | ошибка запроса |
| `refresh` | повторить запрос |
| `clear` | сбросить состояние |

```vue
<template>
  <div v-if="status === 'pending'">…</div>
  <ul v-else-if="data">
    <li v-for="p in data" :key="p.id">{{ p.title }}</li>
  </ul>
</template>
```

В Nuxt 3.4+ часто `status` вместо устаревающего `pending` boolean — смотри актуальную доки своей версии; оба паттерна встречаются.

---

## 3. `$fetch` внутри

`useFetch(url)` ≈ обёртка над **`$fetch`** (ofetch) + Nuxt async data plumbing.

```ts
// прямой вызов — без SSR payload integration «как у useFetch»
const product = await $fetch(`/api/products/${id}`)
```

| | `useFetch` | `$fetch` |
|---|------------|----------|
| SSR payload / hydration reuse | ✅ | ❌ сам по себе |
| В event handler / button | обычно `refresh` или `$fetch` | ✅ |
| В `<script setup>` page | ✅ await useFetch | можно, но без ключа/кеша Nuxt |

```text
Правило:
  страница/комposable setup → useFetch / useAsyncData
  click «Buy» mutation     → $fetch / useRequestFetch
```

---

## 4. Reactive URL и `key`

```ts
const id = computed(() => route.params.id as string)

const { data: product } = await useFetch(
  () => `/api/products/${id.value}`,
  {
    key: () => `product-${id.value}`,
    watch: [id],
  },
)
```

```text
Без key/watch: переход /products/1 → /products/2 может показать старые data
```

`key` — идентификатор слота данных в Nuxt payload. **Уникален** на ресурс.

```ts
// список с фильтрами
const query = computed(() => ({ category: category.value }))

await useFetch('/api/products', {
  query,
  key: () => `products-${category.value}`,
})
```

Опция `query` добавит query string к URL.

---

## 5. Options, которые стоит знать

```ts
await useFetch('/api/products', {
  method: 'GET',
  query: { page: 1 },
  headers: { /* … */ },
  immediate: true,       // запускать сразу
  server: true,          // выполнять на SSR (default true)
  lazy: false,           // true → не блокировать навигацию await
  default: () => [],     // начальное data
  transform: (products) => products.map(/* … */),
  pick: ['id', 'title'], // урезать payload
  watch: false,          // не рефетчить на deps
})
```

### `lazy: true` / `useLazyFetch`

```ts
const { data, status } = await useLazyFetch('/api/products')
```

Page рисуется сразу; данные догоняют. UX: skeleton. Не блокирует переход.

### `server: false`

Только на клиенте — как CSR fetch (для private browser-only APIs).

---

## 6. Ошибки и 404

```ts
const { data, error } = await useFetch(`/api/products/${id}`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage ?? 'Failed to load',
  })
}
```

Или проверка домена:

```ts
if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not found' })
}
```

Показ в UI без throw — тоже ок для soft errors; для missing product SEO page — лучше **404**.

---

## 7. `refresh` и инвалидация

```ts
const { data, refresh } = await useFetch('/api/products')

async function onCreated() {
  await $fetch('/api/products', { method: 'POST', body })
  await refresh()
}
```

```ts
// обновить по ключу из другого места
await refreshNuxtData('products-list')
```

Связь с Module 8 invalidation — та же идея, другой API.

---

## 8. Typed response

```ts
type Product = { id: string; title: string; price: number }

const { data } = await useFetch<Product[]>('/api/products')
// data: Ref<Product[] | null>
```

Для runtime-валидации (Zod) — `transform` + parse или слой api как в Module 13:

```ts
transform: (raw) => raw.map(parseProduct),
```

Не доверяй API вслепую на границе.

---

## 9. `useFetch` vs `useAsyncData`

```ts
// useFetch — URL-centric
await useFetch('/api/products')

// useAsyncData — любой async (второе имя = key)
await useAsyncData('products', () => $fetch('/api/products'))
```

| Когда `useFetch` | Когда `useAsyncData` |
|------------------|----------------------|
| простой HTTP URL | несколько запросов, non-HTTP |
| удобные query/headers options | своя функция-loader |
| большинство list/detail | сложная агрегация |

Подробнее — [урок 07](./07-use-async-data.md). На старте storefront часто хватает `useFetch`.

---

## 10. `useFetch` vs vue-query (Module 8)

| | `useFetch` (Nuxt) | vue-query |
|---|-----------|-----------|
| SSR integration | native Nuxt payload | нужны адаптеры/настройка |
| Cache | Nuxt payload + key | богатый cache (staleTime, gc) |
| Ecosystem | Nuxt-first | framework-agnostic |
| Mutations / optimistic | вручную / другие tools | сильно |

```text
Nuxt app «из коробки» → useFetch / useAsyncData
Уже большой vue-query слой в SPA → можно перенести осознанно
Не обязательно тащить оба на каждый запрос
```

---

## 11. Proxy и `/api`

```ts
await useFetch('/api/products')
```

В Nuxt это часто бьёт в **`server/api/products.get.ts`** (same origin) — удобно, нет CORS в dev.

Внешний API:

```ts
await useFetch('https://api.example.com/products', {
  // или runtimeConfig public base
})
```

```ts
const config = useRuntimeConfig()
await useFetch(`${config.public.apiBase}/products`)
```

Секреты — только server; public base — `runtimeConfig.public` ([env урок Nuxt позже / Module 13 идеи](../module-13/08-env.md)).

---

## 12. Catalog examples

### List

```ts
const category = ref('all')
const { data, status, refresh } = await useFetch('/api/products', {
  query: computed(() => ({ category: category.value })),
  key: () => `products-${category.value}`,
  lazy: true,
  default: () => [],
})
```

### Detail

```ts
const id = computed(() => route.params.id as string)
const { data: product, error } = await useFetch(
  () => `/api/products/${id.value}`,
  { key: () => `product-${id.value}` },
)
```

### Client-only cart summary

```ts
await useFetch('/api/cart', { server: false })
```

---

## 13. Частые ошибки

### `useFetch` в обычном event без await-setup понимания

В handler: `$fetch` + `refreshNuxtData`, не новый `await useFetch` на каждый клик без нужды.

### Забыть reactive `key` на detail page

Stale product.

### Думать что `useFetch` = Pinia

Это request state, не client cart.

### Парсить ответ только в template

Лучше `transform` / parse на границе.

### Тянуть секреты в `useFetch` headers с client

Видно пользователю; proxy через `server/api`.

### Двойной fetch: child и parent оба `useFetch` одного URL без shared key

Два ключа → два запроса; унифицируй `key` или lift fetch на page.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Почему `onMounted(fetch)` плох для SSR?
2. Роль `key` и `watch`?
3. `useFetch` vs `$fetch` в button click?
4. Зачем `lazy` / `useLazyFetch`?
5. Чем `useFetch` отличается от `useAsyncData`?
6. Как сделать 404 при пустом product?

---

## 15. Что почитать

### Официальное

- [useFetch API](https://nuxt.com/docs/api/composables/use-fetch)
- [$fetch](https://nuxt.com/docs/api/utils/dollarfetch)
- [refreshNuxtData](https://nuxt.com/docs/api/utils/refresh-nuxt-data)

### Связанные материалы этого плана

- [Module 14 · pages](./05-pages.md)
- [Module 14 · useAsyncData](./07-use-async-data.md)
- [Module 8 · queries](../module-8/03-queries.md)

---

## 16. Практическое мини-задание

1. List page: `useFetch('/api/products')` + pending/error UI.
2. Detail: reactive id + `key` — проверь смену товара без reload.
3. Фильтр category через `query` + key.
4. Кнопка refresh после mock create.
5. Несуществующий id → `createError(404)`.

---

## 17. Мини-конспект

- **`useFetch`** = SSR-aware HTTP + payload reuse
- `data` / `status` / `error` / `refresh`
- reactive URL + **`key`** обязательны для dynamic routes
- `$fetch` для one-off; `lazy` для non-blocking
- не путать с Pinia и не дублировать vue-query без причины
- дальше — **`useAsyncData`**

---

## 18. Что делать дальше

Следующий теоретический блок Module 14:

- [`useAsyncData`](./07-use-async-data.md)
