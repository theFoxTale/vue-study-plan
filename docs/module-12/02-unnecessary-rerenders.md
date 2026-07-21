# Module 12 · Теория: лишние перерендеры

Этот материал закрывает второй теоретический пункт Module 12: **лишние перерендеры** — когда компонент обновляется без изменения видимого UI, как это диагностировать в catalog app и что делать **до** «экзотических» оптимизаций.

Связанные материалы:

- [Module 12 · реактивность под капотом](./01-reactivity-internals.md)
- [Module 2 · computed](../module-2/03-computed.md)

---

## 1. Rerender ≠ обновление DOM

```text
rerender  = Vue снова вызвал render function компонента
DOM patch = Vue сравнил VDOM и изменил реальный DOM
```

Компонент может **перерендериться**, но **ничего не поменять** в DOM — diff «пустой». Это не бесплатно:

- render function выполнилась
- дочерние компоненты могли тоже обновиться
- computed без invalidate могли не пересчитаться, но props/children всё равно прошли через pipeline

**Цель Module 12:** убрать rerender, когда **пользователь не видит разницы**.

Официально:

- [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Performance · Vue Guide](https://vuejs.org/guide/best-practices/performance.html)

---

## 2. Когда rerender закономерен

| Событие | Пример catalog |
|---------|----------------|
| Изменился прочитанный state | `cart.total` → `CartBadge` |
| Изменился prop | `product.price` → `ProductCard` |
| Изменился slot content | parent перерисовал v-slot |
| Key списка изменился | см. [урок 03](./03-key.md) |
| Query refetch | `products` data обновилась |

**Не баг:** `ProductListPage` rerender при смене `filters.category` — UI должен измениться.

**Кандидат на оптимизацию:** все 200 `ProductCard` rerender при изменении **unrelated** `toast.visible`.

---

## 3. Главный источник: родитель перерендерился

```vue
<!-- AppLayout.vue -->
<template>
  <header>{{ cartCount }}</header>
  <ProductList :products="products" />
  <ToastContainer />
</template>
```

```text
cartCount изменился
  → AppLayout rerender
  → ProductList rerender (props те же по значению?)
  → каждый ProductCard rerender
```

Vue **по умолчанию** обновляет дочерние компоненты, когда обновился родитель — даже если props «логически те же».

**Стратегии:**

1. **Разделить state** — не держать `cartCount` в layout, который оборачивает весь catalog
2. **Вынести «горячий» state** в отдельную ветку дерева
3. **`v-memo` / stable props** — позже в модуле
4. **`defineComponent` + `memo`** — нет в Vue как в React; паттерны другие

---

## 4. Нестабильные props: новый объект каждый render

```vue
<!-- ❌ новый object reference каждый render -->
<ProductCard
  :product="product"
  :options="{ showBadge: true, currency: 'USD' }"
/>

<!-- ✅ stable: computed или константа вне setup -->
<ProductCard :product="product" :show-badge="true" />
```

```vue
<script setup lang="ts">
const cardOptions = { showBadge: true, currency: 'USD' } // module-level or shallowRef
</script>
```

```vue
<!-- ❌ inline array -->
<ProductList :ids="products.map(p => p.id)" />

<!-- ✅ computed -->
const productIds = computed(() => products.value.map(p => p.id))
```

**Правило:** если prop — object/array/function, созданный **в template или setup без memo**, дочерний компонент видит «новый» prop → лишняя работа + риск лишних watcher'ов.

---

## 5. Pinia: подписка на весь store

```vue
<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
</script>

<template>
  <ProductCard :product="product" />
  <!-- template не использует cart, но store уже в setup scope -->
</template>
```

```text
storeToRefs / pick fields — читай только нужное
```

**Лучше:**

```ts
import { storeToRefs } from 'pinia'

const cartStore = useCartStore()
const { totalItems } = storeToRefs(cartStore)
// или
const totalItems = computed(() => cartStore.totalItems)
```

```vue
<!-- ❌ -->
<div>{{ cartStore }}</div>

<!-- ✅ -->
<div>{{ totalItems }}</div>
```

`ProductCard` не должен вызывать `useCartStore()`, если ему нужен только emit `add-to-cart` — иначе **любое** изменение cart триггерит все карточки.

**Паттерн catalog:**

| Компонент | Store access |
|-----------|--------------|
| `ProductCard` | emit only |
| `AddToCartButton` | `useCartStore()` или inject |
| `CartBadge` | `totalItems` ref |
| `ProductListPage` | query + filters local state |

---

## 6. vue-query: refetch и «мигание» списка

```ts
const { data: products } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => fetchProducts(filters),
})
```

```text
invalidate / refetch → data reference меняется → page rerender → весь v-for
```

Это часто **ожидаемо**. Лишнее — когда:

- refetch каждые N секунд без UI need
- `placeholderData` / `keepPreviousData` не используются → список «прыгает» в loading
- один global `isFetching` в layout → rerender всего app

**Смягчение** *(Module 8, не дублируем глубоко)*:

```ts
placeholderData: (prev) => prev,
refetchOnWindowFocus: false, // если не нужно
```

---

## 7. Inline handlers и closures

```vue
<!-- каждый render — новая function reference -->
<button @click="() => add(product.id)">Add</button>

<!-- ok для leaf без memoized children -->
<button @click="add(product.id)">Add</button>
```

Для **простых** кнопок разница редко критична. Проблема усиливается, если:

- handler передаётся **prop** в memoized child
- child с `watch(() => props.onAdd)` срабатывает каждый render

```vue
<!-- если ProductActions мемоизирует по props -->
<ProductActions :on-add="() => cart.add(product)" />
```

**Fix:** stable method или `@click="onAdd"` где `onAdd` из composable с bind, или emit вверх.

---

## 8. Разбиение компонентов: isolate subscriptions

```text
До:
  CatalogPage (filters + products + cart sidebar)
  → любое изменение filters/cart/categories rerender всё

После:
  CatalogFilters   ← только filters state
  ProductGrid      ← products + query
  CartSidebar      ← cart store
  CatalogPage      ← layout shell, minimal state
```

**Container / presentational** из Module 3 здесь = perf tool:

```vue
<!-- ProductGrid.vue — не читает cart -->
<script setup lang="ts">
const props = defineProps<{ products: Product[] }>()
</script>
```

Добавление в cart **не должно** проходить через props `ProductGrid`, если grid не показывает qty on card *(или card сам изолирован)*.

---

## 9. `computed` и derived state на правильном уровне

```vue
<!-- ❌ parent пересчитывает filter при любом своём rerender -->
<script setup>
function filtered() {
  return products.value.filter(/* heavy */)
}
</script>
<template>
  <ProductRow v-for="p in filtered()" />
</template>

<!-- ✅ computed — только когда deps меняются -->
const visibleProducts = computed(() =>
  products.value.filter(/* heavy */),
)
```

Поднять `computed` **ближе к source** (store/query selector), опустить **display** в leaf.

---

## 10. Slots и scoped slots

```vue
<AppLayout>
  <template #default>
    <ProductList :products="products" />
  </template>
</AppLayout>
```

Parent layout rerender → **slot content re-evaluated** → `ProductList` обновляется.

**Fix:** вынести `ProductList` **рядом**, не через slot hot path, или сузить reactive scope layout.

Scoped slot с inline object:

```vue
<ProductList v-slot="{ item }">
  <ProductCard :product="item" :meta="{ idx }" />
</ProductList>
```

`meta` object — снова unstable reference.

---

## 11. Как найти лишний rerender

### Vue DevTools · Performance

1. Record interaction (add to cart, toggle filter)
2. Смотри **component render count**
3. Кто обновился, хотя UI не менялся?

*(Подробнее — [урок 10 · DevTools](./10-vue-devtools.md))*

### Временный debug hook

```vue
<script setup lang="ts">
import { onUpdated, onBeforeUpdate } from 'vue'

onBeforeUpdate(() => {
  if (import.meta.env.DEV) console.count('ProductCard update')
})
</script>
```

Или `@vue/runtime-core` `onRenderTracked` / `onRenderTriggered` *(dev only)*:

```ts
import { onRenderTriggered } from 'vue'

onRenderTriggered((e) => {
  console.log('triggered by', e.key, e.target)
})
```

### Чеклист вопросов

1. Какой **state** изменился?
2. Кто его **читает** в render path?
3. Можно ли **перенести** state ближе к leaf?
4. Props **stable** по reference?
5. Store **не импортирован** там, где не нужен?

---

## 12. Что делать — порядок приоритетов

```text
1. Измерить (DevTools / console.count) — не гадать
2. Убрать лишние store/query subscriptions
3. Стабилизировать props (objects, arrays, handlers)
4. Разбить hot parent на изолированные ветки
5. computed вместо inline filter/map в template
6. v-memo / v-once / key — когда 1–5 недостаточно
```

**Не начинать** с `shallowRef` на весь catalog — сначала architecture.

---

## 13. Catalog: типичные сценарии

### Сценарий A: toast ломает список

```text
useToast() в App.vue → toast queue меняется → App rerender → ProductList
```

**Fix:** `ToastContainer` + `Teleport` с **минимальным** reactive scope; toast state не в том же component, что `products`.

### Сценарий B: auth user в layout

```text
user.name в header → ok
whole user object в provide → дети rerender на любое поле profile
```

**Fix:** provide только `isLoggedIn` / `displayName` computed.

### Сценарий C: filter debounce

```text
searchQuery меняется каждый keypress → queryKey меняется → refetch → grid rerender
```

**Fix:** debounced ref для queryKey; `keepPreviousData`; skeleton только grid, не page.

---

## 14. Частые ошибки

### Оптимизация без профиля

«ProductCard медленный» → добавили `v-memo` везде, не заметив что проблема в parent refetch.

### `React.memo` мышление

Vue не memo-by-default для SFC. Изоляция через **структуру дерева** и **stable data flow**.

### God layout с 10 store

`App.vue` вызывает cart, auth, ui, theme — любой tick → весь app.

### Вынос всего в Pinia «для perf»

Central state **увеличивает** fan-out подписчиков, если читать store без discipline.

### Игнорировать slot / provide/inject

Invisible coupling — rerender без явного prop.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Чем rerender отличается от DOM patch?
2. Почему parent update тянет children?
3. Пример **нестабильного prop** в catalog?
4. Зачем `ProductCard` не должен `useCartStore()` без need?
5. Порядок действий до `v-memo`?
6. Как `onRenderTriggered` помогает в dev?

---

## 16. Что почитать

### Официальное

- [Performance · General](https://vuejs.org/guide/best-practices/performance.html)
- [Reactivity · Optimizing](https://vuejs.org/guide/extras/reactivity-in-depth.html)

### Связанные материалы этого плана

- [Module 12 · реактивность](./01-reactivity-internals.md)
- [Module 3 · container/presentational](../module-3/07-container-presentational.md)
- [Module 6 · Pinia](../module-6/04-pinia.md)

---

## 17. Практическое мини-задание

1. В DevTools или `console.count` — add to cart и запиши, кто rerender'ится кроме cart UI.
2. Найди один inline object/array prop — замени на stable alternative.
3. Проверь `ProductCard`: есть ли `useCartStore` без использования в template?
4. Нарисуй дерево: где «hot» state vs cold branches.
5. Один лишний rerender — исправь **структурой**, не `v-memo`.

---

## 18. Мини-конспект

- rerender ≠ DOM change; оба стоят CPU
- parent update → children по умолчанию
- unstable props / store fan-out — top causes
- isolate state, stable props, computed placement
- measure first; `v-memo`/`key` — после архитектуры
- дальше — **`key` в списках**

---

## 19. Что делать дальше

Следующий теоретический блок Module 12:

- [Значение `key`](./03-key.md)
