# Module 11 · Теория: что тестировать и behavior vs implementation

Этот материал закрывает девятый и десятый теоретические пункты `Module 11`: **scope тестов** — что стоит и не стоит покрывать; **behavior vs implementation** — тесты как спецификация для пользователя, не audit кода.

Связанные материалы:

- [Module 11 · unit tests](./03-unit-tests.md)
- [Module 11 · component tests](./04-component-tests.md)
- [Module 11 · e2e intro](./08-e2e-intro.md)

---

## 1. Цель тестов в учебном catalog

```text
Не: «coverage 80%»
Да: «regression на login, cart, catalog не ломается после refactor»
```

README Module 11:

- критические **user scenarios** покрыты
- тесты **читаются как описание поведения**
- нет массы проверок **внутренней реализации**

---

## 2. Behavior vs implementation

| **Behavior** (test this) | **Implementation** (avoid) |
|--------------------------|----------------------------|
| User sees error after empty submit | `wrapper.vm.submitAttempted === true` |
| Cart badge shows «2» after two adds | `cart.items[0].qty` ref identity |
| Modal closes on Escape | `close()` was called once |
| List shows «No products» when empty | `useQuery` cache key shape |
| Login redirects to home | `router.push` mock 3rd arg |

```ts
// ✓ behavior
expect(wrapper.get('[role="alert"]').text()).toMatch(/email is required/i)

// ✗ implementation
expect(wrapper.vm.errors.email).toBe('Email is required')
```

Public **observable** surface:

- rendered text / roles
- emitted events *(from child to parent)*
- URL change *(e2e/router)*
- store state **when testing store directly**

`vm.errors` иногда ok в **unit** store/composable tests — не в user-facing component spec без DOM.

---

## 3. Тест как документация

```ts
it('shows validation error when user submits empty login form', async () => {
  …
})

it('adds quantity when same product added twice', () => {
  …
})
```

Новый разработчик читает `describe` / `it` — понимает **контракт** без README.

Если название теста нужно объяснять — переименуй.

---

## 4. Что стоит тестировать (catalog)

### High ROI

| Area | Layer | Why |
|------|-------|-----|
| Zod schemas | unit | cheap; rules duplicated nowhere |
| `parseProduct` / errors | unit | data corruption = broken UI |
| Cart store actions | store | business rules centralized |
| Login validation + error UI | component | critical path |
| `TextField` error/a11y | component | reused everywhere |
| `useDisclosure` / `useModal` | composable | shared UI logic |
| Catalog → detail | e2e | router + real integration |

### Medium ROI

| Area | Layer |
|------|-------|
| vue-query page loading/error | component + mock api |
| Auth store login action | store + mock api |
| BaseModal close behavior | component |
| ProductCard add emit | component |

### Lower priority (pet-project)

| Area | Note |
|------|------|
| Every getter one-liner | test via action outcomes |
| CSS exact values | visual, not vitest |
| Third-party lib internals | trust Vue Router / Pinia |
| Snapshot whole pages | brittle |

---

## 5. Что не стоит тестировать

```text
❌ Vue reactivity works
❌ Pinia `$patch` framework code
❌ `@tanstack/vue-query` refetch scheduler internals
❌ every private function in page script
❌ duplicate: schema unit + component + e2e same assertion
❌ generated boilerplate
❌ constant re-exports
```

```text
❌ «component renders without crash» only — zero assertion value
❌ test that mock was called but UI unchanged — incomplete
```

**Skip** tests that only prove «code runs» without business meaning.

---

## 6. Pyramid applied — без дублирования

```text
loginSchema rejects empty email     → unit (once)
LoginPage shows email error         → component (once)
user cannot reach catalog w/o login → e2e (optional once)
```

Same rule **three times** — waste. Pick layers by **feedback speed**:

```text
Rules/format     → unit
UI wiring        → component
Full journey     → e2e
```

---

## 7. Critical scenarios — catalog checklist

Module 11 practice minimum **behaviors**:

1. **Browse** — catalog shows products *(component or e2e)*
2. **Auth** — login validation or failed login message *(component)*
3. **Cart** — add increases qty/total *(store + optional component)*
4. **Data** — parse or schema rejects bad API shape *(unit)*

Optional:

5. Delete confirm modal
6. Profile save success toast
7. Query error + retry button

Write scenarios as **Given / When / Then** in comments:

```ts
// Given empty login form
// When user submits
// Then email required message visible
```

---

## 8. Implementation smells in tests

### Testing CSS classes as behavior

