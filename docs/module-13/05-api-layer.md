# Module 13 · Теория: слой API

Этот материал закрывает пятый теоретический пункт Module 13: **слой API** — http-клиент, entity endpoints, parse/DTO, ошибки, граница с vue-query и почему components/pages не зовут `fetch` напрямую.

Связанные материалы:

- [Module 13 · слои](./03-shared-ui-entities-features-pages.md)
- [Module 8 · server vs client state](../module-8/01-server-state-vs-client-state.md)
- [Module 8 · queries](../module-8/03-queries.md)

---

## 1. Зачем отдельный API layer

```text
❌ CatalogPage.vue
    fetch('/api/products')
    .then(r => r.json())
    .then(raw => /* map fields inline */)

✅ CatalogPage → useProductQuery → fetchProducts → http → parseProduct
```

| Без слоя | Со слоем |
|----------|----------|
| URL размазаны по UI | один `fetchProducts` |
| parse дублируется | `parseProduct` + tests |
| сложно мокать | `vi.spyOn(api, 'fetchProducts')` (Module 11) |
| смена backend | правка api/, не 20 компонентов |

**API layer** = всё, что говорит с **сервером** и приводит ответ к **доменным типам**. Не UI, не Pinia cart.

---

## 2. Два уровня внутри «API»

```text
shared/api/          → transport (http client, errors, base URL)
entities/*/api/      → domain endpoints (fetchProducts, login)
features/*/api/      → редко: scenario-specific (checkout submit)
```

```text
shared = «как ходить в сеть»
entity = «какие ресурсы продукта»
```

```text
shared/api/
  http.ts              # fetch wrapper
  errors.ts            # ApiError
  types.ts             # optional shared envelopes

entities/product/api/
  fetchProducts.ts
  fetchProductById.ts
  parseProduct.ts

entities/user/api/
  login.ts
  fetchMe.ts
```

---

## 3. Http client (`shared/api`)

```ts
// shared/api/http.ts
import { apiBaseUrl } from '@/shared/config/env'

export type HttpOptions = {
  method?: string
  body?: unknown
  token?: string | null
  signal?: AbortSignal
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  if (!res.ok) {
    throw await toApiError(res)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
```

```text
✅ base URL из env ([урок 08](./08-env.md))
✅ единый error mapping
✅ signal для abort (query cancel)
❌ axios + fetch + ky вперемешку без причины
```

Pet-project: `fetch` wrapper достаточно. Axios — ок, если команда уже на нём.

---

## 4. Entity API functions

```ts
// entities/product/api/fetchProducts.ts
import { http } from '@/shared/api/http'
import { parseProduct } from './parseProduct'
import type { Product } from '../model/types'
import type { ProductFilters } from '../model/types'

export async function fetchProducts(filters: ProductFilters): Promise<Product[]> {
  const raw = await http<unknown[]>(`/products${toQuery(filters)}`)
  return raw.map(parseProduct)
}

export async function fetchProductById(id: string): Promise<Product> {
  const raw = await http<unknown>(`/products/${id}`)
  return parseProduct(raw)
}
```

```text
Правила:
1. Возвращай Product, не unknown / any
2. Parse на границе (trust boundary)
3. Одна функция — одна операция
4. Без Vue API (нет ref, нет useRoute)
```

**Чистые async functions** → легко unit-тестить и мокать.

---

## 5. Parse / DTO / schema

```ts
// entities/product/api/parseProduct.ts
import { productSchema } from '../model/schemas'
import type { Product } from '../model/types'

export function parseProduct(raw: unknown): Product {
  return productSchema.parse(raw) // zod — Module 9
}
```

Или ручной guard:

```ts
export function parseProduct(raw: unknown): Product {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid product')
  const p = raw as Record<string, unknown>
  if (typeof p.id !== 'string' || typeof p.title !== 'string') {
    throw new Error('Invalid product')
  }
  return {
    id: p.id,
    title: p.title,
    price: Number(p.price),
    // …
  }
}
```

```text
Wire JSON  → parse → Domain Product
UI / store работают только с Product
```

Module 11: `parseProduct.test.ts` — высокий ROI.

---

## 6. Ошибки

```ts
// shared/api/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function toApiError(res: Response): Promise<ApiError> {
  let body: { message?: string; code?: string } = {}
  try {
    body = await res.json()
  } catch { /* ignore */ }
  return new ApiError(body.message ?? res.statusText, res.status, body.code)
}
```

UI:

```ts
if (error instanceof ApiError && error.status === 401) {
  // redirect login — в feature/page, не в http.ts
}
```

```text
http кидает ApiError
feature/page решает UX (toast, redirect)
не alert() внутри fetchProducts
```

---

## 7. API layer vs vue-query

```text
API function     = «получить Product[]»
useQuery         = «когда кешировать / refetch / status»
```

