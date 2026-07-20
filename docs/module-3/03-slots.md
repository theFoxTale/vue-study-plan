# Module 3 · Теория: slots

Этот материал закрывает третий теоретический пункт `Module 3`: понять, **что такое slots**, **чем они отличаются от props**, **когда parent должен вставлять content внутрь child** и **как это помогает строить reusable UI**.

Связанные материалы:

- [Module 3 · props](./01-props.md)
- [Module 3 · emits](./02-emits.md)
- [Module 1 · Single File Components](../module-1/03-single-file-components.md)

---

## 1. Что такое slots

**Slots** позволяют parent передать **template content** внутрь child component.

```text
props  → data / config
emits  → events / actions
slots  → content / markup
```

### Parent

```vue
<BaseButton>
  Add to cart
</BaseButton>
```

### Child

```vue
<button class="btn">
  <slot></slot>
</button>
```

### Итог в DOM

```html
<button class="btn">Add to cart</button>
```

Официально:

- [Slots · Vue.js](https://vuejs.org/guide/components/slots.html)

---

## 2. Зачем нужны slots

Props хорошо передают значения:

```vue
<BaseButton label="Save" />
```

Но иногда нужно передать **разметку**, а не строку:

```vue
<BaseButton>
  <Icon name="plus" />
  Save
</BaseButton>
```

Или целый блок UI:

```vue
<BaseCard>
  <h3>Keyboard</h3>
  <p>$80</p>
  <button>Buy</button>
</BaseCard>
```

Slots делают компонент **оболочкой** (layout/wrapper), а content оставляет parent.

---

## 3. Mental model: slot как аргумент функции

Упрощённо:

```js
// parent
BaseButton('Click me!')

// child
function BaseButton(slotContent) {
  return `<button class="btn">${slotContent}</button>`
}
```

Child решает **где** показать content.
Parent решает **какой** content передать.

---

## 4. Slot outlet

В child template `<slot>` — это место вставки:

```vue
<template>
  <article class="card">
    <slot></slot>
  </article>
</template>
```

Если parent ничего не передал — slot пустой *(или показывает fallback)*.

---

## 5. Fallback content

Можно задать content по умолчанию:

```vue
<button type="submit" class="btn">
  <slot>Submit</slot>
</button>
```

### Без content от parent

```vue
<SubmitButton />
```

→ `Submit`

### С content от parent

```vue
<SubmitButton>Save product</SubmitButton>
```

→ `Save product`

Fallback полезен для UI-kit: компонент работает «из коробки», но остаётся гибким.

---

## 6. Render scope — чьи данные видит slot

Slot content живёт в **scope parent**.

```vue
<script setup lang="ts">
const title = 'Catalog'
</script>

<template>
  <BaseCard>
    {{ title }}
  </BaseCard>
</template>
```

`title` берётся из parent, не из child.

### Правило

```text
parent template → parent data
child template  → child data
```

Slot content **не видит** private state child автоматически.
Если child хочет отдать свои data в slot — это уже **scoped slots** *(отдельный урок)*.

---

## 7. Props vs slots: когда что

| Нужно передать | Используй |
|----------------|-----------|
| string / number / boolean / object | props |
| text label | props или slot |
| markup / components / mixed content | slots |
| layout areas (header/body/footer) | named slots *(далее)* |
| item template в list | scoped slots *(далее)* |

### Пример: лучше prop

```vue
<ProductPrice :value="80" currency="USD" />
```

### Пример: лучше slot

```vue
<BaseButton>
  <Icon name="cart" />
  Add to cart
</BaseButton>
```

### Серая зона: label

Оба варианта валидны:

```vue
<BaseButton label="Save" />
<BaseButton>Save</BaseButton>
```

Для простого text часто хватает prop.
Для flexible content — slot.

---

## 8. Базовый UI-kit на slots

### `BaseButton.vue`

```vue
<script setup lang="ts">
defineProps<{
  type?: 'button' | 'submit'
  disabled?: boolean
}>()
</script>

<template>
  <button class="btn" :type="type ?? 'button'" :disabled="disabled">
    <slot>Button</slot>
  </button>
</template>
```

### Использование

```vue
<BaseButton>Save</BaseButton>
<BaseButton disabled>Loading...</BaseButton>
<BaseButton>
  <strong>Buy now</strong>
</BaseButton>
```

Один component — много вариантов content без новых boolean props вроде `showIcon`, `showBadge`.

---

## 9. Card / modal / layout wrappers

Slots особенно сильны в wrapper components.

### `BaseCard.vue`

```vue
<template>
  <article class="card">
    <slot />
  </article>
</template>
```

### Использование

```vue
<BaseCard>
  <h3>{{ product.name }}</h3>
  <p>{{ product.price }}</p>
</BaseCard>
```

### `BaseModal.vue` *(упрощённо)*

```vue
<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <div v-if="open" class="modal" role="dialog">
    <div class="modal__content">
      <slot />
    </div>
    <button type="button" @click="$emit('close')">Close</button>
  </div>
</template>
```

```vue
<BaseModal :open="isOpen" @close="isOpen = false">
  <h2>Product details</h2>
  <p>{{ selectedProduct?.name }}</p>
</BaseModal>
```

Parent решает content modal.
Child решает shell: overlay, close button, show/hide.

---

## 10. Conditional slots через `$slots`

Можно проверить, передал ли parent content:

```vue
<template>
  <article class="card">
    <div v-if="$slots.default" class="card__body">
      <slot />
    </div>
  </article>
</template>
```

Это полезно, когда wrapper-стили не нужны для пустого slot.

Для named slots проверка выглядит так: `$slots.header`, `$slots.footer` — подробнее в следующем уроке.

---

## 11. Когда slots упрощают architecture

### Плохо: слишком много boolean props

```vue
<ProductCard
  :show-badge="true"
  :show-actions="true"
  :show-description="false"
  :show-rating="true"
/>
```

API раздувается, component знает слишком много вариантов UI.

### Лучше: slot для гибкого content

```vue
<ProductCard :name="product.name" :price="product.price">
  <template #actions>
    <BaseButton @click="addToCart">Buy</BaseButton>
  </template>
</ProductCard>
```

*(named slots разберём отдельно; идея уже здесь)*

Даже default slot уже снимает часть boolean hell:

```vue
<BaseAlert>
  Failed to load products.
  <BaseButton @click="retry">Retry</BaseButton>
</BaseAlert>
```

---

## 12. Пример для Module 3 practice

Каталог + reusable wrappers:

```vue
<!-- CatalogPage.vue -->
<template>
  <main>
    <BaseCard>
      <ProductFilters v-model:query="query" v-model:sort-by="sortBy" />
    </BaseCard>

    <BaseCard>
      <ProductList :products="visibleProducts" @select="onSelect" />
    </BaseCard>

    <BaseModal :open="Boolean(selected)" @close="selected = null">
      <h2>{{ selected?.name }}</h2>
      <p>{{ selected?.price }}</p>
      <BaseButton @click="addToCart(selected!.id)">
        Add to cart
      </BaseButton>
    </BaseModal>
  </main>
</template>
```

Здесь:

- `BaseCard` / `BaseModal` / `BaseButton` — reusable shells через slots
- feature components (`ProductList`, `ProductFilters`) — domain UI
- page — composition

---

## 13. Чего slots не заменяют

| Задача | Не slots, а... |
|--------|----------------|
| передать data | props |
| сообщить о действии | emits |
| shared logic | composables |
| item data из list child | scoped slots |
| несколько зон layout | named slots |

Slots — про **content composition**, не про state management.

---

## 14. Частые ошибки

### Пытаться читать child state из slot content

```vue
<!-- ❌ slot content не видит child.internalCount -->
<Counter>
  {{ internalCount }}
</Counter>
```

Нужен scoped slot или prop/emits design.

### Заменять props slots без нужды

```vue
<!-- избыточно -->
<Price><span>80</span></Price>

<!-- достаточно -->
<Price :value="80" />
```

### Слишком большой «god slot»

Если в один default slot пихается всё приложение, wrapper перестаёт быть понятным.
Тогда лучше named slots: `header`, `default`, `footer`.

### Путать ownership

Slot content принадлежит parent.
Не жди, что child «сам знает», что parent туда положит.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Чем slot отличается от prop?
2. Где в child ставится slot outlet?
3. Что такое fallback content?
4. Чьи данные видит slot content — parent или child?
5. Когда wrapper component лучше boolean props?
6. Какие UI из Module 3 practice naturally используют slots?

---

## 16. Что почитать

### Официальное

- [Slots · Vue.js](https://vuejs.org/guide/components/slots.html)
- [Slots · Vue.js RU](https://ru.vuejs.org/guide/components/slots.html)

### Связанные материалы этого плана

- [Module 3 · props](./01-props.md)
- [Module 3 · emits](./02-emits.md)

---

## 17. Практическое мини-задание

Создай 3 reusable components на default slots:

1. `BaseButton`
2. `BaseCard`
3. `BaseModal`

### Задачи

1. Добавь fallback text для `BaseButton`
2. Вложи в `BaseCard` filters или list
3. Открой modal с product details через slot content
4. Сравни: можно ли то же сделать только props? Где slots удобнее?

---

## 18. Мини-конспект

- slots передают template content от parent в child
- `<slot>` — outlet для вставки
- fallback задаёт default content
- slot content видит scope parent
- slots сильны для buttons, cards, modals, layouts
- props = data, emits = actions, slots = content

---

## 19. Что делать дальше

Следующий теоретический блок Module 3:

- **[`named slots`](./04-named-slots.md)**

Когда одной default зоны мало — появляются `header`, `footer`, `actions` и другие именованные области layout.
