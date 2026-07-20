# Module 3 · Теория: базовая доступность

Этот материал закрывает **финальный теоретический пункт Module 3**: понять **базовую a11y** для Vue UI — **семантику**, **`label`**, **`button`** и **focus states**, чтобы interactive components были usable не только мышью.

Связанные материалы:

- [Module 3 · UI decomposition](./08-ui-decomposition.md)
- [Module 3 · slots](./03-slots.md)
- [Module 3 · container / presentational](./07-container-presentational.md)
- [Module 1 · basic forms](../module-1/13-basic-forms.md)

---

## 1. Почему a11y входит в Module 3

Ты уже умеешь собирать дерево components.
Теперь важно, чтобы это дерево было **доступным**:

```text
можно пользоваться с клавиатуры
controls имеют понятные имена
focus виден и предсказуем
semantic HTML не заменён на div-soup
```

Vue сам по себе a11y не «чинит».
Accessible UI = то, что ты рендеришь в template.

Официально:

- [Accessibility · Vue.js](https://vuejs.org/guide/best-practices/accessibility.html)

---

## 2. Семантика: используй правильные HTML-элементы

Семантика = выбирать элемент по смыслу, а не по внешнему виду.

| Нужно | Используй |
|------|-----------|
| действие | `<button>` |
| навигация на URL | `<a href="...">` |
| заголовок секции | `<h1>`–`<h3>` |
| список | `<ul>` / `<ol>` + `<li>` |
| поле ввода | `<input>` / `<select>` / `<textarea>` |
| группировка формы | `<form>`, `<label>` |
| диалог | modal с `role="dialog"` *(минимум)* |

### Плохо

```vue
<div class="btn" @click="save">Save</div>
```

### Хорошо

```vue
<button type="button" @click="save">Save</button>
```

Почему:

- native keyboard support (`Enter` / `Space`)
- native focus
- screen reader понимает «button»

Стили меняй через CSS, а не через замену тега на `div`.

---

## 3. Семантика в catalog UI

### Хорошая структура

```vue
<main>
  <h1>Product Catalog</h1>

  <section aria-labelledby="filters-title">
    <h2 id="filters-title">Filters</h2>
    <ProductFilters ... />
  </section>

  <section aria-labelledby="products-title">
    <h2 id="products-title">Products</h2>
    <ProductList ... />
  </section>
</main>
```

### Зачем

- заголовки дают каркас страницы
- `main` / `section` помогают ориентироваться
- list остаётся списком, button — button

Не делай всю страницу из `<div>` без структуры.

---

## 4. `label` для полей ввода

Каждый input должен иметь accessible name.

### Лучший способ: `<label for>` + `id`

```vue
<script setup lang="ts">
defineProps<{
  modelValue: string
  inputId?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="field">
    <label :for="inputId ?? 'search-query'">Search</label>
    <input
      :id="inputId ?? 'search-query'"
      :value="modelValue"
      type="search"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
```

### Alternative: wrap input в label

```vue
<label>
  Search
  <input v-model="query" type="search" />
</label>
```

Оба варианта ок. Explicit `for`/`id` часто надёжнее в UI-kit.

---

## 5. Placeholder ≠ label

```vue
<!-- ❌ недостаточно -->
<input placeholder="Search products" />
```

Placeholder:

- может исчезнуть при вводе
- хуже как единственное имя поля
- не заменяет `<label>`

Можно использовать placeholder как hint, но label всё равно нужен.

---

## 6. `button`: правильные практики

### Всегда указывай `type`

Внутри form:

```vue
<button type="submit">Save</button>
<button type="button" @click="cancel">Cancel</button>
```

Если `type` не указан, browser считает button `submit` — легко словить случайный submit.

### Icon-only button нужен accessible name

```vue
<button type="button" aria-label="Close dialog" @click="close">
  ×
</button>
```

Без `aria-label` screen reader может сказать просто «button» / «times».

### Не делай clickable `div`

```vue
<!-- ❌ -->
<div role="button" tabindex="0" @click="open" @keyup.enter="open">Open</div>

<!-- ✅ -->
<button type="button" @click="open">Open</button>
```

Native `<button>` почти всегда проще и надёжнее custom ARIA.

---

## 7. Links vs buttons

| Сценарий | Элемент |
|----------|---------|
| выполняет действие на странице | `<button>` |
| ведёт на другой URL/route | `<a href>` |

```vue
<!-- action -->
<button type="button" @click="addToCart">Add to cart</button>

<!-- navigation -->
<a href="/products/42">Open product</a>
```

Путать их = ломать ожидания клавиатуры и assistive tech.

---

## 8. Focus states

Focus = индикатор «сейчас активен этот control».

### Нельзя просто убирать outline

```css
/* ❌ плохая практика */
button:focus {
  outline: none;
}
```

Если убираешь default outline — обязан дать **видимую альтернативу**:

```css
.btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

`:focus-visible` показывает focus ring в основном для keyboard navigation — хороший default для современных UI.

### Проверь вручную

1. Открой app
2. Убери мышь
3. Нажимай `Tab` / `Shift+Tab`
4. Все interactive элементы должны быть достижимы
5. Focus ring должен быть заметен

---

## 9. Keyboard checklist для Module 3 UI

Минимум:

- [ ] filters inputs доступны по `Tab`
- [ ] buttons активируются `Enter` / `Space`
- [ ] modal открывается и закрывается предсказуемо
- [ ] close button в modal доступен с клавиатуры
- [ ] нет «мертвых» clickable `div`

Для MVP modal достаточно базового поведения.
Полный focus trap — следующий уровень, но уже сейчас:

```text
при открытии — focus внутрь modal
при закрытии — focus обратно на trigger (ideal)
Escape закрывает modal (очень желательно)
```

---

## 10. Focus management в Vue

### Template ref + `nextTick`

```vue
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{ open: boolean }>()
const panelRef = ref<HTMLElement | null>(null)

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    panelRef.value?.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus()
  },
)
</script>

