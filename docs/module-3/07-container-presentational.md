# Module 3 · Теория: контейнерные и презентационные компоненты

Этот материал закрывает седьмой теоретический пункт `Module 3`: понять, **как разделить components по ролям**, **где жить data/fetch/composables**, а **где только UI**, и как это упрощает catalog / modal / UI-kit architecture.

Связанные материалы:

- [Module 3 · props](./01-props.md)
- [Module 3 · emits](./02-emits.md)
- [Module 3 · component registration](./06-component-registration.md)
- [Module 2 · practice checklist](../module-2/11-practice-checklist.md)

---

## 1. Зачем разделять роли

Если один component делает всё:

```text
fetch products
filter/sort
own form state
render cards
handle modal
talk to API
```

он быстро становится **God Component**.

Разделение ролей:

```text
Container        → data, logic, side effects
Presentational   → UI, props in, events out
```

Это не догма Vue API, а **паттерн проектирования**.

---

## 2. Определения

### Container (умный / smart)

- знает, откуда data
- вызывает composables
- делает fetch / watch / lifecycle
- владеет page/feature state
- передаёт props вниз
- обрабатывает emits

Примеры:

- `CatalogPage.vue`
- `ProductCatalogView.vue`
- иногда `App.vue` на раннем этапе

### Presentational (глупый / dumb / UI)

- получает props
- рисует UI
- emit'ит user intent
- почти не знает про API / store / routing
- легко переиспользовать и тестировать visually

Примеры:

- `ProductCard.vue`
- `ProductFilters.vue`
- `BaseButton.vue`
- `BaseModal.vue`

---

## 3. Mental model

```text
CatalogPage (container)
  ├─ uses useProducts()
  ├─ uses useProductFilters()
  ├─ owns selectedId
  │
  ├─ ProductFilters (presentational)
  ├─ ProductList (presentational / semi)
  │    └─ ProductCard (presentational)
  └─ BaseModal (presentational shell)
```

```text
data flows down via props
events flow up via emits
content customization via slots
```

---

## 4. Как выглядит container

```vue
<!-- CatalogPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProductFilters from './ProductFilters.vue'
import ProductList from './ProductList.vue'
import BaseModal from '../base/BaseModal.vue'
import { useProducts } from '@/composables/useProducts'
import { useProductFilters } from '@/composables/useProductFilters'

const { products, isLoading, error, loadProducts } = useProducts()
const { query, sortBy, visibleProducts } = useProductFilters(products)
const selectedId = ref<number | null>(null)

onMounted(loadProducts)

function onSelect(id: number) {
  selectedId.value = id
}
</script>

<template>
  <section>
    <ProductFilters
      v-model:query="query"
      v-model:sort-by="sortBy"
    />

    <ProductList
      :products="visibleProducts"
      :is-loading="isLoading"
      :error="error"
      @select="onSelect"
    />

    <BaseModal :open="selectedId !== null" @close="selectedId = null">
      Selected id: {{ selectedId }}
    </BaseModal>
  </section>
</template>
```

Container почти не занимается CSS-деталями карточки — он **оркестрирует**.

---

## 5. Как выглядит presentational component

```vue
<!-- ProductCard.vue -->
<script setup lang="ts">
defineProps<{
  id: number
  name: string
  price: number
  isSelected?: boolean
}>()

defineEmits<{
  select: [id: number]
}>()
</script>

<template>
  <article :class="{ selected: isSelected }">
    <h3>{{ name }}</h3>
    <p>{{ price }}</p>
    <button type="button" @click="$emit('select', id)">
      Select
    </button>
  </article>
</template>
```

Нет `fetch`, нет `useProducts`, нет знания о всей странице.

---

## 6. Таблица ответственности

| Задача | Container | Presentational |
|--------|-----------|----------------|
| `ref` / `reactive` page state | ✅ | редко (только UI-local) |
| composables | ✅ | ❌ |
| `onMounted` fetch | ✅ | ❌ |
| `watch` for API reload | ✅ | ❌ |
| props API | передаёт | объявляет/потребляет |
| emits handling | слушает | объявляет/шлёт |
| layout slots | собирает | предоставляет outlets |
| CSS/UI markup | минимум | основной фокус |

---

## 7. Semi-presentational components

Не всё строго binary.

### `ProductList.vue`

Может быть:

- presentational: получает `products`, `isLoading`, `error`
- чуть «умнее»: сам делает `v-for`, empty/loading UI
- но всё ещё без fetch

Это нормально.

```text
Container: CatalogPage
Semi: ProductList
Pure UI: ProductCard, BaseButton
```

Главное — **не тащить domain side effects вниз без причины**.

---

## 8. Связь с composables

В Vue 3 container часто тонкий, потому что logic вынесена в composables:

```text
useProducts()        → data fetching
useProductFilters()  → derived UI state
CatalogPage          → wiring
Product* components  → rendering
```

Это современный вариант старого container/presentational подхода:

| Раньше | Сейчас |
|--------|--------|
| толстый container class/component | composable + thin container |
| dumb UI components | presentational SFCs |

Не обязательно делать container «толстым». Лучше:

