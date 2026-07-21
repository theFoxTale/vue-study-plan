# Module 10 · Теория: Teleport

Этот материал открывает **Module 10** и закрывает первый теоретический пункт: **`Teleport`** — рендер разметки в другой DOM-узел, модалки, overlays, toasts, `body`, a11y и типичные ошибки.

Связанные материалы:

- [Module 9 · кастомные поля](../module-9/02-custom-fields.md)
- [Module 9 · practice checklist](../module-9/08-practice-checklist.md)

---

## 1. Зачем Module 10 после Module 9

```text
Module 9  → формы, validation, submit flow
Module 10 → UI primitives: modal, toast, tabs, transitions
```

Форма login в `<main>` — ok.
**Modal** поверх всего app, **toast** в углу экрана, **dropdown** поверх overflow:hidden card — без Teleport часто ломается layout и z-index.

```text
Component tree     DOM tree (желаемый)
App                body
  Catalog            #app
    Card               …
      Modal (?)        div.modal-root  ← Teleport сюда
```

Официально:

- [Teleport · Vue Guide](https://vuejs.org/guide/built-ins/teleport.html)

---

## 2. Базовый синтаксис

```vue
<template>
  <button type="button" @click="open = true">Open modal</button>

  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="open = false">
      <div class="modal" role="dialog" aria-modal="true">
        <h2>Confirm</h2>
        <p>Delete this product?</p>
        <button type="button" @click="open = false">Cancel</button>
      </div>
    </div>
  </Teleport>
</template>
```

```text
<Teleport to="body">  → содержимое монтируется как child <body>
Логически             → остаётся в том же component (props, emits, state)
```

Modal state (`open`) — в родителе или composable; разметка overlay — в `body`.

---

## 3. Куда teleport: `to`

| Target | Когда |
|--------|--------|
| `"body"` | modal, full-screen overlay *(default choice)* |
| `"#modal-root"` | dedicated container в `index.html` |
| `el` ref | dynamic target |

```html
<!-- index.html -->
<body>
  <div id="app"></div>
  <div id="modal-root"></div>
  <div id="toast-root"></div>
</body>
```

```vue
<Teleport to="#modal-root">
```

**Зачем отдельный root:** контроль порядка stacking, тесты, SSR hydration *(позже)*.

---

## 4. `disabled` — временно без Teleport

```vue
<Teleport to="body" :disabled="!usePortal">
  <div class="dropdown-menu">…</div>
</Teleport>
```

`disabled: true` — рендер **на месте** в дереве компонента.

Полезно: SSR fallback, unit tests, nested scroll container когда portal не нужен.

---

## 5. Modal pattern — catalog app

```vue
<!-- components/ui/BaseModal.vue -->
<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

defineProps<{
  title?: string
}>()

const emit = defineEmits<{ close: [] }>()

function close() {
  open.value = false
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="close">
      <div class="modal" role="dialog" aria-modal="true" :aria-label="title">
        <header v-if="title" class="modal__header">
          <h2 :id="titleId">{{ title }}</h2>
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
  </Teleport>
</template>
```

Использование — delete product, login prompt, quick view:

```vue
<BaseModal v-model:open="showDelete" title="Delete product">
  <p>Are you sure?</p>
  <template #footer>
    <button @click="showDelete = false">Cancel</button>
    <button @click="confirmDelete">Delete</button>
  </template>
</BaseModal>
```

Module 9 forms **внутри** modal — Teleport не меняет `v-model` / VeeValidate.

---

## 6. z-index и stacking

Без Teleport:

```css
.card { overflow: hidden; }
.modal { position: fixed; } /* может клипаться или быть под header */
```

С Teleport в `body`:

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgb(0 0 0 / 0.5);
}
```

Единая шкала z-index для app:

```text
dropdown   100
sticky nav 200
modal      1000
toast      1100
```

Документируй в одном CSS file / design tokens.

---

## 7. Несколько Teleport в одном target

```vue
<!-- Modal A -->
<Teleport to="#modal-root">…</Teleport>

