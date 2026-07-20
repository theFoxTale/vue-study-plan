# Module 3 · Теория: named slots

Этот материал закрывает четвёртый теоретический пункт `Module 3`: понять, **как у одного компонента сделать несколько content-зон**, **как писать `#header` / `#footer` / `#actions`** и **когда named slots лучше одного default slot**.

Связанные материалы:

- [Module 3 · slots](./03-slots.md)
- [Module 3 · props](./01-props.md)
- [Module 3 · emits](./02-emits.md)

---

## 1. Зачем named slots

Default slot — одна зона content:

```vue
<BaseCard>
  Everything goes here
</BaseCard>
```

Но layout часто имеет **несколько областей**:

```text
┌─────────────────────┐
│ header              │
├─────────────────────┤
│ body / default      │
├─────────────────────┤
│ footer / actions    │
└─────────────────────┘
```

Для этого нужны **named slots**.

Официально:

- [Named Slots · Vue.js](https://vuejs.org/guide/components/slots.html#named-slots)

---

## 2. Базовый пример

### Child: `BaseLayout.vue`

```vue
<template>
  <div class="layout">
    <header class="layout__header">
      <slot name="header" />
    </header>

    <main class="layout__main">
      <slot />
    </main>

    <footer class="layout__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>
```

### Parent

```vue
<BaseLayout>
  <template #header>
    <h1>Product Catalog</h1>
  </template>

  <p>Main content goes here</p>

  <template #footer>
    <p>© 2026</p>
  </template>
</BaseLayout>
```

### Что происходит

| Slot name | Content |
|-----------|---------|
| `header` | `<h1>Product Catalog</h1>` |
| `default` | `<p>Main content...</p>` |
| `footer` | `<p>© 2026</p>` |

`<slot>` без `name` — это **`default`**.

---

## 3. Синтаксис: `v-slot` и `#`

Полная форма:

```vue
<template v-slot:header>
  ...
</template>
```

Shorthand:

```vue
<template #header>
  ...
</template>
```

`#header` = «положи этот fragment в slot с именем `header`».

---

## 4. Explicit default slot

Можно писать default явно:

```vue
<BaseLayout>
  <template #header>
    <h1>Catalog</h1>
  </template>

  <template #default>
    <ProductList :products="products" />
  </template>

  <template #footer>
    <p>Footer</p>
  </template>
</BaseLayout>
```

Или оставить top-level nodes как implicit default:

```vue
<BaseLayout>
  <template #header>...</template>

  <ProductList :products="products" />

  <template #footer>...</template>
</BaseLayout>
```

Оба варианта валидны. Explicit `#default` полезен, когда хочется максимум ясности.

---

## 5. Mental model

Как функция с named arguments:

```js
BaseLayout({
  header: `...`,
  default: `...`,
  footer: `...`,
})
```

Child раскладывает fragments по своим outlets.

---

## 6. Fallback для named slots

Fallback работает так же, как у default:

```vue
<header>
  <slot name="header">
    <h2>Untitled</h2>
  </slot>
</header>

<footer>
  <slot name="footer">
    <span>No footer</span>
  </slot>
</footer>
```

Если parent не передал `#header` — покажется `Untitled`.

---

## 7. Conditional named slots

Часто header/footer не нужны всегда:

```vue
<template>
  <article class="card">
    <header v-if="$slots.header" class="card__header">
      <slot name="header" />
    </header>

    <div class="card__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>
```

`$slots.header` — truthy, если parent передал content в этот slot.

Это важно для spacing/borders: пустой header wrapper не должен занимать место.

---

## 8. Типичные имена named slots

В UI-kit часто встречаются:

| Slot | Назначение |
|------|------------|
| `header` | title / toolbar |
| `default` | основной content |
| `footer` | secondary info |
| `actions` | buttons |
| `icon` | leading icon |
| `title` | text title area |
| `description` | subtitle / help text |
| `empty` | empty state |

Не обязательно использовать все. Имена должны описывать **роль зоны**, не конкретный product.

---

## 9. `BaseCard` с named slots

### Component

```vue
<!-- BaseCard.vue -->
<template>
  <article class="card">
    <header v-if="$slots.header" class="card__header">
      <slot name="header" />
    </header>

    <div class="card__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>
```

### Usage

```vue
<BaseCard>
  <template #header>
    <h3>Filters</h3>
  </template>

  <ProductFilters
    v-model:query="query"
    v-model:sort-by="sortBy"
  />

  <template #footer>
    <small>Search updates the list instantly</small>
  </template>
</BaseCard>
```

Один card shell — разные feature contents.

---

## 10. `BaseModal` с named slots

```vue
<script setup lang="ts">
defineProps<{ open: boolean; title?: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <div v-if="open" class="modal" role="dialog" aria-modal="true">
    <div class="modal__panel">
      <header class="modal__header">
        <slot name="header">
          <h2>{{ title ?? 'Dialog' }}</h2>
        </slot>
        <button type="button" aria-label="Close" @click="$emit('close')">
          ×
        </button>
      </header>

      <div class="modal__body">
        <slot />
      </div>

      <footer v-if="$slots.actions" class="modal__actions">
        <slot name="actions" />
      </footer>
    </div>
  </div>
</template>
```

### Usage

```vue
<BaseModal :open="isOpen" title="Delete product?" @close="isOpen = false">
  <p>This action cannot be undone.</p>

  <template #actions>
    <BaseButton @click="isOpen = false">Cancel</BaseButton>
    <BaseButton @click="confirmDelete">Delete</BaseButton>
  </template>
</BaseModal>
```

Modal владеет chrome (overlay, close, structure).
Parent владеет message и actions.

---

## 11. Named slots vs много props

### Плохо

```vue
<ProductCard
  title="Keyboard"
  subtitle="Mechanical"
  badge-text="Sale"
  action-label="Buy"
  footer-text="In stock"
/>
```

Каждый новый кусок UI = новый prop.

### Лучше

```vue
<ProductCard :name="product.name" :price="product.price">
  <template #badge>
    <span class="badge">Sale</span>
  </template>

  <template #actions>
    <BaseButton @click="buy">Buy</BaseButton>
  </template>
</ProductCard>
```

Props остаются для **data**.
Named slots — для **custom UI regions**.

---

## 12. Когда named slots уместны

Используй named slots, если:

- у component есть стабильный layout с 2+ зонами
- zones optional (`header` / `footer` / `actions`)
- parent должен кастомизировать markup, не только text
- ты строишь reusable card / modal / layout / panel

Не используй, если:

- достаточно одного default slot
- можно обойтись 1–2 typed props
- «зоны» на самом деле отдельные components

---

## 13. Пример для catalog practice

```vue
<template>
  <BaseLayout>
    <template #header>
      <AppHeader title="Product Catalog" />
    </template>

    <section class="catalog">
      <BaseCard>
        <template #header>
          <h2>Filters</h2>
        </template>

        <ProductFilters
          v-model:query="query"
          v-model:sort-by="sortBy"
        />
      </BaseCard>

      <BaseCard>
        <template #header>
          <h2>Products</h2>
        </template>

        <ProductList
          :products="visibleProducts"
          :is-loading="isLoading"
          :error="error"
          @select="onSelect"
        />
      </BaseCard>
    </section>

    <template #footer>
      <p>Found: {{ visibleProducts.length }}</p>
    </template>
  </BaseLayout>

  <BaseModal :open="Boolean(selected)" @close="selected = null">
    <template #header>
      <h2>{{ selected?.name }}</h2>
    </template>

    <p>Price: {{ selected?.price }}</p>

    <template #actions>
      <BaseButton @click="addToCart(selected!.id)">
        Add to cart
      </BaseButton>
    </template>
  </BaseModal>
</template>
```

Named slots дают дереву компонентов читаемую структуру page → layout → cards → modal.

---

## 14. Dynamic slot names

Можно выбрать slot name динамически:

```vue
<template #[currentSlot]>
  Dynamic content
</template>
```

На Module 3 это rare case. Достаточно знать, что синтаксис существует.
В обычном UI-kit почти всегда хватает статичных `#header`, `#footer`, `#actions`.

---

## 15. Частые ошибки

### Забыли `#` / `v-slot`

```vue
<!-- ❌ это просто template в parent, не named slot -->
<template name="header">...</template>

<!-- ✅ -->
<template #header>...</template>
```

### Путают `name` на template и на slot outlet

```vue
<!-- в child -->
<slot name="header" />

<!-- в parent -->
<template #header>...</template>
```

Имена должны совпадать.

### Рендерят пустые wrappers без `$slots`

```vue
<!-- может оставить пустой header с padding/border -->
<header>
  <slot name="header" />
</header>
```

Лучше:

```vue
<header v-if="$slots.header">
  <slot name="header" />
</header>
```

### Слишком много named slots

```text
#top #left #right #bottom #meta #extra #misc
```

Если зон больше 4–5 без ясной модели — возможно, component делает слишком много.
Разбей на smaller components.

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Чем named slot отличается от default slot?
2. Что означает `#header`?
3. Как задать fallback для named slot?
4. Зачем проверять `$slots.footer`?
5. Когда named slots лучше набора props вроде `title`, `footerText`, `actionLabel`?
6. Какие named slots логичны для `BaseModal`?

---

## 17. Что почитать

### Официальное

- [Named Slots · Vue.js](https://vuejs.org/guide/components/slots.html#named-slots)
- [Named Slots · Vue.js RU](https://ru.vuejs.org/guide/components/slots.html#named-slots)
- [Conditional Slots · Vue.js](https://vuejs.org/guide/components/slots.html#conditional-slots)

### Связанные материалы этого плана

- [Module 3 · slots](./03-slots.md)
- [Module 3 · emits](./02-emits.md)

---

## 18. Практическое мини-задание

Доработай UI-kit:

1. `BaseCard` → slots: `header`, `default`, `footer`
2. `BaseModal` → slots: `header`, `default`, `actions`
3. `BaseLayout` *(optional)* → `header`, `default`, `footer`

### Задачи

1. Добавь conditional wrappers через `$slots`
2. Собери catalog page на этих shells
3. Сравни API до/после: сколько boolean/text props удалось убрать?

---

## 19. Мини-конспект

- named slots = несколько content-зон в одном component
- `#name` / `v-slot:name` передаёт fragment в нужный outlet
- `<slot>` без name = `default`
- fallback и `$slots` работают и для named slots
- идеальны для card / modal / layout
- props для data, named slots для layout regions

---

## 20. Что делать дальше

Следующий теоретический блок Module 3:

- **`scoped slots`**

Named slots задают **где** показать content. Scoped slots позволяют child **передать данные** в этот content — например, `item` из списка.
