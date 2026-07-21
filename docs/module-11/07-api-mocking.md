# Module 11 · Теория: мокирование API

Этот материал закрывает седьмой теоретический пункт `Module 11`: **mock API** в tests — `vi.spyOn`, `vi.mock`, fixtures, axios/fetch, MSW overview, reset между tests.

Связанные материалы:

- [Module 7 · data layer](../module-7/09-data-layer.md)
- [Module 11 · component tests](./04-component-tests.md)
- [Module 11 · store testing](./06-store-testing.md)

---

## 1. Зачем мокировать API в tests

```text
Real HTTP in unit/component tests → slow, flaky, needs network/CORS
Mock api layer              → fast, deterministic, tests behavior
```

```text
Test WHAT component/store does when API returns X or fails
Not WHETHER axios works
```

E2E — real API or test server — [урок 08](./08-e2e-intro.md).

---

## 2. Граница mock — `src/api/*`

Catalog architecture:

```text
Component / Store / useQuery
        ↓
   src/api/products.ts   ← mock HERE
        ↓
   axios / fetch (real — not called in tests)
```

```ts
// ✅ mock
vi.spyOn(productsApi, 'fetchProductsPage')

// ❌ avoid in component test
global.fetch = vi.fn()
axios.get = vi.fn() // scattered, hard to maintain
```

One **api module** = one mock surface.

---

## 3. `vi.spyOn` — partial mock *(recommended default)*

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as productsApi from '@/api/products'
import { parseProduct } from '@/api/parseProduct'

describe('CatalogPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows products when api succeeds', async () => {
    vi.spyOn(productsApi, 'fetchProductsPage').mockResolvedValue({
      items: [parseProduct({ id: 1, title: 'Phone', price: 99, thumbnail: '' })],
      total: 1,
      page: 1,
    })

    // mount + flushPromises …
  })
})
```

| | `spyOn` | `mock` entire module |
|---|---------|----------------------|
| Real exports | only stubbed methods | all mocked |
| Refactor friendly | **better** | must update factory |
| Use when | most catalog tests | full isolation / no impl |

`mockResolvedValue` — async success; `mockRejectedValue` — error path.

---

## 4. `vi.mock` — module factory

```ts
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
}))

import { login } from '@/api/auth'

it('…', async () => {
  vi.mocked(login).mockResolvedValue({ user: { id: '1' }, token: 'x' })
})
```

**Hoisting:** `vi.mock` поднимается наверх файла — ставь **до** imports или используй `vi.mock` + dynamic import pattern.

```ts
// auth.test.ts top
vi.mock('@/api/auth')

import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
```

Factory replaces **whole module** — ok for small api files.

---

## 5. Fixtures + mock together

```ts
import { dummyJsonProduct } from '@/api/__fixtures__/product.raw'
import { parseProduct } from '@/api/parseProduct'

vi.spyOn(productsApi, 'fetchProductById').mockResolvedValue(
  parseProduct(dummyJsonProduct),
)
```

```text
Fixture = raw API shape
parseProduct = real code path in test
Mock = controlled return
```

Tests real parse + mocked transport — good integration balance.

---

## 6. Error paths

```ts
vi.spyOn(productsApi, 'fetchProductsPage').mockRejectedValue(
  Object.assign(new Error('Network error'), { code: 'network' }),
)

// or use your toAppError-shaped error
vi.spyOn(productsApi, 'login').mockRejectedValue({
  status: 401,
  message: 'Unauthorized',
})
```

Component test:

```ts
await flushPromises()
expect(wrapper.text()).toMatch(/try again|invalid/i)
```

Always test **как минимум один** error scenario per critical screen.

---

## 7. Store action + api mock

```ts
import * as authApi from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

it('login stores session from api', async () => {
  vi.spyOn(authApi, 'login').mockResolvedValue({
    user: { id: '1', email: 'a@b.com' },
    token: 'jwt',
  })

  setActivePinia(createPinia())
  const auth = useAuthStore()

  await auth.login({ email: 'a@b.com', password: 'pass12345' })

  expect(authApi.login).toHaveBeenCalledWith({
    email: 'a@b.com',
    password: 'pass12345',
  })
  expect(auth.isAuthenticated).toBe(true)
})
```

Assert **store outcome**, optionally `toHaveBeenCalledWith` — not internal axios config.

---

## 8. vue-query + mocked api

```ts
const queryClient = createTestQueryClient()

vi.spyOn(productsApi, 'fetchProductById').mockResolvedValue(product)

mount(ProductDetailsPage, {
  props: { id: '42' },
  global: {
    plugins: [[VueQueryPlugin, { queryClient }]],
  },
})

