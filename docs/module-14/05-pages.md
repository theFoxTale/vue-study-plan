# Module 14 · Теория: pages

Этот материал закрывает пятый теоретический пункт Module 14: **pages как слой приложения** — роль page в Nuxt, тонкая композиция, data fetching на page, head/meta, middleware, ошибки/404, и как не превратить `pages/` в свалку (связь с Module 13).

Связанные материалы:

- [Module 14 · файловый роутинг](./03-file-routing.md)
- [Module 14 · layouts](./04-layouts.md)
- [Module 13 · pages слой](../module-13/03-shared-ui-entities-features-pages.md)

---

## 1. Page = route entry, не «весь feature»

```text
File routing (урок 03)  → как URL появляется из файла
Layouts (урок 04)       → чем page обёрнут
Pages (этот урок)       → что писать внутри page и чего не писать
```

**Page** в Nuxt — Vue SFC в `pages/`, который:

1. соответствует URL
2. выбирает layout / middleware / ssr через `definePageMeta`
3. загружает данные для экрана
4. композирует components/composables
5. задаёт SEO для этого URL

```text
Хорошо:  pages/products/[id].vue ≈ 40–120 строк
Плохо:   один page = весь store + все формы + весь fetch + весь UI kit
```

Официально:

- [Nuxt · pages](https://nuxt.com/docs/guide/directory-structure/pages)
- [Nuxt · Data Fetching](https://nuxt.com/docs/getting-started/data-fetching)

---

## 2. Анатомия «здоровой» page

```vue
<!-- pages/products/[id].vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: product, status, error } = await useFetch(
  () => `/api/products/${id.value}`,
  { key: () => `product-${id.value}` },
)

useSeoMeta({
  title: () => product.value?.title ?? 'Product',
  description: () => product.value?.description?.slice(0, 160),
})
</script>

<template>
  <div v-if="status === 'pending'">Loading…</div>
  <div v-else-if="error">Failed to load</div>
  <ProductDetails v-else-if="product" :product="product" />
</template>
```

| Блок | Ответственность |
|------|-----------------|
| `definePageMeta` | route policy |
| `useFetch` / `useAsyncData` | данные экрана ([уроки 06–07](./06-use-fetch.md)) |
| `useSeoMeta` / `useHead` | SEO этого URL |
| template | states + feature/entity UI |

Тяжёлый UI — `<ProductDetails>` в `components/` или `features/`.

---

## 3. Page и Module 13 boundaries

| Nuxt `pages/` | Module 13 |
|---------------|-----------|
| route screen | `pages/` |
| composables в page | тонкий glue; толстые → `composables/` / features |
| shared UI | `components/` |
| server endpoints | `server/api` ≈ api layer |

```text
Можно сохранить feature-based папки вне pages/:
  features/cart/
  components/product/
Pages только импортируют/композируют.
```

Auto-import components из `components/` не отменяет правила «ProductCard без cart store».

---

## 4. Data on page: await в `<script setup>`

```ts
const { data } = await useFetch('/api/products')
```

В Nuxt page/composable под Nuxt context **`await useFetch`** — норма:

- на SSR данные попадают в HTML/payload
- на клиенте при навигации — fetch + reuse payload rules

```text
Не путать с CSR Vite SPA:
там await на top-level setup без Suspense — другая история.
Nuxt pages рассчитаны на async setup.
```

Детали API — `useFetch` / `useAsyncData`. Здесь принцип: **данные экрана объявляй на page (или page composable), не в случайном child без ключа**.

---

## 5. Pending / error / empty — обязанность page

```vue
<template>
  <ProductListSkeleton v-if="pending" />
  <p v-else-if="error">{{ error.message }}</p>
  <p v-else-if="!items?.length">No products</p>
  <ProductGrid v-else :products="items" />
</template>
```

```text
Layout не должен угадывать loading всех pages.
Page владеет состояниями своего URL.
```

Связь с Module 8/12: skeleton, не full-page spinner без нужды.

---

## 6. SEO принадлежит page (и иногда layout title template)

```ts
useHead({
  title: 'Cart',
})

useSeoMeta({
  title: 'Wireless Keyboard',
  ogTitle: 'Wireless Keyboard',
  ogImage: product.value?.imageUrl,
  description: '…',
})
```

```ts
// nuxt.config или app — title template
app: {
  head: {
    titleTemplate: '%s · Product Catalog',
  },
}
```

Подробнее SEO — [урок 09](./09-seo-basics.md). Правило сейчас: **уникальный URL → уникальные meta на page**.

---

## 7. Middleware на page

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})
</script>
```

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn.value) {
    return navigateTo('/login')
  }
})
```

