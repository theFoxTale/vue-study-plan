# Module 10 · Теория: patterns — modal, dropdown, tabs, notifications

Этот материал закрывает последний теоретический пункт `Module 10`: **reusable UI kit** — `BaseModal`, `BaseDropdown`, `Tabs`, `ToastContainer`, demo page, API и связка Teleport + Transition + composables.

Связанные материалы:

- [Module 10 · Teleport](./01-teleport.md)
- [Module 10 · transitions](./03-transitions.md)
- [Module 10 · composables](./05-composables-reuse-layer.md)
- [Module 9 · form fields](../module-9/02-custom-fields.md)

---

## 1. UI kit в catalog app

```text
src/components/ui/
  BaseModal.vue
  BaseDropdown.vue
  Tabs.vue
  TabPanel.vue
  ToastContainer.vue
  AppButton.vue          # optional primitive

src/composables/ui/
  useModal.ts
  useToast.ts
  useDisclosure.ts
  useTabs.ts
```

```text
Module 10 goal = 3–5 reusable pieces с понятным API
                 + одна demo/integration page
```

Не design system на 50 components — **focused kit** для pet-project.

---

## 2. Принципы API reusable UI

| Прinciple | Пример |
|-----------|--------|
| **Predictable props** | `open`, `title`, `disabled` |
| **v-model where stateful** | `v-model:open`, `v-model="activeTab"` |
| **Slots for content** | default, `footer`, `trigger` |
| **Events mirror UX** | `@close`, `@confirm` |
| **Logic outside** | `useModal`, not 200 lines in page |
| **a11y baseline** | roles, labels, keyboard |

```text
Bad API:  <BaseModal :config="megaObject" />
Good API: <BaseModal v-model:open="open" title="Delete">…</BaseModal>
```

---

## 3. Pattern: Modal

### Stack

```text
useModal()        → state + payload
BaseModal         → Teleport + Transition + a11y shell
v-focus           → first field (optional directive)
Module 9 form     → slot content
```

### `BaseModal.vue` contract

```vue
<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

defineProps<{
  title?: string
  size?: 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{ close: [] }>()

function close() {
  open.value = false
  emit('close')
}

// Escape + scroll lock — см. урок 01
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="close">
        <div
          class="modal"
          :class="`modal--${size ?? 'md'}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header v-if="title || $slots.header" class="modal__header">
            <slot name="header">
              <h2>{{ title }}</h2>
            </slot>
            <button type="button" aria-label="Close" @click="close">×</button>
          </header>
          <div class="modal__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
```

### Usage — delete product

```vue
<script setup lang="ts">
const deleteModal = useModal<{ id: string; title: string }>()
const toast = useToast()

async function confirmDelete() {
  const p = deleteModal.payload.value
  if (!p) return
  await deleteProduct(p.id)
  deleteModal.hide()
  toast.success(`Deleted «${p.title}»`)
}
</script>

<template>
  <button @click="deleteModal.show({ id: p.id, title: p.title })">Delete</button>

  <BaseModal
    v-model:open="deleteModal.open.value"
    title="Delete product"
    @close="deleteModal.onClosed"
  >
    <p>Are you sure?</p>
    <template #footer>
      <AppButton variant="ghost" @click="deleteModal.hide">Cancel</AppButton>
      <AppButton variant="danger" @click="confirmDelete">Delete</AppButton>
    </template>
  </BaseModal>
</template>
```

**One modal per page** + payload — не modal per table row.

---

## 4. Pattern: Dropdown

### Stack

```text
useDisclosure()     → open state
v-click-outside     → close on outside click
Teleport (optional) → if overflow clip
```

### `BaseDropdown.vue`

```vue
<script setup lang="ts">
import { vClickOutside } from '@/directives/vClickOutside'
import { useDisclosure } from '@/composables/ui/useDisclosure'

const { open, show, hide, toggle } = useDisclosure()

defineProps<{
  align?: 'start' | 'end'
}>()

const emit = defineEmits<{ select: [value: string] }>()

function onSelect(value: string) {
  emit('select', value)
  hide()
}
</script>

