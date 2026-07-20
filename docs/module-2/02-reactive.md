# Module 2 · Теория: `reactive`

Этот материал закрывает второй теоретический пункт `Module 2`: понять, **что такое `reactive`**, **чем он отличается от `ref`**, **когда его использовать** и **какие у него ограничения**.

Связанные материалы:

- [Module 2 · ref](./01-ref.md)
- [Module 1 · basic forms](../module-1/13-basic-forms.md)
- [Module 1 · v-model](../module-1/11-v-model.md)

---

## 1. Что такое `reactive`

**`reactive`** — второй основной API Vue 3 для создания реактивного состояния.

В отличие от `ref`, который оборачивает значение в объект с `.value`, `reactive()` делает **сам object reactive**.

```ts
import { reactive } from 'vue'

const state = reactive({
  count: 0,
})
```

Доступ к полям — как у обычного object:

```ts
state.count
state.count++
```

Официально:

- [Reactivity Fundamentals · reactive() · Vue.js](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#reactive)
- [reactive() · API](https://vuejs.org/api/reactivity-core.html#reactive)

---

## 2. Базовый пример

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  count: 0,
})

function increment() {
  state.count++
}
</script>

<template>
  <p>Count: {{ state.count }}</p>
  <button @click="increment">+1</button>
</template>
```

### Что здесь важно

- в script **нет `.value`**
- меняешь поля напрямую: `state.count++`
- в template тоже работаешь с полями object

---

## 3. `ref` vs `reactive` — главная разница

| | `ref` | `reactive` |
|---|------|------------|
| Что принимает | любой тип | только object-like types |
| Доступ в script | через `.value` | через свойства object |
| Примитивы | ✅ string, number, boolean | ❌ нельзя |
| Массивы и objects | ✅ | ✅ |
| Переприсвоить целиком | ✅ `count.value = 10` | ⚠️ теряется reactivity |
| Destructuring | безопаснее | ⚠️ ломает reactivity |

### Mental model

```text
ref       → box with .value
reactive  → reactive proxy over object
```

---

## 4. Как работает `reactive` упрощённо

`reactive()` возвращает **Proxy** над object.

```text
const state = reactive({ count: 0 })
   ↓
Vue wraps object in Proxy
   ↓
read/write properties are tracked
   ↓
UI updates automatically
```

### Reactive proxy vs original

```ts
const raw = { count: 0 }
const state = reactive(raw)

console.log(state === raw) // false
```

Реактивен **proxy**, а не исходный object.

Поэтому в Vue-коде лучше работать только с reactive proxy, а не с original object.

---

## 5. Deep reactivity

`reactive` делает object **глубоко reactive**.

```ts
const state = reactive({
  user: {
    name: 'Ann',
    settings: {
      theme: 'dark',
    },
  },
  todos: ['Learn Vue'],
})

state.user.name = 'Alex'
state.user.settings.theme = 'light'
state.todos.push('Build app')
```

Все эти изменения Vue отследит.

---

## 6. Когда `reactive` особенно уместен

`reactive` удобен, когда у тебя **группа связанных полей** в одном object.

### Форма

```ts
const form = reactive({
  email: '',
  password: '',
  rememberMe: false,
})
```

```vue
<template>
  <form @submit.prevent="submit">
    <input v-model="form.email" type="email" />
    <input v-model="form.password" type="password" />
    <label>
      <input v-model="form.rememberMe" type="checkbox" />
      Remember me
    </label>
  </form>
</template>
```

### Фильтры и UI state

```ts
const filters = reactive({
  query: '',
  sortBy: 'name',
  onlyActive: false,
})
```

### Состояние экрана

```ts
const ui = reactive({
  isLoading: false,
  error: '',
  isModalOpen: false,
})
```

Это хорошо ложится на практику Module 2: **поиск, сортировка, фильтры**.

---

## 7. `reactive` для массива

Можно сделать reactive массив:

```ts
const todos = reactive([
  { id: 1, text: 'Learn reactive' },
  { id: 2, text: 'Compare with ref' },
])

todos.push({ id: 3, text: 'Build catalog app' })
```

Но на практике для списков часто используют **`ref([])`**, потому что так проще:

- переприсвоить массив целиком
- передавать в composables
- не думать о edge cases

---

## 8. Почему Vue рекомендует `ref` по умолчанию

Официально Vue советует использовать **`ref()` как primary API**.

Причина — у `reactive` есть ограничения, которые легко сломать неосторожным кодом.

---

## 9. Ограничение 1: только object types

`reactive()` **не работает с primitives**.

```ts
// ❌ так нельзя
const count = reactive(0)
```

Для primitives используй `ref`:

```ts
const count = ref(0)
```

---

## 10. Ограничение 2: нельзя просто заменить весь object

```ts
let state = reactive({ count: 0 })

// ❌ reactivity connection теряется
state = reactive({ count: 1 })
```

Vue отслеживает **конкретную ссылку** на reactive proxy.

Если заменить переменную новым object, старая reactive-связь пропадёт.

### Как правильно обновлять object

```ts
const state = reactive({ count: 0 })

// ✅ меняем поля
state.count = 1

// ✅ или обновляем свойства через Object.assign
Object.assign(state, { count: 1, title: 'New' })
```

---

## 11. Ограничение 3: destructuring ломает reactivity

```ts
const state = reactive({ count: 0 })

let { count } = state
count++ // ❌ original state не изменится
```

После destructuring `count` становится обычным number.

### Как решать

1. Не деструктурировать reactive object напрямую
2. Использовать `toRefs()` *(изучишь позже в Module 2 practice/composables)*

```ts
import { reactive, toRefs } from 'vue'

const state = reactive({ count: 0 })
const { count } = toRefs(state)