await flushPromises()
```

```ts
// createTestQueryClient — retry: false
```

Query calls **real** `queryFn` → hits mocked api function — no need to mock `useQuery`.

---

## 9. Mutations mock

```ts
vi.spyOn(productsApi, 'deleteProduct').mockResolvedValue(undefined)

// trigger delete in modal confirm
await flushPromises()

expect(productsApi.deleteProduct).toHaveBeenCalledWith('42')
expect(toast.success).toHaveBeenCalled() // if toast mocked separately
```

Invalidate behavior — assert mock `deleteProduct` + optional spy on `queryClient.invalidateQueries` *(advanced)*; often **api called + UI feedback** enough.

---

## 10. MSW — Mock Service Worker *(overview)*

```bash
npm install -D msw
```

Intercept HTTP at network level:

```ts
// tests/msw/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/products', () => {
    return HttpResponse.json({ products: [], total: 0 })
  }),
]
```

```ts
// tests/setup.ts
import { setupServer } from 'msw/node'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

| | `vi.spyOn(api)` | MSW |
|---|-----------------|-----|
| Setup | low | medium |
| Tests real fetch URL | no | **yes** |
| Pet catalog | **enough** | stretch / shared with e2e |

Module 11 MVP — **`spyOn` on api modules**; MSW optional for teams wanting HTTP-level tests.

---

## 11. Mock timers + api

Rare combo — api timeout:

```ts
vi.spyOn(productsApi, 'fetchProductsPage').mockImplementation(
  () => new Promise((resolve) => setTimeout(() => resolve(page), 5000)),
)
vi.useFakeTimers()
// test loading state
vi.advanceTimersByTime(5000)
vi.useRealTimers()
```

---

## 12. Cleanup between tests

```ts
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

| API | Effect |
|-----|--------|
| `clearAllMocks` | reset call history |
| `restoreAllMocks` | restore original implementation after spyOn |

Prevent **call count leak** between tests.

---

## 13. Don't mock what you own — parse/utils

```text
✓ mock fetchProductsPage
✓ use real parseProduct with fixture
✗ mock parseProduct to return fake Product — unless testing caller isolation
```

Test parse failures in **unit tests** with bad fixtures — not every component test.

---

## 14. Anti-patterns

### Global fetch mock never reset

Flaky suite — scope mock per file/test.

### Mock implementation duplicated in 10 files

Shared helper:

```ts
// tests/mockProductsApi.ts
export function mockProductsList(items: Product[]) {
  return vi.spyOn(productsApi, 'fetchProductsPage').mockResolvedValue({
    items,
    total: items.length,
    page: 1,
  })
}
```

### Assert axios called with exact header object

Too brittle — assert api function called / UI result.

### Real API in CI

No network dependency in `vitest run`.

### Mock vue-query instead of api

Loses queryFn integration — mock api layer.

---

## 15. Catalog mock cheat sheet

```ts
// tests/mockProductsApi.ts — example
import * as productsApi from '@/api/products'

export function mockEmptyCatalog() {
  return vi.spyOn(productsApi, 'fetchProductsPage').mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
  })
}

export function mockCatalogError() {
  return vi.spyOn(productsApi, 'fetchProductsPage').mockRejectedValue(new Error('fail'))
}
```

Use in `CatalogPage.spec.ts`, store tests, etc.

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Где граница mock в catalog?
2. `spyOn` vs `vi.mock`?
3. Как test error path?
4. vue-query + mock — что мокать?
5. Зачем `restoreAllMocks`?
6. Когда MSW vs spyOn?

---

## 17. Что почитать

### Официальное

- [Vitest · Mocking](https://vitest.dev/guide/mocking.html)
- [Vitest · vi.spyOn](https://vitest.dev/api/vi.html#vi-spyon)
- [MSW · Getting started](https://mswjs.io/docs/getting-started)

### Связанные материалы этого плана

- [Module 7 · api layer](../module-7/09-data-layer.md)
- [Module 11 · component tests](./04-component-tests.md)

---

## 18. Практическое мини-задание

1. `mockProductsList` helper
2. CatalogPage test — success + error with spyOn
3. Auth login store test with mocked `login`
4. `beforeEach` restoreAllMocks
5. One test uses fixture + real parseProduct

---

## 19. Мини-конспект

- mock `src/api/*`, not fetch everywhere
- spyOn default; vi.mock for full replace
- fixtures + real parse = good integration
- error paths mandatory for critical flows
- restore mocks between tests
- MSW optional; e2e uses real browser
- дальше — **e2e intro**

---

## 20. Что делать дальше

Следующий теоретический блок Module 11:

- [базовый e2e-подход](./08-e2e-intro.md)