<template>
  <div class="dropdown" v-click-outside="hide">
    <button
      type="button"
      class="dropdown__trigger"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
    >
      <slot name="trigger">Menu</slot>
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="dropdown__panel" role="listbox">
        <slot :select="onSelect" :close="hide" />
      </div>
    </Transition>
  </div>
</template>
```

### Catalog category filter

```vue
<BaseDropdown align="start" @select="onCategorySelect">
  <template #trigger>
    Category: {{ currentLabel }}
  </template>
  <template #default="{ select }">
    <button type="button" @click="select('all')">All</button>
    <button type="button" @click="select('phones')">Phones</button>
    <button type="button" @click="select('laptops')">Laptops</button>
  </template>
</BaseDropdown>
```

Sync selection with `route.query.category` — router source of truth.

If panel clips — Teleport panel to `body` with anchor positioning *(stretch)* or simpler overflow:visible on parent.

---

## 5. Pattern: Tabs

### Stack

```text
useTabs()     → active id
Tabs + TabPanel → a11y + slot content
Transition (optional) → mode out-in between panels
```

### `Tabs.vue` + `TabPanel.vue`

```vue
<!-- Tabs.vue -->
<script setup lang="ts">
const active = defineModel<string>({ required: true })

defineProps<{
  tabs: { id: string; label: string }[]
}>()
</script>

<template>
  <div class="tabs">
    <div role="tablist" class="tabs__list">
      <button
        v-for="tab in tabs"
        :id="`tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="active === tab.id"
        :aria-controls="`panel-${tab.id}`"
        @click="active = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tabs__panels">
      <slot />
    </div>
  </div>
</template>
```

```vue
<!-- TabPanel.vue -->
<script setup lang="ts">
defineProps<{ id: string; label?: string }>()
const active = inject<string>('tabsActive') // or pass via Tabs provide
</script>

<template>
  <div
    v-show="active === id"
    :id="`panel-${id}`"
    role="tabpanel"
    :aria-labelledby="`tab-${id}`"
  >
    <slot />
  </div>
</template>
```

Provide/inject pattern in `Tabs.vue`:

```ts
provide('tabsActive', active)
```

### Product detail page

```vue
<script setup lang="ts">
const tab = ref('description')
const tabs = [
  { id: 'description', label: 'Description' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'shipping', label: 'Shipping' },
]
</script>

<template>
  <Tabs v-model="tab" :tabs="tabs">
    <TabPanel id="description">…</TabPanel>
    <TabPanel id="reviews">…</TabPanel>
    <TabPanel id="shipping">…</TabPanel>
  </Tabs>
</template>
```

URL `?tab=reviews` — optional sync for shareable links.

---

## 6. Pattern: Notifications (Toast)

### Stack

```text
useToast()         → global queue API
ToastContainer     → Teleport + TransitionGroup
App.vue            → mount once
```

### `ToastContainer.vue`

```vue
<script setup lang="ts">
import { useToast } from '@/composables/ui/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="#toast-root">
    <TransitionGroup name="toast" tag="div" class="toast-stack" aria-live="polite">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast--${t.type}`"
        :role="t.type === 'error' ? 'alert' : 'status'"
      >
        <p>{{ t.message }}</p>
        <button type="button" aria-label="Dismiss" @click="dismiss(t.id)">×</button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>
```

### Call sites

```ts
const toast = useToast()

// after mutation
toast.success('Product saved')
toast.error('Failed to save')

// login
toast.info('Welcome back!')
```

```text
index.html: <div id="toast-root"></div>
App.vue:    <ToastContainer />
```

---

## 7. Demo / integration page

Module 10 practice: **страница**, показывающая kit в действии.

```text
/ui-demo  or  /playground  (dev-only route optional)
```

| Block | Demonstrates |
|-------|----------------|
| Open modal | Teleport + Transition + useModal |
| Toast buttons | success / error / info |
| Dropdown | disclosure + click-outside |
| Tabs | switch panels |
| Cart list TransitionGroup | from lesson 03 *(optional)* |

