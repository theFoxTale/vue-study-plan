# Module 14 · Теория: `useAsyncData`

Этот материал закрывает седьмой теоретический пункт Module 14: **`useAsyncData`** — универсальный SSR-friendly loader с явным ключом, когда URL-centric `useFetch` мало, композиция нескольких запросов, и как не дублировать кеш.

Связанные материалы:

- [Module 14 · useFetch](./06-use-fetch.md)
- [Module 14 · pages](./05-pages.md)
- [Module 8 · queries](../module-8/03-queries.md)

---

## 1. Зачем второй composable, если есть `useFetch`

```ts
// useFetch — удобен, когда есть URL
await useFetch('/api/products')

// useAsyncData — когда loader = любая async функция
await useAsyncData('products', () => $fetch('/api/products'))
```

```text
useFetch(url, options)  ≈  useAsyncData(key, () => $fetch(url, options))
                           + sugar для query/headers/method
```

**`useAsyncData`** — примитив. **`useFetch`** — сахар над ним для HTTP.

Бери `useAsyncData`, когда:

- несколько запросов / агрегация
- не HTTP (CMS SDK, filesystem на server, Redis)
- свой клиент (`api.getProducts()` из Module 13 слоя)
- нужен полный контроль над key и handler

Официально:

- [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data)
- [Data Fetching](https://nuxt.com/docs/getting-started/data-fetching)

---

## 2. Базовый синтаксис

```ts
const { data, status, error, refresh, clear } = await useAsyncData(
  'product-list',
  () => $fetch<Product[]>('/api/products'),
)
```

| Аргумент | Смысл |
|----------|--------|
| 1. `key` | string (или computed getter в продвинутых кейсах) — id в payload |
| 2. `handler` | `() => Promise<T>` |
| 3. `options` | lazy, server, default, transform, watch… |

Возвращаемые поля — те же идеи, что у `useFetch`: `data`, `status`, `error`, `refresh`.

```text
Ключ обязателен и осмысленен:
  'product-list' ✅
  'data' ❌
  `product-${id}` ✅ для detail
```

---

## 3. Ключ = контракт кеша

```ts
const id = computed(() => route.params.id as string)

const { data: product } = await useAsyncData(
  () => `product-${id.value}`,
  () => $fetch(`/api/products/${id.value}`),
  { watch: [id] },
)
```

В актуальном Nuxt ключ может быть computed/getter — сверься с docs своей версии. Классика:

```ts
await useAsyncData(
  `product-${route.params.id}`,
  () => $fetch(`/api/products/${route.params.id}`),
)
```

```text
Одинаковый key в двух местах → shared data slot
Разный key на один URL → двойной fetch
```

`refreshNuxtData('product-list')` сбрасывает/обновляет по ключу.

---

## 4. Свой API layer (Module 13 style)

```ts
// shared or server-friendly api
import { fetchProducts, fetchProductById } from '~/entities/product/api'

const { data: products } = await useAsyncData(
  'products',
  () => fetchProducts(),
)

const { data: product } = await useAsyncData(
  `product-${id}`,
  () => fetchProductById(id),
)
```

```text
Handler вызывает чистые async functions —
useAsyncData не знает про Vue Router внутри api модуля.
```

Если `fetchProducts` использует `localStorage` — сломается на SSR. Api layer должен быть universal или server-only.

---

## 5. Несколько запросов / агрегация

```ts
const id = route.params.id as string

const { data, status, error } = await useAsyncData(
  `product-page-${id}`,
  async () => {
    const [product, reviews] = await Promise.all([
      $fetch(`/api/products/${id}`),
      $fetch(`/api/products/${id}/reviews`),
    ])
    return { product, reviews }
  },
)
```

```vue
<template>
  <ProductDetails v-if="data" :product="data.product" />
  <ReviewList v-if="data" :reviews="data.reviews" />
</template>
```

| Подход | Когда |
|--------|--------|
| Один `useAsyncData` + `Promise.all` | один экран, одна загрузка |
| Два `useAsyncData` | независимые блоки, разный lazy/error |
| `useFetch` ×2 | два простых URL |

Параллель важна для TTFB/LCP (Module 12 waterfall anti-pattern).

---

## 6. Options (важные)

```ts
await useAsyncData('products', () => $fetch('/api/products'), {
  lazy: true,
  server: true,
  immediate: true,
  default: () => [],
  transform: (list) => list.filter(p => p.inStock),
  pick: ['id', 'title', 'price'], // если data — object
  watch: [category],
  dedupe: 'cancel', // поведение параллельных вызовов — см. docs версии
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key], // тонкий контроль
})
```

### `lazy: true` / `useLazyAsyncData`

Не блокирует await навигации — skeleton на page.

### `getCachedData`

Вернуть уже известные данные (из payload / pinia) без сети — advanced optimization.

---

## 7. Только на сервере / только на клиенте

```ts
// тяжёлый server-only SDK
await useAsyncData('report', () => generateReport(), {
  server: true,
  // client получит payload; handler на client может не повторяться
})
```

```ts
await useAsyncData('browser-id', () => readFromLocalStorage(), {
  server: false,
})
```

```text
Branch внутри handler:
  if (import.meta.server) { … }
  if (import.meta.client) { … }
```

Не читай `window` без `server: false` или client branch.

---

## 8. Ошибки

```ts
const { data, error } = await useAsyncData('product', () => fetchProduct(id))

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    message: error.value.message,
  })
}
```

Или в handler:

```ts
await useAsyncData('product', async () => {
  const p = await fetchProduct(id)
  if (!p) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  return p
})
```

---

## 9. Когда `useFetch`, когда `useAsyncData` — шпаргалка

| Задача | Выбор |
|--------|--------|
| `GET /api/products?category=` | `useFetch` + `query` |
| `fetchProducts()` из entity api | `useAsyncData` |
| product + reviews parallel | `useAsyncData` + `Promise.all` |
| Markdown read на server | `useAsyncData` |
| Простой detail URL | либо оба ок; `useFetch` короче |
| Нужен явный стабильный key в коде | `useAsyncData` читаемее |

```text
Не смешивай без нужды два composable на один и тот же key.
```

---

## 10. Связь с vue-query

```text
useAsyncData key     ≈ queryKey
handler              ≈ queryFn
refreshNuxtData      ≈ invalidateQueries
lazy                 ≈ не ждать suspense
```

vue-query богаче: staleTime, mutations, retries из коробки.  
Nuxt data fetching ближе к **page lifecycle + SSR payload**.

Выбери один primary подход на проект; второй — точечно.

---

## 11. Catalog examples

### List через api module

```ts
const category = ref('all')

const { data: products, status, refresh } = await useAsyncData(
  () => `products-${category.value}`,
  () => fetchProducts({ category: category.value }),
  { watch: [category], lazy: true, default: () => [] },
)
```

### Checkout preview (aggregate)

```ts
const { data } = await useAsyncData('checkout-preview', async () => {
  const cart = await $fetch('/api/cart')
  const shipping = await $fetch('/api/shipping/estimate', {
    method: 'POST',
    body: { items: cart.items },
  })
  return { cart, shipping }
})
```

### Content page (SSG-friendly)

```ts
const { data: page } = await useAsyncData(
  `docs-${slug}`,
  () => queryContent(slug).findOne(), // Nuxt Content example
)
```

---

## 12. Тестирование и моки

```text
Мокай handler dependency (fetchProducts / $fetch),
не внутренности useAsyncData.
```

В component tests Nuxt — `@nuxt/test-utils`. Для unit api layer — как Module 11 (`vi.spyOn`).

---

## 13. Частые ошибки

### Ключ `'data'` / `'result'` на всех страницах

Коллизии payload → чужие данные на экране.

### Handler с side effects (toast, router.push)

Loader должен **вернуть данные**; UX — снаружи после status.

### Await двух независимых `useAsyncData` последовательно без нужды

```ts
// медленно
await useAsyncData('a', …)
await useAsyncData('b', …)

// лучше Promise.all вокруг handlers в одном,
// или оба lazy / параллельный await в одном tick — см. docs best practices
```

### Вызов `useAsyncData` вне setup / Nuxt context

Плагины, произвольные utils — нет; только setup / Nuxt composable context.

### Дублировать `useFetch` и `useAsyncData` на один ресурс

Два ключа, два запроса.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Чем `useAsyncData` отличается от `useFetch`?
2. Зачем явный `key`?
3. Как загрузить product + reviews без waterfall?
4. Как встроить `fetchProductById` из api layer?
5. Когда `server: false`?
6. Как обновить данные после mutation?

---

## 15. Что почитать

### Официальное

- [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data)
- [useLazyAsyncData](https://nuxt.com/docs/api/composables/use-lazy-async-data)
- [refreshNuxtData](https://nuxt.com/docs/api/utils/refresh-nuxt-data)

### Связанные материалы этого плана

- [Module 14 · useFetch](./06-use-fetch.md)
- [Module 13 · API layer](../module-13/05-api-layer.md)
- [Module 8 · invalidation](../module-8/05-invalidation.md)

---

## 16. Практическое мини-задание

1. Перепиши один `useFetch` на `useAsyncData` + `fetchProducts()`.
2. Product page: `Promise.all` product + reviews в одном loader.
3. Смена category — новый key + `watch`.
4. После add-to-favorites — `refreshNuxtData(key)`.
5. Намеренно два одинаковых key на разных pages — наблюди sharing; потом разведи keys.

---

## 17. Мини-конспект

- **`useAsyncData`** = key + async handler + SSR payload
- `useFetch` = сахар для URL; async data — для всего остального
- явные **keys**, parallel aggregate, api layer handlers
- lazy / server options как у useFetch
- один primary data tool на проект
- дальше — **server routes**

---

## 18. Что делать дальше

Следующий теоретический блок Module 14:

- [Server routes](./08-server-routes.md)
