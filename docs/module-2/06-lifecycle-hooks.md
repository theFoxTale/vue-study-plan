# Module 2 · Теория: жизненный цикл (`onMounted`, `onUpdated`, `onUnmounted`)

Этот материал закрывает шестой теоретический пункт `Module 2`: понять **фазы жизни Vue-компонента**, **когда использовать lifecycle hooks** и **как правильно делать fetch, DOM-access и cleanup**.

Связанные материалы:

- [Module 2 · watch](./04-watch.md)
- [Module 2 · watchEffect](./05-watchEffect.md)
- [Module 1 · Single File Components](../module-1/03-single-file-components.md)

---

## 1. Что такое lifecycle hooks

Каждый Vue-компонент проходит несколько этапов:

```text
create → mount → update → unmount
```

**Lifecycle hooks** — это функции, которые Vue вызывает на конкретных этапах, чтобы ты мог:

- загрузить data
- работать с DOM
- подписаться на events
- очистить timers/listeners при удалении компонента

В Composition API hooks импортируются из `vue`:

```ts
import { onMounted, onUpdated, onUnmounted } from 'vue'
```

Официально:

- [Lifecycle Hooks · Vue.js](https://vuejs.org/guide/essentials/lifecycle.html)
- [Composition API: Lifecycle Hooks · API](https://vuejs.org/api/composition-api-lifecycle.html)

---

## 2. Упрощённая схема жизненного цикла

```text
setup()
   ↓
onBeforeMount
   ↓
DOM created & inserted
   ↓
onMounted
   ↓
reactive state changes
   ↓
onBeforeUpdate
   ↓
DOM updated
   ↓
onUpdated
   ↓
component removed
   ↓
onBeforeUnmount
   ↓
onUnmounted
```

На Module 2 тебе нужны в первую очередь три hook'а:

- **`onMounted`**
- **`onUpdated`**
- **`onUnmounted`**

---

## 3. Где регистрировать hooks

Hooks регистрируют **синхронно** во время `setup()` / `<script setup>`.

```vue
<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('mounted')
})
</script>
```

### Важно

```ts
// ❌ так нельзя
setTimeout(() => {
  onMounted(() => {})
}, 100)
```

Vue должен связать hook с **текущим component instance**. Если регистрация асинхронная, связь не установится.

---

## 4. `onMounted`

**`onMounted`** вызывается после того, как:

- компонент отрендерился
- его DOM создан и вставлен в document *(если root app тоже in-document)*

### Когда использовать

- initial fetch
- доступ к DOM через template ref
- инициализация сторонней библиотеки
- client-only logic

### Базовый пример

```vue
<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('component is mounted')
})
</script>
```

### Fetch после mount

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

type Product = {
  id: number
  name: string
  price: number
}

const products = ref<Product[]>([])
const isLoading = ref(false)
const error = ref('')

async function loadProducts() {
  isLoading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/products')

    if (!response.ok) {
      throw new Error('Failed to load products')
    }

    products.value = await response.json()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>
```

### Почему fetch часто делают в `onMounted`

- DOM уже существует
- логика явно привязана к появлению компонента на экране
- проще мысленно отделить setup от side effects

На практике fetch можно запускать и через `watchEffect` / `watch`, но **`onMounted` — самый понятный старт**.

---

## 5. Template ref и DOM access

`onMounted` — правильное место для доступа к DOM через `ref`.

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<template>
  <input ref="inputRef" />
</template>
```

До mount `inputRef.value` будет `null`.

---

## 6. `onUpdated`

**`onUpdated`** вызывается после того, как Vue обновил DOM из-за reactive state change.

```vue
<script setup lang="ts">
import { ref, onUpdated } from 'vue'

const count = ref(0)

onUpdated(() => {
  console.log('DOM updated, count =', count.value)
})
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
```

### Когда использовать

- нужно прочитать DOM **после** update
- интеграция с non-Vue library, которой нужен актуальный DOM
- debug / logging DOM state

### Когда НЕ использовать

- обычная reactive UI logic → достаточно template / `computed`
- fetch при изменении state → лучше `watch`
- изменение state внутри `onUpdated` → риск infinite loop

```ts
onUpdated(() => {
  count.value++ // ❌ почти наверняка infinite loop
})
```

### Важный нюанс

`onUpdated` может вызываться **чаще**, чем ты ожидаешь, потому что Vue batch-ит несколько изменений в один render cycle.

Если нужен DOM **после конкретного** изменения — используй `nextTick()`:

```ts
import { nextTick, ref } from 'vue'

async function increment() {
  count.value++
  await nextTick()
  // DOM уже обновлён
}
```

---

## 7. `onUnmounted`

**`onUnmounted`** вызывается, когда компонент удалён из DOM и его reactive effects остановлены.

### Когда использовать

- очистка `setInterval` / `setTimeout`
- remove event listeners
- abort fetch
- destroy third-party widgets

### Базовый пример

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

let intervalId: number | undefined

onMounted(() => {
  intervalId = window.setInterval(() => {
    console.log('tick')
  }, 1000)
})

onUnmounted(() => {
  if (intervalId !== undefined) {
    window.clearInterval(intervalId)
  }
})
</script>
```

### Cleanup для event listener

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

function onResize() {
  console.log(window.innerWidth)
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>
```

---

## 8. Mount / update / unmount: mental model

| Hook | Компонент уже... | DOM уже... | Типичная задача |
|------|------------------|-----------|-----------------|
| `onMounted` | создан | в document | fetch, focus, init |
| `onUpdated` | обновился | перерисован | read updated DOM |
| `onUnmounted` | удаляется | будет уничтожен | cleanup |

---

## 9. Lifecycle hooks vs `watch` / `watchEffect`

Это разные инструменты.

### Lifecycle hook

Отвечает на вопрос: **на каком этапе жизни компонента что-то сделать**.

```ts
onMounted(loadProducts)
onUnmounted(cleanup)
```

### `watch` / `watchEffect`

Отвечает на вопрос: **что сделать, когда изменился reactive state**.

```ts
watch(category, loadProducts)
```

### Частая комбинация

```ts
onMounted(() => {
  loadProducts()
})

watch(category, (newCategory) => {
  loadProducts(newCategory)
})

onUnmounted(() => {
  controller.abort()
})
```

---

## 10. Fetch: `onMounted` или `watchEffect`?

Оба варианта возможны.

### `onMounted` — если data нужна один раз при появлении экрана

```ts
onMounted(() => {
  loadProducts()
})
```

### `watch` / `watchEffect` — если data зависит от filters и должна перезагружаться

```ts
watch(category, loadProducts, { immediate: true })
```

Для Module 2 practice часто получается гибрид:

- initial load в `onMounted`
- reload при смене filter через `watch`

Или один `watch(..., { immediate: true })` без отдельного `onMounted`.

---

## 11. Кратко про `before*` hooks

На Module 2 достаточно знать, что они существуют:

| Hook | Когда |
|------|-------|
| `onBeforeMount` | перед первым render |
| `onBeforeUpdate` | перед DOM update |
| `onBeforeUnmount` | перед удалением, component ещё жив |

Пример:

```ts
onBeforeUnmount(() => {
  console.log('component is about to unmount')
})
```

Подробнее они понадобятся позже; сейчас фокус на **`onMounted` / `onUpdated` / `onUnmounted`**.

---

## 12. Options API equivalent

Если видишь старый код:

| Composition API | Options API |
|-----------------|-------------|
| `onMounted` | `mounted` |
| `onUpdated` | `updated` |
| `onUnmounted` | `unmounted` |

```js
export default {
  mounted() {
    console.log('mounted')
  },
  updated() {
    console.log('updated')
  },
  unmounted() {
    console.log('unmounted')
  },
}
```

В новом коде проекта используй Composition API hooks.

---

## 13. Пример для Module 2 practice

Компонент каталога с fetch и cleanup:

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

type Product = {
  id: number
  name: string
  price: number
}

const products = ref<Product[]>([])
const isLoading = ref(false)
const error = ref('')

let controller: AbortController | null = null

async function loadProducts() {
  controller?.abort()
  controller = new AbortController()

  isLoading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/products', {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error('Failed to load products')
    }

    products.value = await response.json()
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return
    }

    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadProducts()
})

