# Module 1 · Теория: работа с формами на базовом уровне

Этот материал закрывает последний теоретический пункт `Module 1`: понять, **как собирать простые формы во Vue**, связывать поля с state, обрабатывать submit и строить базовый UX для Todo / Notes / Habit Tracker.

Связанные материалы:

- [11 · v-model](11-v-model.md)
- [06 · события](06-events.md)
- [12 · v-on](12-v-on.md)
- [07 · v-bind](07-v-bind.md)

---

## 1. Что значит «базовая работа с формами»

На Module 1 тебе нужно уметь:

- создать простую форму;
- связать поля с reactive state через `v-model`;
- обработать submit без перезагрузки страницы;
- добавить/изменить данные по действию пользователя;
- показать простую validation *(например, пустое поле)*.

Это ещё **не** сложные формы с `VeeValidate` и `Zod` — они будут позже в Module 9.

Официально: [Form Input Bindings · Vue.js](https://vuejs.org/guide/essentials/forms.html)

---

## 2. Из чего состоит простая Vue-form

Базовая форма почти всегда включает:

```text
form
  ├─ input fields
  ├─ v-model bindings
  ├─ submit handler
  └─ reactive state in script setup
```

Минимальный пример:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('')

function addTodo() {
  console.log(title.value)
  title.value = ''
}
</script>

<template>
  <form @submit.prevent="addTodo">
    <input v-model="title" placeholder="New todo" />
    <button type="submit">Add</button>
  </form>
</template>
```

---

## 3. Базовый flow формы

Типичный сценарий:

```text
user types in input
   ↓
v-model updates state
   ↓
user submits form
   ↓
@submit.prevent runs handler
   ↓
handler uses state
   ↓
state resets or UI updates
```

### Главная идея

Форма — это не отдельная магия. Это связка:

- `v-model`
- `@submit.prevent`
- function в `<script setup>`

---

## 4. `@submit.prevent` — обязательная база

```vue
<form @submit.prevent="save">
```

Без `.prevent` браузер может перезагрузить страницу.

Для Vue SPA это почти всегда нежелательно.

---

## 5. Text input

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('')
</script>

<template>
  <label for="todo-title">Todo</label>
  <input
    id="todo-title"
    v-model.trim="title"
    type="text"
    placeholder="Enter todo"
  />
</template>
```

### Полезные детали

- используй `<label for="...">`
- для текста часто удобен `.trim`
- `placeholder` улучшает UX, но не заменяет label

---

## 6. Textarea

```vue
<script setup lang="ts">
const note = ref('')
</script>

<template>
  <label for="note-text">Note</label>
  <textarea
    id="note-text"
    v-model="note"
    rows="4"
    placeholder="Write your note..."
  />
</template>
```

Подходит для Notes App и описаний.

---

## 7. Checkbox

```vue
<script setup lang="ts">
const isDone = ref(false)
</script>

<template>
  <label>
    <input v-model="isDone" type="checkbox" />
    Completed
  </label>
</template>
```

Используй для:

- done / not done
- filters
- toggles в Habit Tracker

---

## 8. Select

```vue
<script setup lang="ts">
const priority = ref('medium')
</script>

<template>
  <label for="priority">Priority</label>
  <select id="priority" v-model="priority">
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
  </select>
</template>
```

---

## 9. Submit через Enter

Если кнопка submit находится внутри `<form>`, Enter обычно отправляет форму автоматически.

```vue
<form @submit.prevent="addTodo">
  <input v-model="title" />
  <button type="submit">Add</button>
</form>
```

Это удобный UX-паттерн для Todo / Notes.

---

## 10. Простая validation на Module 1

На этом этапе достаточно базовых проверок в handler.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('')
const error = ref('')

function addTodo() {
  if (!title.value.trim()) {
    error.value = 'Title is required'
    return
  }

  error.value = ''
  console.log('Add todo:', title.value)
  title.value = ''
}
</script>

<template>
  <form @submit.prevent="addTodo">
    <input v-model="title" />
    <p v-if="error">{{ error }}</p>
    <button type="submit">Add</button>
  </form>
</template>
```

### Что здесь важно

- validation живёт в script, не в template
- ошибка показывается через `v-if`
- после успешного submit поле очищается

---

## 11. Disabled submit button

```vue
<button type="submit" :disabled="!title.trim()">
  Add
</button>
```

Это простой UX-паттерн: нельзя отправить пустую форму.

---

## 12. Форма + список

Очень типичный паттерн Module 1:

```vue
<script setup lang="ts">
import { ref } from 'vue'

type Todo = {
  id: number
  text: string
}

const newTodo = ref('')
const todos = ref<Todo[]>([])

function addTodo() {
  if (!newTodo.value.trim()) return

  todos.value.push({
    id: Date.now(),
    text: newTodo.value.trim(),
  })

  newTodo.value = ''
}
</script>

<template>
  <form @submit.prevent="addTodo">
    <input v-model="newTodo" placeholder="New todo" />
    <button type="submit">Add</button>
  </form>

  <p v-if="todos.length === 0">No todos yet</p>

  <ul v-else>
    <li v-for="todo in todos" :key="todo.id">
      {{ todo.text }}
    </li>
  </ul>
</template>
```

Здесь уже соединены:

- form
- `v-model`
- `@submit.prevent`
- `v-if`
- `v-for`

---

## 13. Semantic and accessible forms

Даже на базовом уровне полезно писать формы правильно:

```vue
<form @submit.prevent="saveNote">
  <label for="note-title">Title</label>
  <input id="note-title" v-model="title" type="text" />

  <label for="note-body">Body</label>
  <textarea id="note-body" v-model="body" />

  <button type="submit">Save note</button>
</form>
```

Это помогает:

- accessibility
- читаемости
- поддержке проекта

---

## 14. Примеры для pet-project

### Todo List

- одно text field
- submit добавляет todo
- empty validation

### Notes App

- title + body
- submit сохраняет note
- textarea для текста

### Habit Tracker

- habit name input
- checkbox done / not done
- submit или click для добавления привычки

---

## 15. Частые ошибки

### Забыли `@submit.prevent`

```vue
<form @submit="save">
```

Страница может перезагрузиться.

### Дублируют логику и в `@click`, и в `@submit`

Лучше выбрать один основной путь. Для формы — обычно `@submit.prevent`.

### Не очищают input после submit

```vue
title.value = ''
```

Без этого UX feels broken.

### Делают validation только через disabled button

Лучше иметь и disabled button, и проверку в handler.

### Пишут слишком сложную form logic прямо в template

Validation и submit logic должны жить в `<script setup>`.

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Как связать input с state?
2. Зачем нужен `@submit.prevent`?
3. Как добавить todo через form submit?
4. Как показать ошибку пустого поля?
5. Чем textarea отличается от text input в usage?
6. Как form связана со списком через `v-for`?

---

## 17. Что почитать

### Официальное

- [Form Input Bindings · Vue.js](https://vuejs.org/guide/essentials/forms.html)
- [Form Input Bindings · Vue.js RU](https://ru.vuejs.org/guide/essentials/forms.html)
- [Event Handling · Vue.js](https://vuejs.org/guide/essentials/event-handling.html)

### Связанные материалы этого плана

- [11 · v-model](11-v-model.md)
- [06 · события](06-events.md)
- [10 · v-for](10-v-for.md)
- [08 · v-if](08-v-if.md)

---

## 18. Практическое мини-задание

Создай компонент `TodoForm.vue`:

### Требования

- одно поле `title`
- submit через form
- `@submit.prevent`
- validation: пустое поле нельзя отправить
- после submit todo добавляется в список
- input очищается

### Бонус

- disabled submit button, если поле пустое
- empty state `No todos yet`

---

## 19. Мини-конспект

- базовая form = `v-model` + `@submit.prevent` + handler
- input/textarea/checkbox/select связываются через `v-model`
- submit не должен перезагружать страницу
- простая validation на Module 1 делается в handler
- формы — центральный паттерн для первых pet-project

---

## 20. Что делать дальше

Теория **Module 1** теперь закрыта.

Следующий шаг — **практика Module 1**:

- `Todo List`
- `Notes App`
- `Habit Tracker`

Выбери один pet-project и собери его, используя всё изученное: SFC, interpolation, events, directives и forms.