```ts
expect(wrapper.classes()).toContain('btn--primary') // design detail
expect(wrapper.get('button').attributes('disabled')).toBeDefined() // ok
```

### Spying on every internal method

```ts
expect(cart.add).toHaveBeenCalled() // ok in isolation test
// + expect wrapper.vm.onAddHandler).toHaveBeenCalled() // redundant
```

### Asserting call order of private helpers

Refactor breaks test without user-visible bug.

### Matching full HTML snapshot

```ts
expect(wrapper.html()).toMatchSnapshot() // 400 lines noise
```

### Testing Pinia by mutating state directly in component test

```ts
cart.items.push(fake) // bypasses action — test wrong layer
cart.add(product) // store test
```

---

## 9. Refactor-friendly tests

```text
Good tests survive:
  rename internal variable
  extract composable
  change CSS module

Bad tests break:
  rename private method
  split component file
  swap div → button (same behavior)
```

Prefer **roles, labels, testid, visible text** over DOM structure depth.

```ts
page.getByRole('button', { name: 'Add to cart' })
```

---

## 10. Coverage metrics

```bash
vitest run --coverage
```

| Metric | Use |
|--------|-----|
| Line % | hint only |
| Uncovered parse/schema | **fix** |
| Uncovered dead code | delete code |
| 100% on `.vue` pages | **not** goal |

README: **critical scenarios** > percentage.

---

## 11. When to add a test

Ask:

1. **Regression risk** — bug or refactor likely here?
2. **User impact** — login/cart/payment level?
3. **Complexity** — parse, refine, cart merge rules?
4. **Cheaper layer** — unit instead of e2e?

If all no — skip or manual QA ok for pet-project.

---

## 12. When **not** to add more tests

```text
✓ MVP scenarios green
✓ CI runs test:run on push
✓ diminishing returns — testing getters that mirror one line
```

Move on to Module 12+ — perf, build, deploy.

---

## 13. Behavior table — examples from modules

| Module feature | Behavior assertion |
|----------------|-------------------|
| Module 7 empty state | text «No products found» |
| Module 8 query error | «Try again» button visible |
| Module 9 login | error under email field |
| Module 10 modal | dialog hidden after Escape |
| Module 6 cart | totalQty 2 after two adds |

Link tests to **features user sees**.

---

## 14. Team conventions (solo project)

Document in `tests/README.md` or project root:

```markdown
## Testing policy
- Colocate `*.test.ts`
- Mock `@/api/*` only
- Component: DOM + emits, not vm private
- E2E: 2–4 flows max
- Required before merge: `npm run test:run`
```

Consistency beats perfect philosophy.

---

## 15. Частые ошибки

### Tests mirror implementation line-by-line

Double maintenance — test outcomes.

### No tests on parse/schemas — only UI

Bugs in data shape slip to production.

### E2E only project

Slow feedback; hard debug.

### Testing library code copied from docs

Zero value.

### Flaky e2e with waitForTimeout

Fix selectors/waits — [урок 08](./08-e2e-intro.md).

### Assert exact axios config object

Api module contract + UI enough.

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Behavior vs implementation — пример?
2. Three catalog tests high ROI?
3. What to skip?
4. Why not duplicate schema test in e2e?
5. When is `vm` assertion ok?
6. Module 11 done when?

---

## 17. Что почитать

### Официальное

- [Testing Library · Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [Kent C. Dodds · Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- [Vitest · Best Practices](https://vitest.dev/guide/)

### Связанные материалы этого плана

- [Module 11 · e2e intro](./08-e2e-intro.md)
- [Module 11 · unit tests](./03-unit-tests.md)

---

## 18. Практическое мини-задание

1. List 4 critical behaviors for your catalog
2. Map each to layer (unit/component/e2e)
3. Rename one vague `it('works')` to behavior name
4. Remove or rewrite one implementation-heavy test
5. Add `tests/README.md` one-paragraph policy

---

## 19. Мини-конспект

- test what user/store **observes**, not private glue
- pyramid: unit many, e2e few, no duplicate layers
- schemas/parse/store rules = high ROI
- skip framework, CSS, snapshots, 100% coverage chase
- tests = living spec of critical paths
- **теория Module 11 завершена** → practice checklist

---

## 20. Что делать дальше

Теория Module 11 завершена. Переходи к практике:

- [Module 11 · practice checklist](./10-practice-checklist.md)

Собери unit + component + store tests; optional e2e; `npm run test:run` в CI-ready состоянии.
