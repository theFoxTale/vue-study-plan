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

## 8. Мини-конспект

- `v-for="item in items"`
- `:key` обязателен для списков
- отлично сочетается с компонентами и `v-if`

---

## 9. Практика

Сделай список notes:

```vue
<ul>
  <li v-for="note in notes" :key="note.id">
    {{ note.title }}
  </li>
</ul>
```

Добавь empty state через `v-if`.
