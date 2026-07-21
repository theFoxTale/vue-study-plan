# Module 7 · Теория: когда хватает `fetch`, а когда нужен data layer

Этот материал закрывает последний теоретический пункт `Module 7`: собрать **архитектуру работы с сервером** — где живут запросы, parse, loading state, и **почему не всё кладут в Pinia или в component**.

Связанные материалы:

- [Module 7 · fetch](./01-fetch.md)
- [Module 6 · когда store не нужен](../module-6/03-when-store-is-not-needed.md)
- [Module 4 · typing API responses](../module-4/05-typing-api-responses.md)

---

## 1. Что такое data layer

**Data layer** — слой приложения, который отвечает за **общение с внешним API** и **превращение сырого ответа в domain data**.

```text
UI (page/component)
  ↓
composable / orchestration (optional)
  ↓
api/* (HTTP + parse)
  ↓
network
```

Data layer **не** равен Pinia.
Pinia — client state; server data может **проходить через** api/composable, но не обязана жить в store.

---

## 2. Лестница сложности

| Уровень | Когда | Структура |
|---------|-------|-----------|
| **0** | 1–2 запроса, учебный прототип | `fetch` в page + parse inline |
| **1** | catalog + detail, Module 7 MVP | `src/api/*` + page/composable |
| **2** | много экранов, общие loaders | composables `useProducts`, `useUsers` |
| **3** | кеш, dedupe, invalidation | **Module 8** · TanStack Query |
| **4** | BFF, SSR, сложный backend | отдельный backend-for-frontend |

Module 7 цель — уверенно **уровень 1–2**, понимать зачем **3**.

---

## 3. Когда хватает «голого» fetch в page

Допустимо на самом старте:

```vue
<script setup lang="ts">
onMounted(async () => {
  const res = await fetch('/api/products')
  // ...
})
</script>
```

Признаки, что **пора вынести**:

- второй page делает тот же запрос
- дублируется parse / error handling
- появились pagination, query, abort
- typecheck страдает от `any` в каждом файле

Критерий Module 7: **запросы не размазаны хаотично** → минимум `src/api/products.ts`.

---

## 4. Рекомендуемая структура Module 7

```text
src/
  api/
    client.ts          # axios instance / fetch base
    errors.ts          # HttpError, toAppError
    products.ts        # fetchProducts, fetchProductById
    users.ts           # optional
    catalogQuery.ts    # parse route query → api params
  composables/
    useCatalogProducts.ts   # load + loading/error + abort
  types/
    product.ts         # Product, parseProduct(s)
  pages/
    CatalogPage.vue
    ProductDetailsPage.vue
  stores/
    cart.ts            # client state ONLY (Module 6)
```

Правило:

```text
api/        = как достать данные с сервера
composable  = когда и как UI их грузит (async state)
store       = что пользователь/сессия «держит» client-side
page        = layout + wiring
```

---

## 5. Роли слоёв

### `api/*` — transport + parse

```ts
// только HTTP, headers, URL, unknown → Product
export async function fetchProductById(id: string, options?: { signal?: AbortSignal }) {
  const { data } = await api.get(`/products/${id}`, { signal: options?.signal })
  return parseProduct(data as unknown)
}
```

Без:

- `ref`, loading UI
- router
- Pinia cart

### Composable — server state orchestration

```ts
export function useProductDetails(productId: Ref<string>) {
  const product = ref<Product | null>(null)
  const isLoading = ref(false)
  const error = ref<AppError | null>(null)

  async function load(signal?: AbortSignal) { /* fetchProductById + states */ }

  watch(productId, () => load(), { immediate: true })

  return { product, isLoading, error, isEmpty: computed(() => !product.value), reload: load }
}
```

Composable знает **когда** грузить и **как** показать loading/error.
api знает **как** сходить на сервер.

### Page — glue

```vue
<script setup lang="ts">
const route = useRoute()
const id = computed(() => String(route.params.id))
const { product, isLoading, error, isEmpty, reload } = useProductDetails(id)
</script>
```

### Pinia — не default для products list

```text
❌ useCatalogStore.products = await fetch...
✅ composable + api; cart/favorites в Pinia
```

Кеш products в store — только если **осознанная** стратегия (stale-while-revalidate), не «так проще».

---

## 6. Client state vs server data (ещё раз)

| | Client (Module 6) | Server (Module 7) |
|---|-------------------|-------------------|
| Примеры | cart, auth session, modal | products[], user profile from API |
| Источник правды | app / user action | backend |
| Переживает reload | иногда (persist) | нужен refetch |
| Типичный дом | Pinia | api + composable |
| URL | иногда (filters) | identity `/products/:id` |

