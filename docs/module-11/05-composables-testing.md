# Module 11 · Теория: тестирование composables

Этот материал закрывает пятый теоретический пункт `Module 11`: **testing composables** — прямой вызов vs `withSetup`, lifecycle, shared state, `useModal` / `useToast` / `useDisclosure`.

Связанные материалы:

- [Module 10 · composables reuse layer](../module-10/05-composables-reuse-layer.md)
- [Module 11 · unit tests](./03-unit-tests.md)
- [Module 11 · component tests](./04-component-tests.md)

---

## 1. Где composable в test pyramid

```text
Unit-like     → useDisclosure(), pure return values — call in test directly
Setup-bound   → onMounted, watch, inject — need component context
Integration   → composable + mounted component together
```

| Composable | Test approach |
|------------|---------------|
| `useDisclosure` | direct call |
| `useModal` | direct call |
| `useToast` | direct call + reset shared state |
| `useEscapeKey` | `withSetup` or mount wrapper |
| `useProductFilters` | direct or mount |
| `useQuery` wrapper | mock api + `withSetup` or test via page |

---

## 2. Прямой вызов — когда достаточно

Composable без lifecycle hooks можно вызывать **в теле test** как обычную функцию:

```ts
// src/composables/ui/useDisclosure.test.ts
import { describe, it, expect } from 'vitest'
import { useDisclosure } from './useDisclosure'

describe('useDisclosure', () => {
  it('starts closed by default', () => {
    const { open } = useDisclosure()
    expect(open.value).toBe(false)
  })

  it('opens and closes', () => {
    const { open, show, hide } = useDisclosure()
    show()
    expect(open.value).toBe(true)
    hide()
    expect(open.value).toBe(false)
  })

  it('toggle switches state', () => {
    const { open, toggle } = useDisclosure()
    toggle()
    expect(open.value).toBe(true)
    toggle()
    expect(open.value).toBe(false)
  })

  it('respects initial open true', () => {
    const { open } = useDisclosure(true)
    expect(open.value).toBe(true)
  })
})
```

**Важно:** каждый `it` вызывает `useDisclosure()` заново — **fresh state** per test.

---

## 3. Правило Composition API в tests

```text
Composable must be called at top level of setup — same as in <script setup>
```

В test файле «top level» = inside `it` callback body *(not inside if/for)* — ok.

```ts
// ❌ bad
it('…', () => {
  if (condition) {
    const { open } = useDisclosure() // conditional
  }
})

// ✓ ok
it('…', () => {
  const { open } = useDisclosure()
  if (condition) { … }
})
```

---

## 4. `withSetup` helper — lifecycle composables

```ts
// tests/withSetup.ts
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

export function withSetup<T>(composable: () => T) {
  let result!: T

  const Comp = defineComponent({
    setup() {
      result = composable()
      return () => h('div')
    },
  })

  const wrapper = mount(Comp)
  return { result, wrapper }
}
```

Usage:

```ts
import { withSetup } from '@/tests/withSetup'
import { useEscapeKey } from '@/composables/ui/useEscapeKey'

describe('useEscapeKey', () => {
  it('calls handler on Escape', async () => {
    const onEscape = vi.fn()
    const { wrapper } = withSetup(() => useEscapeKey(onEscape))

    await wrapper.trigger('keydown', { key: 'Escape' })
    // handler on document — trigger on document instead:
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(onEscape).toHaveBeenCalled()
    wrapper.unmount()
  })
})
```

`onMounted` / `onUnmounted` run because composable inside real `setup()`.

**Always `wrapper.unmount()`** — cleanup listeners.

---

## 5. `useModal` tests

```ts
// src/composables/ui/useModal.test.ts
import { describe, it, expect } from 'vitest'
import { useModal } from './useModal'

describe('useModal', () => {
  it('show opens modal and sets payload', () => {
    const modal = useModal<{ id: string }>()
    modal.show({ id: '42' })

    expect(modal.open.value).toBe(true)
    expect(modal.payload.value).toEqual({ id: '42' })
  })

  it('hide closes modal', () => {
    const modal = useModal()
    modal.show()
    modal.hide()
    expect(modal.open.value).toBe(false)
  })

  it('onClosed clears payload', () => {
    const modal = useModal<{ id: string }>()
    modal.show({ id: '42' })
    modal.onClosed()
    expect(modal.payload.value).toBeNull()
  })
})
```

`readonly(open)` — assert via `.value` on returned ref; don't mutate from outside except through API.

---

## 6. `useToast` — shared module state

```ts
// composables/ui/useToast.ts — module-level toasts ref
```

Tests **share queue** if not reset:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    const { dismiss, toasts } = useToast()
    // dismiss all from prior tests
    ;[...toasts.value].forEach((t) => dismiss(t.id))
  })

  it('push adds toast to queue', () => {
    const toast = useToast()
    toast.push('Hello', 'success')

    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0].message).toBe('Hello')
    expect(toast.toasts.value[0].type).toBe('success')
  })

  it('success helper uses success type', () => {
    const toast = useToast()
    toast.success('Saved')
    expect(toast.toasts.value[0].type).toBe('success')
  })

  it('dismiss removes toast by id', () => {
    const toast = useToast()
    const id = toast.push('Temp', 'info')
    toast.dismiss(id)
    expect(toast.toasts.value).toHaveLength(0)
  })
})
```

Better long-term: export test-only `resetToasts()` or inject store — optional refactor.

`vi.useFakeTimers()` for auto-dismiss timeout tests:

```ts
it('auto-dismisses after duration', () => {
  vi.useFakeTimers()
  const toast = useToast()
  toast.push('Hi', 'info', 3000)
  expect(toast.toasts.value).toHaveLength(1)
  vi.advanceTimersByTime(3000)
  expect(toast.toasts.value).toHaveLength(0)
  vi.useRealTimers()
})
```

---

## 7. `useTabs` tests

```ts
import { useTabs } from './useTabs'

