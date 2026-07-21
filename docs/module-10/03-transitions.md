# Module 10 · Теория: transitions

Этот материал закрывает третий теоретический пункт `Module 10`: **`<Transition>`** и **`<TransitionGroup>`** — enter/leave, CSS classes, mode, list animations, modal/toast, `prefers-reduced-motion`.

Связанные материалы:

- [Module 10 · Teleport](./01-teleport.md)
- [Module 10 · Suspense](./02-suspense.md)
- [Module 5 · RouterView](../module-5/04-router-view.md)

---

## 1. Зачем transitions

```text
Modal open/close     → резкий pop — плохой UX
Toast appear/dismiss → user не замечает feedback
Route change         → optional subtle fade
Cart item remove     → список «прыгает»
```

**Transitions** — декларативные enter/leave анимации при **mount/unmount** или **v-if / v-show** toggle.

Официально:

- [Transition · Vue Guide](https://vuejs.org/guide/built-ins/transition.html)
- [TransitionGroup](https://vuejs.org/guide/built-ins/transition-group.html)

---

## 2. `<Transition>` — один элемент

```vue
<Transition name="fade">
  <div v-if="open" class="modal">Hello</div>
</Transition>
```

```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

Vue 3 class naming:

| Phase | Classes |
|-------|---------|
| Enter start | `name-enter-from`, `name-enter-active` |
| Enter end | `name-enter-to` |
| Leave start | `name-leave-from`, `name-leave-active` |
| Leave end | `name-leave-to` |

Default `name` = `v` → `v-enter-from`, …

**Rule:** transitioned element must be **single root** inside `<Transition>`.

---

## 3. `v-if` vs `v-show`

| | `v-if` | `v-show` |
|---|--------|----------|
| DOM | mount/unmount | toggle `display` |
| Transition | enter + leave | mostly CSS on show/hide *(leave limited)* |

Modal/toast — **`v-if`** + Transition для enter **и** leave.

---

## 4. Modal fade + scale *(Teleport)*

```vue
<!-- BaseModal.vue -->
<Teleport to="body">
  <Transition name="modal">
    <div v-if="open" class="modal-backdrop" @click.self="close">
      <div class="modal" role="dialog">…</div>
    </div>
  </Transition>
</Teleport>
```

```css
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.96);
  opacity: 0;
}
```

Backdrop и panel анимируются вместе — связка [Teleport](./01-teleport.md) + Transition.

---

## 5. `mode` — порядок enter/leave

```vue
<Transition name="fade" mode="out-in">
  <component :is="currentTab" :key="currentTab" />
</Transition>
```

| mode | Поведение |
|------|-----------|
| default | enter и leave параллельно |
| `out-in` | сначала leave, потом enter |
| `in-out` | сначала enter, потом leave |

Tabs / wizard steps — **`out-in`** avoids overlap.

Router page transition:

```vue
<RouterView v-slot="{ Component, route }">
  <Transition name="fade" mode="out-in">
    <component :is="Component" :key="route.path" />
  </Transition>
</RouterView>
```

Subtle fade only — не обязательно в MVP.

---

## 6. `appear` — анимация при первом mount

```vue
<Transition name="fade" appear>
  <CatalogHero v-if="showHero" />
</Transition>
```

Первый render тоже проходит enter transition.

---

## 7. `<TransitionGroup>` — списки

```vue
<TransitionGroup name="list" tag="ul" class="cart-items">
  <li v-for="item in cart.items" :key="item.id" class="cart-item">
    {{ item.title }} × {{ item.qty }}
  </li>
</TransitionGroup>
```

```css
.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

/* move animation when siblings reflow */
.list-move {
  transition: transform 0.25s ease;
}
```

**`:key` обязателен** — Vue tracks items for move transition.

Cart remove / filter catalog cards — типичный use case (Module 6 cart).

---

## 8. Toast slide-in

```vue
<TransitionGroup name="toast" tag="div" class="toast-stack">
  <div v-for="t in toasts" :key="t.id" class="toast">
    {{ t.message }}
  </div>
</TransitionGroup>
```

```css
.toast-enter-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.toast-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
```

Teleport container + TransitionGroup — [patterns урок 06](./06-ui-patterns.md).

---

## 9. JavaScript hooks

```vue
<Transition
  @before-enter="onBeforeEnter"
  @enter="onEnter"
  @after-enter="onAfterEnter"
  @leave="onLeave"
  …
