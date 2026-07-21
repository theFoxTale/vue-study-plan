# Module 11 · Теория: тестирование store

Этот материал закрывает шестой теоретический пункт `Module 11`: **Pinia store tests** — `setActivePinia`, actions, getters, cart/auth, `$reset`, без лишнего mount.

Связанные материалы:

- [Module 6 · Pinia](../module-6/04-pinia.md)
- [Module 6 · actions](../module-6/07-actions.md)
- [Module 11 · component tests](./04-component-tests.md)

---

## 1. Зачем тестировать store отдельно

```text
Component test  → cart badge visible after click
Store test      → add() increases totalQty — fast, no DOM
Unit test       → cartSubtotal pure fn — if extracted
```

Store tests проверяют **client state rules** без VTU overhead.

Официально:

- [Pinia · Testing](https://pinia.vuejs.org/cookbook/testing.html)

---

## 2. Setup — fresh Pinia per test

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'

describe('useCartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts empty', () => {
    const cart = useCartStore()
    expect(cart.items).toEqual([])
    expect(cart.totalQty).toBe(0)
  })
})
```

```text
beforeEach → new Pinia → no leaked state between tests
```

**Never** reuse one pinia instance across tests without `$reset`.

---

## 3. Testing actions

```ts
const product = { id: '1', title: 'Phone', price: 99 }

it('add puts item in cart', () => {
  const cart = useCartStore()
  cart.add(product)

  expect(cart.items).toHaveLength(1)
  expect(cart.items[0]).toMatchObject({ id: '1', qty: 1 })
})

it('add same product increases qty', () => {
  const cart = useCartStore()
  cart.add(product)
  cart.add(product)

  expect(cart.items).toHaveLength(1)
  expect(cart.items[0].qty).toBe(2)
  expect(cart.totalQty).toBe(2)
})

it('remove deletes line', () => {
  const cart = useCartStore()
  cart.add(product)
  cart.remove('1')
  expect(cart.items).toHaveLength(0)
})

it('clear empties cart', () => {
  const cart = useCartStore()
  cart.add(product)
  cart.clear()
  expect(cart.items).toEqual([])
})
```

Test **behavior** actions — not that internal `items.value.push` was called.

---

## 4. Testing getters

```ts
it('totalQty sums line quantities', () => {
  const cart = useCartStore()
  cart.add({ id: '1', title: 'A', price: 10 })
  cart.add({ id: '1', title: 'A', price: 10 })
  cart.add({ id: '2', title: 'B', price: 5 })

  expect(cart.totalQty).toBe(3)
})

it('subtotal sums price * qty', () => {
  const cart = useCartStore()
  cart.add({ id: '1', title: 'A', price: 10 })
  cart.add({ id: '1', title: 'A', price: 10 })

  expect(cart.subtotal).toBe(20)
})
```

Complex math → extract `calcSubtotal(items)` unit test + store test **wiring** one happy path.

---

## 5. `$patch` и `$reset`

```ts
it('$reset restores initial state', () => {
  const cart = useCartStore()
  cart.add(product)
  cart.$reset()

  expect(cart.items).toEqual([])
  expect(cart.totalQty).toBe(0)
})
```

Logout flow in auth store:

```ts
it('logout clears session', () => {
  const auth = useAuthStore()
  auth.setSession({ user: { id: '1' }, token: 'x' })
  auth.logout()

  expect(auth.isAuthenticated).toBe(false)
  expect(auth.user).toBeNull()
})
```

---

## 6. Auth store — mock session

```ts
// src/stores/auth.test.ts
import { useAuthStore } from './auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('isAuthenticated false when no user', () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('setSession stores user and token', () => {
    const auth = useAuthStore()
    auth.setSession({
      user: { id: '1', email: 'a@b.com' },
      token: 'jwt',
    })

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user?.email).toBe('a@b.com')
  })
})
```

Async `login` action with api mock — [урок 07](./07-api-mocking.md):

```ts
it('login action sets session on success', async () => {
  vi.spyOn(authApi, 'login').mockResolvedValue({
    user: { id: '1', email: 'a@b.com' },
    token: 'jwt',
  })

  const auth = useAuthStore()
  await auth.login({ email: 'a@b.com', password: 'password123' })

  expect(auth.isAuthenticated).toBe(true)
  expect(authApi.login).toHaveBeenCalled()
})
```

---

## 7. Setup store vs Options store

Testing **same** — `useStore()` after `setActivePinia`:

```ts
// setup store
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartLine[]>([])
  function add(product: Product) { … }
  const totalQty = computed(() => …)
  return { items, add, totalQty }
})
```

```ts
const cart = useCartStore()
cart.add(product)
expect(cart.totalQty).toBe(1)
```

No special API for tests.

---

## 8. `storeToRefs` — usually skip in store tests

Store tests use store directly:

```ts
cart.totalQty // getter on store
```

`storeToRefs` — component concern; test in component spec if needed.

---

## 9. Store + component — division

| Store test | Component test |
|------------|------------------|
| `add` merges qty | click «Add to cart» → badge «1» |
| `logout` clears user | header hides username |
| getter `subtotal` | `/cart` page shows total price |

Don't repeat every store case in component tests — **key paths** only.

---

## 10. Multiple stores interaction

```ts
it('checkout clears cart after order', async () => {
  vi.spyOn(ordersApi, 'placeOrder').mockResolvedValue({ id: 'order-1' })

  const cart = useCartStore()
  cart.add(product)

  const checkout = useCheckoutStore()
  await checkout.placeOrder()

  expect(cart.items).toHaveLength(0)
})
```

Cross-store — fewer tests; prefer integration or e2e for full checkout.

---

## 11. Initial state / hydration

If store reads `localStorage` on init *(stretch)*:

```ts
beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})
```

Mock `localStorage` in jsdom — isolate side effects.

Module 6 MVP often **no persist** — simpler tests.

---

## 12. File layout

```text
src/stores/
  cart.ts
  cart.test.ts
  auth.ts
  auth.test.ts
