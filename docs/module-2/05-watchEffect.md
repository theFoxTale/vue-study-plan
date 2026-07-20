# Module 2 · Теория: `watchEffect`

Этот материал закрывает пятый теоретический пункт `Module 2`: понять, **что такое `watchEffect`**, **чем он отличается от `watch`**, **когда удобнее auto-tracking dependencies** и **какие у него ограничения**.

Связанные материалы:

- [Module 2 · watch](./04-watch.md)
- [Module 2 · computed](./03-computed.md)
- [Module 2 · ref](./01-ref.md)

---

## 1. Что такое `watchEffect`

**`watchEffect`** запускает callback **сразу** и **автоматически отслеживает** все reactive dependencies, которые используются внутри него.

```ts
import { ref, watchEffect } from 'vue'

const count = ref(0)

watchEffect(() => {
  console.log('count is', count.value)
})
// сразу лог: count is 0

count.value++
// снова лог: count is 1
```

Тебе **не нужно явно указывать source**, как в `watch`.

Официально:

- [Watchers · watchEffect() · Vue.js](https://vuejs.org/guide/essentials/watchers.html#watcheffect)
- [watchEffect() · API](https://vuejs.org/api/reactivity-core.html#watcheffect)

---

## 2. Зачем нужен `watchEffect`

Иногда в `watch` один и тот же reactive state используется **и как source, и внутри callback**.

### С `watch`

```ts
watch(
  category,
  async () => {
    products.value = await fetchProducts(category.value)
  },
  { immediate: true },
)
```

Здесь `category` указан явно, но внутри callback снова читается `category.value`.

### С `watchEffect`

```ts
watchEffect(async () => {
  products.value = await fetchProducts(category.value)
})
```

Vue сам поймёт, что effect зависит от `category.value`.

### Главная идея

```text
watch       → ты явно говоришь, за чем следить
watchEffect → Vue сам собирает dependencies внутри callback
```

---

## 3. Базовый пример

```vue
<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const query = ref('')
const log = ref<string[]>([])

watchEffect(() => {
  log.value.push(`query: ${query.value}`)
})
</script>

<template>
  <input v-model="query" placeholder="Search..." />
  <ul>
    <li v-for="(item, index) in log" :key="index">{{ item }}</li>
  </ul>
</template>
```

### Что здесь важно

- callback запускается **сразу**
- при изменении `query` effect перезапускается
- source указывать не нужно

---

## 4. `watch` vs `watchEffect`

| | `watch` | `watchEffect` |
|---|--------|---------------|
| Source | указываешь явно | auto-track внутри callback |
| Первый запуск | lazy by default | сразу |
| `oldValue` | ✅ есть | ❌ нет |
| Контроль | точнее | короче и удобнее |
| Dependencies | только declared source | всё, что прочитано синхронно |

### Когда выбрать `watch`

- нужен `oldValue`
- важно следить **только** за одним конкретным source
- callback не должен запускаться сразу
- нужен `{ once: true }`

### Когда выбрать `watchEffect`

- effect использует несколько reactive values
- нужен immediate run
- хочется короче записать fetch/sync logic
- dependencies очевидны из тела callback

---

## 5. Как работает `watchEffect` упрощённо

```text
watchEffect runs
   ↓
Vue tracks all reactive reads inside callback
   ↓
any tracked dependency changes
   ↓
cleanup (if any)
   ↓
effect runs again
```

Это похоже на `computed`, но:

- `computed` возвращает derived value
- `watchEffect` выполняет side effect

---

## 6. Пример для Module 2 practice: auto fetch

```vue
<script setup lang="ts">
import { ref, watchEffect } from 'vue'

type Product = {
  id: number
  name: string
  price: number
}

const category = ref('phones')
const products = ref<Product[]>([])
const isLoading = ref(false)
const error = ref('')

watchEffect(async (onCleanup) => {
  let cancelled = false

  onCleanup(() => {
    cancelled = true
  })

  isLoading.value = true
  error.value = ''

  try {
    const response = await fetch(`/api/products?category=${category.value}`)

    if (!response.ok) {
      throw new Error('Failed to load products')
    }

    const data = await response.json()

    if (!cancelled) {
      products.value = data
    }
  } catch (err) {
    if (!cancelled) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      products.value = []
    }
  } finally {
    if (!cancelled) {
      isLoading.value = false
    }
  }
})
</script>
```

Это типичный refactor:

```text
watch(category, ..., { immediate: true })
   ↓
watchEffect(...)
```

---

## 7. Важное ограничение: async tracking

`watchEffect` отслеживает dependencies **только во время синхронной части** callback.

```ts
watchEffect(async () => {
  console.log(category.value) // ✅ tracked

  const response = await fetch(`/api/products?category=${category.value}`)
  // ⚠️ чтение после await может не попасть в dependency tracking
})
```

### Практическое правило

Если effect зависит от reactive value **после `await`**, безопаснее:

1. прочитать value **до `await`**
2. или использовать `watch` с явным source

```ts
watchEffect(async (onCleanup) => {
  const currentCategory = category.value // ✅ read before await

  const response = await fetch(`/api/products?category=${currentCategory}`)
  products.value = await response.json()
})
```

---

## 8. Cleanup в `watchEffect`

Перед повторным запуском effect Vue вызывает cleanup.

```ts
watchEffect((onCleanup) => {
  const timer = window.setTimeout(() => {
    console.log(query.value)
  }, 300)

  onCleanup(() => {
    window.clearTimeout(timer)
  })
})
```

Для async:

```ts
watchEffect(async (onCleanup) => {
  const controller = new AbortController()

  onCleanup(() => {
    controller.abort()
  })

  const response = await fetch(`/api/products?category=${category.value}`, {
    signal: controller.signal,
  })

  products.value = await response.json()
})
```

Это защищает от stale responses.

---

## 9. `watchEffect` с несколькими dependencies

```ts
const query = ref('')
const sortBy = ref<'name' | 'price'>('name')

watchEffect(() => {
  console.log('filters changed:', query.value, sortBy.value)
})
```

С `watch` пришлось бы писать:

```ts
watch([query, sortBy], ([newQuery, newSortBy]) => {
  console.log('filters changed:', newQuery, newSortBy)
})
```

`watchEffect` здесь короче, но менее явный.

---

## 10. Когда `watchEffect` не лучший выбор

### Нужен `oldValue`

```ts
watch(count, (newValue, oldValue) => {
  console.log(oldValue, '→', newValue)
})
```

`watchEffect` old value не даёт.

### Нужен lazy watcher

```ts
watch(query, saveToStorage) // только при изменении
```

`watchEffect` всегда запускается сразу.

### Side effect должен зависеть не от всего, что прочитан

```ts
watchEffect(() => {
  document.title = `${query.value} | Catalog`

  // если здесь случайно прочитать что-то ещё,
  // effect начнёт зависеть и от этого
})
```

Иногда явный `watch` безопаснее.

---

## 11. Остановка, pause и resume

`watchEffect` возвращает handle:

```ts
const stop = watchEffect(() => {
  console.log(count.value)
})

stop()
```

Также есть:

```ts
const { stop, pause, resume } = watchEffect(() => {})
```

На практике чаще всего нужен только `stop()`.

Как и у `watch`, effect, созданный **синхронно** в `<script setup>`, автоматически останавливается при unmount.

---

## 12. `flush` options

По умолчанию effect запускается **до** DOM update компонента.

### `flush: 'post'`

```ts
watchEffect(
  () => {
    // DOM already updated
  },
  { flush: 'post' },
)
```

Или alias:

```ts
import { watchPostEffect } from 'vue'

watchPostEffect(() => {
  // runs after DOM update
})
```

Полезно, если effect читает DOM.

### `flush: 'sync'`

Запускается синхронно при каждом изменении dependency. Использовать осторожно.

---

## 13. `watchEffect` vs `computed` — ещё раз коротко

```ts
// derived value
const total = computed(() => items.value.length)

// side effect
watchEffect(() => {
  console.log('items changed', items.value.length)
})
```

Если можно **вернуть значение** — используй `computed`.

Если нужно **что-то сделать** — `watch` или `watchEffect`.

---

## 14. TypeScript

TypeScript обычно не требует отдельной типизации для самого `watchEffect`.

```ts
const category = ref<'phones' | 'laptops'>('phones')

watchEffect(() => {
  console.log(category.value)
})
```

Cleanup типизируется автоматически:

```ts
watchEffect((onCleanup) => {
  onCleanup(() => {})
})
```

---

## 15. Частые ошибки

### Бесконечный loop через запись в tracked state

```ts
watchEffect(() => {
  count.value++ // ❌ effect перезапускает сам себя
})
```

### Ожидали tracking после `await`

```ts
watchEffect(async () => {
  await something()
  console.log(category.value) // ⚠️ может не отслеживаться как ожидается
})
```

### Использовали `watchEffect` вместо `computed`

```ts
watchEffect(() => {
  fullName.value = `${first.value} ${last.value}` // ❌
})

const fullName = computed(() => `${first.value} ${last.value}`) // ✅
```

### Создали effect асинхронно

```ts
setTimeout(() => {
  watchEffect(() => {}) // ❌ не привяжется к component lifecycle
}, 100)
```

---

## 16. Практический выбор между `watch` и `watchEffect`

```text
нужен oldValue?                → watch
lazy by default?               → watch
auto-track several deps?       → watchEffect
immediate fetch on setup?        → watchEffect or watch + immediate
очень важен explicit control?  → watch
```

Если сомневаешься — **`watch` безопаснее**, потому что dependencies явные.

---

## 17. Что важно понять после этого блока

Проверь себя:

1. Чем `watchEffect` отличается от `watch`?
2. Когда `watchEffect` запускается первый раз?
3. Как Vue собирает dependencies?
4. Почему async tracking — подводный камень?
5. Зачем нужен `onCleanup`?
6. Когда лучше всё же выбрать `watch`?

---

## 18. Что почитать

### Официальное

- [Watchers · watchEffect() · Vue.js](https://vuejs.org/guide/essentials/watchers.html#watcheffect)
- [Watchers · watch vs. watchEffect · Vue.js](https://vuejs.org/guide/essentials/watchers.html#watch-vs-watcheffect)
- [watchEffect() · API](https://vuejs.org/api/reactivity-core.html#watcheffect)

### Связанные материалы этого плана

- [Module 2 · watch](./04-watch.md)
- [Module 2 · computed](./03-computed.md)

---

## 19. Практическое мини-задание

Refactor catalog loading:

1. Возьми `watch(category, loadProducts, { immediate: true })`
2. Перепиши на `watchEffect`
3. Добавь cleanup для stale request
4. Сравни, стал ли код короче и понятнее

### Подсказка

```ts
watchEffect(async (onCleanup) => {
  const currentCategory = category.value
  let cancelled = false

  onCleanup(() => {
    cancelled = true
  })

  isLoading.value = true
  error.value = ''

  try {
    const response = await fetch(`/api/products?category=${currentCategory}`)
    const data = await response.json()

    if (!cancelled) {
      products.value = data
    }
  } finally {
    if (!cancelled) {
      isLoading.value = false
    }
  }
})
```

---

## 20. Мини-конспект

- `watchEffect` запускается сразу
- dependencies собираются автоматически
- удобен для fetch/sync с несколькими reactive values
- не даёт `oldValue`
- async tracking работает только для синхронной части callback
- для side effects, не для derived values
- если нужен explicit control — используй `watch`

---

## 21. Что делать дальше

Следующий теоретический блок Module 2:

- **[жизненный цикл: `onMounted`, `onUpdated`, `onUnmounted`](./06-lifecycle-hooks.md)**

После reactivity API логично разобрать, **когда** component mount/update/unmount и как в этих фазах безопасно запускать effects, fetch и cleanup.
