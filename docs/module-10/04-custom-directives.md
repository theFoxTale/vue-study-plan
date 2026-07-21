# Module 10 · Теория: custom directives

Этот материал закрывает четвёртый теоретический пункт `Module 10`: **custom directives** — `v-focus`, `v-click-outside`, lifecycle hooks, регистрация, **directive vs composable**.

Связанные материалы:

- [Module 10 · transitions](./03-transitions.md)
- [Module 10 · Teleport](./01-teleport.md)
- [Module 4 · typing composables](../module-4/03-typing-composables.md)

---

## 1. Что такое custom directive

**Directive** — reactive side effect на **DOM element**:

```vue
<input v-focus />
<div v-click-outside="close">…</div>
```

```text
Component  → UI + composition
Composable → reusable logic (preferred)
Directive  → low-level DOM behavior on element
```

Встроенные: `v-model`, `v-show`, `v-if` *(structural)*.

Custom — когда нужно **переиспользовать DOM-паттерн** без обёртки-компонента.

Официально:

- [Custom Directives · Vue Guide](https://vuejs.org/guide/reusability/custom-directives.html)

---

## 2. Когда directive, когда composable

| Используй **directive** | Используй **composable** |
|-------------------------|---------------------------|
| focus, click-outside, autogrow textarea | `useModal`, `useToast` |
| tooltip on arbitrary element | form validation state |
| lazy `loading="lazy"` wrapper | fetch, router, pinia |
| third-party lib needs DOM hook | business logic |

```text
Directive  → «повесь behavior на этот el»
Composable → «дай state + methods в setup»
```

Module 10 README: directives **в оправданном сценарии** — 1–2 в проекте достаточно.

---

## 3. Lifecycle hooks (Vue 3)

```ts
const myDirective = {
  mounted(el: HTMLElement, binding) { … },
  updated(el, binding) { … },
  unmounted(el, binding) { … },
}
```

| Hook | Когда |
|------|--------|
| `mounted` | el inserted — add listeners, focus |
| `updated` | binding/value changed |
| `unmounted` | cleanup — **remove listeners** |

Vue 2 names (`inserted`, `bind`) — deprecated; используй Vue 3 API.

Shorthand function = только `mounted` + `unmounted` если симметрично.

---

## 4. `v-focus` — автофокус

```ts
// directives/vFocus.ts
import type { Directive } from 'vue'

export const vFocus: Directive<HTMLElement, boolean | undefined> = {
  mounted(el, binding) {
    if (binding.value === false) return
    el.focus()
  },
  updated(el, binding) {
    if (binding.value) el.focus()
  },
}
```

```vue
<input v-focus />
<input v-focus="shouldFocus" />
```

Login modal open → first field:

```vue
<TextField v-focus="open" … />
```

**Composable alternative:** `watch(open, () => inputRef.value?.focus())` — тоже ok; directive короче на arbitrary input.

---

## 5. Регистрация

### Local

```vue
<script setup lang="ts">
import { vFocus } from '@/directives/vFocus'

const vClickOutside = vClickOutsideDirective // local alias
</script>

<template>
  <input v-focus />
</template>
```

In `<script setup>`, import `vFocus` → usable as `v-focus` if named `vFocus`.

### Global

```ts
// main.ts
import { vFocus } from '@/directives/vFocus'
import { vClickOutside } from '@/directives/vClickOutside'

app.directive('focus', vFocus)
app.directive('click-outside', vClickOutside)
```

```vue
<input v-focus />
```

Global — для 2+ uses across app; local — для isolated case.

---

## 6. `v-click-outside` — dropdown / popover

```ts
// directives/vClickOutside.ts
import type { DirectiveBinding } from 'vue'

type ClickOutsideHandler = (event: MouseEvent) => void

const clickOutsideMap = new WeakMap<HTMLElement, ClickOutsideHandler>()

export const vClickOutside = {
  mounted(el: HTMLElement, binding: DirectiveBinding<() => void>) {
    const handler: ClickOutsideHandler = (event) => {
      const target = event.target as Node | null
      if (!target || el === target || el.contains(target)) return
      binding.value?.()
    }

    clickOutsideMap.set(el, handler)
    document.addEventListener('click', handler)
  },
  unmounted(el: HTMLElement) {
    const handler = clickOutsideMap.get(el)
    if (handler) {
      document.removeEventListener('click', handler)
      clickOutsideMap.delete(el)
    }
  },
}
```

```vue
<div v-click-outside="close" class="dropdown">
  <button @click="toggle">Category</button>
  <ul v-if="open">…</ul>
</div>
```

**Cleanup в `unmounted`** — иначе memory leak и ghost closes.

Catalog filters dropdown — типичный use case.

---

## 7. `binding` object

```ts
mounted(el, binding) {
  binding.value    // переданное значение
  binding.arg      // v-my-dir:arg
  binding.modifiers // v-my-dir.lazy → { lazy: true }
  binding.instance // component instance (rare)
}
```

```vue
<div v-tooltip:top.delay="hint">…</div>
```

```ts
mounted(el, binding) {
  const placement = binding.arg ?? 'bottom'
  const delay = binding.modifiers.delay ? 300 : 0
  showTooltip(el, binding.value, { placement, delay })
}
```

Modifiers — boolean flags; complex config → **object value**.

---

## 8. `v-autogrow` для textarea

```ts
export const vAutogrow = {
  mounted(el: HTMLTextAreaElement) {
    const resize = () => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    el.addEventListener('input', resize)
    ;(el as HTMLTextAreaElement & { _autogrow?: () => void })._autogrow = resize
    resize()
  },
  unmounted(el: HTMLTextAreaElement) {
    const resize = (el as HTMLTextAreaElement & { _autogrow?: () => void })._autogrow
    if (resize) el.removeEventListener('input', resize)
  },
}
```

Profile bio field — UX без manual resize.

---

## 9. Directive vs component wrapper

```vue
<!-- directive -->
<button v-tooltip="'Delete'">🗑</button>

<!-- component -->
<Tooltip text="Delete">
  <button>🗑</button>
</Tooltip>
```

| | Directive | Component |
|---|-----------|-----------|
| Arbitrary child | ✓ native element | needs slot |
| Template clarity | hidden magic | explicit |
| Testing | harder | easier |

Prefer **component** for complex tooltip with Teleport/a11y; **directive** for one-liner focus/click-outside.

---

## 10. TypeScript

```ts
import type { Directive, DirectiveBinding } from 'vue'

export const vFocus: Directive<HTMLElement, boolean | undefined> = {
  mounted(el, binding: DirectiveBinding<boolean | undefined>) {
    …
  },
}
```

Global augmentation *(optional)*:

```ts
// env.d.ts
declare module 'vue' {
  interface ComponentCustomProperties {
    vFocus: typeof vFocus
  }
}
```

---

## 11. Что не делать directive

```text
❌ HTTP fetch on mounted
❌ Pinia store access для business rules
❌ whole modal logic
❌ replace composable when setup is clearer
```

```ts
// bad: v-auth="admin" hiding logic in directive
// good: composable usePermissions() + v-if in template
```

Directives должны быть **thin DOM adapters**.

---

## 12. Catalog app — justified uses

| Directive | Where |
|-----------|--------|
| `v-focus` | login modal first field |
| `v-click-outside` | category dropdown, user menu |
| `v-autogrow` | profile bio *(optional)* |

Module 10 practice criterion: **≥1 directive** in justified scenario.

---

## 13. Частые ошибки

### No cleanup in `unmounted`

Leaked document listeners.

### `click-outside` on modal backdrop only

Click inside modal closes — attach handler to panel wrapper correctly.

### Directive mutates unrelated state heavily

Hard to debug — move logic to composable, directive calls callback only.

### Global register every micro-directive

Noise — local or colocate in `directives/index.ts`.

### SSR: `document` in mounted without guard

SPA ok; SSR needs `typeof document !== 'undefined'`.

### Same as composable but worse DX

If team always asks «what v-foo does» — use composable + explicit template.

---

## 14. Структура проекта

```text
src/directives/
  vFocus.ts
  vClickOutside.ts
  index.ts          # export all + register function
```

```ts
// directives/index.ts
export function registerDirectives(app: App) {
  app.directive('focus', vFocus)
  app.directive('click-outside', vClickOutside)
}
```

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Чем directive от composable?
2. Какие hooks в Vue 3?
3. Зачем cleanup в `unmounted`?
4. Как работает `v-click-outside`?
5. Local vs global registration?
6. Когда component лучше directive?

---

## 16. Что почитать

### Официальное

- [Custom Directives](https://vuejs.org/guide/reusability/custom-directives.html)
- [Directive API](https://vuejs.org/api/built-in-directives.html)

### Связанные материалы этого плана

- [Module 10 · UI patterns](./06-ui-patterns.md) *(dropdown)*

---

## 17. Практическое мини-задание

1. `v-focus` on login first field
2. `v-click-outside` on catalog filter dropdown
3. Register globally or import local in 2 components
4. Verify listeners removed on unmount *(DevTools Event Listeners)*
5. Write 1 sentence: why directive vs composable here

---

## 18. Мини-конспект

- directive = DOM-side effect on element
- mounted / updated / unmounted; always cleanup
- v-focus, v-click-outside — classic justified cases
- thin adapters; business logic → composable
- дальше — **composables как слой переиспользования**

---

## 19. Что делать дальше

Следующий теоретический блок Module 10:

- [composables как слой переиспользования](./05-composables-reuse-layer.md)
