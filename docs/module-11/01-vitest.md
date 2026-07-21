# Module 11 · Теория: Vitest

Этот материал открывает **Module 11** и закрывает первый теоретический пункт: **Vitest** — установка в Vite/Vue проект, структура тестов, `describe` / `it` / `expect`, scripts, конфиг.

Связанные материалы:

- [Module 10 · composables](../module-10/05-composables-reuse-layer.md)
- [Module 4 · typing composables](../module-4/03-typing-composables.md)

---

## 1. Зачем Module 11

```text
Module 5–10  → catalog app растёт: router, query, forms, UI kit
Module 11    → confidence: regressions ловятся до deploy
```

Тесты в этом плане — **осмысленные проверки поведения**, не 100% coverage ради галочки.

**Vitest** — test runner, созданный для **Vite**-экосистемы:

- тот же config/transform что dev build
- быстрый HMR-like watch mode
- Jest-compatible API (`describe`, `expect`, mocks)

Официально:

- [Vitest](https://vitest.dev/)
- [Getting Started](https://vitest.dev/guide/)

---

## 2. Vitest vs Jest в Vue project

| | Vitest | Jest |
|---|--------|------|
| Vite project | **native** | extra config |
| ESM / `@/` alias | из `vite.config` | duplicate |
| Speed | fast | ok |
| API | Jest-like | Jest |

Pet-project на Vite + Vue 3 → **Vitest** default choice.

---

## 3. Установка

```bash
npm install -D vitest
```

Vue + jsdom для component tests *(полная настройка VTU — [следующий урок](./02-vue-test-utils.md))*:

```bash
npm install -D @vue/test-utils jsdom
```

`package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui"
  }
}
```

```bash
npm run test        # watch mode
npm run test:run    # CI single run
```

---

## 4. Минимальный `vitest.config.ts`

```ts
import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.{test,spec}.{js,ts}'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
```

Or inline in `vite.config.ts`:

```ts
/// <reference types="vitest/config" />
export default defineConfig({
  // …
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

**`globals: true`** — `describe` / `it` / `expect` без import *(optional; explicit imports тоже ok)*.

**`environment: 'jsdom'`** — browser-like DOM для components; pure TS utils могут использовать `environment: 'node'`.

---

## 5. Где лежат тесты

```text
src/
  utils/
    formatPrice.ts
    formatPrice.test.ts      # colocated — recommended
  composables/ui/
    useDisclosure.ts
    useDisclosure.test.ts
  components/ui/
    BaseModal.vue
    BaseModal.spec.ts
tests/                       # optional integration/e2e helpers
  setup.ts
```

| Pattern | Когда |
|---------|--------|
| `*.test.ts` рядом с файлом | unit, composable, util |
| `*.spec.ts` | component *(convention varies)* |
| `tests/` folder | shared setup, e2e |

Module 11 practice: **colocated** tests для composables/utils минимум.

---

## 6. Первый unit test — pure function

```ts
// src/utils/formatPrice.test.ts
import { describe, it, expect } from 'vitest'
import { formatPrice } from './formatPrice'

describe('formatPrice', () => {
  it('formats number as USD by default', () => {
    expect(formatPrice(99)).toBe('$99.00')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })
})
```

```ts
// src/utils/formatPrice.ts
export function formatPrice(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}
```

```text
Arrange → Act → Assert
```

Тест **не** трогает Vue, DOM, network — fastest layer.

---

## 7. `describe` / `it` / `test`

```ts
describe('loginSchema', () => {
  it('accepts valid email and password', () => { … })
  it('rejects empty email', () => { … })

  describe('password rules', () => {
    it('requires min 8 chars', () => { … })
  })
})
```

`it` = `test` — alias.

Имена **поведение**, не implementation:

```text
✓ 'rejects empty email'
✗ 'calls z.string().min'
```

---

## 8. Основные matchers

```ts
expect(value).toBe(42)              // strict equality
expect(obj).toEqual({ a: 1 })       // deep equality
expect(arr).toContain('vue')
expect(text).toMatch(/error/i)
expect(fn).toThrow()
expect(promise).rejects.toThrow()

expect(value).toBeTruthy()
expect(value).toBeNull()
expect(value).toBeDefined()
```

TypeScript: `@vitest/expect` extends matchers.

---

## 9. `beforeEach` / `afterEach`

```ts
describe('cart calculations', () => {
  let items: LineItem[]

  beforeEach(() => {
    items = [{ id: '1', qty: 2, price: 10 }]
  })

  it('sums line totals', () => {
    expect(total(items)).toBe(20)
  })
})
```

Fresh state per test — избегай order-dependent tests.

---

## 10. Async tests

```ts
it('parses product response', async () => {
  const product = await parseProduct(mockPayload)
  expect(product.id).toBe('42')
})

it('rejects invalid payload', async () => {
  await expect(parseProduct(null)).rejects.toThrow()
})
```

Vitest waits for returned Promise from `async it`.

---

## 11. Mocks preview

```ts
import { vi } from 'vitest'

const fn = vi.fn()
fn('hello')
expect(fn).toHaveBeenCalledWith('hello')

vi.spyOn(console, 'error').mockImplementation(() => {})
```

Full API mocking — [урок 07](./07-api-mocking.md).

```ts
vi.mock('@/api/products', () => ({
  fetchProducts: vi.fn(() => Promise.resolve([])),
}))
```

---

## 12. Snapshot tests — осторожно

```ts
expect(wrapper.html()).toMatchSnapshot()
```

Large snapshots brittle — Module 11 prefers **behavior assertions**.

Snapshots ok для stable small output (formatter, serializer).

---

## 13. Что тестировать на Vitest layer (unit)

| Хорошие кандидаты | Плохие кандидаты |
|-------------------|------------------|
| `formatPrice`, parse helpers | private function names |
| Zod schemas `safeParse` | CSS class list exact order |
| pure cart total fn | every getter trivial |
| composable logic | implementation details |

Component DOM — [Vue Test Utils](./02-vue-test-utils.md).

---

## 14. Watch mode workflow

```bash
npm run test
```

```text
edit formatPrice.ts → tests re-run automatically
```

TDD optional: red → green → refactor для utils/schemas.

---

## 15. Coverage *(optional)*

```bash
npm install -D @vitest/coverage-v8
```

```ts
// vitest.config
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    include: ['src/**/*.{ts,vue}'],
  },
},
```

```bash
vitest run --coverage
```

README Module 11: **critical scenarios** > coverage percentage.

---

## 16. CI one-liner

```bash
npm run test:run
```

Fail build if tests fail — GitHub Actions step *(Module 14+)*.

---

## 17. Частые ошибки

### Tests in `src/` imported in production bundle

`.test.ts` not imported by app — ok; don't import tests from app code.

### Alias `@/` not resolved

Merge vite config in vitest config.

### `document is not defined`

Need `environment: 'jsdom'` for DOM tests.

### Testing implementation: `expect(wrapper.vm.internalCounter)`

Test visible behavior — [урок 09](./09-behavior-vs-implementation.md).

### Flaky async without await

Always return promise or use `async/await`.

### One giant test file for whole app

Split by module/feature.

---

## 18. Что важно понять после этого блока

Проверь себя:

1. Почему Vitest в Vite project?
2. Где colocate unit tests?
3. `toBe` vs `toEqual`?
4. Зачем `beforeEach`?
5. Unit vs component test layer?
6. `test:run` vs watch?

---

## 19. Что почитать

### Официальное

- [Vitest Guide](https://vitest.dev/guide/)
- [Vitest API · expect](https://vitest.dev/api/expect.html)
- [Config · test](https://vitest.dev/config/)

### Связанные материалы этого плана

- [Module 10 · composables tests preview](../module-10/05-composables-reuse-layer.md)

---

## 20. Практическое мини-задание

1. Install vitest + config
2. `formatPrice.test.ts` or `loginSchema.safeParse` tests
3. `npm run test` watch — green
4. One failing test → fix → green
5. Add `test:run` script

---

## 21. Мини-конспект

- Vitest = Vite-native test runner, Jest-like API
- colocate `*.test.ts` with source
- pure functions/schemas — first tests
- jsdom for DOM; merge vite config
- behavior names; mocks later
- дальше — **Vue Test Utils**

---

## 22. Что делать дальше

Следующий теоретический блок Module 11:

- [Vue Test Utils](./02-vue-test-utils.md)

Разберём `mount`, `shallowMount`, queries, events, testing Vue components.