>
```

```ts
function onEnter(el: Element, done: () => void) {
  // anime.js / Web Animations API
  el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }).onfinish = done
}
```

**`done` callback обязателен** при JS hook — иначе Vue не знает когда transition ended.

Pet-project: **CSS transitions** достаточно; JS — для complex choreography.

---

## 10. `type` prop — CSS vs animation

```vue
<Transition type="animation" name="bounce">
```

Vue listens `animationend` instead of `transitionend` — для `@keyframes`.

---

## 11. `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .toast-enter-active,
  .toast-leave-active {
    transition: none !important;
  }
}
```

Or global:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Accessibility — не block functionality, only motion.

---

## 12. Transition + Suspense

Разные задачи:

```text
Suspense   → wait for async content
Transition → animate when content appears/disappears
```

Optional combo: fade in after Suspense resolves — subtle `appear` on loaded content, not on skeleton.

---

## 13. Dropdown / accordion

```vue
<Transition name="expand">
  <div v-if="open" class="dropdown-panel">…</div>
</Transition>
```

Height animation tricky in pure CSS — often `max-height` hack or JS hook.

Simple: **opacity + translateY** instead of height.

---

## 14. Catalog app — где уместно

| UI | Transition |
|----|------------|
| Modal open/close | ✓ fade/scale |
| Toast stack | ✓ slide |
| Cart line remove | ✓ TransitionGroup |
| Route change | optional fade |
| Product grid filter | optional list move |
| Query loading skeleton | ✗ not replace Suspense/query states |
| Every hover | ✗ overkill |

Module 10 README: **«в оправданном сценарии»** — 2–3 места enough.

---

## 15. Частые ошибки

### Несколько roots в `<Transition>`

Invalid — wrap in one div.

### List без `:key`

TransitionGroup broken / wrong move.

### Leave transition не виден — immediate `v-if=false` parent

Parent unmounts before leave finishes — keep modal state until `@after-leave`.

### `mode` без `:key` на dynamic component

Same component reused — no transition.

### Animate `width/height` layout everywhere

Janky — prefer transform/opacity.

### 500ms transitions на всём

App feels slow — 150–250ms for UI chrome.

### Transition на vue-query `isPending` toggle

Skeleton flicker — stabilize with `placeholderData` or min display time.

---

## 16. Reusable CSS utilities

```css
/* assets/transitions.css */
.t-fade-enter-active,
.t-fade-leave-active {
  transition: opacity 0.2s ease;
}
.t-fade-enter-from,
.t-fade-leave-to {
  opacity: 0;
}
```

```vue
<Transition enter-active-class="t-fade-enter-active" …>
```

Or shared `name="t-fade"` across components.

---

## 17. Что важно понять после этого блока

Проверь себя:

1. Class names enter/leave в Vue 3?
2. `mode="out-in"` зачем?
3. Transition vs TransitionGroup?
4. Почему list needs `:key`?
5. Modal + Teleport + Transition порядок?
6. `prefers-reduced-motion` зачем?

---

## 18. Что почитать

### Официальное

- [Transition](https://vuejs.org/guide/built-ins/transition.html)
- [TransitionGroup](https://vuejs.org/guide/built-ins/transition-group.html)

### Связанные материалы этого плана

- [Module 10 · Teleport](./01-teleport.md)
- [Module 6 · cart](../module-6/10-practice-checklist.md)

---

## 19. Практическое мини-задание

1. `BaseModal` — fade + scale transition
2. Cart page — `TransitionGroup` on line items
3. One toast enter/leave animation
4. `prefers-reduced-motion` fallback
5. Optional: `RouterView` fade `mode="out-in"`

---

## 20. Мини-конспект

- `<Transition>` single element enter/leave
- `<TransitionGroup>` lists + `list-move`
- Vue 3: `*-enter-from/to`, `*-leave-from/to`
- modal/toast/cart — justified targets
- keep durations short; respect reduced motion
- дальше — **custom directives**

---

## 21. Что делать дальше

Следующий теоретический блок Module 10:

- [custom directives](./04-custom-directives.md)
