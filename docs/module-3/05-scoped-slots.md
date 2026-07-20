# Module 3 · Теория: scoped slots

Этот материал закрывает пятый теоретический пункт `Module 3`: понять, **как child передаёт данные в slot content**, **зачем это нужно в списках и UI-kit** и **когда scoped slots лучше обычных props/slots**.

Связанные материалы:

- [Module 3 · slots](./03-slots.md)
- [Module 3 · named slots](./04-named-slots.md)
- [Module 3 · props](./01-props.md)

---

## 1. Проблема, которую решают scoped slots

Обычный slot content видит только **parent scope**.

```vue
<!-- parent -->
<ProductList>
  {{ /* здесь нет доступа к item изнутри ProductList */ }}
</ProductList>
```

Но часто нужно другое:

```text
Child знает данные item
Parent знает, как item должен выглядеть
```

**Scoped slot** = child отдаёт data в slot, parent решает markup.

Официально:

- [Scoped Slots · Vue.js](https://vuejs.org/guide/components/slots.html#scoped-slots)

---

## 2. Базовый пример

### Child

```vue
<!-- FancyList.vue -->
<script setup lang="ts">
defineProps<{
  items: Array<{ id: number; name: string; price: number }>
}>()
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <slot name="item" v-bind="item" />
    </li>
  </ul>
</template>
```

### Parent

```vue
<FancyList :items="products">
  <template #item="{ name, price }">
    <strong>{{ name }}</strong>
    <span>{{ price }}</span>
  </template>
</FancyList>
```

### Что происходит

1. Child итерирует `items`
2. На каждом шаге передаёт `item` в slot через `v-bind`
3. Parent получает `{ name, price }` и рисует свой UI

---

## 3. Mental model: slot как callback

```js
FancyList({
  item: ({ name, price }) => {
    return `<strong>${name}</strong><span>${price}</span>`
  },
})

function FancyList({ item: renderItem }) {
  return items.map((current) => renderItem(current))
}
```

Child вызывает slot как функцию и передаёт аргументы.
Parent описывает, что вернуть.

---

## 4. Синтаксис

### Child передаёт slot props

```vue
<slot :product="product" :index="index" />
```

или целиком object:

```vue
<slot name="item" v-bind="product" />
```

### Parent принимает slot props

```vue
<template #item="slotProps">
  {{ slotProps.name }}
</template>
```

С destructuring:

```vue
<template #item="{ name, price }">
  {{ name }} — {{ price }}
</template>
```

Для default scoped slot:

```vue
<MouseTracker v-slot="{ x, y }">
  {{ x }}, {{ y }}
</MouseTracker>
```

или:

```vue
<MouseTracker #default="{ x, y }">
  {{ x }}, {{ y }}
</MouseTracker>
```

---

## 5. Default scoped slot vs named scoped slot

### Default

```vue
<!-- child -->
<slot :count="count" />

<!-- parent -->
<Counter v-slot="{ count }">
  Value: {{ count }}
</Counter>
```

### Named

```vue
<!-- child -->
<slot name="item" v-bind="item" />

<!-- parent -->
<template #item="{ name, price }">
  ...
</template>
```

Если есть и named, и default scoped slots — для default используй explicit `#default`, чтобы не было ambiguity.

```vue
<MyComponent>
  <template #default="{ message }">
    {{ message }}
  </template>

  <template #footer>
    Footer
  </template>
</MyComponent>
```

---

## 6. Главный use case: гибкий list item

`ProductList` может владеть:

- loading / error / empty
- `v-for`
- keys
- list layout

А parent — внешний вид каждой карточки.

### `ProductList.vue`

```vue
<script setup lang="ts">
import type { Product } from '@/types/product'

defineProps<{
  products: Product[]
  isLoading: boolean
  error: string
}>()
</script>

<template>
  <p v-if="isLoading">Loading...</p>
  <p v-else-if="error">{{ error }}</p>
  <p v-else-if="products.length === 0">No products</p>

  <ul v-else class="product-list">
    <li v-for="product in products" :key="product.id">
      <slot name="item" :product="product" />
    </li>
  </ul>
</template>
```

### Parent

```vue
<ProductList
  :products="visibleProducts"
  :is-loading="isLoading"
  :error="error"
>
  <template #item="{ product }">
    <ProductCard
      :id="product.id"
      :name="product.name"
      :price="product.price"
      @select="onSelect"
    />
  </template>
</ProductList>
```

Или вообще другой item UI без изменения list logic:

```vue
<template #item="{ product }">
  <button class="row" @click="onSelect(product.id)">
    {{ product.name }} — ${{ product.price }}
  </button>
</template>
```

---

## 7. Scoped slots vs props

| Подход | Когда |
|--------|-------|
| props | child сам знает, как render item (`ProductCard` внутри) |
| scoped slot | parent хочет кастомизировать item markup |
| named slot | parent кастомизирует layout region без child data |
| scoped + named | parent кастомизирует region **и** получает child data |

### Жёсткий list

```vue
<!-- ProductList всегда рендерит ProductCard -->
<ProductCard v-bind="product" />
```

Проще, но менее гибко.

### Гибкий list

```vue
<slot name="item" :product="product" />
```

Гибче для UI-kit / reusable table / feed.

---

## 8. Пример: `DataTable`

```vue
<script setup lang="ts" generic="T extends { id: number | string }">
defineProps<{
  rows: T[]
}>()
</script>

<template>
  <table>
    <thead>
      <tr>
        <slot name="header" />
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.id">
        <slot name="row" :row="row" />
      </tr>
    </tbody>
  </table>
</template>
```

### Usage

```vue
<DataTable :rows="products">
  <template #header>
    <th>Name</th>
    <th>Price</th>
  </template>

  <template #row="{ row }">
    <td>{{ row.name }}</td>
    <td>{{ row.price }}</td>
  </template>
</DataTable>
```

Table владеет structure.
Parent владеет columns/cells.

---

## 9. Renderless components *(кратко)*

Scoped slots позволяют делать components, которые почти не рисуют UI, а только отдают state:

```vue
<MouseTracker v-slot="{ x, y }">
  Cursor: {{ x }}, {{ y }}
</MouseTracker>
```

Но в современном Vue 3 для чистой logic чаще лучше **composable**:

```ts
const { x, y } = useMouse()
```

### Практическое правило

```text
нужна только logic            → composable
нужна logic + visual shell    → component + scoped slots
нужен только layout region    → named slots
```

---

## 10. Когда scoped slots особенно полезны

Используй, если:

- reusable list / table / select / autocomplete
- child знает items, parent знает item UI
- нужен UI-kit с customization points
- один component обслуживает разные presentations

Не усложняй scoped slots, если:

- item UI всегда один и тот же
- достаточно вложить `ProductCard` внутрь list
- data уже есть в parent и можно просто `v-for` снаружи

---

## 11. Catalog practice: два уровня гибкости

### Уровень A — достаточно обычных components

```vue
<ProductList :products="visibleProducts">
  <!-- внутри ProductList всегда ProductCard -->
</ProductList>
```

Нормальный выбор для учебного MVP.

### Уровень B — scoped slot customization

```vue
<ProductList :products="visibleProducts">
  <template #item="{ product }">
    <ProductCard v-bind="product" @select="onSelect" />
  </template>
</ProductList>
```

Полезно, когда хочешь:

- card view
- compact row view
- admin table row

без дублирования list states (`loading` / `error` / `empty`).

---

## 12. Передача нескольких значений

```vue
<slot
  name="item"
  :product="product"
  :index="index"
  :is-selected="product.id === selectedId"
/>
```

```vue
<template #item="{ product, index, isSelected }">
  <ProductCard
    v-bind="product"
    :is-selected="isSelected"
  />
  <small>#{{ index + 1 }}</small>
</template>
```

Передавай только то, что parent реально использует.

---

## 13. Частые ошибки

### Ждать child data в обычном slot

```vue
<!-- ❌ product здесь не появится сам -->
<ProductList>
  {{ product.name }}
</ProductList>
```

Нужно:

```vue
<template #item="{ product }">
  {{ product.name }}
</template>
```

### Забыть передать props в `<slot>`

```vue
<!-- ❌ slot без данных -->
<slot name="item" />

<!-- ✅ -->
<slot name="item" :product="product" />
```

### Слишком широкий slot payload

```vue
<slot name="item" :app="app" :store="store" :everything="everything" />
```

Держи payload маленьким и typed.

### Scoped slots там, где хватит props

Не каждый list обязан быть renderless/flexible.
Сначала простой design, scoped slots — когда customization реально нужна.

---

## 14. TypeScript note

Для сложных generic lists/tables типы scoped slots могут быть verbose.
На Module 3 достаточно:

- явно типизировать props list component
- понимать shape slot props (`product`, `row`, `item`)
- не гнаться за идеальной generic магией в первом MVP

Позже, в более взрослых UI-kit, можно углубить typing через `defineSlots`.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Чем scoped slot отличается от обычного slot?
2. Кто передаёт data в scoped slot — parent или child?
3. Что делает `v-bind="item"` на `<slot>`?
4. Когда list лучше оставить «жёстким», а когда дать `#item` slot?
5. Почему для чистой logic чаще берут composable, а не renderless component?
6. Как выглядят named + scoped slots вместе?

---

## 16. Что почитать

### Официальное

- [Scoped Slots · Vue.js](https://vuejs.org/guide/components/slots.html#scoped-slots)
- [Scoped Slots · Vue.js RU](https://ru.vuejs.org/guide/components/slots.html#scoped-slots)
- [Named ScopedSlots · Vue.js](https://vuejs.org/guide/components/slots.html#named-scoped-slots)

### Связанные материалы этого плана

- [Module 3 · slots](./03-slots.md)
- [Module 3 · named slots](./04-named-slots.md)

---

## 17. Практическое мини-задание

Доработай `ProductList`:

1. Добавь scoped slot `#item="{ product }"`
2. В parent отрисуй через него `ProductCard`
3. Сделай второй вариант item UI: compact row
4. Переключай presentation без изменения fetch/filter logic

### Подсказка

```vue
<slot name="item" :product="product" />
```

```vue
<template #item="{ product }">
  <ProductCard v-bind="product" />
</template>
```

---

## 18. Мини-конспект

- scoped slot = child передаёт data в slot content
- parent решает markup, child решает data/iteration/shell
- синтаксис: `<slot :item="item" />` + `#item="{ item }"`
- идеальны для flexible lists/tables
- named slots = где, scoped slots = какие данные доступны
- для pure logic предпочитай composables

---

## 19. Что делать дальше

Следующий теоретический блок Module 3:

- **[локальная и глобальная регистрация компонентов](./06-component-registration.md)**

После slots логично понять, **как components попадают в template**: import + local use vs global registration.
