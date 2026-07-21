# Module 11 · Теория: component tests

Этот материал закрывает четвёртый теоретический пункт `Module 11`: **component tests** — mount сценарии, user interactions, forms, async UI, stubs/mocks, critical flows catalog app.

Связанные материалы:

- [Module 11 · Vue Test Utils](./02-vue-test-utils.md)
- [Module 11 · unit tests](./03-unit-tests.md)
- [Module 9 · VeeValidate](../module-9/04-veevalidate.md)
- [Module 10 · UI patterns](../module-10/06-ui-patterns.md)

---

## 1. Component test — определение

```text
Mount one component (or small tree)
Simulate user actions
Assert visible outcome / emits — not private vm state
```

```text
Unit:     loginSchema.safeParse
Component: LoginPage shows error after empty submit
E2E:      real browser full flow
```

Component tests — **sweet spot** для forms и UI kit между unit и E2E.

---

## 2. Что тестировать на уровне component

| Приоритет | Component | Scenario |
|-----------|-----------|----------|
| High | `LoginPage` | validation errors, submit disabled |
| High | `TextField` | label, error, aria-invalid |
| High | `AppButton` / `BaseModal` | click, close, emit |
| Medium | `ProductCard` | renders title, emits add-to-cart |
| Medium | `CartPage` | empty state vs items list |
| Lower | full `CatalogPage` | stub grid; test filters/header only |

README Module 11: **critical user scenarios** — login, cart add, delete confirm.

Не mount весь app в каждом test.

---

## 3. Структура component spec

```ts
// src/pages/LoginPage.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import LoginPage from './LoginPage.vue'
import { createTestRouter } from '@/tests/createTestRouter'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows validation error when email is empty on submit', async () => {
    const router = createTestRouter()
    const wrapper = mount(LoginPage, {
      global: { plugins: [router] },
    })

    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toMatch(/email is required/i)
  })
})
```

```text
*.spec.ts or *.test.ts рядом с .vue — оба ok, будь consistent
```

---

## 4. Test helpers — router / pinia / query

```ts
// tests/createTestRouter.ts
import { createRouter, createMemoryHistory } from 'vue-router'

export function createTestRouter(routes = [
  { path: '/', component: { template: '<div>Home</div>' } },
  { path: '/login', component: { template: '<div>Login</div>' } },
]) {
  return createRouter({
    history: createMemoryHistory(),
    routes,
  })
}
```

```ts
// tests/createTestQueryClient.ts
import { QueryClient } from '@tanstack/vue-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
}
```

```ts
// tests/createTestPinia.ts
import { createPinia, setActivePinia } from 'pinia'

export function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}
```

Reuse в specs — не копируй setup 20 раз.

---

## 5. UI component — `TextField`

```ts
import TextField from '@/components/form/TextField.vue'

describe('TextField', () => {
  it('renders label and links input with for/id', () => {
    const wrapper = mount(TextField, {
      props: {
        modelValue: '',
        label: 'Email',
      },
    })
    const label = wrapper.get('label')
    const input = wrapper.get('input')
    expect(label.text()).toContain('Email')
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })

  it('shows error message with role alert', () => {
    const wrapper = mount(TextField, {
      props: {
        modelValue: 'bad',
        label: 'Email',
        error: 'Invalid email',
      },
    })
    expect(wrapper.get('[role="alert"]').text()).toBe('Invalid email')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(TextField, {
      props: { modelValue: '', label: 'Email' },
    })
    await wrapper.get('input').setValue('user@test.com')
    expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['user@test.com'])
  })
})
```

Schema validation — unit test; **visible error on page** — component test.

---

## 6. Form flow — Login with VeeValidate