onUnmounted(() => {
  controller?.abort()
})
</script>

<template>
  <section>
    <p v-if="isLoading">Loading...</p>
    <p v-else-if="error">{{ error }}</p>

    <ul v-else>
      <li v-for="product in products" :key="product.id">
        {{ product.name }} — {{ product.price }}
      </li>
    </ul>
  </section>
</template>
```

---

## 14. Частые ошибки

### Регистрация hook асинхронно

```ts
setTimeout(() => {
  onMounted(() => {}) // ❌
}, 0)
```

### DOM access до mount

```ts
const el = ref<HTMLDivElement | null>(null)
el.value?.focus() // ❌ ещё null

onMounted(() => {
  el.value?.focus() // ✅
})
```

### Мутация state в `onUpdated`

```ts
onUpdated(() => {
  count.value++ // ❌
})
```

### Забыли cleanup

```ts
onMounted(() => {
  window.addEventListener('resize', onResize)
})
// ❌ listener останется после unmount

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
}) // ✅
```

### Путаница lifecycle и reactivity

```ts
// ❌ не lifecycle task
onMounted(() => {
  fullName.value = `${firstName.value} ${lastName.value}`
})

// ✅ derived state
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
```

---

## 15. Что важно понять после этого блока

Проверь себя:

1. На каком этапе вызывается `onMounted`?
2. Зачем нужен `onUnmounted`?
3. Почему нельзя менять state в `onUpdated`?
4. Когда лучше `onMounted`, а когда `watch` для fetch?
5. Почему hooks нужно регистрировать синхронно?
6. Где безопасно обращаться к template ref?

---

## 16. Что почитать

### Официальное

- [Lifecycle Hooks · Vue.js](https://vuejs.org/guide/essentials/lifecycle.html)
- [Lifecycle Hooks · Vue.js RU](https://ru.vuejs.org/guide/essentials/lifecycle.html)
- [Composition API: Lifecycle Hooks · API](https://vuejs.org/api/composition-api-lifecycle.html)

### Связанные материалы этого плана

- [Module 2 · watch](./04-watch.md)
- [Module 2 · watchEffect](./05-watchEffect.md)

---

## 17. Практическое мини-задание

Создай компонент `CatalogLoader.vue`:

1. При `onMounted` загрузи mock/fake products
2. Покажи `isLoading` и `error`
3. В `onUnmounted` отмени fetch или очисти timer
4. Добавь `onUpdated` только для debug-log и убедись, что он срабатывает при изменении list

### Подсказка для fake data

```ts
onMounted(async () => {
  isLoading.value = true

  await new Promise((resolve) => setTimeout(resolve, 500))

  products.value = [
    { id: 1, name: 'Keyboard', price: 80 },
    { id: 2, name: 'Mouse', price: 40 },
  ]

  isLoading.value = false
})
```

---

## 18. Мини-конспект

- lifecycle hooks привязаны к этапам жизни компонента
- `onMounted` — после первого render, для fetch/DOM/init
- `onUpdated` — после DOM update, использовать осторожно
- `onUnmounted` — cleanup timers/listeners/requests
- hooks регистрируют синхронно в `<script setup>`
- fetch может жить в `onMounted` или в `watch`, depending on behavior

---

## 19. Что делать дальше

Следующий теоретический блок Module 2:

- **`defineProps`**

После lifecycle логично перейти к **коммуникации между компонентами**: как родитель передаёт data внутрь child component.