```ts
// entities/product/queries/useProductListQuery.ts  (или features/catalog)
export function useProductListQuery(filters: Ref<ProductFilters>) {
  return useQuery({
    queryKey: productKeys.list(filters.value),
    queryFn: ({ signal }) => fetchProducts(filters.value), // pass signal into http
  })
}
```

| Класть query wrapper | Когда |
|----------------------|--------|
| `entities/product` | переиспользуется в нескольких features |
| `features/catalog` | только catalog filters UX |

```text
❌ useQuery внутри ProductCard
❌ fetchProducts внутри template handler без слоя
✅ page/feature вызывает useProductListQuery
```

---

## 8. Auth token на границе

```ts
// entities/user/api/login.ts
export async function login(body: LoginBody): Promise<Session> {
  return http('/auth/login', { method: 'POST', body })
}

// fetchMe — token из auth store / session
export async function fetchMe(token: string): Promise<User> {
  return parseUser(await http('/me', { token }))
}
```

```text
http не импортирует useAuthStore (циклы + тестируемость)
token передаётся аргументом или через getToken() inject в shared/api
```

Паттерн:

```ts
// shared/api/token.ts
let getAccessToken: () => string | null = () => null

export function setTokenGetter(fn: () => string | null) {
  getAccessToken = fn
}

// app/providers.ts после pinia
setTokenGetter(() => useAuthStore().token)
```

---

## 9. Что НЕ входит в API layer

| Не сюда | Куда |
|---------|------|
| Pinia cart mutations | features/cart |
| Toast «Saved» | feature / shared toast |
| Route redirects | pages / guards |
| v-model формы | features/auth |
| formatPrice для UI | shared/lib |

API = **I/O + parse**. Side effects UI — выше.

---

## 10. Catalog: целевая карта API

```text
shared/api/http.ts
shared/api/errors.ts

entities/product/api/fetchProducts.ts
entities/product/api/fetchProductById.ts
entities/product/api/parseProduct.ts
entities/product/queries/productKeys.ts

entities/user/api/login.ts
entities/user/api/fetchMe.ts

features/checkout/api/placeOrder.ts   # если checkout scenario-specific
```

Public API:

```ts
// entities/product/index.ts
export { fetchProducts, fetchProductById } from './api/fetchProducts'
export { parseProduct } from './api/parseProduct'
export { productKeys } from './queries/productKeys'
```

---

## 11. Тестирование границы

```ts
vi.spyOn(productApi, 'fetchProducts').mockResolvedValue([fixtureProduct])
```

```text
Мокай entities/*/api, не глобальный fetch
(Module 11 · api mocking)
```

Unit: `parseProduct` без сети.  
Component: mock `fetchProducts`.  
E2E: реальный или MSW — optional.

---

## 12. Частые ошибки

### Fetch в каждом компоненте

Дубли URL, разный parse, невозможный mock.

### API functions возвращают `any`

Смысл слоя теряется.

### Http знает Vue Router

```ts
if (401) router.push('/login') // ❌ в shared/api
```

### QueryFn копирует fetch inline

Обход api layer → два источника правды.

### God `api.ts` на 2000 строк

Дроби по entity: `product`, `user`, `orders`.

### Parse только «на удачу»

`as Product` без проверки — runtime бомба.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Чем `shared/api` отличается от `entities/product/api`?
2. Почему API function без `ref` / `useRoute`?
3. Где parse — и зачем?
4. Как связаны `fetchProducts` и `useQuery`?
5. Почему http не импортирует Pinia напрямую?
6. Что мокать в component tests?

---

## 14. Что почитать

### Связанные материалы этого плана

- [Module 8 · queries](../module-8/03-queries.md)
- [Module 8 · mutations](../module-8/04-mutations.md)
- [Module 11 · API mocking](../module-11/07-api-mocking.md)
- [Module 13 · naming](./04-naming.md)

### Ориентиры

- [TanStack Query · Important Defaults](https://tanstack.com/query/latest/docs/framework/vue/guides/important-defaults)

---

## 15. Практическое мини-задание

1. Вынеси все `fetch(` из pages/components в `entities/*/api`.
2. Добавь `http` wrapper + `ApiError`.
3. `parseProduct` + unit test на bad payload.
4. `useQuery` / `queryFn` только вызывает api function.
5. Component test: `vi.spyOn` на `fetchProducts`, не на `global.fetch`.

---

## 16. Мини-конспект

- API layer = **transport + endpoints + parse**
- `shared/api` vs `entities/*/api`
- pure async → query/mutation wrappers выше
- ошибки типизированы; UX — не в http
- mock api module в тестах
- дальше — **слой composables**

---

## 17. Что делать дальше

Следующий теоретический блок Module 13:

- [Слой composables](./06-composables-layer.md)