```ts
import { vi } from 'vitest'
import * as authApi from '@/api/auth'

describe('LoginPage submit', () => {
  it('calls login and navigates on success', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      user: { id: '1', email: 'a@b.com' },
      token: 'fake',
    })

    const router = createTestRouter()
    const push = vi.spyOn(router, 'push')
    const wrapper = mount(LoginPage, {
      global: { plugins: [router, createTestPinia()] },
    })

    await wrapper.get('[data-testid="email"]').setValue('a@b.com')
    await wrapper.get('[data-testid="password"]').setValue('password123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(authApi.login).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password123',
    })
    expect(push).toHaveBeenCalled()
  })

  it('shows error when login fails', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(new Error('Unauthorized'))

    const wrapper = mount(LoginPage, {
      global: { plugins: [createTestRouter(), createTestPinia()] },
    })

    await wrapper.get('[data-testid="email"]').setValue('a@b.com')
    await wrapper.get('[data-testid="password"]').setValue('password123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toMatch(/invalid/i)
  })
})
```

Mock **api module**, not fetch globally — [урок 07](./07-api-mocking.md).

---

## 7. `BaseModal` behavior

```ts
import BaseModal from '@/components/ui/BaseModal.vue'

describe('BaseModal', () => {
  it('does not render dialog when closed', () => {
    const wrapper = mount(BaseModal, {
      props: { open: false, title: 'Test' },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('renders title and body when open', () => {
    const wrapper = mount(BaseModal, {
      props: { open: true, title: 'Delete' },
      slots: { default: 'Sure?' },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('Delete')
    expect(wrapper.text()).toContain('Sure?')
  })

  it('closes on Escape key', async () => {
    const wrapper = mount(BaseModal, {
      props: { open: true, title: 'Delete' },
      global: { stubs: { Teleport: true } },
    })
    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })
})
```

Teleport: stub or `attachTo: document.body` — pick one project-wide strategy.

---

## 8. Component with vue-query

```ts
import { VueQueryPlugin } from '@tanstack/vue-query'
import ProductDetailsPage from '@/pages/ProductDetailsPage.vue'
import * as productsApi from '@/api/products'

describe('ProductDetailsPage', () => {
  it('shows product title when loaded', async () => {
    vi.spyOn(productsApi, 'fetchProductById').mockResolvedValue({
      id: '42',
      title: 'Test Phone',
      price: 99,
      imageUrl: '/x.jpg',
    })

    const queryClient = createTestQueryClient()
    const wrapper = mount(ProductDetailsPage, {
      props: { id: '42' },
      global: {
        plugins: [[VueQueryPlugin, { queryClient }], createTestRouter()],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Test Phone')
  })

  it('shows error state when fetch fails', async () => {
    vi.spyOn(productsApi, 'fetchProductById').mockRejectedValue(new Error('fail'))

    const wrapper = mount(ProductDetailsPage, {
      props: { id: '42' },
      global: {
        plugins: [[VueQueryPlugin, { queryClient: createTestQueryClient() }]],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toMatch(/try again|error/i)
  })
})
```

`retry: false` in test QueryClient — fast failure.

---

## 9. Stubs — isolate component under test

```ts
mount(CatalogPage, {
  global: {
    stubs: {
      ProductGrid: {
        template: '<div data-testid="product-grid-stub" />',
      },
      BaseDropdown: true,
      RouterLink: { template: '<a><slot /></a>' },
    },
  },
})
```

Test **CatalogPage** filter bar emits / updates query — без рендера 50 cards.

```text
Integration breadth ↑ = stubs ↓
Focus on one behavior = stubs ↑
```

---

## 10. Testing emits to parent

```ts
import ProductCard from '@/components/ProductCard.vue'

it('emits add-to-cart when button clicked', async () => {
  const product = { id: '1', title: 'Phone', price: 99, imageUrl: '' }
  const wrapper = mount(ProductCard, { props: { product } })

  await wrapper.get('[data-testid="add-to-cart"]').trigger('click')

  expect(wrapper.emitted('add-to-cart')?.[0]).toEqual([product])
})
```

Parent wiring — optional separate test; card test enough for button behavior.

