# Module 10 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 10**: собрать **reusable UI kit** (3–5 элементов) в catalog app — modal, toast, dropdown/tabs, Teleport/transitions/directives, composables.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 5–9 должны быть на месте

- [ ] Router + catalog + detail работают
- [ ] Pinia cart (и опционально auth)
- [ ] vue-query или api layer для products
- [ ] Forms (Module 9) — optional, но modal с form — хороший combo

### Прочитай теорию Module 10

- [01 · Teleport](01-teleport.md)
- [02 · Suspense](02-suspense.md)
- [03 · transitions](03-transitions.md)
- [04 · custom directives](04-custom-directives.md)
- [05 · composables reuse layer](05-composables-reuse-layer.md)
- [06 · UI patterns](06-ui-patterns.md)

---

## Шаг 1. Выбрать проект

| Вариант | Когда |
|---------|--------|
| **Product Catalog Module 5–9** | recommended |
| **Blog + modal comments** | если catalog исчерпан |
| **Dashboard** | tabs + notifications |

### Рекомендация

Module 10 — **UI layer поверх** существующего app, не новый проект.

### Checklist

- [ ] выбран проект
- [ ] `npm run dev` стартует

---

## Шаг 2. Зафиксировать MVP Module 10

### MVP (критерии README)

- **3–5 reusable UI elements** с понятным API
- минимум **один** из: `Teleport`, `Transition`, custom **directive** — в оправданном месте
- **composables** для UI logic (`useModal`, `useToast`, …) — не god composables
- **integration** на реальных экранах *(не только /demo)*
- страница или flow с **модалкой + уведомлениями + динамическим блоком** (tabs/dropdown)

### Рекомендуемый минимальный набор

| # | Component | Composable | Real usage |
|---|-----------|------------|------------|
| 1 | `BaseModal` | `useModal` | delete confirm catalog |
| 2 | `ToastContainer` | `useToast` | save / cart add |
| 3 | `BaseDropdown` | `useDisclosure` | category filter |
| 4 | `Tabs` + `TabPanel` | — | product detail |
| 5 | *(optional)* `AppButton` | — | consistent actions |

**3 компонента + toast** = можно закрыть MVP, если tabs или dropdown вместо одного из optional.

### Из README practice

| Требование | MVP |
|------------|-----|
| набор переиспользуемых компонентов | 3–5 шт |
| страница с модалкой, уведомлениями, динамикой | catalog/detail integration |
| Teleport / transitions / directives | ≥1 механизм явно |
| composables помогают, не усложняют | useModal + useToast |
| понятный API | v-model, slots, typed props |

### Не обязательно в MVP

- Headless UI / Radix port
- full design system / Storybook
- Suspense page loader *(если уже есть — ok)*
- keyboard roving tabindex на tabs
- portal positioning library для dropdown

### Checklist

- [ ] MVP записан (какие 3–5 pieces)
- [ ] scope не уехал в Module 11 testing

---

## Шаг 3. Подготовить DOM roots

```html
<!-- index.html -->
<body>
  <div id="app"></div>
  <div id="modal-root"></div>
  <div id="toast-root"></div>
</body>
```

`BaseModal` → `body` or `#modal-root` — выбери один и будь consistent.

### Checklist

- [ ] teleport targets exist
- [ ] `ToastContainer` mounted once in `App.vue`

---

## Шаг 4. UI composables

```text
src/composables/ui/
  useDisclosure.ts
  useModal.ts
  useToast.ts
  useTabs.ts           # optional
```

### Checklist

- [ ] `useModal` — show/hide + optional payload
- [ ] `useToast` — global queue, success/error
- [ ] `useDisclosure` — toggle for dropdown
- [ ] shared toast state — module-level, not per component instance leak

---

## Шаг 5. `BaseModal`

Требования:

- [ ] `<Teleport to="body">` or `#modal-root`
- [ ] `<Transition name="modal">` enter/leave
- [ ] `v-model:open`
- [ ] props: `title`, slot `footer`
- [ ] backdrop click + **Escape** close
- [ ] `body` scroll lock while open
- [ ] `role="dialog"`, `aria-modal="true"`

### Integration

- [ ] Catalog: delete product → confirm modal → mutation/toast
- [ ] **One modal per page** + payload, not per table row

---

## Шаг 6. `ToastContainer` + notifications

- [ ] Teleport to `#toast-root`
- [ ] `TransitionGroup` for stack
- [ ] `aria-live="polite"` / `role="alert"` for errors
- [ ] dismiss button or auto-dismiss timeout

### Integration

- [ ] success toast after profile save / product update
- [ ] error toast on failed action *(optional)*
- [ ] cart add toast *(optional stretch)*

---

## Шаг 7. `BaseDropdown` или `Tabs` *(минимум один)*

### Dropdown

- [ ] `v-click-outside` or composable close
- [ ] `useDisclosure` for open state
- [ ] `aria-expanded` on trigger
- [ ] Transition on panel
- [ ] Catalog category or user menu in header