```

Colocate like composables.

---

## 13. Что не класть в Pinia store tests

```text
❌ products list from API (vue-query — Module 8)
❌ form draft fields (local/VeeValidate — Module 9)
❌ testing Pinia plugin internals
```

Store tests = **shared client state** only.

---

## 14. Частые ошибки

### Forgot `setActivePinia`

`[🍍]: getActivePinia was called with no active Pinia`

### Shared pinia across tests

Second test sees first test's cart items — always `beforeEach` fresh pinia.

### Assert direct mutation worked

```ts
cart.items.push(...) // bypassing action — don't test this way
```

Use public actions.

### Test getter by reimplementing formula in test

```ts
expect(cart.subtotal).toBe(cart.items.reduce(...)) // duplicate logic
```

Assert known outcome: `add` two items → `subtotal === 20`.

### Mock entire store in component AND duplicate all tests in store

Split responsibility.

### Async action without await

```ts
auth.login(...) // missing await — false pass/fail
```

---

## 15. Catalog MVP store tests

Module 11 practice:

- [ ] `cart.test.ts` — add, remove, totalQty, clear
- [ ] `auth.test.ts` — setSession, logout, isAuthenticated
- [ ] optional: async login with mocked api

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Зачем `setActivePinia(createPinia())` in beforeEach?
2. Actions vs getters — examples?
3. `$reset` when?
4. Store vs component test split?
5. Products list — store or query?
6. Async login action — mock what?

---

## 17. Что почитать

### Официальное

- [Pinia · Testing stores](https://pinia.vuejs.org/cookbook/testing.html)
- [Pinia · Unit testing components](https://pinia.vuejs.org/cookbook/testing.html#Unit-testing-components)

### Связанные материалы этого плана

- [Module 6 · store best practices](../module-6/09-store-best-practices.md)
- [Module 11 · API mocking](./07-api-mocking.md)

---

## 18. Практическое мини-задание

1. `cart.test.ts` — add, duplicate add, remove, subtotal
2. `auth.test.ts` — session + logout
3. `beforeEach` fresh pinia in both files
4. One async login test with `vi.spyOn` *(optional)*
5. `npm run test:run` green

---

## 19. Мини-конспект

- fresh Pinia each test via setActivePinia
- test actions + getters behavior
- $reset for logout/clear
- no products API in store tests
- component tests for DOM wiring only
- дальше — **мокирование API**

---

## 20. Что делать дальше

Следующий теоретический блок Module 11:

- [мокирование API](./07-api-mocking.md)

Разберём `vi.mock`, `vi.spyOn`, MSW, моки в store/component/composable tests.