<!-- Modal B -->
<Teleport to="#modal-root">…</Teleport>
```

Оба в `#modal-root` — **порядок в DOM** = порядок mount. Последний открытый modal часто сверху — ok для одного modal at a time.

Nested modals — редко; лучше replace content одного modal.

---

## 8. Toast / notifications

```vue
<!-- components/ui/ToastContainer.vue -->
<template>
  <Teleport to="#toast-root">
    <div class="toast-stack" aria-live="polite" aria-relevant="additions">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        {{ toast.message }}
      </div>
    </div>
  </Teleport>
</template>
```

Mount `ToastContainer` once в `App.vue`; composable `useToast()` push messages — [урок 06](./06-ui-patterns.md).

---

## 9. Focus trap и scroll lock *(overview)*

Teleport решает **DOM placement**, не a11y полностью.

Modal best practices:

- focus first focusable on open
- `Escape` closes
- return focus to trigger on close
- `document.body.style.overflow = 'hidden'` while open

Полная реализация — composable `useModal` или lib *(Headless UI)*; Module 10 practice — минимум Escape + backdrop click.

```ts
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', onKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
  }
})
```

---

## 10. Teleport + `v-if`

```vue
<Teleport to="body">
  <div v-if="open" class="modal-backdrop">…</div>
</Teleport>
```

`v-if="false"` — ничего не в DOM target *(Teleport empty)*.

Не держи backdrop в DOM с `visibility: hidden` без нужды.

---

## 11. Dropdown vs Modal

| | Modal | Dropdown |
|---|-------|----------|
| Teleport | almost always `body` | often yes, if overflow clip |
| Backdrop | full screen | optional |
| Focus | trap | return on outside click |
| Module 10 | BaseModal | BaseDropdown *(урок 06)* |

Menu в header catalog filters — Teleport если parent `overflow: hidden`.

---

## 12. SSR / SSG note

Teleport to `body` на server: Vue 3 SSR поддерживает Teleport с matching target в HTML.

Pet-project SPA (Vite) — обычно не проблема. `disabled` на SSR если target нет.

---

## 13. Частые ошибки

### Modal без Teleport в nested layout

Клипается `overflow: hidden` на card/layout.

### `to="#missing"` target

Teleport не монтируется / warning. Проверь `index.html`.

### z-index война с header

Modal под nav — подними token или teleport выше.

### State в modal, разметка не teleported

Ok logically; но visual bug остаётся.

### Забыть `@click.self` на backdrop

Click inside modal closes — bug.

### Нет `role="dialog"` / `aria-modal`

Screen reader не понимает context.

### Body scroll не lock

Background scroll behind modal.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Что делает `<Teleport to="body">`?
2. Зачем `#modal-root` отдельно от `#app`?
3. Modal state где живёт vs DOM где рендерится?
4. Почему toast stack teleported?
5. Что делает `:disabled` на Teleport?
6. Teleport решает z-index или focus trap?

---

## 15. Что почитать

### Официальное

- [Teleport](https://vuejs.org/guide/built-ins/teleport.html)
- [WAI-ARIA · Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

### Связанные материалы этого плана

- [Module 9 · forms](../module-9/07-auth-profile-checkout-forms.md)

---

## 16. Практическое мини-задание

1. `BaseModal.vue` с Teleport to `body`
2. Catalog: «Delete product» opens modal
3. Backdrop click + Escape close
4. `body` overflow hidden while open
5. `#toast-root` + empty Teleport container in App *(prep for toasts)*

---

## 17. Мини-конспект

- Teleport = same component logic, different DOM mount point
- modal/toast → `body` or dedicated root
- fixes overflow clip + z-index stacking
- a11y/focus/scroll — отдельно от Teleport
- дальше — **Suspense**

---

## 18. Что делать дальше

Следующий теоретический блок Module 10:

- [Suspense](./02-suspense.md)
