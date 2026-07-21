# Module 11 · Теория: unit tests

Этот материал закрывает третий теоретический пункт `Module 11`: **unit test layer** — что тестировать без DOM, utils, Zod schemas, parsers, pure domain logic, структура и именование.

Связанные материалы:

- [Module 11 · Vitest](./01-vitest.md)
- [Module 11 · Vue Test Utils](./02-vue-test-utils.md)
- [Module 9 · Zod](../module-9/05-zod.md)
- [Module 4 · typing API responses](../module-4/05-typing-api-responses.md)

---

## 1. Слои тестирования в catalog app

```text
Unit          → pure fn, schema, parse — no Vue mount
Component     → mount one .vue — VTU (урок 04)
Composable      → withSetup / mount helper (урок 05)
Store           → Pinia isolated (урок 06)
Integration     → component + plugins + mock api
E2E             → real browser (урок 08)
```

**Unit** — самый быстрый и дешёвый слой. Начинай с него для utils и validation.

```text
Больше unit tests на pure code
Меньше, но ценнее component tests на UX paths
```

---

## 2. Что считается unit test

| Unit *(Vitest only)* | Не unit |
|----------------------|---------|
| `formatPrice(99)` | `mount(CatalogPage)` |
| `loginSchema.safeParse(data)` | `useQuery` + real fetch |
| `parseProduct(json)` | full Router navigation |
| `calcCartTotal(items)` | Pinia store + component together |
| `toAppError(axiosErr)` | Playwright click flow |

**Признак:** нет `mount`, нет network, нет browser — только import + call + expect.

Composable **без** lifecycle можно тестировать как unit; с `onMounted` — [урок 05](./05-composables-testing.md).

---

## 3. Структура unit test — AAA

```text
Arrange  → подготовка input
Act      → вызов функции
Assert   → expect outcome
```

```ts
it('returns empty array when API returns empty products list', () => {
  // Arrange
  const raw = { products: [] }

  // Act
  const result = parseProductsPage(raw)

  // Assert
  expect(result.items).toEqual([])
  expect(result.total).toBe(0)
})
```

Один `it` — **одна** проверяемая идея *(можно несколько expect на один outcome)*.

---

## 4. Именование tests

```text
✓ 'rejects email without @'
✓ 'formats price with two decimal places'
✓ 'maps 404 axios error to AppError not found'

✗ 'test1'
✗ 'parseProduct works'
✗ 'should call z.string'
```

Pattern: **`[unit under test] + [scenario] + [expected]`**

```ts
describe('parseProduct', () => {
  it('maps DummyJSON shape to Product type', () => { … })
  it('throws ValidationError when id is missing', () => { … })
})
```

Тест читается как **спецификация поведения**.

---

## 5. Utils — `formatPrice`, `toApiParams`

```ts
// src/utils/formatPrice.test.ts
import { describe, it, expect } from 'vitest'
import { formatPrice } from './formatPrice'

describe('formatPrice', () => {
  it('formats positive number as currency', () => {
    expect(formatPrice(99.5)).toBe('$99.50')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })
})
```

```ts
// src/utils/catalogFilters.test.ts
import { parseCatalogFilters } from './catalogFilters'

describe('parseCatalogFilters', () => {
  it('defaults page to 1 when query param missing', () => {
    expect(parseCatalogFilters({})).toEqual({
      page: 1,
      category: 'all',
      q: '',
    })
  })

  it('parses page from route query string', () => {
    expect(parseCatalogFilters({ page: '3' })).toMatchObject({ page: 3 })
  })
})
```

Router query → plain object in, typed filters out — **ideal unit**.

---

## 6. Zod schemas — form validation

```ts
// src/schemas/loginSchema.test.ts
import { describe, it, expect } from 'vitest'
import { loginSchema } from './loginSchema'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined()
    }
  })

  it('rejects password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })
})
```

```ts
describe('registerSchema', () => {
  it('rejects mismatched confirmPassword', () => {
    const result = registerSchema.safeParse({
      name: 'Ann',
      email: 'a@b.com',
      password: 'password123',
      confirmPassword: 'different',
      agreed: true,
    })
    expect(result.success).toBe(false)
  })
})
```

Module 9 schemas — **high ROI** unit tests, no Vue.

---

## 7. API parse layer — `parseProduct`

```ts
// src/api/parseProduct.test.ts
import { describe, it, expect } from 'vitest'
import { parseProduct, parseProductsPage } from './parseProduct'

const validProduct = {
  id: 42,
  title: 'Phone',
  price: 99,
  thumbnail: 'https://example.com/p.jpg',
}

describe('parseProduct', () => {
  it('returns typed Product for valid payload', () => {
    const product = parseProduct(validProduct)
    expect(product).toEqual({
      id: '42',
      title: 'Phone',
      price: 99,
      imageUrl: 'https://example.com/p.jpg',
    })
  })

  it('throws when title is missing', () => {
    expect(() => parseProduct({ id: 1 })).toThrow()
  })
})

describe('parseProductsPage', () => {
  it('extracts items and total from DummyJSON list shape', () => {
    const page = parseProductsPage({
      products: [validProduct],
      total: 100,
      skip: 0,
      limit: 20,
    })
    expect(page.items).toHaveLength(1)
    expect(page.total).toBe(100)
  })
})
```

Fixtures рядом с тестом:

```ts
// src/api/__fixtures__/product.raw.ts
export const dummyJsonProduct = { … }
```

---

## 8. Error mapping — `toAppError`

```ts
// src/api/errors.test.ts
import { describe, it, expect } from 'vitest'
import { toAppError } from './errors'

describe('toAppError', () => {
  it('maps abort to aborted code', () => {
    const err = new DOMException('Aborted', 'AbortError')
    expect(toAppError(err).code).toBe('aborted')
  })

  it('maps 404 response to not found message', () => {
    const axiosLike = {
      isAxiosError: true,
      response: { status: 404, data: { message: 'Not found' } },
    }
    expect(toAppError(axiosLike).code).toBe('http')
    expect(toAppError(axiosLike).status).toBe(404)
  })
})
```

Module 7 error layer — unit tests prevent regressions on edge cases.

---

## 9. Pure domain — cart totals

```ts
// src/domain/cart.test.ts
import { describe, it, expect } from 'vitest'
import { lineTotal, cartSubtotal } from './cart'

describe('cartSubtotal', () => {
  it('sums qty * price for all lines', () => {
    const total = cartSubtotal([
      { id: '1', qty: 2, price: 10 },
      { id: '2', qty: 1, price: 5 },
    ])
    expect(total).toBe(25)
  })

  it('returns 0 for empty cart', () => {
    expect(cartSubtotal([])).toBe(0)
  })
})
```

Logic extracted from Pinia getter → unit test; store test checks **action wiring** — [урок 06](./06-store-testing.md).

---

## 10. `productKeys` factory

```ts
// src/queries/productKeys.test.ts
import { describe, it, expect } from 'vitest'
import { productKeys } from './productKeys'

describe('productKeys', () => {
  it('list key includes filters in stable order', () => {
    const key = productKeys.list({ page: 2, category: 'phones', q: '' })
    expect(key).toContain('list')
    expect(key).toContainEqual({ page: 2, category: 'phones', q: '' })
  })

  it('detail key includes id', () => {
    expect(productKeys.detail('42')).toEqual(
      expect.arrayContaining(['42']),
    )
  })
})
```

Cache identity bugs — cheap to catch with unit tests.

---

## 11. Test data и fixtures

```text
src/
  api/__fixtures__/
    product.raw.ts
    products-page.raw.ts
  schemas/__fixtures__/
    valid-login.ts
```

```ts
import { dummyJsonProduct } from './__fixtures__/product.raw'

it('…', () => {
  expect(parseProduct(dummyJsonProduct).title).toBe('Phone')
})
```

**Не** копируй большой JSON в каждый test — shared fixtures.

---

## 12. `environment: 'node'` для pure tests

```ts
// vitest.config — optional per-file
// @vitest-environment node
```

Pure TS files без DOM — можно быстрее на node. Default `jsdom` для всего проекта тоже ok.

---

## 13. Table — unit test candidates в catalog

| File / area | Example tests |
|-------------|---------------|
| `schemas/*` | valid/invalid fields, refine |
| `api/parse*` | shape mapping, throw on bad data |
| `api/errors` | status codes, abort |
| `utils/format*` | edge numbers |
| `utils/query parsers` | route query → filters |
| `domain/cart` | totals, empty |
| `queries/*Keys` | key structure |
| `composables/ui/useDisclosure` | toggle *(simple — or lesson 05)* |

**Skip unit:** trivial one-liner re-exports, generated code, CSS-only files.

---

## 14. Unit vs component — пример login

| Layer | Test |
|-------|------|
| **Unit** | `loginSchema` rejects bad email |
| **Component** | `LoginPage` shows error text after submit |
| **E2E** | user logs in and sees catalog |

Не дублируй всё три раза — **unit schema + component happy path** often enough.

---

## 15. Частые ошибки

### Unit test that mounts Vue

That's component test — rename/move file.

### Testing private function via export hack

Test public API of module.

### Giant fixture copy-paste

Use `__fixtures__`.

### Assert exact error message string that changes weekly

Assert `success === false` or error path key; stable messages ok for schemas.

### No edge cases — only happy path

Add empty, null, boundary values.

### Mocking everything in unit test

Unit should need **few or zero** mocks.

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Чем unit от component test?
2. Примеры unit candidates в catalog?
3. AAA pattern?
4. Зачем тестировать Zod schemas?
5. Зачем parse tests с fixtures?
6. Когда extract fn from store for unit test?

---

## 17. Что почитать

### Официальное

- [Vitest · Test API](https://vitest.dev/api/)
- [Vitest · Test Context](https://vitest.dev/guide/test-context.html)

### Связанные материалы этого плана

- [Module 11 · Vitest](./01-vitest.md)
- [Module 7 · error handling](../module-7/03-error-handling.md)

---

## 18. Практическое мини-задание

1. `loginSchema.test.ts` — 3 cases
2. `parseProduct.test.ts` — valid + invalid
3. `formatPrice.test.ts` or cart total
4. One `__fixtures__` file
5. All green with `npm run test:run`

---

## 19. Мини-конспект

- unit = pure logic, no mount, no network
- schemas, parse, utils, domain — best ROI
- AAA + behavior naming
- fixtures for API shapes
- complement, don't replace, component tests
- дальше — **component tests**

---

## 20. Что делать дальше

Следующий теоретический блок Module 11:

- [component tests](./04-component-tests.md)