---

## 11. Cart page — Pinia + list

```ts
import CartPage from '@/pages/CartPage.vue'
import { useCartStore } from '@/stores/cart'

it('shows empty message when cart has no items', () => {
  const pinia = createTestPinia()
  mount(CartPage, { global: { plugins: [pinia] } })

  expect(document.body.textContent).toMatch(/empty/i)
})

it('lists line items from store', () => {
  const pinia = createTestPinia()
  const cart = useCartStore()
  cart.add({ id: '1', title: 'Phone', price: 99 })

  const wrapper = mount(CartPage, { global: { plugins: [pinia] } })

  expect(wrapper.text()).toContain('Phone')
})
```

Store actions in isolation — [урок 06](./06-store-testing.md); page test — **user-visible list**.

---

## 12. Async UI states checklist

| State | Assert |
|-------|--------|
| Loading | skeleton / «Loading…» |
| Error | message + retry button |
| Empty | «No products» |
| Success | data visible |

Component test one state per `it` with mocked api/query.

---

## 13. User-centric queries — priority

```text
1. getByRole / role + name   (button, alert, dialog)
2. data-testid
3. label text → input
4. text content
5. CSS class — avoid
```

```ts
wrapper.get('[role="alert"]')
wrapper.get('button', { name: /sign in/i }) // testing-library style if @testing-library/vue
```

VTU native: `get('button[type="submit"]')` ok with stable markup.

---

## 14. Что не тестировать в component spec

```text
❌ exact internal method calls count
❌ snapshot entire CatalogPage HTML
❌ every prop combination matrix
❌ duplicate schema rules already in unit tests
❌ vue-query cache internals
```

```text
✓ user sees error after bad submit
✓ modal closes on Escape
✓ cart shows added item title
```

---

## 15. Частые ошибки

### No flushPromises after async query/form

False negative — empty wrapper.

### Mount CatalogPage without stubs

Slow, flaky — stub ProductGrid.

### Assert wrapper.vm.formValues

Use visible inputs / emitted submit payload.

### Same test checks schema + DOM + navigation

Split into focused `it` blocks.

### Forgot Pinia before mount

`getActivePinia()` error.

### Real network in component test

Always mock api module.

---

## 16. Catalog — recommended component test set (MVP)

Minimum for Module 11 practice:

1. `TextField.spec.ts` — error display
2. `LoginPage.spec.ts` — validation + failed login message
3. `ProductCard.spec.ts` or `BaseModal.spec.ts` — interaction
4. One page with query — loading → success **or** error

---

## 17. Что важно понять после этого блока

Проверь себя:

1. Component vs unit — пример?
2. Зачем stubs на CatalogPage?
3. Как test form submit with VeeValidate?
4. Как test vue-query page?
5. Что assert вместо wrapper.vm?
6. MVP component test list для catalog?

---

## 18. Что почитать

### Официальное

- [Vue Test Utils · Interactions](https://test-utils.vuejs.org/guide/interactions.html)
- [Vue Test Utils · Testing Async](https://test-utils.vuejs.org/guide/advanced/async-suspense)

### Связанные материалы этого плана

- [Module 11 · Vue Test Utils](./02-vue-test-utils.md)
- [Module 7 · async UI states](../module-7/04-async-ui-states.md)

---

## 19. Практическое мини-задание

1. `TextField.spec.ts` — 3 cases
2. `LoginPage.spec.ts` — empty submit + mock login fail
3. `createTestQueryClient` helper
4. One query page test with mocked api
5. `npm run test:run` green

---

## 20. Мини-конспект

- component test = mount + user action + visible result
- mock api; test QueryClient retry false
- stubs for heavy children
- forms: setValue + submit + flushPromises
- don't duplicate unit schema tests
- дальше — **тестирование composables**

---

## 21. Что делать дальше

Следующий теоретический блок Module 11:

- [тестирование composables](./05-composables-testing.md)
