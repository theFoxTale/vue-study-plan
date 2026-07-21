# Module 12 · Теория: `shallowRef` и shallow reactivity

Этот материал закрывает шестой теоретический пункт Module 12: **`shallowRef`**, **`shallowReactive`**, **`triggerRef`** — контроль **глубины** реактивности для больших коллекций, сторонних объектов и сценариев «replace whole value», не «mutate deep».

Связанные материалы:

- [Module 12 · реактивность под капотом](./01-reactivity-internals.md)
- [Module 2 · ref](../module-2/01-ref.md)

---

## 1. Deep vs shallow

По умолчанию `ref()` / `reactive()` — **глубокая** реактивность: Vue рекурсивно оборачивает вложенные объекты в Proxy.

```ts
const products = ref<Product[]>([])
products.value[0].price = 99 // trigger — deep track
```

**Shallow** — реактивен только **первый уровень**:

```ts
const products = shallowRef<Product[]>([])

products.value = newList        // trigger ✅
products.value[0].price = 99    // НЕ trigger ❌ (без triggerRef)
```

```text
deep   → track каждое поле в дереве
shallow → track только .value / root keys
```

Официально:

- [shallowRef](https://vuejs.org/api/reactivity-advanced.html#shallowref)
- [shallowReactive](https://vuejs.org/api/reactivity-advanced.html#shallowreactive)
- [Reactivity in Depth · Deep vs Shallow](https://vuejs.org/guide/extras/reactivity-in-depth.html)

---

## 2. Зачем это catalog app

| Кейс | Почему shallow |
|------|----------------|
| Список 500+ products с API | deep proxy на каждый item — memory + track cost |
| Immutable update pattern | whole array replace, не mutate item fields |
| Chart/map instance | не делать reactive thousands internal fields |
| vue-query `data` copy | иногда держишь local snapshot без deep watch |

**Не цель:** «ускорить всё» — цель **не подписывать** UI на deep mutations, когда паттерн данных — **replace**.

---

## 3. `shallowRef`

```ts
import { shallowRef, triggerRef } from 'vue'

const products = shallowRef<Product[]>([])

async function loadCatalog() {
  products.value = await fetchProducts() // trigger
}

function updatePrice(id: string, price: number) {
  // ❌ UI не обновится
  const item = products.value.find(p => p.id === id)
  if (item) item.price = price

  // ✅ immutable replace
  products.value = products.value.map(p =>
    p.id === id ? { ...p, price } : p,
  )

  // ✅ или force trigger после intentional mutate
  // item!.price = price
  // triggerRef(products)
}
```

### Template

```vue
<li v-for="p in products" :key="p.id">
  {{ p.title }} — {{ p.price }}
</li>
```

Render читает `products` (shallow ref) → при **replace** `.value` список обновится.

Deep mutate item **без** replace/trigger → **stale UI**.

---

## 4. `triggerRef` — когда mutate in place осознанно

```ts
const list = shallowRef([{ id: '1', qty: 1 }])

list.value[0].qty++
triggerRef(list) // force subscribers
```

```text
Используй редко — prefer immutable replace для predictability
```

Catalog cart **в Pinia** обычно deep reactive — ok для малого state. Shallow — для **больших read-mostly** списков на page.

---

## 5. `shallowReactive`

```ts
const state = shallowReactive({
  products: [] as Product[],
  filters: { category: 'all' },
})

state.products = newArray     // trigger root key 'products'
state.filters.category = 'x' // trigger root 'filters' — но НЕ deep на filters.category?
```

Для `shallowReactive` **только keys первого уровня** reactive. Запись `state.filters.category` **does trigger** set on `filters` object as root property access... Actually in Vue 3 shallowReactive: only root level property assignment triggers. Reading/writing nested `state.filters.category` - the nested object is NOT converted to reactive proxy, so mutating nested properties won't trigger updates.

From Vue docs:
- shallowReactive: only root-level property access is tracked
- Nested objects are NOT converted to reactive - so mutating nested properties won't trigger updates

```ts
state.filters.category = 'phones' // might NOT trigger if filters was plain object nested
// Better: state.filters = { ...state.filters, category: 'phones' }
```

**В practice:** `shallowRef` чаще чем `shallowReactive` в Composition API.

---

## 6. `markRaw` — never reactive

```ts
import { markRaw, shallowRef } from 'vue'

const chartContainer = shallowRef<HTMLElement | null>(null)
const chart = shallowRef(
  markRaw(createChart(canvasEl)), // Chart.js instance
)
```

```text
Сторонний imperative object → markRaw
Vue не тратит ресурсы на proxy внутренностей
```

Catalog: map widget, rich text editor instance, D3 selection.

---

## 7. Паттерн: immutable list updates

```ts
const products = shallowRef<Product[]>([])

function applyDiscount(ids: Set<string>, percent: number) {
  products.value = products.value.map(p =>
    ids.has(p.id)
      ? { ...p, price: p.price * (1 - percent) }
      : p,
  )
}
```

```text
Согласуется с:
  - vue-query (new data reference on refetch)
  - functional mindset
  - predictable triggers для shallowRef
```

**Pinia** `$patch` и mutations — другой стиль; shallow — чаще **local page state** или composable cache.

---

## 8. Shallow + `computed`

```ts
const products = shallowRef<Product[]>([])
const visible = computed(() =>
  products.value.filter(p => p.category === category.value),
)
```

```text
computed читает products.value (shallow) → track на replace .value
filter создаёт new array → ok
mutate item in place без triggerRef → computed НЕ пересчитается
```

---

## 9. Shallow vs vue-query

```ts
const { data: products } = useQuery({ ... })
```

Query `data` уже **ref** с replace on fetch — часто **обычный ref** достаточен. Shallow имеет смысл если:

- копируешь data в **local editable** list без deep watch
- держишь **огромный** parsed tree и обновляешь root only

Не дублируй query cache в shallowRef без причины — один source of truth.

---

## 10. Catalog scenarios

### A. Large product list (client-side only)

```ts
// page state — thousands from JSON demo
const allProducts = shallowRef<Product[]>(initialData)

function sortByPrice() {
  allProducts.value = [...allProducts.value].sort(
    (a, b) => a.price - b.price,
  )
}
```

Sort = **new array** → UI updates.

### B. Selected product detail

Detail page может использовать **deep** `product` ref — один object, много bound fields, form edit.

```text
List page → shallow + replace
Detail form → deep ref или reactive для draft fields
```

### C. Third-party SKU picker widget

```ts
const picker = shallowRef(markRaw(initSkuPicker(el)))
```

---

## 11. DevTools и отладка

Symptom: «изменил price — card не обновилась»

1. `shallowRef` + in-place mutate?
2. Need `triggerRef` or immutable update?
3. Child reads nested field without parent replace?

---

## 12. Когда НЕ использовать shallow

| ❌ | Почему |
|----|--------|
| Cart store с частыми `item.qty++` | нужен deep или explicit patch |
| Form draft с v-model на nested fields | deep reactive |
| «Не понимаю reactivity» | shallow маскирует bugs |
| Маленький list < 50 items | выигрыш negligible |

---

## 13. Сравнение API

| API | Track level | Typical use |
|-----|-------------|-------------|
| `ref` / `reactive` | deep | forms, store, general state |
| `shallowRef` | `.value` replace | large arrays, external instances |
| `shallowReactive` | root keys | rare, object bag |
| `markRaw` | none | lib instances |
| `triggerRef` | manual bump | in-place mutate escape hatch |
| `readonly` / `shallowReadonly` | prevent writes | pass down immutable |

---

## 14. Частые ошибки

### Mutate shallow list items

```ts
products.value[0].stock-- // silent no-op for UI
```

### Забыли spread при update

```ts
products.value.push(newItem) // array ref same → shallow MAY not trigger?
```

Actually for shallowRef, mutating the array in place with push - the .value reference is the same array object. **push does NOT change .value reference** → **NO trigger** for shallowRef!

```ts
// ❌ push/pop/splice in place on shallowRef
products.value.push(item)

// ✅ new array
products.value = [...products.value, item]
```

Critical mistake!

### shallowRef на form state

v-model nested fields stop updating.

### shallow everywhere «for perf»

Premature; architecture first.

### Confuse with `v-memo`

Different layers: shallow = data reactivity; v-memo = render skip.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Чем `shallowRef` отличается от `ref`?
2. Почему `push` на shallowRef **не** trigger?
3. Три способа обновить item в shallow list?
4. Зачем `markRaw` для Chart/map?
5. Когда catalog list shallow, detail page deep?
6. Когда вызывать `triggerRef`?

---

## 16. Что почитать

### Официальное

- [shallowRef](https://vuejs.org/api/reactivity-advanced.html#shallowref)
- [triggerRef](https://vuejs.org/api/reactivity-advanced.html#triggerref)
- [markRaw](https://vuejs.org/api/reactivity-advanced.html#markraw)

### Связанные материалы этого плана

- [Module 12 · реактивность](./01-reactivity-internals.md)
- [Module 8 · server state](../module-8/01-server-state-vs-client-state.md)

---

## 17. Практическое мини-задание

1. Возьми products list — `shallowRef` + sort by price через **new array**.
2. Попробуй `push` — UI не обновился? Fix через spread.
3. In-place price change + `triggerRef` — работает? Prefer immutable?
4. Один third-party / plain object — `markRaw`.
5. Реши: какие части catalog **shallow**, какие **deep** — запиши.

---

## 18. Мини-конспект

- **shallow** = reactive только **верхний** уровень
- replace `.value` / new array — да; **push/mutate nested** — нет
- **`triggerRef`** — escape hatch; immutable — лучше
- **`markRaw`** — lib instances
- large read-mostly lists — main catalog use case
- дальше — **code splitting**

---

## 19. Что делать дальше

Следующий теоретический блок Module 12:

- [Code splitting](./07-code-splitting.md)