<template>
  <div v-if="open" ref="panelRef" role="dialog" aria-modal="true">
    <slot />
  </div>
</template>
```

`nextTick` нужен, потому что DOM после `v-if` появляется не мгновенно.

---

## 11. Accessible `BaseButton`

```vue
<script setup lang="ts">
defineProps<{
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  ariaLabel?: string
}>()
</script>

<template>
  <button
    class="btn"
    :type="type ?? 'button'"
    :disabled="disabled"
    :aria-label="ariaLabel"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>
```

Base UI-kit — лучшее место закрепить a11y defaults.

---

## 12. Accessible filters

```vue
<template>
  <form class="filters" @submit.prevent>
    <div class="field">
      <label for="catalog-query">Search products</label>
      <input
        id="catalog-query"
        :value="query"
        type="search"
        autocomplete="off"
        @input="$emit('update:query', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="field">
      <label for="catalog-sort">Sort by</label>
      <select
        id="catalog-sort"
        :value="sortBy"
        @change="$emit('update:sortBy', ($event.target as HTMLSelectElement).value)"
      >
        <option value="name">Name</option>
        <option value="price">Price</option>
      </select>
    </div>
  </form>
</template>
```

Даже если submit не нужен, semantic `<form>` + labels уже улучшают структуру.

---

## 13. Accessible modal (минимум для Module 3)

```vue
<script setup lang="ts">
defineProps<{ open: boolean; titleId?: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <div
    v-if="open"
    class="modal"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId ?? 'modal-title'"
    @keydown.escape="$emit('close')"
  >
    <div class="modal__panel">
      <header>
        <h2 :id="titleId ?? 'modal-title'">
          <slot name="header">Dialog</slot>
        </h2>
        <button type="button" aria-label="Close" @click="$emit('close')">
          ×
        </button>
      </header>

      <div>
        <slot />
      </div>

      <footer v-if="$slots.actions">
        <slot name="actions" />
      </footer>
    </div>
  </div>
</template>
```

Это ещё не полный production focus-trap, но уже намного лучше `div` без ролей и labels.

---

## 14. ARIA: используй sparingly

Правило:

```text
сначала semantic HTML
ARIA — только если native не хватает
```

Полезные атрибуты на Module 3:

| Attribute | Зачем |
|-----------|------|
| `aria-label` | имя для icon-only button |
| `aria-labelledby` | связать dialog с title |
| `aria-modal="true"` | обозначить modal |
| `aria-hidden="true"` | спрятать decorative content от AT |

Не добавляй `role="button"` на `div`, если можешь использовать `<button>`.

---

## 15. Disabled и loading states

```vue
<button type="button" :disabled="isLoading">
  {{ isLoading ? 'Loading...' : 'Retry' }}
</button>
```

Disabled button:

- не должен быть focusable как активный control
- должен понятно выглядеть и читаться

Для loading list достаточно текста/`aria-live` позже.
На Module 3 хватит явного visible state: `Loading...`, `Error`, `Empty`.

---

## 16. Быстрый a11y checklist для Module 3 practice

Перед завершением модуля проверь:

### Semantics

- [ ] actions = `<button>`
- [ ] links = `<a>` только для navigation
- [ ] есть заголовки (`h1`/`h2`)
- [ ] списки товаров — semantic list *(или осознанная grid-разметка)*

### Labels

- [ ] у search/sort есть `<label>`
- [ ] `for`/`id` совпадают
- [ ] placeholder не единственный источник имени

### Buttons

- [ ] у всех button есть `type`
- [ ] icon-only имеют `aria-label`
- [ ] нет clickable `div`

### Focus

- [ ] виден `:focus-visible`
- [ ] Tab проходит по всем controls
- [ ] modal можно закрыть с клавиатуры

---

## 17. Частые ошибки

### Clickable card без keyboard path

```vue
<div class="card" @click="select">...</div>
```

Лучше:

- button «Select» внутри card
- или card как article + явный button/link

### Убрали outline и забыли replacement

Focus есть логически, но пользователь его не видит.

### Label текстом рядом, но без связи

```vue
<span>Search</span>
<input />
```

Это визуально похоже на label, но не является accessible name.

### Modal только для мыши

Нет Escape, нет focus, close только «кликом по overlay».

---

## 18. Что важно понять после этого блока

Проверь себя:

1. Почему `<div @click>` плох для actions?
2. Чем `<label for>` лучше placeholder?
3. Зачем `type="button"` внутри form?
4. Что такое `:focus-visible` и зачем он нужен?
5. Какие минимум-атрибуты полезны для modal?
6. Что проверить Tab-навигацией перед сдачей Module 3?

---

## 19. Что почитать

### Официальное

- [Accessibility · Vue.js](https://vuejs.org/guide/best-practices/accessibility.html)
- [Accessibility · Vue.js RU](https://ru.vuejs.org/guide/best-practices/accessibility.html)
- [MDN · HTML: A good basis for accessibility](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/HTML)
- [MDN · `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)
- [MDN · `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)

### Связанные материалы этого плана

- [Module 3 · UI decomposition](./08-ui-decomposition.md)
- [Module 1 · basic forms](../module-1/13-basic-forms.md)

---

## 20. Практическое мини-задание

Пройди a11y pass по catalog UI:

1. Замени clickable `div` на `<button>` / `<a>`
2. Добавь labels к filters
3. Добавь `:focus-visible` в `BaseButton`
4. В modal:
   - `role="dialog"`
   - `aria-modal="true"`
   - close с `aria-label`
   - закрытие по `Escape`
5. Пройди весь UI только клавиатурой

---

## 21. Мини-конспект

- a11y начинается с semantic HTML
- label связан с input через `for`/`id`
- actions = `<button type="...">`
- focus ring обязателен и должен быть виден
- ARIA не заменяет семантику, а дополняет
- Module 3 UI должен работать с клавиатуры

---

## 22. Что делать дальше

**Теория Module 3 завершена.**

Следующий шаг:

- **[практика Module 3](./10-practice-checklist.md)** — catalog cards, modal, reusable UI-kit, a11y pass
- затем **Module 4**
