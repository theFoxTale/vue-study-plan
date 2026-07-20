# Module 3 · Теория: props в компонентной архитектуре

Этот материал открывает **Module 3** и закрывает первый теоретический пункт: понять, **как проектировать props в дереве компонентов**, **какие данные передавать вниз** и **как не превратить props в хаотичный API**.

> Механика `defineProps`, one-way flow и TypeScript уже разобраны в Module 2. Здесь фокус — **архитектура и проектирование**.

Связанные материалы:

- [Module 2 · defineProps](../module-2/07-defineProps.md)
- [Module 1 · v-bind](../module-1/07-v-bind.md)
- [Module 1 · Single File Components](../module-1/03-single-file-components.md)

---

## 1. Зачем props в Module 3

В Module 2 ты научился **объявлять** props.

В Module 3 важно научиться **проектировать** их:

```text
какие props нужны компоненту?
какие данные parent обязан передать?
что child должен знать, а что не должен?
```

Props — это **public API** компонента.

---

## 2. Props как контракт компонента

Каждый компонент — маленький модуль с контрактом:

```text
Input:  props
Output: UI + emits
```

Пример:

```vue
<ProductCard
  :id="product.id"
  :name="product.name"
  :price="product.price"
  :is-selected="selectedId === product.id"
/>
```

`ProductCard` получает только то, что нужно для render.

Parent решает:

- откуда взять data
- что считать selected
- когда обновлять state

---

## 3. Базовая схема дерева компонентов

```text
App.vue
  ↓
CatalogPage.vue
  ↓
ProductFilters.vue
ProductList.vue
  ↓
ProductCard.vue
```

### Кто что передаёт

| Component | Получает props | Зачем |
|-----------|----------------|-------|
| `CatalogPage` | maybe route/config | container level |
| `ProductFilters` | `query`, `sortBy` | controlled filters |
| `ProductList` | `products`, `isLoading`, `error` | list rendering |
| `ProductCard` | `name`, `price`, `isSelected` | card UI |

---

## 4. Container vs presentational *(preview)*

Module 3 позже подробнее разберёт container/presentational pattern. Уже сейчас важно:

### Container component

- знает откуда data
- держит state / composables
- передаёт props вниз

### Presentational component

- получает props
- рисует UI
- сообщает о действиях через emits

```vue
<!-- container -->
<script setup lang="ts">
const { products, isLoading, error } = useProducts()
const { visibleProducts } = useProductFilters(products)
</script>

<template>
  <ProductList
    :products="visibleProducts"
    :is-loading="isLoading"
    :error="error"
  />
</template>
```

```vue
<!-- presentational -->
<script setup lang="ts">
defineProps<{
  products: Product[]
  isLoading: boolean
  error: string
}>()
</script>
```

---

## 5. Как проектировать хороший props API

### Правило 1: передавай только нужное

```vue
<!-- ❌ слишком широко -->
<ProductCard :product="product" :catalog="catalog" :user="user" />

<!-- ✅ только то, что нужно card -->
<ProductCard
  :id="product.id"
  :name="product.name"
  :price="product.price"
/>
```

### Правило 2: props должны быть понятны по имени

```ts
defineProps<{
  name: string
  price: number
  isSelected?: boolean
}>()
```

Плохие имена:

```ts
defineProps<{
  data: any
  item: object
  value: string
}>()
```

### Правило 3: не передавай лишнюю business logic

Child не должен получать props, которые он не использует, только «на всякий случай».

---

## 6. Primitive props vs object prop

### Отдельные primitives

```vue
<ProductCard :name="product.name" :price="product.price" />
```

Плюсы:

- явный API
- проще reuse
- проще тестировать

### Один object prop

```vue
<ProductCard :product="product" />
```

Плюсы:

- меньше boilerplate
- удобно для CRUD/forms

Минусы:

- child знает shape всего object
- сложнее переиспользовать в другом context

### Практическая рекомендация

```text
UI card / button / input → primitives or small typed object
domain entity card → object prop допустим
```

---

## 7. `v-bind` для spread props

Если object уже совпадает с props API:

```vue
<ProductCard v-bind="product" />
```

Эквивалентно:

```vue
<ProductCard
  :id="product.id"
  :name="product.name"
  :price="product.price"
/>
```

Используй spread только если:

- keys object совпадают с props
- API компонента осознанный

---

## 8. Controlled components через props

Filters — классический controlled component:

```vue
<ProductFilters
  :query="query"
  :sort-by="sortBy"
  @update:query="query = $event"
  @update:sort-by="sortBy = $event"
/>
```

или:

```vue
<ProductFilters
  v-model:query="query"
  v-model:sort-by="sortBy"
/>
```

Child **не владеет source of truth**, только отображает props и просит parent обновить state.

---

## 9. Props для UI state vs domain data

Различай типы props:

| Type | Examples |
|------|----------|
| Domain data | `product`, `products`, `user` |
| UI config | `variant`, `size`, `disabled` |
| Derived flags | `isSelected`, `isLoading`, `hasError` |

Пример:

```vue
<BaseButton
  variant="primary"
  :disabled="isSubmitting"
>
  Save
</BaseButton>
```

```vue
<ProductCard
  :name="product.name"
  :price="product.price"
  :is-selected="selectedId === product.id"
/>
```

Не смешивай всё в один unstructured prop bag.