count.value++ // ✅
```

---

## 12. Когда выбрать `ref`, а когда `reactive`

### Используй `ref`, если:

- одно значение
- boolean flag
- selected id
- массив, который можешь переприсвоить целиком
- ты не уверен, что выбрать

### Используй `reactive`, если:

- несколько связанных полей в одном object
- form state
- filters / sort / search state
- UI state одного экрана

### Практическое правило

```text
default → ref
grouped related fields → reactive
```

---

## 13. `ref` внутри `reactive`

Если положить `ref` внутрь reactive object, Vue **auto-unwrap**-ит его при доступе к property.

```ts
import { ref, reactive } from 'vue'

const count = ref(0)

const state = reactive({
  count,
})

console.log(state.count) // 0
state.count = 1
console.log(count.value) // 1
```

Это полезно знать, но на старте лучше **не смешивать API без необходимости**.

---

## 14. Caveat: refs в массивах и коллекциях

В reactive array или `Map` ref **не unwrap-ится автоматически**.

```ts
import { ref, reactive } from 'vue'

const books = reactive([ref('Vue 3 Guide')])

console.log(books[0].value) // нужен .value
```

На практике это редкий кейс, но ошибка может сбить с толку.

---

## 15. TypeScript и `reactive`

### Простая типизация

```ts
type Filters = {
  query: string
  sortBy: 'name' | 'price'
  onlyActive: boolean
}

const filters = reactive<Filters>({
  query: '',
  sortBy: 'name',
  onlyActive: false,
})
```

### Зачем типизировать

- autocomplete для полей
- защита от опечаток
- понятнее структура state

---

## 16. Пример для Module 2 practice

Приложение «список товаров + поиск + сортировка»:

```ts
import { reactive } from 'vue'

type Product = {
  id: number
  name: string
  price: number
}

const catalog = reactive({
  query: '',
  sortBy: 'name' as 'name' | 'price',
  products: [] as Product[],
})
```

```vue
<template>
  <section>
    <input v-model="catalog.query" placeholder="Search..." />

    <select v-model="catalog.sortBy">
      <option value="name">By name</option>
      <option value="price">By price</option>
    </select>

    <ul>
      <li v-for="product in catalog.products" :key="product.id">
        {{ product.name }} — {{ product.price }}
      </li>
    </ul>
  </section>
</template>
```

Позже поверх этого добавишь `computed`, `watch` и composables.

---

## 17. Частые ошибки

### Попытка сделать reactive primitive

```ts
const count = reactive(0) // ❌
const count = ref(0) // ✅
```

### Переприсвоение reactive object

```ts
let state = reactive({ count: 0 })
state = reactive({ count: 1 }) // ❌
```

### Destructuring без `toRefs`

```ts
const { count } = reactive({ count: 0 })
count++ // ❌
```

### Сравнение proxy с original object

```ts
const raw = { count: 0 }
const state = reactive(raw)

console.log(state === raw) // false — это нормально
```

---

## 18. `ref` или `reactive`: что важно понять после этого блока

Проверь себя:

1. Что принимает `reactive()`?
2. Нужен ли `.value` для полей reactive object?
3. Почему нельзя просто заменить reactive object новым?
4. Почему destructuring ломает reactivity?
5. Для чего `reactive` удобнее `ref`?
6. Почему Vue всё равно рекомендует `ref` по умолчанию?

---

## 19. Что почитать

### Официальное

- [Reactivity Fundamentals · reactive() · Vue.js](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#reactive)
- [Reactivity Fundamentals · Vue.js RU](https://ru.vuejs.org/guide/essentials/reactivity-fundamentals.html#reactive)
- [reactive() · API](https://vuejs.org/api/reactivity-core.html#reactive)
- [Limitations of reactive() · Vue.js](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#limitations-of-reactive)

### Связанные материалы этого плана

- [Module 2 · ref](./01-ref.md)
- [Module 1 · basic forms](../module-1/13-basic-forms.md)

---

## 20. Практическое мини-задание

Создай компонент `ProductFilters.vue`:

```vue
<script setup lang="ts">
import { reactive } from 'vue'

type Product = {
  id: number
  name: string
  price: number
}

const state = reactive({
  query: '',
  sortBy: 'name' as 'name' | 'price',
  products: [
    { id: 1, name: 'Keyboard', price: 80 },
    { id: 2, name: 'Mouse', price: 40 },
    { id: 3, name: 'Monitor', price: 300 },
  ] as Product[],
})
</script>

<template>
  <section>
    <input v-model="state.query" placeholder="Search products..." />

    <select v-model="state.sortBy">
      <option value="name">By name</option>
      <option value="price">By price</option>
    </select>

    <ul>
      <li v-for="product in state.products" :key="product.id">
        {{ product.name }} — {{ product.price }}
      </li>
    </ul>
  </section>
</template>
```

### Задачи

1. Убедись, что поля `query` и `sortBy` реактивны
2. Попробуй **неправильно** сделать destructuring и посмотри, что reactivity ломается
3. Подумай, какие части этого state позже вынести в composable

Пока сортировку и фильтрацию можно не реализовывать — это будет логичным следующим шагом с `computed`.

---

## 21. Мини-конспект

- `reactive()` делает object deeply reactive
- доступ к полям идёт напрямую, без `.value`
- хорошо подходит для forms, filters, grouped UI state
- не работает с primitives
- нельзя просто заменить весь reactive object
- destructuring ломает reactivity
- по умолчанию безопаснее выбирать `ref`

---

## 22. Что делать дальше

Следующий теоретический блок Module 2:

- **`computed`**

Именно `computed` поможет на базе `ref`/`reactive` state сделать derived data: отфильтрованный список, отсортированные товары, счётчики и другие вычисляемые значения.
