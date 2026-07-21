# Module 12 · Теория: `v-memo`

Этот материал закрывает пятый теоретический пункт Module 12: **`v-memo`** — условный skip update поддерева по массиву зависимостей, типичный кейс **большого списка** catalog и когда memo **не** заменяет архитектуру.

Связанные материалы:

- [Module 12 · v-once](./04-v-once.md)
- [Module 12 · лишние перерендеры](./02-unnecessary-rerenders.md)

---

## 1. Что делает `v-memo`

```vue
<div v-memo="[product.id, product.price, product.title]">
  <ProductCard :product="product" />
</div>
```

```text
Parent rerender
  → сравнить deps с прошлым render (shallow ===)
  → если все deps те же → SKIP update этого subtree
  → если хоть один изменился → normal update
```

**`v-memo`** — built-in directive для **memoization на уровне template**: Vue пропускает diff/patch ветки, пока **явно указанные** deps не изменились.

Официально:

- [v-memo](https://vuejs.org/api/built-in-directives.html#v-memo)
- [Performance · v-memo](https://vuejs.org/guide/best-practices/performance.html#v-memo)

---

## 2. Место в perf-стеке Module 12

```text
1. Архитектура (isolate store, stable props)     ← урок 02
2. key, computed placement                         ← уроки 01–03
3. v-once для static                               ← урок 04
4. v-memo для «тяжёлых, но редко меняющихся» item ← этот урок
5. shallowRef, code split                          ← дальше
```

`v-memo` — **точечный** инструмент после измерения. Не первый шаг.

---

## 3. Синтаксис

### Базовый

```vue
<div v-memo="[valueA, valueB]">
  <!-- expensive subtree -->
</div>
```

Массив **обязателен**. Сравнение элементов — **`Object.is`** (как `===` для primitives).

### Пустой массив = навсегда skip *(как v-once)*

```vue
<div v-memo="[]">
  <StaticBlock />
</div>
```

Эквивалент «никогда не обновлять» — проще часто **`v-once`**.

### На `v-for` *(главный use case)*

```vue
<template v-for="product in products" :key="product.id">
  <div v-memo="[product.id, product.price, inCart(product.id)]">
    <ProductCard
      :product="product"
      :highlight="inCart(product.id)"
    />
  </div>
</template>
```

Parent (`ProductListPage`) rerender из-за **filters UI** или **toast** — карточки, чьи deps не изменились, **не** patch'атся.

**`:key` обязателен** на том же `v-for` — идентичность строки списка.

---

## 4. Что включать в deps

**Правило:** перечисли **каждое reactive значение**, от которого **видимо** зависит subtree.

```vue
<div v-memo="[product.id, product.title, product.price, product.imageUrl]">
  <ProductCard :product="product" />
</div>
```

| В subtree используется | Добавь в deps |
|------------------------|---------------|
| `product.price` | `product.price` |
| `inCart(id)` | `inCart(product.id)` или `cartVersion` |
| `selectedId === product.id` | `selectedId` |
| i18n `t('key')` | current `locale` |
| theme class | `isDark` |

### Объекты в deps

```vue
<!-- ❌ product object reference меняется каждый refetch -->
<div v-memo="[product]">

<!-- ✅ поля, которые реально отображаются -->
<div v-memo="[product.id, product.price, product.title]">
```

Shallow compare: **новый object** с теми же полями — если положить whole `product`, memo **не** сработает после refetch с new array items.

### Computed deps

```vue
<script setup lang="ts">
const highlight = computed(() => cart.has(product.id))
</script>

<div v-memo="[product.id, product.price, highlight]">
```

`highlight` — ref/computed unwrap в template; в массиве передай **`.value`** в script или положи computed ref *(Vue unwrap в template deps array)*:

```vue
<div v-memo="[product.id, highlight]">
```

---

## 5. Catalog: product grid

### Проблема

```text
ProductListPage читает: filters, cartStore, toast, searchQuery
  → rerender
  → 200× ProductCard patch
  → только cart badge у 3 cards изменился
```

### Решение A — architecture *(preferred)*

`ProductCard` не подписан на cart store; `inCart` prop с stable parent computed — см. [урок 02](./02-unnecessary-rerenders.md).

### Решение B — v-memo *(если A недостаточно)*

```vue
<script setup lang="ts">
const props = defineProps<{ products: Product[] }>()
const cart = useCartStore()

function cartQty(productId: string) {
  return cart.qtyByProductId(productId)
}
</script>

<template>
  <div class="grid">
    <template v-for="p in products" :key="p.id">
      <div v-memo="[p.id, p.title, p.price, p.imageUrl, cartQty(p.id)]">
        <ProductCard :product="p" :qty-in-cart="cartQty(p.id)" />
      </div>
    </template>
  </div>
</template>
```

Cart qty change → memo invalidates **только** затронутые ids.

---

## 6. `v-memo` vs `v-once`

| | `v-once` | `v-memo` |
|---|----------|----------|
| Updates | never | when deps change |
| Deps | none | explicit array |
| Stale risk | total freeze | wrong/missing deps |
| Use | footer, static | heavy list items |

```vue
<!-- once: shipping copy -->
<section v-once class="shipping-info">…</section>

<!-- memo: card in hot list -->
<div v-memo="[product.id, product.price]">…</div>
```

---

## 7. `v-memo` vs split component

```vue
<!-- ProductCard.vue — NO useCartStore inside -->
```

Изолированный leaf + stable props часто **убирает** need в `v-memo`.

```text
v-memo = оптимизация когда parent ДОЛЖЕН rerender часто,
         а item subtree дорогой и deps редко меняются
```

Если parent rerender fixable — fix parent.

---

## 8. Стоимость самого `v-memo`

Каждый parent render:

- сравнить массив deps (cheap)
- если skip — **не** diff subtree (win)

Если deps **всегда** меняются (unstable array, whole `product` ref) — memo **добавляет** compare без выигрыша.

```text
Measure: with/without memo on 200 items
```

---

## 9. Типичные баги: stale UI

### Забыли dep

```vue
<div v-memo="[product.id, product.title]">
  <ProductCard :product="product" />
  <!-- price в card, но price НЕ в deps → старая цена -->
</div>
```

### Dep не тот уровень

```vue
<!-- cart changed, но memo только по product.id -->
<div v-memo="[product.id]">
  <span v-if="cart.has(product.id)">In cart</span>
</div>
```

### Nested reactive без полей

```vue
<div v-memo="[product.id]">
  {{ product.reviews.length }}  <!-- reviews async load — не обновится -->
</div>
```

**Fix:** добавь `product.reviews.length` или не memo эту ветку.

---

## 10. С `Transition`, slots, components

### Transition внутри memo

Если enter/leave зависит от **не** указанного в deps state — animation stuck.

### Slot content

Memo на wrapper **не** memo parent slot expression отдельно — slot compiled в parent scope. Deps должны покрывать **всё**, что slot читает.

### Component root

```vue
<ProductCard v-memo="[product.id, product.price]" :product="product" />
```

Vue 3.2+: `v-memo` на component — memo root subtree of component.

---

## 11. Когда НЕ использовать

- мало items (< 20) — overhead не окупается
- deps почти всегда меняются
- проще вынести store из parent/child
- «не знаю deps» — **не** memo
- вместо fix unstable props

### Anti-pattern

```vue
<!-- memo на всём app -->
<div v-memo="[route.path]">
  <RouterView />
</div>
```

Скрывает архитектурные проблемы; route change и так remount.

---

## 12. Checklist перед добавлением v-memo

1. DevTools показал **mass child update** без visible change?
2. Architecture split уже сделан?
3. Список **достаточно большой** или subtree **тяжёлый**?
4. Список deps **полный** для visible output?
5. Deps **stable primitives**, не whole objects?
6. После memo — manual QA price/cart/badge/locale?

---

## 13. Частые ошибки

### v-memo без `:key` в v-for

Memo привязан к **position** — при reorder bugs. Key + memo together.

### Whole object in deps

Refetch → new references → memo useless.

### Memo вместо store isolation

200 components still **run setup** if parent recreates v-for — memo skips **update**, not always **setup** of first mount. *(Child still mounted once per key.)*

### Пустой deps на live form

Frozen broken fields.

### Copy-paste deps from tutorial

Your card shows `stock` — add `product.stock`.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Как `v-memo` решает, skip или update?
2. Зачем `:key` + `v-memo` в одном `v-for`?
3. Почему `[product]` часто бесполезен?
4. Пример deps для `ProductCard` + cart badge?
5. Когда architecture лучше memo?
6. Чем пустой `v-memo="[]"` похож на `v-once`?

---

## 15. Что почитать

### Официальное

- [v-memo API](https://vuejs.org/api/built-in-directives.html#v-memo)
- [Performance · v-memo](https://vuejs.org/guide/best-practices/performance.html#v-memo)

### Связанные материалы этого плана

- [Module 12 · v-once](./04-v-once.md)
- [Module 12 · key](./03-key.md)
- [Module 12 · лишние перерендеры](./02-unnecessary-rerenders.md)

---

## 16. Практическое мини-задание

1. DevTools: add to cart — сколько `ProductCard` обновилось?
2. Если >3 — попробуй isolate props **или** `v-memo` с правильными deps.
3. Намеренно **пропусти** dep (price) — воспроизведи stale UI, потом fix.
4. Сравни perf feel на списке 100+ *(optional)*.
5. Запиши финальный deps array для своей карточки.

---

## 17. Мини-конспект

- **v-memo** = skip subtree update if **deps unchanged** (shallow)
- killer case: **large v-for** + hot parent
- deps = **every visible reactive input**
- prefer **fields**, not whole objects
- wrong deps → **stale UI**; measure first
- дальше — **`shallowRef`**

---

## 18. Что делать дальше

Следующий теоретический блок Module 12:

- [`shallowRef` и shallow reactivity](./06-shallow-ref.md)
