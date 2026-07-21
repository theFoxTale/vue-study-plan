# Module 1 · Теория: директива `v-for`

Этот материал закрывает блок Module 1 про **`v-for`**: понять, **как рендерить списки** в Vue template.

Связанные материалы:

- [05 · интерполяция](05-interpolation.md)
- [08 · v-if](08-v-if.md)

---

## 1. Что такое `v-for`

**`v-for`** — директива для **рендеринга списков**.

```vue
<li v-for="todo in todos" :key="todo.id">
  {{ todo.text }}
</li>
```

Официально: [List Rendering · Vue.js](https://vuejs.org/guide/essentials/list.html)

---

## 2. Базовый пример

```vue
<script setup lang="ts">
const todos = [
  { id: 1, text: 'Learn Vue' },
  { id: 2, text: 'Build Todo app' },
]
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

## 3. Зачем нужен `:key`

`:key` помогает Vue отслеживать элементы списка.

```vue
<li v-for="todo in todos" :key="todo.id">
```

### Правило

- используй **уникальный и stable key**
- лучше `id`, а не index *(если список меняется)*

---

## 4. `v-for` с index

```vue
<li v-for="(todo, index) in todos" :key="todo.id">
  {{ index + 1 }}. {{ todo.text }}
</li>
```

---

## 5. `v-for` на компонентах

```vue
<TodoItem
  v-for="todo in todos"
  :key="todo.id"
  :text="todo.text"
  :done="todo.done"
/>
```

---

## 6. `v-for` и empty state

```vue
<p v-if="todos.length === 0">No todos yet</p>

<ul v-else>
  <li v-for="todo in todos" :key="todo.id">
    {{ todo.text }}
  </li>
</ul>
```

---

## 7. Частые ошибки

- забывать `:key`
- использовать index как key в изменяемых списках
- писать слишком много логики внутри `v-for` template

---

## 8. Что важно понять после этого блока

Проверь себя:

1. Зачем `:key` в списке?
2. Почему `id` лучше `index` при delete/reorder?
3. Как показать empty state вместе с `v-for`?
4. Можно ли `v-for` на компоненте?

---

## 9. Что почитать

### Официальное

- [List Rendering](https://vuejs.org/guide/essentials/list.html)
- [Maintaining State with `key`](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key)
- [RU · Рендеринг списков](https://ru.vuejs.org/guide/essentials/list.html)

### Playground / доп. ресурсы

- [Vue SFC Playground](https://play.vuejs.org/) — список + add/remove + `:key`
- [DEMOS.md](../DEMOS.md) · [RESOURCES.md](../RESOURCES.md)
- позже глубже: [Module 12 · key](../module-12/03-key.md)

---

## 10. Практическое мини-задание

Сделай список notes:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const notes = ref([
  { id: 1, title: 'Vue' },
  { id: 2, title: 'Vite' },
])
</script>

<template>
  <p v-if="notes.length === 0">No notes yet</p>
  <ul v-else>
    <li v-for="note in notes" :key="note.id">
      {{ note.title }}
    </li>
  </ul>
</template>
```

Задачи:

1. Добавь кнопку, которая `push` новую note с новым `id`
2. Добавь удаление первой note — ключи остаются корректными?
3. Намеренно поставь `:key="index"` и сравни поведение после delete
4. Воспроизведи в [play.vuejs.org](https://play.vuejs.org/)

---

## 11. Мини-конспект

- `v-for="item in items"`
- `:key` обязателен для списков
- отлично сочетается с компонентами и `v-if`

---

## 12. Что делать дальше

Следующий теоретический блок Module 1:

- [`v-model`](./11-v-model.md)
