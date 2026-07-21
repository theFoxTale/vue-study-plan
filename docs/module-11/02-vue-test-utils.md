# Module 11 · Теория: Vue Test Utils

Этот материал закрывает второй теоретический пункт `Module 11`: **`@vue/test-utils`** — `mount`, queries, events, props/emits, stubs, plugins, async в component tests.

Связанные материалы:

- [Module 11 · Vitest](./01-vitest.md)
- [Module 10 · UI patterns](../module-10/06-ui-patterns.md)
- [Module 9 · custom fields](../module-9/02-custom-fields.md)

---

## 1. Vue Test Utils — роль

```text
Vitest        → runner + expect
Vue Test Utils → mount Vue components in jsdom
```

```bash
npm install -D @vue/test-utils
```

Официально:

- [Vue Test Utils](https://test-utils.vuejs.org/)
- [API · mount](https://test-utils.vuejs.org/api/#mount)

Component test = **render + user interaction + observable outcome**.

---

## 2. Первый component test

```ts
// src/components/ui/AppButton.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from './AppButton.vue'

describe('AppButton', () => {
  it('renders label from slot', () => {
    const wrapper = mount(AppButton, {
      slots: { default: 'Save' },
    })
    expect(wrapper.text()).toContain('Save')
  })

  it('emits click when enabled', async () => {
    const wrapper = mount(AppButton, {
      slots: { default: 'Save' },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(AppButton, {
      props: { disabled: true },
      slots: { default: 'Save' },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
```

```text
mount → Wrapper → DOM queries + trigger + emitted()
```

---

## 3. `mount` vs `shallowMount`

| | `mount` | `shallowMount` |
|---|---------|----------------|
| Children | full render | stubbed to shallow |
| Speed | slower | faster |
| Integration | closer to real | isolated unit |

```ts
import { shallowMount } from '@vue/test-utils'

shallowMount(CatalogPage) // child components = stubs
```

**Default Module 11:** `mount` для UI components (`TextField`, `AppButton`); `shallowMount` для heavy pages когда children уже tested separately.

---

## 4. Queries — find vs get

```ts
wrapper.find('button')           // first match or empty wrapper
wrapper.find('[data-testid="save"]')
wrapper.findComponent(TextField)

wrapper.get('button')            // throws if not found
wrapper.findAll('.cart-item')    // array of wrappers
```

**Recommended:** `data-testid` для stable selectors:

```vue
<button data-testid="delete-product">Delete</button>
```

```ts
await wrapper.get('[data-testid="delete-product"]').trigger('click')
```

Avoid brittle CSS class selectors from design refactors.

---

## 5. Props, slots, attrs

```ts
mount(BaseModal, {
  props: {
    open: true,
    title: 'Delete product',
  },
  slots: {
    default: '<p>Are you sure?</p>',
    footer: '<button>Confirm</button>',
  },
  attrs: {
    'data-testid': 'delete-modal',
  },
})
```

```ts
expect(wrapper.props('title')).toBe('Delete product')
expect(wrapper.text()).toContain('Are you sure?')
```

`v-model:open`:

```ts
await wrapper.setValue(false) // on component with defineModel — use setProps
await wrapper.setProps({ open: false })
```

---

## 6. Events и `emitted`

```ts
await wrapper.get('form').trigger('submit.prevent')

expect(wrapper.emitted('submit')).toBeTruthy()
expect(wrapper.emitted('submit')![0]).toEqual([{ email: 'a@b.com' }])
```

Child emit → parent:

```ts
await wrapper.findComponent(TextField).vm.$emit('update:modelValue', 'test@mail.com')
// or setValue on input — preferred user-like interaction
```

---

## 7. User-like input — `setValue`

```ts
const email = wrapper.get('[data-testid="email-input"]')
await email.setValue('user@example.com')
expect((email.element as HTMLInputElement).value).toBe('user@example.com')
```

Для `TextField` with nested input:

```ts
await wrapper.find('input').setValue('hello')
```

Prefer **DOM interaction** over `wrapper.vm.internalState = …`.

---

## 8. Async — `flushPromises`

```ts
import { flushPromises } from '@vue/test-utils'

it('shows products after load', async () => {
  const wrapper = mount(CatalogPage, { global: { plugins: [queryPlugin] } })
  await flushPromises()
  expect(wrapper.text()).toContain('Phone')
})
```

```ts
import { waitFor } from '@testing-library/vue' // optional library
```

Vitest + `await wrapper.vm.$nextTick()` for local DOM updates.

---

## 9. Global config — plugins и stubs

Catalog components often need Pinia / Router / Query:

```ts
import { createPinia, setActivePinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

mount(CatalogPage, {
  global: {
    plugins: [
      createTestPinia(),
      [VueQueryPlugin, { queryClient: createTestQueryClient() }],
    ],
    stubs: {
      RouterLink: true,
      Teleport: true, // render inline in tests — optional
    },
  },
})
```

**Stub** heavy children:

```ts
global: {
  stubs: ['ProductGrid', 'BaseModal'],
}
```

Focus test on **one component** behavior.

---

## 10. `tests/setup.ts`

```ts
// tests/setup.ts
import { config } from '@vue/test-utils'
import { beforeEach } from 'vitest'

beforeEach(() => {
  // reset mocks
})

config.global.stubs = {
  Teleport: true,
}
```

```ts
// vitest.config
test: {
  setupFiles: ['./tests/setup.ts'],
},
```

---

## 11. Testing Module 10 `BaseModal`

```ts
import BaseModal from '@/components/ui/BaseModal.vue'

describe('BaseModal', () => {
  it('shows title and body when open', () => {
    const wrapper = mount(BaseModal, {
      props: { open: true, title: 'Confirm' },
      slots: { default: 'Delete item?' },
      global: { stubs: { Teleport: false } }, // or true — consistent choice
    })
    expect(wrapper.text()).toContain('Confirm')
    expect(wrapper.text()).toContain('Delete item?')
  })

  it('emits update:open false on close button', async () => {
    const wrapper = mount(BaseModal, {
      props: { open: true, title: 'Confirm' },
    })
    await wrapper.get('[aria-label="Close"]').trigger('click')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })
})
```

Test **observable** behavior — text, aria, emitted — not internal `useModal`.

---

## 12. Testing form field error

```ts
import TextField from '@/components/form/TextField.vue'

it('shows error message', () => {
  const wrapper = mount(TextField, {
    props: {
      modelValue: '',
      label: 'Email',
      error: 'Email is required',
    },
  })
  expect(wrapper.text()).toContain('Email is required')
  expect(wrapper.find('[role="alert"]').exists()).toBe(true)
})
```

Form submit with VeeValidate — [component tests](./04-component-tests.md).

---

## 13. Router testing snippet

```ts
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

await router.push('/')
await router.isReady()

mount(MyPage, {
  global: { plugins: [router] },
})
```

Or stub `useRouter` / `useRoute` with mocks — simpler for unit-like page tests.

---

## 14. Pinia store in component test

```ts
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '@/stores/cart'

beforeEach(() => {
  setActivePinia(createPinia())
})

it('shows cart badge count', () => {
  const cart = useCartStore()
  cart.add({ id: '1', title: 'Phone', price: 99 })
  const wrapper = mount(AppHeader)
  expect(wrapper.text()).toContain('1')
})
```

Store testing in isolation — [урок 06](./06-store-testing.md).

---

## 15. `wrapper.unmount()`

Cleanup after test — Vitest jsdom resets, but listeners in component may need:

```ts
afterEach(() => {
  wrapper?.unmount()
})
```

Or rely on auto cleanup per test mount scope.

---

## 16. Что VTU **не** делает

```text
❌ E2E real browser (Playwright — урок 08)
❌ Visual regression screenshots
❌ Network layer (mock api — урок 07)
```

VTU = component/integration in jsdom.

---

## 17. Частые ошибки

### Assert on wrapper.vm private state

Use DOM text / emitted / visible props.

### No await on trigger + async update

Missing `await wrapper.trigger()` or `flushPromises`.

### Full app mount every test

Slow, brittle — mount smallest component.

### Teleport content "not found"

Stub Teleport or use `attachTo: document.body` *(advanced)*:

```ts
mount(Modal, { attachTo: document.body })
```

### Forgetting plugins

Pinia/router errors — add `global.plugins`.

### Testing implementation: exact CSS class string

Prefer role / testid / visible text.

---

## 18. Что важно понять после этого блока

Проверь себя:

1. Чем `mount` от `shallowMount`?
2. `find` vs `get`?
3. Как проверить emit?
4. Зачем `data-testid`?
5. Зачем `global.plugins` / stubs?
6. `setValue` vs mutating `vm`?

---

## 19. Что почитать

### Официальное

- [Vue Test Utils · Guide](https://test-utils.vuejs.org/guide/)
- [API Reference](https://test-utils.vuejs.org/api/)

### Связанные материалы этого плана

- [Module 11 · Vitest](./01-vitest.md)
- [Module 10 · BaseModal](../module-10/06-ui-patterns.md)

---

## 20. Практическое мини-задание

1. `AppButton.spec.ts` — render + click emit
2. `TextField.spec.ts` — error prop visible
3. `global.stubs` for RouterLink on one page test
4. `data-testid` on one interactive element
5. `npm run test` — green

---

## 21. Мини-конспект

- VTU = mount components, query DOM, trigger events
- behavior via text, emits, roles — not vm internals
- plugins: Pinia, Router, QueryClient in `global`
- stubs for heavy children / Teleport
- async: await trigger + flushPromises
- дальше — **unit tests** (слой и паттерны)

---

## 22. Что делать дальше

Следующий теоретический блок Module 11:

- [unit tests](./03-unit-tests.md)

Разберём что относится к unit слою, структуру, Zod/utils/composables без DOM.
