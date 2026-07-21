# Module 5 · Теория: useRoute

Этот материал закрывает шестой теоретический пункт `Module 5`: понять, **как читать текущий route**, **что есть в `params` / `query` / `name`**, и **как реагировать на смену URL**.

Связанные материалы:

- [Module 5 · useRouter](./05-use-router.md)
- [Module 5 · RouterLink](./03-router-link.md)
- [Module 4 · types in store & router](../module-4/07-types-in-store-and-router.md)

---

## 1. Что такое `useRoute`

`useRoute()` — composable, который возвращает **текущий reactive route**.

```ts
import { useRoute } from 'vue-router'

const route = useRoute()
```

Через него читаешь:

| Поле | Смысл | Пример |
|------|--------|--------|
| `path` | путь URL | `/products/42` |
| `fullPath` | path + query + hash | `/products/42?tab=info` |
| `name` | имя matched route | `'product-details'` |
| `params` | динамические сегменты | `{ id: '42' }` |
| `query` | query string | `{ category: 'phones' }` |
| `hash` | hash | `'#reviews'` |
| `meta` | произвольные meta-поля route | `{ requiresAuth: true }` |

В Options API это `this.$route`.
В Composition API — `useRoute()`.

Официально:

- [Vue Router + Composition API](https://router.vuejs.org/guide/advanced/composition-api.html)
- [Dynamic Route Matching](https://router.vuejs.org/guide/essentials/dynamic-matching.html)

---

## 2. `useRoute` vs `useRouter`

| | `useRoute` | `useRouter` |
|---|------------|-------------|
| Роль | **читать** текущий URL/state | **командовать** navigation |
| Типичные методы/поля | `params`, `query`, `name` | `push`, `replace`, `back` |
| Аналогия | «где я сейчас» | «куда идти» |

```ts
const route = useRoute()
const router = useRouter()

// читаем
const id = route.params.id

// пишем (меняем URL)
router.push({ name: 'catalog', query: { page: 2 } })
```

Не путай: `route` не имеет `.push()`.

---

## 3. Базовое чтение в page

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <p>Path: {{ route.path }}</p>
  <p>Name: {{ route.name }}</p>
</template>
```

В template также доступен `$route` без import — в script лучше явный `useRoute()`.

---

## 4. `params` — сегменты path

Route:

```ts
{ path: '/products/:id', name: 'product-details', component: ProductDetailsPage }
```

URL `/products/42`:

```ts
route.params.id // '42'  (обычно string!)
```

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const productId = computed(() => String(route.params.id))
</script>

<template>
  <h1>Product #{{ productId }}</h1>
</template>
```

Важно:

- `params` — **strings** (или `string | string[]` для repeatable)
- для чисел делай явный parse: `Number(route.params.id)`
- проверяй `NaN` / пустые значения

Подробнее динамика — в следующем уроке **динамические маршруты**.

---

## 5. `query` — фильтры и опции

URL:

```text
/catalog?category=phones&page=2
```

```ts
route.query.category // 'phones'
route.query.page     // '2'
```

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const category = computed(() =>
  typeof route.query.category === 'string' ? route.query.category : null,
)

function setCategory(next: string) {
  router.push({
    name: 'catalog',
    query: { ...route.query, category: next },
  })
}
</script>
```

Query удобен для:

- фильтров catalog
- pagination
- sort
- tab на той же page

Params — для **identity** ресурса (`/products/42`).
Query — для **опций отображения**.

---

## 6. Реактивность: не watch весь `route`

`route` реактивен. При смене URL поля обновляются.

Плохо (часто):

```ts
watch(route, () => {
  // сработает на любое изменение route
})
```

Лучше watch конкретное поле:

```ts
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watch(
  () => route.params.id,
  async (id) => {
    if (typeof id !== 'string') return
    // await loadProduct(id)
  },
  { immediate: true },
)
```

Или computed + отдельный fetch effect:

```ts
const productId = computed(() => String(route.params.id ?? ''))
```

Почему: при переходе `/products/1` → `/products/2` **тот же** component может переиспользоваться — `onMounted` не вызовется снова. Нужен `watch` на param.

---

## 7. Пример: Product Details page

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Product } from '@/types/product'
import { fetchProductById } from '@/api/products'

const route = useRoute()
const product = ref<Product | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(false)

const productId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

async function load() {
  if (!productId.value) {
    error.value = 'Invalid product id'
    product.value = null
    return
  }

  isLoading.value = true
  error.value = null
  try {
    product.value = await fetchProductById(productId.value)
  } catch {
    error.value = 'Product not found'
    product.value = null
  } finally {
    isLoading.value = false
  }
}

watch(productId, load, { immediate: true })
</script>

<template>
  <p v-if="isLoading">Loading…</p>
  <p v-else-if="error">{{ error }}</p>
  <article v-else-if="product">
    <h1>{{ product.title }}</h1>
  </article>
</template>
```

---

## 8. Пример: catalog filters из query

```ts
const route = useRoute()
const router = useRouter()

const page = computed(() => {
  const raw = route.query.page
  const n = typeof raw === 'string' ? Number(raw) : 1
  return Number.isFinite(n) && n > 0 ? n : 1
})

function goToPage(next: number) {
  router.push({
    name: 'catalog',
    query: {
      ...route.query,
      page: String(next),
    },
  })
}
```

URL становится source of truth для фильтров — можно шарить ссылку.

---

## 9. `name` и `meta`

```ts
if (route.name === 'product-details') {
  // ...
}

// meta задаётся в routes:
// { path: '/admin', meta: { requiresAuth: true } }
route.meta.requiresAuth
```

`meta` чаще пригодится в **navigation guards** (отдельный урок).

---

## 10. Типизация params (кратко)

По умолчанию params loosely typed.
В Module 4 уже был мост к typed router; минимум на практике:

```ts
const id = route.params.id
if (typeof id !== 'string') {
  // handle array / missing
}
```

Не полагайся на `as string` без проверки.

---

## 11. Частые ошибки

### Читать `params` только в `onMounted`

Не сработает при `/products/1` → `/products/2` без remount.

### Считать, что `params.id` — number

Это string (пока сам не распарсишь).

### Путать `params` и `query`

`/products/42` → params  
`/catalog?id=42` → query (обычно хуже для entity identity)

### Мутировать `route.params` напрямую

Route — read model. Меняй URL через `router.push` / `replace`.

### Watch всего `route` без нужды

Слишком широкие срабатывания → лишние fetch.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Чем `useRoute` отличается от `useRouter`?
2. Что хранят `params` и `query`?
3. Почему params обычно string?
4. Зачем `watch(() => route.params.id)`?
5. Как сделать page фильтров shareable через URL?
6. Можно ли делать `route.params.id = '1'`?

---

## 13. Что почитать

### Официальное

- [Composition API](https://router.vuejs.org/guide/advanced/composition-api.html)
- [Dynamic Route Matching](https://router.vuejs.org/guide/essentials/dynamic-matching.html)
- [Passing Props to Route Components](https://router.vuejs.org/guide/essentials/passing-props.html)

### Связанные материалы этого плана

- [Module 5 · useRouter](./05-use-router.md)
- [Module 4 · types in store & router](../module-4/07-types-in-store-and-router.md)

---

## 14. Практическое мини-задание

1. На любой page выведи `route.path` и `route.name`
2. Добавь `/products/:id` и читай `params.id` через `useRoute`
3. Сделай `watch` на `params.id` с `immediate: true`
4. На catalog добавь `?category=` и читай через `route.query`
5. Кнопкой меняй category через `router.push` + spread `route.query`

---

## 15. Мини-конспект

- `useRoute()` = reactive snapshot текущего URL
- `params` — identity в path, `query` — опции
- значения обычно strings — парси и валидируй
- при смене params тот же page может не remount'иться → `watch`
- читать — `useRoute`, менять URL — `useRouter`

---

## 16. Что делать дальше

Следующий теоретический блок Module 5:

- [динамические маршруты](./07-dynamic-routes.md)
