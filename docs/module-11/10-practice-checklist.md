# Module 11 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 11**: покрыть **catalog app** осмысленными тестами — **unit**, **component**, **store/composable**, optional **e2e**; `npm run test:run` green.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 5–10 должны быть на месте

- [ ] catalog app с router, api layer, Pinia cart *(+ auth optional)*
- [ ] forms (Module 9) и/или UI kit (Module 10) — тестируемые targets
- [ ] `npm run dev` работает

### Прочитай теорию Module 11

- [01 · Vitest](01-vitest.md)
- [02 · Vue Test Utils](02-vue-test-utils.md)
- [03 · unit tests](03-unit-tests.md)
- [04 · component tests](04-component-tests.md)
- [05 · composables testing](05-composables-testing.md)
- [06 · store testing](06-store-testing.md)
- [07 · API mocking](07-api-mocking.md)
- [08 · e2e intro](08-e2e-intro.md)
- [09 · testing philosophy](09-testing-philosophy.md)

---

## Шаг 1. Выбрать проект

| Вариант | Когда |
|---------|--------|
| **Product Catalog Module 5–10** | recommended |
| **Blog + auth + posts** | если catalog исчерпан |

### Рекомендация

Module 11 — **tests для существующего app**, не отдельный test-only repo.

### Checklist

- [ ] выбран проект
- [ ] понятны 3–4 critical user behaviors для MVP

---

## Шаг 2. Зафиксировать MVP Module 11

### MVP (критерии README)

- **Vitest** + config (`vitest.config` or vite `test` block)
- scripts: `test`, `test:run`
- **unit tests** — минимум 1 файл (schema **или** parse **или** util)
- **component tests** — минимум 1 файл (form field **или** page **или** UI component)
- **store OR composable tests** — минимум 1 файл (cart **или** useDisclosure/useModal)
- **mock api** через `vi.spyOn` на `@/api/*` в component/store tests
- тесты **behavior-named** — не `it('works')`
- `npm run test:run` — **all green**
- **no** mass implementation-detail assertions (`wrapper.vm` без DOM)

### Critical behaviors (pick & map)

| Behavior | Layer | Required |
|----------|-------|----------|
| Schema/parse rejects bad data | unit | **yes** (one of) |
| Login shows validation error | component | recommended |
| Cart add increases qty | store | recommended |
| Catalog/detail navigation | component or e2e | one of |
| Query error shows retry | component | optional |

### Из README practice

| Требование | MVP |
|------------|-----|
| покрыть средний проект | catalog app |
| render, events, forms, API, store | spread across layers |
| critical scenarios | ≥3 behaviors |
| readable as spec | behavior `it` names |
| not implementation audit | philosophy check |

### Не обязательно в MVP

- 80%+ coverage
- e2e Playwright *(stretch)*
- MSW
- test every component
- snapshot whole pages
- CI GitHub Actions *(stretch)*

### Checklist

- [ ] MVP behaviors записаны
- [ ] pyramid: unit ≥ component count not inverted by e2e only

---

## Шаг 3. Install & configure Vitest

```bash
npm install -D vitest @vue/test-utils jsdom
```

```ts
// vitest.config.ts — merge with vite.config
test: {
  environment: 'jsdom',
  globals: true,
  include: ['src/**/*.{test,spec}.{ts,tsx}'],
}
```

```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run"
}
```

### Checklist

- [ ] `@/` alias resolves in tests
- [ ] `npm run test:run` executes (even empty/pass)

---

## Шаг 4. Test helpers

```text
tests/
  createTestRouter.ts
  createTestQueryClient.ts
  createTestPinia.ts
  withSetup.ts          # optional
  mockProductsApi.ts    # optional
```

### Checklist

- [ ] at least **createTestPinia** or **createTestQueryClient** if needed
- [ ] `beforeEach` → `vi.restoreAllMocks()` pattern documented

---

## Шаг 5. Unit tests

Pick **≥2** from:

- [ ] `schemas/loginSchema.test.ts` — valid + invalid
- [ ] `api/parseProduct.test.ts` — fixture + throw
- [ ] `utils/formatPrice.test.ts`
- [ ] `domain/cart.test.ts` — subtotal *(if extracted)*
- [ ] `queries/productKeys.test.ts`

```bash
npm run test:run -- src/schemas
```

### Checklist

- [ ] ≥1 unit file green
- [ ] uses `__fixtures__` if API parse
- [ ] behavior names in `it(...)`

---

## Шаг 6. Store tests

- [ ] `stores/cart.test.ts` — add, duplicate add qty, remove, clear
- [ ] optional: `stores/auth.test.ts` — setSession, logout
- [ ] `beforeEach(() => setActivePinia(createPinia()))`

### Checklist

- [ ] fresh pinia each test
- [ ] actions only — no direct `items.push` in test

---

## Шаг 7. Composable tests *(optional if store done)*