| Тип | Когда |
|-----|--------|
| Named `middleware/auth.ts` | opt-in через page meta |
| Global `middleware/auth.global.ts` | каждый route — осторожно |

Guards Module 5 ≈ Nuxt route middleware. Логику auth держи в composable; middleware — тонкий redirect.

---

## 8. Ключ page и навигация между динамическими URL

```text
/products/1 → /products/2
один и тот же page component
```

Парамы меняются — нужно:

```ts
const id = computed(() => route.params.id as string)

await useFetch(() => `/api/products/${id.value}`, {
  key: () => `product-${id.value}`,
  watch: [id],
})
```

Иначе рискуешь **залипшими данными** предыдущего id.

`onBeforeRouteUpdate` — дополнительный рычаг; чаще хватает `watch` / reactive key в data fetching.

---

## 9. Когда выносить логику из page

Вынеси в `composables/useProductPage.ts` (или feature), если:

```text
- script > ~150 строк
- одна и та же загрузка на двух pages
- тестируешь orchestration отдельно
```

```vue
<script setup lang="ts">
const { product, pending, error } = await useProductPage()
</script>
```

Page остаётся **декларацией экрана**.

---

## 10. Error и not found

```ts
const { data, error } = await useFetch(`/api/products/${id}`)

if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found' })
}
```

```text
createError → Nuxt error page (error.vue)
validate в definePageMeta → 404 до fetch (bad id format)
```

Не молчи с пустым экраном на отсутствующий product — плохой UX и SEO.

---

## 11. CSR-only pages

```vue
<script setup lang="ts">
definePageMeta({
  ssr: false,
  layout: 'blank',
})
</script>
```

Типично: cart с тяжёлым client-only widget, rich editor, pages за auth где SEO не нужен.

```text
Hybrid: публичный product — SSR; /cart — ssr: false
```

---

## 12. Storefront: карта ответственности pages

| Page | Делает | Не делает |
|------|--------|-----------|
| `products/index` | filters query + list fetch + grid | cart store internals |
| `products/[id]` | detail fetch + SEO + AddToCart | parse API wire format |
| `cart` | compose cart UI | raw `fetch` duplicate |
| `login` | compose form + meta blank layout | http client |
| `index` | hero + links | весь blog |

---

## 13. Частые ошибки

### God page

Все features в одном SFC — возврат к Module 13 проблеме.

### Fetch только в `onMounted`

Ломает смысл SSR: HTML без данных. Используй `useFetch`/`useAsyncData` (или осознанный client-only).

### Один `key` на все product ids

Stale content при client navigation.

### SEO только в `nuxt.config`

Все страницы с одним title.

### Business logic в `definePageMeta`

Meta — декларации; не место для сложного runtime.

### Игнорировать pending/error

Мигание / пустота / hydration confusion.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Чем «pages урок» отличается от «file routing»?
2. Какие блоки в здоровой page?
3. Почему `await useFetch` на page в Nuxt ок?
4. Как не залипнуть на `/products/1` → `/products/2`?
5. Когда `createError(404)`?
6. Как Module 13 говорит «тонкий page» в Nuxt?

---

## 15. Что почитать

### Официальное

- [pages directory](https://nuxt.com/docs/guide/directory-structure/pages)
- [Data Fetching](https://nuxt.com/docs/getting-started/data-fetching)
- [createError](https://nuxt.com/docs/api/utils/create-error)
- [useSeoMeta](https://nuxt.com/docs/api/composables/use-seo-meta)

### Связанные материалы этого плана

- [Module 14 · file routing](./03-file-routing.md)
- [Module 14 · layouts](./04-layouts.md)
- [Module 13 · layers](../module-13/03-shared-ui-entities-features-pages.md)

---

## 16. Практическое мини-задание

1. Возьми одну god-like page — разрежь на page + `ProductDetails` component.
2. Добавь pending/error/empty явно.
3. `useSeoMeta` с title из product data.
4. Навигация id 1→2 — проверь, что данные обновляются (`key`/`watch`).
5. Несуществующий id → `createError(404)`.

---

## 17. Мини-конспект

- page = **route entry + data + SEO + composition**
- тонкий script; UI в components/features
- async data на page для SSR-friendly HTML
- keys/watch для dynamic params; 404 через `createError`
- middleware/layout/ssr — `definePageMeta`
- дальше — **`useFetch`**

---

## 18. Что делать дальше

Следующий теоретический блок Module 14:

- [`useFetch`](./06-use-fetch.md)
