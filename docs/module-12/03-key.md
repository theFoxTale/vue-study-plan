# Module 12 · Теория: значение `key`

Этот материал закрывает третий теоретический пункт Module 12: **`key`** — зачем Vue сопоставляет узлы по identity, почему `:key="index"` ломает списки и state, и как правильно ключить catalog (`ProductCard`, cart, filters).

Связанные материалы:

- [Module 12 · лишние перерендеры](./02-unnecessary-rerenders.md)
- [Module 10 · transitions](../module-10/03-transitions.md)

---

## 1. Зачем `key` существует

Vue обновляет DOM через **diff** virtual DOM. Без `key` алгоритм **по умолчанию** сопоставляет элементы **по позиции** в siblings.

```vue
<li v-for="product in products" :key="product.id">
  {{ product.title }}
</li>
```

```text
key = stable identity элемента в списке
Vue знает: «это тот же Product #42», а не «третья строка таблицы»
```

**Два эффекта:**

1. **Correctness** — local state, focus, input не «переезжают» на другой item
2. **Performance** — переиспользование DOM/component instance вместо destroy+create

Официально:

- [List Rendering · key](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key)
- [Render Functions · key](https://vuejs.org/guide/extras/render-function.html)

---

## 2. Diff без key: сортировка ломает смысл

```text
Было:     [A, B, C]  → DOM nodes n1, n2, n3
Стало:    [C, A, B]  → по позиции Vue «патчит» n1:A→C, n2:B→A, n3:C→B
```

Текст обновится правильно, но:

- `<input>` внутри item сохранит **DOM node n1** — value может остаться от A, пока не перезапишется
- `<ProductCard>` с internal hover/qty draft **не тот instance**
- `<TransitionGroup>` не знает, что элемент **переместился**

С **`:key="product.id"`**:

```text
Vue сопоставляет id=C → node был n3, перемещает/переиспользует правильно
```

---

## 3. `:key="index"` — антипаттерн для mutable lists

```vue
<!-- ❌ catalog: delete, sort, filter, pagination -->
<ProductCard
  v-for="(product, index) in products"
  :key="index"
  :product="product"
/>
```

| Операция | Что ломается с index key |
|----------|---------------------------|
| Delete first item | все keys сдвигаются → mass remount |
| Sort by price | keys не следуют за entity → state mix |
| Filter → reset | index 0 — другой product |
| Infinite scroll prepend | весь список «новый» |

```text
index key = identity «позиция в массиве», не «товар»
```

**Когда index допустим:**

- статический list, **никогда** не reorder/delete
- purely presentational, без inputs/state в item
- prototype / demo на 3 пункта

Для **Product Catalog** — почти всегда **`product.id`**.

---

## 4. Что считать хорошим key

| Хорошо | Плохо |
|--------|-------|
| `product.id` (server id) | `Math.random()` |
| `sku` если уникален | `index` при CRUD |
| composite `'cart-' + item.productId` | JSON.stringify(product) |
| `route.fullPath` для `<router-view>` | нестабильный hash каждый fetch |

```ts
// composite когда один product в cart дважды нельзя, id строки cart item:
:key="item.id" // cart line id, не productId
```

**Уникальность среди siblings** — обязательна. Duplicate keys → dev warning, undefined behavior.

---

## 5. `key` на `<component>` и conditional branches

### Dynamic component

```vue
<component :is="activeTab" :key="activeTab" />
```

Force remount при смене tab — сброс local state формы *(осознанно)*.

### `v-if` / `v-else` siblings

```vue
<LoginForm v-if="!user" key="login" />
<UserMenu v-else key="user" />
```

Без key Vue **reuse** DOM где возможно — иногда нужен fresh mount.

### `<router-view>`

```vue
<RouterView :key="$route.fullPath" />
```

Remount page при **любом** query change — грубо. Лучше точечно:

```vue
<RouterView :key="$route.params.id" />
```

Catalog detail: remount только при смене `productId`, не при `?tab=reviews`.

---

## 6. Local state в item: классический баг

```vue
<ProductCard
  v-for="p in products"
  :key="p.id"
  :product="p"
/>
```

```vue
<!-- ProductCard.vue -->
<script setup lang="ts">
const qty = ref(1) // local draft before add-to-cart
</script>
```

С **правильным key** — qty привязан к **product id**.

С **index key** + delete first product — qty «переедет» на другой товар.

**Правило:** если в item есть **local ref**, **input**, **expanded flag** — key = entity id.

---

## 7. Performance: remount vs patch

### Плохой key → лишние remount

```vue
:key="product.updatedAt" // меняется при каждом refetch
```

Каждый refetch → **все** карточки destroy+create → дороже patch.

### Хороший key → переиспользование

Stable `id` → меняется только prop `product` → patch text/image.

### Слишком агressive remount

```vue
<ProductCard :key="product.id + product.price" />
```

Price change → **новый** instance → потеря hover, animation, child state. Обычно **не нужно** — prop update достаточно.

**Remount by key** — когда нужен **сброс** internal state (wizard step, form after submit).

---

## 8. `<TransitionGroup>` и key

Module 10 — list transitions **требуют** unique keys:

```vue
<TransitionGroup name="list" tag="ul">
  <li v-for="item in cart.items" :key="item.id">
    {{ item.title }}
  </li>
</TransitionGroup>
```

Без key Vue не анимирует **move** — только enter/leave вслепую.

---

## 9. Catalog patterns

### Product grid

```vue
<ul class="product-grid">
  <li v-for="product in products" :key="product.id">
    <ProductCard :product="product" @add="onAdd" />
  </li>
</ul>
```

Key на **wrapper `<li>`** или на `ProductCard` — один уровень siblings; не дублируй один id на двух siblings.

### Cart lines

```vue
<CartLine
  v-for="line in cart.lines"
  :key="line.id"
  :line="line"
/>
```

`line.id` — id строки корзины, не `productId` *(если duplicate products возможны)*.

### Categories sidebar

```vue
<button
  v-for="cat in categories"
  :key="cat.slug"
  type="button"
  @click="selectCategory(cat.slug)"
>
  {{ cat.name }}
</button>
```

`slug` stable; index ok только если список фиксирован навсегда.

### Skeleton loaders

```vue
<div v-for="n in 8" :key="'skeleton-' + n" class="skeleton-card" />
```

Static count, no entity — **`skeleton-${n}`** ok.

---

## 10. `key` и vue-query pagination

```text
Page 1: products [id: 1,2,3]
Page 2: products [id: 4,5,6]
```

Keys = product ids — корректно; items remount только новые.

```text
Page 2 replace data entirely — ok
Append «load more»: [1..3] + [4..6] — ids must not duplicate
```

Infinite scroll: dedupe by id в data layer; key = `id`.

---

## 11. Anti-pattern: random key «для перерисовки»

```vue
<!-- ❌ force refresh hack -->
<ProductList :key="refreshKey" />

<!-- refreshKey++ после action -->
```

Remount **всего** списка — дорого и маскирует баг state/query.

**Лучше:** `queryClient.invalidateQueries`, fix stale props, или local reset там, где нужен.

---

## 12. Fragments и nested v-for

```vue
<template v-for="product in products" :key="product.id">
  <ProductCard :product="product" />
  <Divider />
</template>
```

Vue 3: **key на template v-for** — правильное место для пары sibling nodes.

```vue
<!-- ❌ key only on first child inside -->
<template v-for="product in products">
  <ProductCard :key="product.id" />
  <Divider />
</template>
```

---

## 13. Частые ошибки

### Index key в production catalog

Самая частая причина «input показывает чужое значение».

### Key не уникален

Два `product.id` undefined с API → duplicate `undefined`.

### Key = object

```vue
:key="product" // stringified [object Object] — бесполезно
```

### Менять key чтобы «форсить обновление»

Symptom of broken data flow — fix source.

### Key на несibling элементах

Key работает в **одном** v-for / TransitionGroup level.

### Забыть key в TransitionGroup

List animation silently wrong.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Зачем Vue нужен **stable identity**?
2. Почему **index key** опасен при delete/sort?
3. Когда **remount by key** — feature, не bug?
4. Чем `:key="product.id"` лучше `:key="index"` для `ProductCard` с local qty?
5. Почему `Math.random()` / `updatedAt` key вредят perf?
6. Где ставить key в `<TransitionGroup>`?

---

## 15. Что почитать

### Официальное

- [List Rendering · Maintaining State with key](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key)
- [TransitionGroup](https://vuejs.org/guide/built-ins/transition-group.html)

### Связанные материалы этого плана

- [Module 12 · лишние перерендеры](./02-unnecessary-rerenders.md)
- [Module 10 · transitions](../module-10/03-transitions.md)
- [Module 5 · dynamic routes](../module-5/07-dynamic-routes.md)

---

## 16. Практическое мини-задание

1. Найди все `v-for` в catalog — есть ли без `:key` или с `index`?
2. Delete первый product в list — local input/qty остаётся корректным?
3. Sort by price — TransitionGroup ведёт себя правильно?
4. `RouterView`: нужен ли `:key="params.id"` на detail page?
5. Один случай «force refresh via key» — можно заменить invalidate/ref?

---

## 17. Мини-конспект

- **key** = identity для diff, не decoration
- catalog lists → **`entity.id`**, не index
- stable key → patch; unstable → remount storm
- remount by key — осознанный reset state
- TransitionGroup **требует** keys
- дальше — **`v-once`**

---

## 18. Что делать дальше

Следующий теоретический блок Module 12:

- [`v-once`](./04-v-once.md)