### Tabs

- [ ] `v-model` active tab id
- [ ] `role="tablist"`, `tab`, `tabpanel`
- [ ] Product detail: description / reviews / shipping

### Checklist

- [ ] dropdown **или** tabs на real page
- [ ] оба — stretch ok

---

## Шаг 8. Custom directive *(recommended)*

Минимум **один**:

- [ ] `v-focus` — modal/login first field
- [ ] `v-click-outside` — dropdown

### Checklist

- [ ] directive registered (global or local)
- [ ] cleanup on unmount verified

---

## Шаг 9. Transitions *(recommended)*

- [ ] modal fade/scale
- [ ] toast slide
- [ ] optional: `TransitionGroup` on cart lines
- [ ] `@media (prefers-reduced-motion: reduce)` fallback

---

## Шаг 10. Suspense *(optional stretch)*

- [ ] `Suspense` around `RouterView` + page fallback
- [ ] **не** replace vue-query loading for catalog list

---

## Шаг 11. Структура проекта

```text
src/
  components/ui/
    BaseModal.vue
    BaseDropdown.vue
    Tabs.vue
    TabPanel.vue
    ToastContainer.vue
  composables/ui/
  directives/
    vClickOutside.ts
    vFocus.ts
  pages/
    CatalogPage.vue      # modal + dropdown
    ProductDetailsPage.vue  # tabs
  App.vue                # ToastContainer
```

### Checklist

- [ ] UI components in `components/ui/`
- [ ] pages не содержат 200 lines modal markup inline

---

## Шаг 12. API review

Для каждого Base* ответь:

1. Какие props обязательны?
2. Какие slots?
3. Какие events?
4. Где state — composable vs v-model?

### Checklist

- [ ] можно использовать компонент на второй page без copy-paste
- [ ] API задокументирован в comment или README snippet

---

## Шаг 13. Ручной QA

1. Open modal → Escape closes  
2. Open modal → backdrop click closes  
3. Background scroll locked when modal open  
4. Toast appears and dismisses  
5. Dropdown outside click closes  
6. Tabs switch content  
7. Delete flow: modal → confirm → list updates + toast  
8. No z-index clash with header  
9. Teleport targets — modal/toast visible, not clipped  
10. Reduced motion — no broken UI  

### Checklist

- [ ] все релевантные пункты пройдены

---

## Шаг 14. Финальная самопроверка

1. Зачем Teleport для modal?
2. Composable vs component — пример из проекта?
3. Почему один modal + payload?
4. Transition vs Suspense — что для чего?
5. Directive vs composable — что выбрал и почему?
6. Какие 3–5 reusable pieces собрал?

### Checklist

- [ ] ответы своими словами

---

## Финальный checklist Module 10

Module 10 можно считать завершённым, если:

### Проект

- [ ] 3–5 reusable UI components in `components/ui/`
- [ ] modal + toast на real user flows
- [ ] dropdown или tabs на real page
- [ ] app собирается и работает

### Критерии README

- [ ] Teleport / transitions / directives — ≥1 justified
- [ ] composables (`useModal`, `useToast`, …) без over-engineering
- [ ] понятный API (v-model, slots)
- [ ] integration page/flow, не orphan demo-only components

### Module 10 mechanisms map

| Mechanism | Used? |
|-----------|-------|
| Teleport | [ ] |
| Transition / TransitionGroup | [ ] |
| Suspense | [ ] optional |
| Custom directive | [ ] |
| UI composable | [ ] |

---

## Stretch goals *(optional)*

- `/ui-demo` playground route
- `Suspense` + lazy route loader
- RouterView page transition fade
- Tabs synced with `route.query.tab`
- Dropdown Teleport to body with positioning
- focus trap library in modal
- unit tests for `useDisclosure` / `useModal` *(Module 11 preview)*

---

## Если что-то пошло не так

### Modal clipped or under header

- Teleport to `body`; check z-index tokens

### Toast never shows

- `ToastContainer` in App.vue? `#toast-root` in html?

### Transition leave not visible

- parent `v-if` removes too fast — wait `@after-leave`

### Dropdown closes on inside click

- fix `v-click-outside` contains check

### useToast empty in second component

- same module-level queue — import same composable file

### Five different modal implementations

- consolidate to `BaseModal`

### Composable 300 lines

- split UI vs domain; keep modal composable thin

---

## Что делать после Module 10

Переходи к **Module 11 · Тестирование**:

- Vitest + Vue Test Utils
- component tests, composable tests
- mock API
- Playwright/Cypress intro

UI kit готов — Module 11 покроет **tests** для composables и critical flows.

---

## Мини-конспект

- Module 10 = reusable UI kit + real integration
- modal + toast = minimum viable Module 10
- Teleport/Transition/directive/composable — по делу
- 3–5 Base* components, thin pages
- Module 11 = tests for behavior
