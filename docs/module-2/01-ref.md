# Module 2 · Теория: `ref`

Этот материал закрывает первый теоретический пункт `Module 2`: понять, **что такое `ref`**, **зачем он нужен**, **как работает `.value`** и **когда использовать `ref` как основной способ хранить reactive state**.

Связанные материалы:

- [Module 1 · интерполяция](../module-1/05-interpolation.md)
- [Module 1 · v-model](../module-1/11-v-model.md)
- [Module 1 · basic forms](../module-1/13-basic-forms.md)

---

## 1. Что такое `ref`

**`ref`** — основной API Vue 3 для создания **реактивного состояния** в Composition API.

```ts
import { ref } from 'vue'

const count = ref(0)
```

`ref()` оборачивает значение в объект с полем `.value`:

```ts
count.value // 0
count.value = 1
```

Официально:

- [Reactivity Fundamentals · Vue.js](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [ref() · API](https://vuejs.org/api/reactivity-core.html#ref)

---

## 2. Зачем нужен `ref`, если уже есть обычные переменные

В Module 1 ты уже использовал `ref`, но важно понять **почему**.

### Обычная переменная

```ts
let count = 0
count = 1
```

Vue **не отслеживает** такие изменения автоматически.

### Reactive ref

```ts
const count = ref(0)
count.value = 1
```

Vue **отслеживает** чтение и запись `.value` и обновляет UI.

### Главная идея

```text
plain variable → Vue не знает, что data changed
ref             → Vue знает и перерисовывает template
```

---

## 3. Как работает `ref` упрощённо

Когда компонент рендерится:

1. Vue читает refs, использованные в template
2. Запоминает зависимость
3. Когда `.value` меняется, Vue перерисовывает компонент

Упрощённая mental model:

```text
template uses ref
   ↓
Vue tracks dependency
   ↓
ref.value changes
   ↓
component rerenders
```

---

## 4. Базовый пример

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}
</script>

<template>
  <p>Count: {{ count }}</p>
  <button @click="increment">+1</button>
</template>
```

### Что здесь важно

- в script: `count.value`
- в template: просто `count`
- UI обновляется автоматически

---

## 5. Правило `.value`

| Место | Как писать |
|------|-----------|
| `<script setup>` | `count.value` |
| `<template>` | `count` |

Пример:

```vue
<script setup lang="ts">
const title = ref('Todo List')

function resetTitle() {
  title.value = 'New title'
}
</script>

<template>
  <h1>{{ title }}</h1>
</template>
```

Это одна из самых частых точек путаницы у новичков.

---

## 6. `ref` для primitives

`ref` отлично подходит для:

- string
- number
- boolean

```ts
const title = ref('')
const count = ref(0)
const isOpen = ref(false)
```

### Примеры из учебных проектов

```ts
const newTodo = ref('')
const isLoading = ref(false)
const selectedId = ref<number | null>(null)
```

---

## 7. `ref` для objects и arrays

`ref` можно использовать не только для primitives.

```ts
const user = ref({
  name: 'Ann',
  role: 'Developer',
})

const todos = ref([
  { id: 1, text: 'Learn ref' },
  { id: 2, text: 'Build app' },
])
```

### Важно

Если внутрь `ref` положить object или array, Vue делает его **deep reactive**.

```ts
todos.value.push({ id: 3, text: 'New todo' })
```

UI обновится.

---

## 8. Когда использовать `ref` для object, а когда `reactive`

На Module 2 ты ещё изучишь `reactive`, но уже сейчас полезно знать:

| Ситuation | Часто используют |
|-----------|------------------|
| одно значение | `ref` |
| boolean flag | `ref` |
| string/number | `ref` |
| массив | `ref` |
| form object | `ref` или `reactive` |

### Практическая рекомендация

Если сомневаешься — используй **`ref`**.

Это самый универсальный и предсказуемый вариант.

---

## 9. `ref` в формах

```vue
<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')
</script>

<template>
  <form @submit.prevent="login">
    <input v-model="email" type="email" />
    <input v-model="password" type="password" />
    <button type="submit">Login</button>
  </form>
</template>
```

`v-model` работает с `ref` напрямую в template.

---

## 10. `ref` в списках

```vue
<script setup lang="ts">
import { ref } from 'vue'

type Todo = {
  id: number
  text: string
  done: boolean
}

const todos = ref<Todo[]>([])

function addTodo(text: string) {
  todos.value.push({
    id: Date.now(),
    text,
    done: false,
  })
}
</script>

<template>
  <ul>
    <li v-for="todo in todos" :key="todo.id">
      {{ todo.text }}
    </li>
  </ul>
</template>
```

---

## 11. `ref` и TypeScript

### Простая типизация

```ts
const count = ref(0)
const title = ref('')
const isOpen = ref(false)
```

TypeScript часто выводит тип автоматически.

### Явная типизация

```ts
const selectedId = ref<number | null>(null)

type Todo = {
  id: number
  text: string
}

const todos = ref<Todo[]>([])
```

### Зачем это нужно

- меньше ошибок
- лучше autocomplete
- проще поддерживать код

---

## 12. `ref` можно передавать дальше

Одно из преимуществ `ref` — его можно передать в function или composable, сохранив reactivity.

```ts
function useCounter(initial = 0) {
  const count = ref(initial)

  function increment() {
    count.value++
  }

  return { count, increment }
}
```

Это станет основой для composables в Module 2.

---

## 13. Частые ошибки

### Забыли `.value` в script

```ts
count++ // ❌
count.value++ // ✅
```

### Использовали `.value` в template

```vue
<p>{{ count.value }}</p> <!-- ❌ -->
<p>{{ count }}</p> <!-- ✅ -->
```

### Подменили весь ref object вместо `.value`

```ts
let count = ref(0)
count = ref(10) // ❌ теряется связь, если count не const и переприсваивается неправильно
count.value = 10 // ✅
```

### Ожидали reactivity от plain variable

```ts
let title = 'Todo'
title = 'New todo' // Vue не отследит
```

---

## 14. `ref` vs data from Module 1 mental model

В Module 1 ты уже использовал `ref`, но мог воспринимать его как «магию для input».

Теперь важно понимать глубже:

- `ref` — это **единицa reactive state**
- template автоматически подписывается на неё
- functions меняют `.value`
- UI обновляется сам

---

## 15. Когда `ref` особенно уместен

Используй `ref`, когда нужно хранить:

- input value
- counter
- loading flag
- selected item id
- list of todos
- temporary form state
- result of simple async request *(позже в Module 2 practice)*

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Что возвращает `ref()`?
2. Зачем нужен `.value`?
3. Почему plain variable не обновляет UI?
4. Как `ref` используется в template?
5. Можно ли хранить array/object в `ref`?
6. Почему `ref` — recommended default для reactive state?

---

## 17. Что почитать

### Официальное

- [Reactivity Fundamentals · Vue.js](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Reactivity Fundamentals · Vue.js RU](https://ru.vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [ref() · API](https://vuejs.org/api/reactivity-core.html#ref)

### Связанные материалы этого плана

- [Module 1 · interpolation](../module-1/05-interpolation.md)
- [Module 1 · v-model](../module-1/11-v-model.md)
- [Module 1 · events](../module-1/06-events.md)

---

## 18. Практическое мини-задание

Создай компонент `CounterPanel.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
const step = ref(1)

function increment() {
  count.value += step.value
}

function decrement() {
  count.value -= step.value
}

function reset() {
  count.value = 0
}
</script>

<template>
  <section>
    <p>Count: {{ count }}</p>

    <label>
      Step
      <input v-model.number="step" type="number" min="1" />
    </label>

    <button @click="decrement">-</button>
    <button @click="increment">+</button>
    <button @click="reset">Reset</button>
  </section>
</template>
```

### Задачи

1. Проверь, что counter обновляется
2. Измени `step` и посмотри, как меняется increment/decrement
3. Открой Vue DevTools и посмотри refs в component state

---

## 19. Мини-конспект

- `ref()` создаёт reactive state
- доступ к value идёт через `.value` в script
- в template ref unwrap-ится автоматически
- `ref` работает с primitives, objects и arrays
- если сомневаешься — используй `ref`

---

## 20. Что делать дальше

Следующий теоретический блок Module 2:

- **`reactive`**

После `ref` логично сравнить второй способ хранения state и понять, когда какой API уместнее.