```text
thin container + rich composables + presentational UI
```

---

## 9. Presentational UI-kit

Base components — почти всегда presentational:

| Component | Role |
|-----------|------|
| `BaseButton` | UI primitive |
| `BaseInput` | controlled input shell |
| `BaseCard` | layout wrapper via slots |
| `BaseModal` | dialog chrome |

Они не должны:

- знать про products
- ходить в API
- читать global catalog state

Их API = props + emits + slots.

---

## 10. Пример плохого смешения ролей

```vue
<!-- ❌ ProductCard слишком умный -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'

const product = ref(null)

onMounted(async () => {
  product.value = await fetch('/api/product/1').then((r) => r.json())
})
</script>
```

Проблемы:

- card сложно переиспользовать
- трудно тестировать UI отдельно
- source of truth размазан
- list/page не контролирует data flow

Лучше: page/container загружает, card только показывает.

---

## 11. Пример хорошего разделения для modal

### Container

```ts
const selected = ref<Product | null>(null)

function openProduct(product: Product) {
  selected.value = product
}

function closeProduct() {
  selected.value = null
}
```

### Presentational modal shell

```vue
<BaseModal :open="Boolean(selected)" @close="closeProduct">
  <template #header>
    <h2>{{ selected?.name }}</h2>
  </template>

  <p>{{ selected?.price }}</p>

  <template #actions>
    <BaseButton @click="addToCart(selected!.id)">
      Add to cart
    </BaseButton>
  </template>
</BaseModal>
```

`BaseModal` не знает, что такое product.
Container знает selected entity и actions.

---

## 12. Как решать, куда положить logic

Спроси:

1. Это нужно нескольким screens? → composable
2. Это page/feature orchestration? → container
3. Это только визуал / local UI state? → presentational
4. Это reusable shell? → base presentational + slots

### Local UI state в presentational — ок

```ts
const isHovered = ref(false)
const isMenuOpen = ref(false)
```

### Domain state в presentational — обычно нет

```ts
const products = ref([]) // ❌ если это feature data
```

---

## 13. Тестируемость и переиспользование

Presentational components легче:

- переиспользовать в Storybook / отдельных страницах
- менять UI без ломки fetch logic
- проверять по props/emits

Container легче:

- менять data source (mock → API → vue-query later)
- не трогая card markup

Это одна из главных причин паттерна.

---

## 14. Антиpatterns

### Everything in App.vue

Работает на Module 1, но для Module 3 уже тесно.

### Fetch inside every card

N cards = N requests / хаос ownership.

### Props + silent mutation

Presentational получает object и мутирует nested fields.
Лучше emit.

### Fake presentational

Component называется `ProductCard`, но внутри Pinia/router/API.
Тогда это уже feature/container hybrid — ок occasionally, но не называй его «pure UI».

---

## 15. Практическая схема для Module 3 catalog

```text
pages/CatalogPage.vue          ← container
components/catalog/
  ProductFilters.vue           ← presentational controlled
  ProductList.vue              ← presentational/semi
  ProductCard.vue              ← presentational
components/base/
  BaseButton.vue               ← presentational
  BaseCard.vue                 ← presentational
  BaseModal.vue                ← presentational
composables/
  useProducts.ts               ← logic
  useProductFilters.ts         ← logic
```

Если можешь объяснить роль каждого файла одной фразой — architecture здоровая.

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Чем container отличается от presentational?
2. Где должны жить fetch и composables?
3. Почему `ProductCard` не должен сам ходить в API?
4. Какой local state допустим в presentational?
5. Как slots помогают presentational shells (`BaseModal`)?
6. Почему thin container + composables — хороший Vue 3 стиль?

---

## 17. Что почитать

### Контекст этого плана

- [Module 3 · props](./01-props.md)
- [Module 3 · emits](./02-emits.md)
- [Module 3 · slots](./03-slots.md)
- [Module 2 · Composition vs Options API](../module-2/10-composition-api-vs-options-api.md)

### Идея паттерна

Паттерн известен из React-экосистемы как *container/presentational* / *smart/dumb*.
В Vue 3 он обычно реализуется через **page/feature containers + composables + UI components**.

---

## 18. Практическое мини-задание

Разложи catalog app по ролям:

1. Вынеси page-level wiring в `CatalogPage` (container)
2. Оставь cards/filters/modal shells presentational
3. Проверь: ни один presentational component не делает `fetch`
4. Выпиши таблицу:

| File | Role | Owns | Emits/Props |
|------|------|------|-------------|

5. Если нашёл God Component — разрежь его

---

## 19. Мини-конспект

- container владеет data/logic/side effects
- presentational рисует UI через props/emits/slots
- composables забирают logic из толстых containers
- base UI-kit почти всегда presentational
- цель — понятное дерево ответственности, не formal dogma
- Module 3 practice строится вокруг этого разделения

---

## 20. Что делать дальше

Следующий теоретический блок Module 3:

- **принципы декомпозиции UI**

Container/presentational отвечают на вопрос «какая роль».
Декомпозиция отвечает на вопрос «как резать UI на components правильного размера».
