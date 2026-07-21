# Module 4 · Теория: типы в store и router

Этот материал закрывает **финальный теоретический пункт Module 4**: понять, **как типизировать Pinia store и Vue Router**, даже если полноценная практика stores/routing будет в Module 5–6.

> Это bridge-урок: не заменяет Module 5/6, но даёт typed foundation заранее.

Связанные материалы:

- [Module 4 · typing composables](./03-typing-composables.md)
- [Module 4 · typing API responses](./05-typing-api-responses.md)
- [Module 4 · generics](./06-generics.md)

---

## 1. Зачем это в Module 4

К Module 5–6 ты подойдёшь уже с навыками:

- domain types (`Product`, `SortBy`)
- typed composables
- API parsing

Store и router — следующие места, где types либо помогают, либо быстро расползаются в `any`.

```text
components  → props/emits
composables → Ref/return contracts
services    → API responses
store       → shared state models
router      → params / query / route names
```

---

## 2. Pinia: Option Store typing

Pinia хорошо выводит types, если state описан явно.

```ts
import { defineStore } from 'pinia'
import type { Product } from '@/types/product'

type CatalogState = {
  products: Product[]
  selectedId: number | null
  query: string
}

export const useCatalogStore = defineStore('catalog', {
  state: (): CatalogState => ({
    products: [],
    selectedId: null,
    query: '',
  }),
  getters: {
    selectedProduct(state): Product | null {
      return state.products.find((p) => p.id === state.selectedId) ?? null
    },
  },
  actions: {
    setQuery(query: string) {
      this.query = query
    },
    selectProduct(id: number) {
      this.selectedId = id
    },
  },
})
```

### Важно для пустых массивов / null

```ts
products: [] as Product[]
user: null as User | null
```

или через return type `state(): State`.

Официально:

- [Pinia · Typing state](https://pinia.vuejs.org/core-concepts/state.html#typescript)

---

## 3. Pinia: Setup Store typing

Setup store типизируется почти как composable:

```ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Product } from '@/types/product'
import { fetchProducts } from '@/services/productsApi'

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref<Product[]>([])
  const selectedId = ref<number | null>(null)
  const query = ref('')
  const isLoading = ref(false)
  const error = ref('')

  const selectedProduct = computed(() => {
    return products.value.find((p) => p.id === selectedId.value) ?? null
  })

  async function loadProducts() {
    isLoading.value = true
    error.value = ''
    try {
      products.value = await fetchProducts()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  function selectProduct(id: number) {
    selectedId.value = id
  }

  return {
    products,
    selectedId,
    query,
    isLoading,
    error,
    selectedProduct,
    loadProducts,
    selectProduct,
  }
})
```

Те же правила, что у composables:

- `ref<Product[]>([])`
- no `any`
- methods с явными arg types

---

## 4. Store vs composable: где какие types

| | Composable | Store |
|---|------------|-------|
| Scope | обычно local/feature instance | shared app/global feature state |
| Types | `UseXReturn` | state/getters/actions contracts |
| Domain models | те же `Product` types | те же `Product` types |

Не плоди разные `StoreProduct` и `ComposableProduct`, если shape одна.
Переиспользуй `src/types/product.ts`.

---

## 5. Destructuring store без потери types/reactivity

```ts
import { storeToRefs } from 'pinia'
import { useCatalogStore } from '@/stores/catalog'

const catalogStore = useCatalogStore()
const { products, selectedProduct, isLoading } = storeToRefs(catalogStore)
const { loadProducts, selectProduct } = catalogStore
```

- state/getters → `storeToRefs`
- actions → обычный destructure

Types сохраняются, если store был хорошо типизирован.

---

## 6. Vue Router: базовые typed hooks

```ts
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
```

Из коробки:

- `route.params` имеет широкий тип
- dynamic params часто приходят как `string` (или `string | string[]`)

Поэтому params нужно сужать.

---

## 7. Типизация route params вручную

### Route

```ts
{
  path: '/products/:id',
  name: 'product-details',
  component: () => import('@/pages/ProductDetailsPage.vue'),
}
```

### В page

```ts
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const productId = computed(() => {
  const raw = route.params.id
  const value = Array.isArray(raw) ? raw[0] : raw
  const id = Number(value)

  if (Number.isNaN(id)) {
    throw new Error('Invalid product id')
  }

  return id
})
```

Даже без advanced typed routes можно сделать params безопасными.

---

## 8. Typed `router.push`

Минимум — не разбрасывать magic strings без names:

```ts
await router.push({
  name: 'product-details',
  params: { id: String(product.id) },
})
```

Params в URL — strings.
Если store/domain держат `number`, конвертируй на границе router ↔ domain.

```text
domain id: number
route param: string
```

Это нормально. Главное — explicit conversion.

---

## 9. Query typing

```ts
// /catalog?query=keyboard&sortBy=price
const route = useRoute()

const query = computed(() => {
  const raw = route.query.query
  return typeof raw === 'string' ? raw : ''
})

const sortBy = computed(() => {
  const raw = route.query.sortBy
  return raw === 'price' ? 'price' : 'name'
})
```

Лучше сразу сузить к union `SortBy`, а не держать `string` по всему app.

---

## 10. Advanced typed routes *(preview)*

С Vue Router 4.4+ можно описывать `RouteNamedMap` для autocomplete names/params.

Это мощно, но verbose вручную.
Часто генерируют через file-based routing tooling.

На Module 4 достаточно знать:

```text
typed routes существуют
для старта хватает manual narrowing params/query
глубокая генерация типов — optional later
```

Официально:

- [Typed Routes · Vue Router](https://router.vuejs.org/guide/advanced/typed-routes.html)

---

## 11. Как это стыкуется с catalog architecture

Пока Module 4 practice может остаться без Pinia/Router.

Но types стоит проектировать так, чтобы потом было легко:

```text
Product
SortBy
ProductFilters state
selectedId: number | null
```

Потом:

- filters sync с `route.query`
- selected product sync с `/products/:id`
- shared catalog state уходит в Pinia при необходимости

Хорошие domain types сегодня = меньше боли в Module 5–6.

---

## 12. Пример будущего `ProductDetailsPage`

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { Product } from '@/types/product'
import { fetchProductById } from '@/services/productsApi'

const route = useRoute()
const product = ref<Product | null>(null)
const error = ref('')

const productId = computed(() => Number(route.params.id))

onMounted(async () => {
  try {
    if (Number.isNaN(productId.value)) {
      throw new Error('Invalid id')
    }
    product.value = await fetchProductById(productId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  }
})
</script>
```

Здесь уже видны все Module 4 навыки: domain type, API, narrowing params, error as `unknown`.

---

## 13. Частые ошибки

### `params.id as number`

```ts
const id = route.params.id as number // ❌ в runtime это string
```

Правильнее parse:

```ts
const id = Number(route.params.id)
```

### Store state как `any[]`

```ts
products: [] as any[]
```

Сразу потеряешь пользу Pinia inference.

### Разные имена одной сущности

```ts
StoreProduct, ApiProduct, UiProduct
```

без необходимости. Лучше DTO + domain + mapper.

### Деструктур store без `storeToRefs`

Types могут выглядеть «ок», а reactivity уже сломана.

---

## 14. Что реально сделать в Module 4 practice

Не обязательно подключать Pinia/Router прямо сейчас.

Сделай подготовку:

1. Оставь чистые domain types
2. Напиши helper `parseRouteId(raw: unknown): number`
3. Напиши typed sketch store *(можно без подключения в app)*
4. Опиши future routes names в comments/types:
   - `catalog`
   - `product-details`

Это засчитывается как понимание блока.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Как типизировать empty array в Pinia state?
2. Чем Setup Store typing похож на composable typing?
3. Почему `route.params.id` нельзя просто считать `number`?
4. Как сузить `sortBy` query к `'name' | 'price'`?
5. Зачем `storeToRefs`?
6. Какие types из Module 4 переедут в Module 5–6 почти без изменений?

---

## 16. Что почитать

### Pinia

- [Defining a Store](https://pinia.vuejs.org/core-concepts/)
- [Typing state](https://pinia.vuejs.org/core-concepts/state.html#typescript)

### Vue Router

- [Typed Routes](https://router.vuejs.org/guide/advanced/typed-routes.html)
- [Dynamic Route Matching](https://router.vuejs.org/guide/essentials/dynamic-matching.html)

### Связанные материалы этого плана

- [Module 4 · typing composables](./03-typing-composables.md)
- [Module 4 · generics](./06-generics.md)

---

## 17. Практическое мини-задание

1. Создай файл-скетч `src/stores/catalog.ts` с typed Setup Store
2. Создай helper:

```ts
export function parseRouteParamId(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw
  const id = Number(value)
  if (!value || Number.isNaN(id)) {
    throw new Error('Invalid route id')
  }
  return id
}
```

3. Опиши `SortBy` parsing из query
4. Не обязательно подключать router/pinia в running app на этом шаге
5. Проверь, что скетч компилируется typecheck'ом

---

## 18. Мини-конспект

- store types = те же domain models + явные ref/state annotations
- empty lists/null нужно помогать TS через `as` или State interface
- router params/query приходят как strings и требуют narrowing
- `storeToRefs` сохраняет reactivity при destructure
- advanced typed routes — optional later
- Module 4 готовит фундамент для Module 5–6

---

## 19. Что делать дальше

**Теория Module 4 завершена.**

Следующий шаг:

- **[практика Module 4](./08-practice-checklist.md)** — ужесточить catalog types, убрать `any`, описать models/API
- затем **Module 5 · Маршрутизация**
