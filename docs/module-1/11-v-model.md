# Module 1 · Теория: директива `v-model`

Этот материал закрывает блок Module 1 про **`v-model`**: понять, **как делать two-way binding** между form controls и reactive state.

Связанные материалы:

- [06 · события](06-events.md)
- [07 · v-bind](07-v-bind.md)

---

## 1. Что такое `v-model`

**`v-model`** — директива для **двусторонней привязки данных**.

```vue
<input v-model="title" />
```

Когда пользователь меняет input, меняется `title`.  
Когда `title` меняется в code, input тоже обновляется.

Официально: [Form Input Bindings · Vue.js](https://vuejs.org/guide/essentials/forms.html)

---

## 2. Базовый пример

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('')
</script>

<template>
  <input v-model="title" placeholder="Todo title" />
  <p>You typed: {{ title }}</p>
</template>
```

---

## 3. Что делает `v-model` под капотом

Упрощённо:

```vue
<input
  :value="title"
  @input="title = ($event.target as HTMLInputElement).value"
/>
```

`v-model` — это синтаксический sugar для связки value + input event.

---

## 4. `v-model` на разных элементах

| Element | Что биндится |
|---------|-------------|
| `<input type="text">` | string |
| `<textarea>` | string |
| `<input type="checkbox">` | boolean |
| `<select>` | selected value |

---

## 5. Checkbox

```vue
<script setup lang="ts">
const isDone = ref(false)
</script>

<template>
  <label>
    <input v-model="isDone" type="checkbox" />
    Done
  </label>
</template>
```

---

## 6. Textarea

```vue
<textarea v-model="note" placeholder="Write a note..." />
```

---

## 7. `v-model` и forms

```vue
<form @submit.prevent="addTodo">
  <input v-model="newTodo" />
  <button type="submit">Add</button>
</form>
```

Это один из самых частых паттернов Module 1.

---

## 8. Modifiers

```vue
<input v-model.trim="name" />
<input v-model.number="age" />
<input v-model.lazy="description" />
```

| Modifier | Что делает |
|---------|-----------|
| `.trim` | убирает пробелы |
| `.number` | преобразует в number |
| `.lazy` | обновляет on change, а не on input |

---

## 9. Частые ошибки

- забывать, что для `ref` в script нужен `.value`, а в template — нет
- использовать `v-model` и `:value` одновременно на одном input
- не делать `@submit.prevent` на формах

---

## 10. Мини-конспект

- `v-model` = two-way binding
- идеален для input, textarea, checkbox, select
- часто используется вместе с `@submit.prevent`

---

## 11. Практика

Сделай mini form:

```vue
<input v-model.trim="title" />
<button @click="addTodo">Add</button>
```

После submit очищай `title`.
