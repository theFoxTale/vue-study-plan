# Module 1 · Теория: события

Этот материал закрывает шестой теоретический пункт `Module 1`: понять, **как Vue обрабатывает пользовательские события**, **как использовать `@click`, `@submit` и другие handlers**, и **зачем нужны event modifiers**.

Связанные материалы:

- [05 · интерполяция](05-interpolation.md)
- [04 · секции template, script setup, style](04-sfc-sections-template-script-style.md)

---

## 1. Что такое события во Vue

**Событие** — это действие пользователя или браузера:

- click
- submit
- input
- keydown
- mouseenter

Vue позволяет «слушать» такие события прямо в template и запускать JavaScript-код, когда они происходят.

Официально: [Event Handling · Vue.js](https://vuejs.org/guide/essentials/event-handling.html)

---

## 2. Базовый синтаксис: `v-on` и `@`

Vue использует директиву `v-on` для обработки событий.

Полная форма:

```vue
<button v-on:click="save">Save</button>
```

Короткая форма *(используй её почти всегда)*:

```vue
<button @click="save">Save</button>
```

### Главное правило

```text
@eventName="handler"
```

---

## 3. Самый простой пример

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

### Что происходит

1. Пользователь нажимает кнопку
2. Vue ловит событие `click`
3. Вызывается функция `increment`
4. Меняется `count`
5. UI обновляется через интерполяцию

---

## 4. Inline handler vs method handler

### Method handler

```vue
<button @click="increment">+1</button>
```

Вызывается функция из `<script setup>`.

### Inline handler

```vue
<button @click="count++">+1</button>
```

Код пишется прямо в template.

### Что лучше на Module 1

- для простых действий inline допустим;
- для читаемости лучше выносить логику в function.

Хорошо:

```vue
<script setup lang="ts">
function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">+1</button>
</template>
```

---

## 5. Передача аргументов в handler

```vue
<script setup lang="ts">
function removeTodo(id: number) {
  console.log('Remove todo', id)
}
</script>

<template>
  <button @click="removeTodo(1)">Delete</button>
</template>
```

Vue позволяет вызывать handler с аргументами прямо из template.

---

## 6. Объект события `$event`

Иногда нужен доступ к native event object.

```vue
<script setup lang="ts">
function handleClick(event: MouseEvent) {
  console.log(event.target)
}
</script>

<template>
  <button @click="handleClick($event)">Click me</button>
</template>
```

### Когда это нужно

- узнать, на какой элемент кликнули;
- прочитать координаты;
- остановить поведение браузера вручную.

На Module 1 чаще хватает modifiers вместо ручной работы с `$event`.

---

## 7. Самые частые события на старте

| Событие | Где используется |
|--------|------------------|
| `@click` | кнопки, карточки, toggle |
| `@submit` | формы |
| `@input` | input fields *(часто через `v-model`)* |
| `@keydown.enter` | submit по Enter |
| `@change` | checkbox, select |

---

## 8. `@click`

```vue
<script setup lang="ts">
const isOpen = ref(false)

function togglePanel() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <button @click="togglePanel">
    {{ isOpen ? 'Hide' : 'Show' }}
  </button>
</template>
```

Используй `@click`, когда пользователь должен что-то переключить, удалить, добавить или открыть.

---

## 9. `@submit` и формы

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('')

function addTodo() {
  console.log('Add todo:', title.value)
  title.value = ''
}
</script>

<template>
  <form @submit.prevent="addTodo">
    <input v-model="title" />
    <button type="submit">Add</button>
  </form>
</template>
```

### Почему `.prevent`

По умолчанию submit формы перезагружает страницу.

`.prevent` эквивалентен:

```js
event.preventDefault()
```

Для SPA это почти всегда нужно.

---

## 10. Event modifiers

**Event modifiers** — специальные суффиксы после точки.

```vue
@click.stop
@submit.prevent
@click.once
```

Они помогают управлять поведением события без лишнего boilerplate в handler.

---

## 11. Основные modifiers для Module 1

| Modifier | Что делает |
|---------|-----------|
| `.prevent` | `event.preventDefault()` |
| `.stop` | `event.stopPropagation()` |
| `.once` | handler сработает один раз |
| `.self` | только если event target — сам элемент |

### `.prevent`

```vue
<form @submit.prevent="save">
```

### `.stop`

```vue
<div @click="onParentClick">
  <button @click.stop="onButtonClick">Click</button>
</div>
```

Клик по кнопке не «всплывёт» к родителю.

### `.once`

```vue
<button @click.once="initAnalytics">Start</button>
```

### `.self`

```vue
<div @click.self="selectCard">
  <button>Action</button>
</div>
```

Handler сработает только при клике по самому `div`, а не по кнопке внутри.

---

## 12. Можно chain-ить modifiers

```vue
<form @submit.prevent.stop="save">
```

Порядок modifiers **важен**.

---

## 13. Keyboard events

Vue позволяет слушать нажатия клавиш.

```vue
<input @keydown.enter="submitSearch" />
```

Примеры:

```vue
<input @keyup.esc="closeModal" />
<input @keydown.enter.prevent="addTodo" />
```

На Module 1 чаще всего нужен `.enter`.

---

## 14. События и реактивность

События обычно меняют state, а state обновляет UI.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const todos = ref<string[]>([])

function addTodo(text: string) {
  todos.value.push(text)
}
</script>

<template>
  <button @click="addTodo('Learn events')">Add</button>
  <ul>
    <li v-for="todo in todos" :key="todo">{{ todo }}</li>
  </ul>
</template>
```

### Цепочка

```text
user action
   ↓
event handler
   ↓
state change
   ↓
template update
```

---

## 15. Custom events — коротко

Помимо DOM-событий, Vue-компоненты могут **emit-ить свои события**.

Родитель:

```vue
<TodoItem @remove="removeTodo" />
```

Ребёнок:

```vue
<script setup lang="ts">
const emit = defineEmits<{
  remove: []
}>()
</script>

<template>
  <button @click="emit('remove')">Delete</button>
</template>
```

Подробно custom events будут в Module 2–3. На Module 1 достаточно понимать, что `@click` на DOM и `@remove` на component — одна идея: **слушать событие и реагировать**.

---

## 16. Примеры из учебных проектов

### Todo List

```vue
<button @click="addTodo">Add</button>
<button @click="removeTodo(id)">Delete</button>
```

### Notes App

```vue
<form @submit.prevent="saveNote">
  <button type="submit">Save note</button>
</form>
```

### Habit Tracker

```vue
<button @click="toggleHabit(habit.id)">
  {{ habit.done ? 'Undo' : 'Done' }}
</button>
```

---

## 17. Частые ошибки

### Забывают `.prevent` на submit

Плохо:

```vue
<form @submit="save">
```

Страница может перезагрузиться.

Хорошо:

```vue
<form @submit.prevent="save">
```

### Пишут `@click="increment()"` без необходимости

Оба варианта работают:

```vue
<button @click="increment">+</button>
<button @click="increment()">+</button>
```

Но для простого вызова без аргументов лучше:

```vue
<button @click="increment">+</button>
```

### Слишком много логики прямо в template

Плохо:

```vue
<button @click="items = items.filter(i => i.id !== id).map(i => ({ ...i, updated: true }))">
  Delete
</button>
```

Лучше вынести в function.

### Путают `@click` и `:click`

- `@click` — событие
- `:click` — attribute binding *(обычно не то, что нужно)*

---

## 18. Когда использовать события

Используй events, когда нужно:

- обработать click;
- отправить form;
- удалить элемент;
- переключить состояние;
- отреагировать на keyboard input.

Не нужно вручную вешать `addEventListener` — Vue делает это через template syntax.

---

## 19. Что важно понять после этого блока

Проверь себя:

1. Чем `@click` отличается от `v-on:click`?
2. Зачем нужен `.prevent` на submit?
3. Что делает `.stop`?
4. Как передать аргумент в handler?
5. Что такое `$event`?
6. Как события связаны с реактивностью?

---

## 20. Что почитать

### Официальное

- [Event Handling · Vue.js](https://vuejs.org/guide/essentials/event-handling.html)
- [Event Handling · Vue.js RU](https://ru.vuejs.org/guide/essentials/event-handling.html)
- [v-on · API](https://vuejs.org/api/built-in-directives.html#v-on)

### Связанные материалы этого плана

- [05 · интерполяция](05-interpolation.md)
- [04 · секции SFC](04-sfc-sections-template-script-style.md)

---

## 21. Практическое мини-задание

Создай компонент `CounterPanel.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}

function decrement() {
  count.value--
}

function reset(event: MouseEvent) {
  console.log(event.type)
  count.value = 0
}
</script>

<template>
  <section>
    <p>Count: {{ count }}</p>
    <button @click="increment">+1</button>
    <button @click="decrement">-1</button>
    <button @click.once="reset($event)">Reset once</button>
  </section>
</template>
```

Задачи:

1. Проверь работу всех кнопок
2. Посмотри, как `.once` срабатывает только один раз
3. Открой Vue DevTools и проследи изменение state после click

---

## 22. Мини-конспект

- `@event="handler"` — основной способ слушать события во Vue
- `@` — короткая форма `v-on:`
- handler может быть function или inline expression
- `.prevent`, `.stop`, `.once`, `.self` — базовые modifiers
- события обычно меняют state, а state обновляет UI

---

## 23. Что делать дальше

Следующий теоретический блок Module 1:

- **директивы**: `v-bind`, `v-if`, `v-show`, `v-for`, `v-model`, `v-on`

После событий логично собрать все основные директивы в один практический обзор.
