# Module 1 · Теория: директива `v-on`

Этот материал закрывает блок Module 1 про **`v-on`**: директиву для **обработки событий** во Vue.

> Если ты уже прошёл [06 · события](06-events.md), этот блок можно использовать как краткую шпаргалку именно по директиве `v-on`.

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

## 9. Мини-конспект

- `v-on:event="handler"`
- короткая форма: `@event="handler"`
- modifiers упрощают работу с DOM events
- подробнее см. [06 · события](06-events.md)

---

## 10. Практика

Сделай форму:

```vue
<form @submit.prevent="addTodo">
  <button type="submit">Add</button>
</form>
```

И кнопку удаления:

```vue
<button @click.stop="removeTodo(id)">Delete</button>
```