---

## 10. Required vs optional props

```ts
defineProps<{
  name: string
  price: number
  category?: string
  isSelected?: boolean
}>()
```

### Required

- component не может нормально render без них
- `name`, `price`, `products`

### Optional

- есть default behavior
- `isSelected = false`
- `variant = 'default'`

---

## 11. Defaults и fallback UI

```ts
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary'
    emptyText?: string
  }>(),
  {
    variant: 'primary',
    emptyText: 'Nothing found',
  },
)
```

Defaults помогают делать компонент **безопасным для reuse**.

---

## 12. Props в списках

```vue
<ProductList :products="visibleProducts" />
```

```vue
<script setup lang="ts">
defineProps<{
  products: Product[]
}>()
</script>

<template>
  <ul>
    <li v-for="product in products" :key="product.id">
      <ProductCard
        :id="product.id"
        :name="product.name"
        :price="product.price"
      />
    </li>
  </ul>
</template>
```

Parent list получает array, item card — primitives/object.

---

## 13. Prop drilling — когда props идут слишком глубоко

```text
App
  ↓ theme
Layout
  ↓ theme
Sidebar
  ↓ theme
Button
```

Если один и тот же prop пробрасывается через 3-4 уровня без использования — это **prop drilling**.

На Module 3 достаточно знать:

- это признак плохой декомпозиции или missing abstraction
- иногда решается composable, provide/inject или store *(позже)*

Не каждый prop через несколько уровней — ошибка. Но если промежуточные components просто «прокидывают» prop дальше, стоит пересмотреть architecture.

---

## 14. Что не должно быть prop

Не передавай через props то, что child может/должен получить иначе:

| Не нужно prop | Почему |
|---------------|--------|
| random internal helper | это implementation detail |
| весь app store | слишком широкий contract |
| callback для всего подряд | лучше конкретные emits |
| mutable shared object «для удобства» | ломает one-way flow |

---

## 15. Пример хорошего props design для catalog

### `ProductCard.vue`

```ts
defineProps<{
  id: number
  name: string
  price: number
  isSelected?: boolean
}>()
```

### `ProductList.vue`

```ts
defineProps<{
  products: Product[]
  isLoading: boolean
  error: string
}>()
```

### `ProductFilters.vue`

```ts
defineProps<{
  query: string
  sortBy: 'name' | 'price'
}>()
```

Каждый компонент получает **минимально достаточный** набор данных.

---

## 16. Частые архитектурные ошибки

### God prop

```ts
defineProps<{ appState: any }>() // ❌
```

### Prop используется только для emit обратно

```ts
// ❌ child получает query только чтобы emit update:query
// иногда это нормально для controlled input,
// но если parent и child дублируют logic — плохой design
```

### Слишком много boolean props

```vue
<Card
  :showHeader="true"
  :showFooter="false"
  :showBadge="true"
  :showPrice="true"
  :showActions="false"
/>
```

Иногда лучше:

- slots *(следующие уроки Module 3)*
- один `variant`
- composition через smaller components

### Передача derived data и raw data одновременно без нужды

```vue
<ProductList
  :products="products"
  :visible-products="visibleProducts"
/>
```

Обычно list должен получать **уже prepared data**, а filter logic жить выше.

---

## 17. TypeScript и props design

Хороший props API почти всегда typed:

```ts
type Product = {
  id: number
  name: string
  price: number
}

defineProps<{
  products: Product[]
}>()
```

Это:

- документирует contract
- ловит ошибки на этапе разработки
- улучшает autocomplete

---

## 18. Что важно понять после этого блока

Проверь себя:

1. Чем props в Module 3 отличаются от `defineProps` в Module 2?
2. Что такое public API компонента?
3. Когда передавать primitives, а когда object?
4. Что такое controlled component?
5. Что такое prop drilling?
6. Какие props должны быть у `ProductCard`, а какие у `ProductList`?

---

## 19. Что почитать

### Официальное

- [Props · Vue.js](https://vuejs.org/guide/components/props.html)
- [Components Basics · Vue.js](https://vuejs.org/guide/essentials/component-basics.html)
- [Typing Component Props · Vue.js](https://vuejs.org/guide/typescript/composition-api.html#typing-component-props)

### Связанные материалы этого плана

- [Module 2 · defineProps](../module-2/07-defineProps.md)
- [Module 2 · practice checklist](../module-2/11-practice-checklist.md)

---

## 20. Практическое мини-задание

Возьми catalog app из Module 2 *(или набросай на бумаге)*:

1. Нарисуй component tree
2. Для каждого component выпиши props
3. Убери лишние props
4. Раздели container vs presentational
5. Проверь, нет ли prop drilling

### Пример результата

```text
CatalogPage
  ProductFilters(query, sortBy)
  ProductList(products, isLoading, error)
    ProductCard(id, name, price, isSelected)
```

---

## 21. Мини-конспект

- props = public input contract компонента
- parent решает source of truth
- child получает минимально нужные данные
- хорошие props понятны, typed и не избыточны
- controlled components получают state через props
- prop drilling — сигнал пересмотреть architecture

---

## 22. Что делать дальше

Следующий теоретический блок Module 3:

- **[`emits`](./02-emits.md)**

Если props — это input contract, то emits — output contract: как component сообщает parent о действиях пользователя.
