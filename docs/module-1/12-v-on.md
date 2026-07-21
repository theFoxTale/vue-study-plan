# Module 1 · Теория: директива `v-on`

Этот материал закрывает блок Module 1 про **`v-on`**: директиву для **обработки событий** во Vue.

> Если ты уже прошёл [06 · события](06-events.md), этот блок можно использовать как краткую шпаргалку именно по директиве `v-on`.

Связанные материалы:

- [06 · события](06-events.md) *(полный урок)*
- [07 · v-bind](07-v-bind.md)
- [11 · v-model](11-v-model.md)

---

## 1. Что такое `v-on`

**`v-on`** — директива для прослушивания DOM-событий.

```vue
<button v-on:click="save">Save</button>
```

Короткая форма:

```vue
<button @click="save">Save</button>
```

Официально: [Event Handling · Vue.js](https://vuejs.org/guide/essentials/event-handling.html)

---

## 2. Зачем нужен `v-on`

Vue-template должен реагировать на действия пользователя:

- click
- submit
- input
- keydown

`v-on` связывает DOM event с handler function.

---

## 3. Базовый синтаксис

```vue
<button @click="increment">+1</button>
<form @submit.prevent="save">...</form>
<input @keydown.enter="submit" />
```

---

## 4. Method handler

```vue
<script setup lang="ts">
function removeTodo(id: number) {
  console.log(id)
}
</script>

<template>
  <button @click="removeTodo(1)">Delete</button>
</template>
```

---

## 5. Event modifiers

| Modifier | Назначение |
|---------|-----------|
| `.prevent` | preventDefault |
| `.stop` | stopPropagation |
| `.once` | один раз |
| `.self` | только если target — сам элемент |

Примеры:

```vue
<form @submit.prevent="save">
<button @click.stop="deleteItem">
<input @keydown.enter="addTodo">
```

---

## 6. `$event`

```vue
<button @click="handleClick($event)">Click</button>
```

---

## 7. `v-on` и custom events

На компонентах `@` слушает custom events:

```vue
<TodoItem @remove="removeTodo" />
```

---

## 8. `v-on` vs `v-bind`

| Директива | Для чего |
|----------|---------|
| `v-on` / `@` | события |
| `v-bind` / `:` | атрибуты и props |

```vue
<button :disabled="isLoading" @click="save">Save</button>
```

---

## 9. Что важно понять после этого блока

Проверь себя:

1. Чем `@click` отличается от `:click`?
2. Что делает `@submit.prevent`?
3. Когда нужен `$event`?
4. Как слушать custom event с дочернего компонента?

---

## 10. Что почитать

### Официальное

- [Event Handling](https://vuejs.org/guide/essentials/event-handling.html)
- [RU · Обработка событий](https://ru.vuejs.org/guide/essentials/event-handling.html)
- [Event Modifiers](https://vuejs.org/guide/essentials/event-handling.html#event-modifiers)

### В этом плане

- [06 · события](./06-events.md) — полный урок (этот файл — шпаргалка по директиве)

### Playground / доп. ресурсы

- [Vue SFC Playground](https://play.vuejs.org/) — `@click`, `.once`, `.prevent`
- [DEMOS.md](../DEMOS.md) · [RESOURCES.md](../RESOURCES.md)

---

## 11. Практическое мини-задание

Сделай форму и кнопку удаления:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('')
const items = ref<{ id: number; text: string }[]>([
  { id: 1, text: 'Sample' },
])

function addTodo() {
  if (!title.value.trim()) return
  items.value.push({ id: Date.now(), text: title.value.trim() })
  title.value = ''
}

function removeTodo(id: number) {
  items.value = items.value.filter(i => i.id !== id)
}
</script>

<template>
  <form @submit.prevent="addTodo">
    <input v-model="title" />
    <button type="submit">Add</button>
  </form>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
      <button type="button" @click.stop="removeTodo(item.id)">Delete</button>
    </li>
  </ul>
</template>
```

Задачи:

1. Без `.prevent` — убедись, что страница перезагружается
2. С `.stop` — клик Delete не всплывает на родителя (добавь `@click` на `<li>` с `console.log`)
3. Воспроизведи в [play.vuejs.org](https://play.vuejs.org/)

---

## 12. Мини-конспект

- `v-on:event="handler"`
- короткая форма: `@event="handler"`
- modifiers упрощают работу с DOM events
- подробнее см. [06 · события](06-events.md)

---

## 13. Что делать дальше

Следующий теоретический блок Module 1:

- [Базовые формы](./13-basic-forms.md)