```vue
<!-- UiDemoPage.vue -->
<template>
  <section>
    <h1>UI Kit Demo</h1>
    <AppButton @click="demoModal.show()">Open modal</AppButton>
    <AppButton @click="toast.success('Saved!')">Toast success</AppButton>
    <BaseDropdown>…</BaseDropdown>
    <Tabs v-model="tab" :tabs="demoTabs">…</Tabs>
  </section>
  <BaseModal v-model:open="demoModal.open.value" title="Demo">…</BaseModal>
</template>
```

Or integrate into **real** catalog — delete modal + save toasts *(preferred for portfolio)*.

---

## 8. Связка механизмов Module 10

| Mechanism | Used in |
|-----------|---------|
| **Teleport** | Modal, Toast |
| **Transition** | Modal, Dropdown, Toast |
| **TransitionGroup** | Toast stack, cart |
| **Directive** | v-click-outside dropdown, v-focus modal |
| **Composable** | useModal, useToast, useDisclosure, useTabs |
| **Suspense** | lazy demo chunk *(optional)* |

README criterion: Teleport **or** transitions **or** directives — kit covers all justified.

---

## 9. Props vs slots decision

| Content | API |
|---------|-----|
| Title string | prop `title` |
| Custom header | slot `header` |
| Body | default slot |
| Actions | slot `footer` |
| Dropdown items | default slot + scoped `select` |
| Tab labels | prop `tabs[]` |
| Tab body | TabPanel slots |

Avoid 20 boolean props — slots scale better.

---

## 10. Styling strategy

```text
BEM-ish: .modal__header, .dropdown__panel
CSS variables: --z-modal, --color-danger
One ui.css or scoped per component
```

Pet-project: scoped CSS in each `Base*` component ok.

Dark mode — CSS variables *(stretch)*.

---

## 11. Чеклист качества UI kit

- [ ] Modal: Escape, backdrop click, scroll lock
- [ ] Modal: `role="dialog"`, `aria-modal`
- [ ] Dropdown: `aria-expanded`, click-outside close
- [ ] Tabs: `role="tablist/tab/tabpanel"`
- [ ] Toast: `aria-live`, dismiss button
- [ ] Transitions ≤ 250ms; reduced-motion respected
- [ ] z-index documented
- [ ] TypeScript props typed
- [ ] Used in ≥2 real screens (not only demo)

---

## 12. Частые ошибки

### Kit never used in real pages — only /ui-demo

Portfolio weak — wire delete modal on catalog.

### Modal per row in v-for

Use one modal + payload.

### Dropdown state in Pinia

Local `useDisclosure` enough.

### Tabs without keyboard *(stretch)*

Arrow keys — optional a11y improvement.

### Toast from every composable directly

Call `useToast()` at action site — ok; don't chain 5 wrappers.

### Mega `<BaseUi>` single component

Split BaseModal, BaseDropdown, …

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Из чего состоит modal pattern?
2. Dropdown close strategies?
3. Tabs a11y roles?
4. Where ToastContainer mounts?
5. Composable vs component responsibility?
6. What makes API «понятным»?

---

## 14. Что почитать

### Официальное

- [Teleport](https://vuejs.org/guide/built-ins/teleport.html)
- [Transition](https://vuejs.org/guide/built-ins/transition.html)
- [WAI-ARIA · Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

### Связанные материалы этого плана

- [Module 10 · composables](./05-composables-reuse-layer.md)
- [Module 10 · directives](./04-custom-directives.md)

---

## 15. Практическое мини-задание

1. Implement all 4: Modal, Dropdown, Tabs, ToastContainer
2. Wire delete modal on catalog
3. Toast on profile save / cart add
4. Category dropdown in header
5. Product detail tabs

---

## 16. Мини-конспект

- UI kit = few Base* components + ui composables
- modal = Teleport + Transition + useModal
- dropdown = disclosure + click-outside
- tabs = v-model active + TabPanel
- toast = global queue + Teleport stack
- **теория Module 10 завершена** → practice checklist

---

## 17. Что делать дальше

Теория Module 10 завершена. Переходи к практике:

- [Module 10 · practice checklist](./07-practice-checklist.md)

Собери 3–5 UI elements и integration page в catalog app.