Критерий завершения Module 7: **понятна разница** — можешь объяснить на cart vs products.

---

## 7. Когда composable достаточно (без Pinia, без Vue Query)

Хватит `useCatalogProducts()` если:

- данные нужны 1–2 pages
- нет сложного cross-page cache
- loading/error/local к query привязаны
- abort/retry живут рядом с load

Не хватит, если (→ Module 8):

- один и тот же query на 5 pages без refetch hell
- нужен background refetch, stale time
- mutations + invalidation (`add product` → refresh list)
- dedupe одинаковых in-flight запросов из коробки

---

## 8. Когда Pinia для server data — плохая идея

Symptoms:

- store.actions = 200 строк fetch + parse + toast
- `products` в store, но обновляются только на catalog page
- loading флаги products смешаны с cart в одном store
- после каждого route change ручной `$reset` server fields

Если **очень** нужен shared cache без Vue Query — отдельный `useProductsStore` с чёткой политикой TTL/stale; для Module 7 **не требуется**.

---

## 9. Когда нужен отдельный data layer «по-взрослому»

Признаки:

- >3 resource types (products, orders, users, …)
- общий auth header / error mapping / retry
- команда >1 человека — нужен контракт api/
- тесты на parse без mount component
- смена mock → prod API только в api/

Минимальный «взрослый» data layer Module 7:

```text
client + errors + per-resource modules + composables + parse in types/
```

---

## 10. Сквозной поток catalog (эталон)

```text
1. User opens /catalog?page=2&category=phones
2. CatalogPage / useCatalogProducts
3. parseCatalogQuery(route.query)
4. abort previous controller
5. api.fetchProductsPage(toApiParams(filters), { signal })
6. parseProducts / normalize pagination
7. composable sets items, isLoading, error, isEmpty
8. template: loading | error | empty | ProductList
9. User clicks product → /products/42 (detail composable + fetchProductById)
10. Add to cart → Pinia cart.add (client state, не refetch list)
```

Запросы **не** в `ProductCard.vue` напрямую.

---

## 11. Чеклист архитектуры Module 7

- [ ] HTTP только в `src/api/*`
- [ ] parse рядом с types (`parseProduct`)
- [ ] `toAppError` централизован
- [ ] loading/error/empty/success на data screens
- [ ] abort при смене query / unmount
- [ ] user Retry на error
- [ ] products **не** в god Pinia store
- [ ] cart/auth **не** в api layer

---

## 12. Preview Module 8

**TanStack Vue Query** = server state toolkit:

- queries с cache key
- автоматический loading/error
- refetch, invalidation
- retries (пересечение с уроком 08)

Module 7 учит **ручной** data flow, чтобы Module 8 был осознанным upgrade, не магией.

---

## 13. Частые ошибки

### «Data layer» = один файл utils.ts на 800 строк

Дроби по resource.

### Parse в component template path

`product.price.toFixed` на `any` — parse в api/types.

### Composable вызывает router и cart и fetch

Раздели orchestration: data composable vs page actions.

### Дублировать fetch в store action и composable

Один путь загрузки.

### Vue Query на первый день без понимания fetch

Сначала ручной flow Module 7.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Что входит в data layer?
2. Когда fetch в page ещё ok?
3. Чем api от composable отличается?
4. Почему products list не в cart store?
5. Когда пора Vue Query (Module 8)?
6. Как выглядит эталонный flow catalog?

---

## 15. Что почитать

### Связанные материалы этого плана

- [Module 7 · fetch](./01-fetch.md) … [retries](./08-retries.md) — вся цепочка
- [Module 6 · когда store не нужен](../module-6/03-when-store-is-not-needed.md)
- [Module 4 · typing API responses](../module-4/05-typing-api-responses.md)

### Preview

- [TanStack Query · Vue](https://tanstack.com/query/latest/docs/framework/vue/overview)

---

## 16. Практическое мини-задание

1. Нарисуй слои своего app (page / composable / api / store)
2. Вынеси все HTTP в `src/api/*` если ещё не
3. Добавь `useCatalogProducts` composable
4. Убедись: Pinia только client domains
5. Одним абзацем: «почему products не в store»

---

## 17. Мини-конспект

- data layer = api + parse + (composable orchestration)
- fetch в page — старт; Module 7 = api module + composables
- server data ≠ Pinia по умолчанию
- client state (cart) и server data (products) — разные слои
- Module 8 добавит cache toolkit; Module 7 theory закрыта

---

## 18. Что делать дальше

Теория Module 7 закрыта.

Следующий шаг:

- [практический checklist Module 7](./10-practice-checklist.md)