- [ ] `useDisclosure.test.ts` — show/hide/toggle
- [ ] `useModal.test.ts` — payload + onClosed
- [ ] `useToast.test.ts` — push/dismiss + beforeEach cleanup

### Checklist

- [ ] shared toast queue reset between tests

---

## Шаг 8. Component tests

Pick **≥2** from:

- [ ] `TextField.spec.ts` — label, error, input emit
- [ ] `LoginPage.spec.ts` — empty submit error + mock login fail
- [ ] `BaseModal.spec.ts` — open/close/Escape
- [ ] `ProductDetailsPage.spec.ts` — mock api + flushPromises

```ts
global: {
  plugins: [createTestPinia(), [VueQueryPlugin, { queryClient }]],
  stubs: { RouterLink: true, Teleport: true },
}
```

### Checklist

- [ ] mock `@/api/*` not global fetch
- [ ] `await flushPromises()` after async
- [ ] assert DOM/text/role — not only `wrapper.vm`

---

## Шаг 9. API mocking discipline

- [ ] all component/store tests that hit network use `vi.spyOn(apiModule, 'fn')`
- [ ] `restoreAllMocks` in `beforeEach`/`afterEach`
- [ ] at least one **error path** test (rejected promise)

---

## Шаг 10. Behavior review

Read each `it` name aloud — does it describe **user/store observable**?

- [ ] no test named only `works` / `renders`
- [ ] no duplicate: same assertion in unit + component + e2e
- [ ] optional: `tests/README.md` one-paragraph policy

---

## Шаг 11. E2E stretch *(optional)*

```bash
npm init playwright@latest
```

- [ ] `e2e/catalog.spec.ts` — list + detail
- [ ] `data-testid="product-card"` in app
- [ ] `npm run test:e2e` green
- [ ] script in `package.json`

---

## Шаг 12. CI-ready

```bash
npm run test:run
```

- [ ] exits 0 locally
- [ ] optional: GitHub Action step `npm run test:run`

---

## Шаг 13. Ручной QA (tests as spec)

1. Break login validation intentionally → unit/component fails  
2. Break cart add qty → store test fails  
3. Rename test behavior — still readable  
4. `test:run` < 30s for pet-project *(guideline)*  
5. No real network in vitest run  

### Checklist

- [ ] tests fail when behavior breaks (sanity check)

---

## Шаг 14. Финальная самопроверка

1. Unit vs component vs store — example from your project?
2. One behavior test vs implementation test you avoided?
3. What api functions do you mock?
4. How many e2e and why?
5. What critical scenario is **not** tested and why ok?
6. Would a new dev understand tests from `it` names alone?

### Checklist

- [ ] ответы своими словами

---

## Финальный checklist Module 11

Module 11 можно считать завершённым, если:

### Tooling

- [ ] Vitest + VTU configured
- [ ] `npm run test:run` green

### Coverage by layer (README)

- [ ] **unit** tests exist
- [ ] **component** tests exist
- [ ] **store OR composable** tests exist
- [ ] api mocked at `@/api/*` boundary where needed

### Quality (README)

- [ ] critical user scenarios covered (≥3)
- [ ] tests read as behavior spec
- [ ] no bulk implementation-detail checks

### Pyramid sanity

| Layer | Have? |
|-------|-------|
| Unit | [ ] |
| Component | [ ] |
| Store/composable | [ ] |
| E2E | [ ] optional |

---

## Stretch goals *(optional)*

- Playwright auth + cart flows
- `@vitest/coverage-v8` report
- MSW for shared handlers
- GitHub Actions test job
- `useToast` fake timers test
- integration test: LoginPage + real VeeValidate + mock api only

---

## Если что-то пошло не так

### `document is not defined`

- `environment: 'jsdom'`

### `@/` import fails

- merge vite config in vitest

### Pinia error in test

- `setActivePinia(createPinia())` before `useStore()`

### Component test timeout

- `await flushPromises()`; QueryClient `retry: false`

### Flaky test order

- reset shared toast state; fresh pinia each test

### All tests mock fetch globally

- refactor to spy on `src/api/*`

### Tests pass but app broken

- add one e2e or manual QA; strengthen behavior asserts

---

## Что делать после Module 11

Переходи к **Module 12 · Производительность**:

- [реактивность под капотом](../module-12/01-reactivity-internals.md)
- лишние rerenders, `v-memo`, `shallowRef`, code splitting
- Vue Devtools profiling
- [практический checklist Module 12](../module-12/11-practice-checklist.md) *(после теории)*

Tests дают safety net — Module 12 оптимизирует **измеримые** узкие места.

---

## Мини-конспект

- Module 11 = pyramid: unit + component + store/composable
- mock api module; behavior asserts
- test:run green; e2e optional stretch
- quality > coverage %
- Module 12 = perf diagnosis with confidence