describe('useTabs', () => {
  it('select changes active tab', () => {
    const { active, select, isActive } = useTabs(
      ['a', 'b', 'c'] as const,
      'a',
    )
    expect(isActive('a')).toBe(true)
    select('b')
    expect(active.value).toBe('b')
    expect(isActive('b')).toBe(true)
    expect(isActive('a')).toBe(false)
  })
})
```

---

## 8. Composable с `watch` / `computed`

```ts
// composables/useDebouncedRef.ts — example
export function useDebouncedRef<T>(value: Ref<T>, delay = 300) {
  const debounced = ref(value.value) as Ref<T>
  watch(value, () => {
    setTimeout(() => { debounced.value = value.value }, delay)
  })
  return debounced
}
```

Test with `withSetup` + fake timers:

```ts
it('updates debounced after delay', async () => {
  vi.useFakeTimers()
  const source = ref('a')
  const { result, wrapper } = withSetup(() => useDebouncedRef(source, 300))

  source.value = 'b'
  vi.advanceTimersByTime(299)
  expect(result.value).toBe('a')
  vi.advanceTimersByTime(1)
  expect(result.value).toBe('b')

  wrapper.unmount()
  vi.useRealTimers()
})
```

---

## 9. Composable + inject

```ts
// Parent provides
const { result, wrapper } = withSetup(() => {
  provide('theme', ref('dark'))
  return useTheme()
})
```

Or mount parent component that provides — closer to integration.

---

## 10. Data composables — thin wrappers

```ts
// composables/useCatalogProducts.ts — wraps useQuery
export function useCatalogProducts(filters: Ref<CatalogFilters>) {
  return useQuery({
    queryKey: computed(() => productKeys.list(filters.value)),
    queryFn: () => fetchProductsPage(filters.value),
  })
}
```

**Prefer:** test `fetchProductsPage` + `productKeys` in unit tests; test **page component** with mocked api for integration.

Don't duplicate vue-query internals in composable test.

---

## 11. Composable vs component — duplicate?

| Test composable | Test component |
|-----------------|----------------|
| state machine logic | DOM + a11y |
| show/hide/toggle | button click visible |
| toast queue API | toast rendered in container |

Both ok for Module 10 UI composables — **composable test faster**; component test proves wiring.

Avoid **identical** assertions in both — composable for logic, component for render once.

---

## 12. File layout

```text
src/composables/ui/
  useDisclosure.ts
  useDisclosure.test.ts
  useModal.ts
  useModal.test.ts
  useToast.ts
  useToast.test.ts

tests/
  withSetup.ts
```

---

## 13. Частые ошибки

### Call composable outside test/`setup` context at module level

```ts
const { open } = useDisclosure() // top of file — shared state leak
```

Call inside each `it`.

### Forget unmount in `withSetup`

Leaked document listeners — flaky suite.

### Test useToast without reset

Order-dependent failures.

### Test implementation: ref identity

Test behavior: open.value, queue length.

### Mock entire composable in component test

Test composable separately; component test uses real composable.

### Conditional composable call

Breaks Vue rules — same as in components.

---

## 14. Catalog MVP composable tests

Module 11 practice — минимум:

- [ ] `useDisclosure.test.ts`
- [ ] `useModal.test.ts` or `useToast.test.ts`
- [ ] one lifecycle composable with `withSetup` *(optional)*

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Когда direct call vs `withSetup`?
2. Зачем fresh call per `it`?
3. Проблема shared state в `useToast`?
4. Как test auto-dismiss timers?
5. Thin query composable — где тестировать?
6. Composable vs component duplicate?

---

## 16. Что почитать

### Официальное

- [Vue · Composables](https://vuejs.org/guide/reusability/composables.html)
- [Vue Test Utils · Advanced · Async](https://test-utils.vuejs.org/guide/advanced/async-suspense)

### Связанные материалы этого плана

- [Module 10 · composables](../module-10/05-composables-reuse-layer.md)
- [Module 11 · unit tests](./03-unit-tests.md)

---

## 17. Практическое мини-задание

1. `useDisclosure.test.ts` — 4 cases
2. `useModal.test.ts` — show/hide/payload
3. `useToast.test.ts` — push/dismiss + beforeEach cleanup
4. Add `tests/withSetup.ts`
5. Fake timers test for toast auto-dismiss *(optional)*

---

## 18. Мини-конспект

- simple composables — call in `it`, assert refs
- lifecycle — `withSetup` + unmount
- shared toast queue — reset between tests
- fake timers for debounce/dismiss
- query wrappers — test via unit/page, not query internals
- дальше — **тестирование store**

---

## 19. Что делать дальше

Следующий теоретический блок Module 11:

- [тестирование store](./06-store-testing.md)
