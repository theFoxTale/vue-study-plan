# Module 12 · Теория: реактивность под капотом

Этот материал открывает **Module 12** и закрывает первый теоретический пункт: **как работает реактивность Vue 3** — Proxy, track/trigger, `ref` / `reactive`, effect, dependency graph и почему это основа для диагностики производительности.

Связанные материалы:

- [Module 11 · practice checklist](../module-11/10-practice-checklist.md)
- [Module 2 · ref и reactive](../module-2/01-ref.md)

---

## 1. Зачем Module 12 после Module 11

```text
Module 5–11  → catalog app: router, query, forms, UI kit, tests
Module 12    → измерять и чинить узкие места, не «оптимизировать вслепую»
```

Тесты дают **safety net**. Оптимизация без понимания реактивности часто превращается в:

- «добавил `shallowRef` везде» — и сломал обновления UI
- «обернул всё в `computed`» — и получил лишнюю работу
- «поставил `key={Math.random()}`» — и убил переиспользование DOM

Module 12 начинается с **модели**, а не с API-читов. Сначала — как Vue узнаёт, что перерисовать; потом — `v-memo`, `key`, code splitting.

Официально:

- [Reactivity in Depth · Vue Guide](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Reactivity API · Core](https://vuejs.org/api/reactivity-core.html)

---

## 2. Главная идея: dependency tracking

Vue 3 не «сканирует весь объект каждый кадр». Он строит **граф зависимостей**:

```text
state (ref/reactive)
    ↓ track (чтение во время effect)
effect (render, computed, watch)
    ↓ trigger (запись в state)
перезапуск только затронутых effect'ов
```

**Effect** — любая функция, которая должна **перезапуститься**, когда изменились прочитанные данные:

- render function компонента
- `computed` getter
- `watch` callback
- `watchEffect`

**Track** — «этот effect читал `product.price` → запомни связь».

**Trigger** — «`product.price` изменился → перезапусти связанные effect'ы».

---

## 3. Proxy: почему Vue 3, а не Vue 2

Vue 2: `Object.defineProperty` — только существующие ключи, массивы и Map требовали обходных путей.

Vue 3: **`Proxy`** оборачивает объект:

```ts
const raw = { title: 'Keyboard', price: 99 }
const reactiveProduct = reactive(raw)

// чтение → track
console.log(reactiveProduct.price)

// запись → trigger
reactiveProduct.price = 89
```

```text
get trap  → track(target, 'price')
set trap  → trigger(target, 'price')
```

Для **catalog app** это значит: изменение `cart.items[0].qty` триггерит только компоненты/computed, которые **реально читали** эту ветку state — не весь app.

---

## 4. `ref` vs `reactive`: две формы одного механизма

| | `ref` | `reactive` |
|---|--------|------------|
| Примитивы | **да** (`ref(0)`) | нет *(оборачивай в object)* |
| `.value` в script | да | нет |
| Reassign whole object | `count.value = 1` | теряется реактивность при `obj = newObj` |
| Template unwrap | auto | auto |
| TypeScript | часто проще для union/primitive | удобен для «формы» / record |

```ts
import { ref, reactive } from 'vue'

const page = ref(1)
const filters = reactive({ category: 'all', sort: 'price' })

// ref — box с .value
page.value++

// reactive — proxy object
filters.sort = 'name'
```

**Под капотом** `ref` — тоже reactive: `.value` читается/пишется через getter/setter с track/trigger.

В **Product Catalog**:

```ts
// список — часто ref или reactive + computed
const products = ref<Product[]>([])
const cart = reactive({ items: [] as CartItem[] })

// query params — ref удобнее для примитивов
const searchQuery = ref('')
```

---

## 5. Что именно «реактивно» в компоненте

При mount Vue создаёт **render effect** для компонента:

```vue
<script setup lang="ts">
const props = defineProps<{ product: Product }>()
const discounted = computed(() => props.product.price * 0.9)
</script>

<template>
  <p>{{ product.title }}</p>
  <p>{{ discounted }}</p>
</template>
```

```text
render effect читает:
  - props.product.title
  - discounted (computed effect читает props.product.price)

изменение product.title  → rerender ProductCard
изменение product.price  → rerender + пересчёт discounted
изменение unrelated store → rerender только если render effect это прочитал
```

**Props** — reactive proxy. **Template refs**, **emit** — не state для track в том же смысле.

Ключ для Module 12: **лишний rerender** = effect перезапустился, хотя **видимый результат** для пользователя не должен был измениться — разберём в [следующем уроке](./02-unnecessary-rerenders.md).

---

## 6. `computed`: кэшированный effect

```ts
const filteredProducts = computed(() =>
  products.value.filter(p => p.category === filters.category),
)
```

```text
1. При первом чтении filteredProducts → запуск getter
2. Getter читает products + filters.category → track
3. Результат кэшируется
4. Повторное чтение без изменения deps → return cache (getter не вызывается)
5. deps изменились → invalidate → следующее чтение пересчитает
```

**Не путать** с методом в template:

```vue
<!-- плохо для perf: вызывается каждый render -->
<li v-for="p in filterProducts()">

<!-- хорошо: кэш computed -->
<li v-for="p in filteredProducts">
```

Для catalog с 200+ товаров разница заметна без «магических» оптимизаций.

---

## 7. `watch` vs `watchEffect`

| | `watch(source, cb)` | `watchEffect(fn)` |
|---|---------------------|-------------------|
| Запуск | lazy (после изменения source) | сразу + при deps |
| Явный source | да | нет (auto track) |
| Старые значения | да | нет |
| Когда | side effects по конкретному полю | sync URL, logging, fetch trigger |

```ts
watch(
  () => route.query.page,
  (page) => { /* load catalog page */ },
)

watchEffect(() => {
  document.title = `${filters.category} · Catalog`
})
```

Оба — effects. Лишние `watchEffect` без нужды = лишние перезапуски.

---

## 8. Уровни реактивности: shallow

По умолчанию `reactive()` **глубокий** — изменение вложенного поля триггерит deps.

```ts
const state = reactive({ cart: { items: [] } })
state.cart.items.push(item) // trigger
```

`shallowRef` / `shallowReactive` — только **первый уровень** *(отдельный урок [06-shallow-ref.md](./06-shallow-ref.md))*:

```ts
const bigList = shallowRef<Product[]>([])
bigList.value = newArray // trigger
bigList.value[0].price = 1 // НЕ trigger (без deep watch)
```

Понимание «глубины» нужно, чтобы не удивляться «UI не обновился» после shallow.

---

## 9. `triggerRef`, `toRaw`, `markRaw`

Редко в daily code, полезно для отладки:

```ts
import { triggerRef, toRaw, markRaw } from 'vue'

// принудительный trigger для shallowRef после мутации innards
triggerRef(bigList)

// сырой объект без proxy — осторожно, обход reactivity
toRaw(reactiveProduct)

// markRaw — никогда не делать reactive (Chart.js instance, Map library)
const chart = markRaw(createChart(canvas))
```

В catalog: **сторонние imperative API** (chart, map) часто `markRaw`, чтобы Vue не оборачивал тысячи внутренних полей.

---

## 10. Effect scope и cleanup

Компонент unmount → его render effect **останавливается**. `watch` с `{ flush: 'pre' }` и onUnmounted — стандартный lifecycle.

```ts
watch(searchQuery, debounceFetch, { flush: 'post' })

onUnmounted(() => {
  abortController.abort()
})
```

Утечка perf: **watch без stop** на long-lived layout + частая смена route → лишние callbacks.

`effectScope()` — групповая отмена *(advanced, чаще в библиотеках)*:

```ts
const scope = effectScope()
scope.run(() => {
  watch(/* … */)
})
scope.stop() // все effects в scope
```

---

## 11. Catalog: ментальная модель «кто от кого зависит»

```text
Pinia cart store
  └─ items, total (getters/computed in store)

ProductListPage
  └─ useQuery(['products', filters])  ← server state (Module 8)
  └─ computed filteredByClient
  └─ ProductCard × N
        └─ props product
        └─ emit add-to-cart
```

Вопрос при каждом «тормозит»:

1. **Какой state изменился?**
2. **Какой effect/component его читает?**
3. **Изменился ли DOM, который видит пользователь?**

Если (3) нет — кандидат на лишний rerender или лишний computed.

---

## 12. Реактивность и vue-query / Pinia

**Pinia** — stores тоже reactive. `$patch`, actions → trigger подписчиков store.

**vue-query** — `data` из query ref; при `invalidateQueries` меняется server cache → компоненты с этим query key rerender.

```text
Не смешивай «server cache» и «client UI state» в одном reactive blob
без причины — сложнее понять, кто trigger'ит список
```

Module 8 уже разделил слои; Module 12 смотрит **стоимость** обновлений при invalidate/refetch.

---

## 13. Dev-only: `@vue/reactivity` package

Vue экспортирует низкоуровневый API *(для library authors)*:

```ts
import { effect, ref } from '@vue/reactivity'

const count = ref(0)
effect(() => {
  console.log('count is', count.value)
})
count.value++ // log again
```

В app-коде обычно не нужен — но объясняет документацию «Reactivity in Depth».

---

## 14. Частые ошибки

### Деструктуризация `reactive` без `toRefs`

```ts
const state = reactive({ count: 0 })
const { count } = state // потеря reactivity!
const { count } = toRefs(state) // ok в template/script с .value
```

### Замена всего `reactive` объекта

```ts
let filters = reactive({ sort: 'price' })
filters = reactive({ sort: 'name' }) // новая ссылка, старые подписчики?
// лучше: filters.sort = 'name' или ref + replace .value
```

### Мутировать props

Props reactive, но **anti-pattern** мутировать. Trigger parent → child rerender cascade.

### Огромный `reactive()` tree в одном store

Любое поле в глубине может связать effect с **всем store**, если читать store целиком в template.

### «Сделаю всё ref» или «всё reactive»

Выбирай по форме данных: примитивы/ref, records/reactive, server state/query отдельно.

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Чем **track** отличается от **trigger**?
2. Почему Vue 3 использует **Proxy**?
3. Когда нужен **`ref`**, когда **`reactive`**?
4. Почему **`computed`** дешевле метода в template при повторном чтении?
5. Что произойдёт при мутации внутри **`shallowRef`** без `triggerRef`?
6. Как связаны render компонента и **effect**?

---

## 16. Что почитать

### Официальное

- [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Reactivity API · Core](https://vuejs.org/api/reactivity-core.html)
- [Computed Properties](https://vuejs.org/guide/essentials/computed.html)

### Связанные материалы этого плана

- [Module 8 · server vs client state](../module-8/01-server-state-vs-client-state.md)
- [Module 6 · Pinia](../module-6/04-pinia.md)

---

## 17. Практическое мини-задание

1. В DevTools или `console.log` отметь один компонент catalog (например `ProductCard`).
2. Измени **несвязанное** поле в store — rerender случился? Почему да/нет?
3. Замени inline `filter()` в template на `computed` — опиши разницу в deps.
4. Нарисуй на бумаге граф: `cart.items` → какие компоненты/computed зависят.
5. Найди один `reactive` объект в проекте — есть ли риск деструктуризации без `toRefs`?

---

## 18. Мини-конспект

- Vue 3 = **Proxy** + **track/trigger** + **effects**
- `ref` / `reactive` — обёртки над одной системой
- **computed** кэширует по deps; метод в template — нет
- **shallow** / **markRaw** — контроль глубины и сторонних объектов
- perf начинается с вопроса: **какой effect лишний?**
- дальше — **лишние перерендеры**

---

## 19. Что делать дальше

Следующий теоретический блок Module 12:

- [Лишние перерендеры](./02-unnecessary-rerenders.md)
