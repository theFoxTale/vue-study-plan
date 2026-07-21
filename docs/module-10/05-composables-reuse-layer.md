# Module 10 · Теория: composables как слой переиспользования

Этот материал закрывает пятый теоретический пункт `Module 10`: **UI composables** — `useModal`, `useToast`, `useDisclosure`, API design, shared state, граница с data-composables Module 7–8.

Связанные материалы:

- [Module 10 · custom directives](./04-custom-directives.md)
- [Module 4 · typing composables](../module-4/03-typing-composables.md)
- [Module 7 · data layer](../module-7/09-data-layer.md)

---

## 1. Composable — определение

```ts
export function useModal() {
  const open = ref(false)
  function show() { open.value = true }
  function hide() { open.value = false }
  return { open, show, hide }
}
```

```text
Composable = функция, использующая Composition API
           → переиспользуемая логика + reactive state
```

Официально:

- [Composables · Vue Guide](https://vuejs.org/guide/reusability/composables.html)

Module 10 фокус: **UI behavior** composables, не `useProducts` fetch *(Module 7)*.

---

## 2. Слои composables в catalog app

```text
src/composables/
  ui/
    useModal.ts
    useToast.ts
    useDisclosure.ts
  data/              # или рядом с features
    useProductFilters.ts
  auth/
    useRequireAuth.ts
```

| Слой | Примеры | Module |
|------|---------|--------|
| **UI** | modal, toast, tabs state | 10 |
| **Data** | fetch, query wrappers | 7–8 |
| **Domain** | cart helpers *(store preferred)* | 6 |

**Rule:** composable не должен **заменять** Pinia для shared cart — store ok.

---

## 3. `useDisclosure` — open/close primitive

Building block для modal, dropdown, accordion:

```ts
// composables/ui/useDisclosure.ts
import { ref } from 'vue'

export function useDisclosure(initial = false) {
  const open = ref(initial)

  function show() {
    open.value = true
  }

  function hide() {
    open.value = false
  }

  function toggle() {
    open.value = !open.value
  }

  return { open, show, hide, toggle }
}
```

```vue
<script setup lang="ts">
const deleteModal = useDisclosure()
</script>

<template>
  <button @click="deleteModal.show">Delete</button>
  <BaseModal v-model:open="deleteModal.open.value" … />
</template>
```

Or pass `open` as computed writable — см. `useModal` ниже.

---

## 4. `useModal` — API design

```ts
// composables/ui/useModal.ts
import { ref, readonly } from 'vue'

export function useModal<T = void>() {
  const open = ref(false)
  const payload = ref<T | null>(null)

  function show(data?: T) {
    payload.value = (data ?? null) as T | null
    open.value = true
  }

  function hide() {
    open.value = false
  }

  function onClosed() {
    payload.value = null
  }

  return {
    open: readonly(open),
    payload: readonly(payload),
    show,
    hide,
    onClosed,
  }
}
```

```vue
<script setup lang="ts">
const confirmDelete = useModal<{ id: string; title: string }>()

function askDelete(product: Product) {
  confirmDelete.show({ id: product.id, title: product.title })
}

async function confirm() {
  if (!confirmDelete.payload.value) return
  await deleteProduct(confirmDelete.payload.value.id)
  confirmDelete.hide()
}
</script>

<template>
  <BaseModal
    :open="confirmDelete.open.value"
    @update:open="(v) => { if (!v) confirmDelete.hide() }"
    @closed="confirmDelete.onClosed"
    title="Delete product"
  >
    Delete «{{ confirmDelete.payload.value?.title }}»?
  </BaseModal>
</template>
```

| API choice | Зачем |
|------------|--------|
| `show(payload?)` | контекст modal без global state |
| `readonly(open)` | не мутировать снаружи минуя `hide` |
| `onClosed` | clear payload after leave transition |

**v-model:open** — bridge readonly + hide в template или helper `useModalModel()`.

---

## 5. `useToast` — module-level shared state

Toasts **глобальны** — несколько components вызывают notify:

```ts
// composables/ui/useToast.ts
import { ref, readonly } from 'vue'

export type Toast = {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

const toasts = ref<Toast[]>([])
let seed = 0

export function useToast() {
  function push(message: string, type: Toast['type'] = 'info', duration = 4000) {
    const id = String(++seed)
    toasts.value.push({ id, message, type, duration })

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts: readonly(toasts),
    push,
    success: (msg: string) => push(msg, 'success'),
    error: (msg: string) => push(msg, 'error'),
    dismiss,
  }
}
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import ToastContainer from '@/components/ui/ToastContainer.vue'
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>
```

```ts
// any page
const toast = useToast()
toast.success('Product saved')
```

State **вне** function — один queue на app. Pattern «shared composable state».

---

## 6. Return API conventions

```ts
return {
  // state — refs или readonly
  open,
  toasts,

  // actions — verbs
  show,
  hide,
  push,

  // derived — computed
  isOpen,
  hasToasts,
}
```

| Do | Don't |
|----|-------|
| `show`, `hide`, `toggle` | `setOpenTrue` |
| readonly для shared state | export mutable ref globally without reason |
| typed payload generic | `any` payload |

Document in JSDoc one-liner if non-obvious.

---

## 7. Composable vs component

```text
useToast()     → logic + global queue
ToastContainer → Teleport + Transition + render
BaseModal      → markup + a11y shell
useModal()     → open/payload state
```

```text
Logic composable + dumb UI component = Module 10 sweet spot
```

Не делай `ModalService` class если `useModal` + component достаточно.

---

## 8. `useTabs` — local UI state

```ts
export function useTabs<T extends string>(tabs: T[], initial: T) {
  const active = ref(initial) as Ref<T>

  function select(tab: T) {
    active.value = tab
  }

  const isActive = (tab: T) => active.value === tab

  return { tabs, active, select, isActive }
}
```

```vue
<script setup lang="ts">
const { tabs, active, select, isActive } = useTabs(['description', 'reviews', 'shipping'], 'description')
</script>

<template>
  <div role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab"
      role="tab"
      :aria-selected="isActive(tab)"
      @click="select(tab)"
    >
      {{ tab }}
    </button>
  </div>
  <div role="tabpanel">…</div>
</template>
```

URL sync для catalog filters — `route.query.tab`, не composable alone *(Module 5)*.

---

## 9. Lifecycle cleanup

```ts
import { onMounted, onUnmounted } from 'vue'

export function useEscapeKey(onEscape: () => void) {
  function handler(e: KeyboardEvent) {
    if (e.key === 'Escape') onEscape()
  }

  onMounted(() => document.addEventListener('keydown', handler))
  onUnmounted(() => document.removeEventListener('keydown', handler))
}
```

Use inside modal component or `useModal` consumer when open.

**Directive alternative** — [урок 04](./04-custom-directives.md); composable when need conditional subscribe with `watch(open)`.

---

## 10. Typing composables

```ts
export function useModal<T = void>() {
  const payload = ref<T | null>(null)
  function show(data?: T) { … }
  return { … }
}

// usage
const modal = useModal<Product>()
modal.show(product)
```

Explicit return type for public library composables:

```ts
export type UseModalReturn<T> = {
  open: Readonly<Ref<boolean>>
  payload: Readonly<Ref<T | null>>
  show: (data?: T) => void
  hide: () => void
}
```

См. [Module 4 · typing composables](../module-4/03-typing-composables.md).

---

## 11. Когда **не** выносить composable

```text
❌ one-liner used once — inline ref in component
❌ composable that only wraps storeToRefs(store)
❌ «useCatalogPage» god composable with 300 lines
❌ duplicate vue-query useQuery 1:1 without added value
```

```text
✓ 2+ components need same UI behavior
✓ testable logic separate from template
✓ modal/toast/disclosure patterns
```

Module 10 README: composables **help reuse, not complexity**.

---

## 12. Testing composables

```ts
import { describe, it, expect } from 'vitest'
import { useDisclosure } from '@/composables/ui/useDisclosure'

describe('useDisclosure', () => {
  it('toggles open', () => {
    const { open, show, hide } = useDisclosure()
    expect(open.value).toBe(false)
    show()
    expect(open.value).toBe(true)
    hide()
    expect(open.value).toBe(false)
  })
})
```

`@vue/test-utils` + `withSetup` helper for lifecycle composables — Module 11 preview.

---

## 13. Catalog integration map

| Feature | Composable | Component |
|---------|------------|-----------|
| Delete confirm | `useModal<{id,title}>` | BaseModal |
| Save product | `useToast` | ToastContainer |
| Filter dropdown | `useDisclosure` | + v-click-outside |
| Product tabs | `useTabs` | TabPanel slots |
| Fetch products | `useQuery` | — *(Module 8)* |

---

## 14. Частые ошибки

### Mutable global ref exported directly

```ts
export const open = ref(false) // anyone mutates
```

Wrap in `useModal()` factory.

### Composable calls composable conditionally

Violates Composition API rules — call top-level in setup.

### Toast setTimeout без dismiss on unmount

Rare leak — clear in `onUnmounted` if component-scoped; global ok.

### useModal per component instance when need singleton

Confirm delete from list — each row can have own `useModal` **or** one page-level modal with payload — prefer **one** page modal + payload.

### Composable duplicates Pinia

Session in auth store; don't `useUser()` composable mirroring store without reason.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. UI composable vs data composable?
2. Зачем module-level state в `useToast`?
3. `useModal` payload pattern?
4. Composable + component split?
5. Когда **не** создавать composable?
6. `readonly` на shared refs — зачем?

---

## 16. Что почитать

### Официальное

- [Composables](https://vuejs.org/guide/reusability/composables.html)
- [Sharing state](https://vuejs.org/guide/scaling-up/state-management.html#simple-state-management-with-reactivity-api)

### Связанные материалы этого плана

- [Module 4 · typing composables](../module-4/03-typing-composables.md)
- [Module 10 · Teleport](./01-teleport.md)

---

## 17. Практическое мини-задание

1. `useDisclosure` + catalog filter dropdown
2. `useModal<{ id: string }>` + delete confirm
3. `useToast` + App-level ToastContainer
4. `toast.success` after profile save
5. Typed `useModal<Product>` stretch

---

## 18. Мини-конспект

- composable = reusable setup logic
- UI layer: modal, toast, disclosure, tabs
- global toast queue — module-level state
- thin composables + UI components
- не дублировать store/query без value
- дальше — **UI patterns** (modal, dropdown, tabs, notifications)

---

## 19. Что делать дальше

Следующий теоретический блок Module 10:

- [patterns для modal, dropdown, tabs, notifications](./06-ui-patterns.md)

Соберём компоненты catalog app в единый reusable UI kit.
