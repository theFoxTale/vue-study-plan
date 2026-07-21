# Module 1 · Теория: директива `v-if`

Этот материал закрывает блок Module 1 про **`v-if`**: понять, **как условно показывать или скрывать элементы в template**.

Связанные материалы:

- [07 · v-bind](07-v-bind.md)
- [09 · v-show](09-v-show.md)

---

## 1. Что такое `v-if`

**`v-if`** — директива для **условного рендеринга**.

Если условие `true` — элемент создаётся в DOM.  
Если `false` — элемент **не рендерится**.

```vue
<p v-if="isVisible">Hello</p>
```

Официально: [Conditional Rendering · Vue.js](https://vuejs.org/guide/essentials/conditional.html)

---

## 2. Базовый пример

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isLoggedIn = ref(false)
</script>

<template>
  <p v-if="isLoggedIn">Welcome back</p>
  <p v-else>Please log in</p>
</template>
```

---

## 3. `v-else` и `v-else-if`

```vue
<template>
  <p v-if="status === 'loading'">Loading...</p>
  <p v-else-if="status === 'error'">Something went wrong</p>
  <p v-else>Content loaded</p>
</template>
```

---

## 4. `v-if` на компонентах

```vue
<AdminPanel v-if="user.isAdmin" />
<UserPanel v-else />
```

Полезно, когда нужно показывать разные блоки UI.

---

## 5. `v-if` vs простая интерполяция

Иногда новички пишут:

```vue
<p>{{ isVisible ? 'Shown' : '' }}</p>
```

Но `v-if` лучше, когда нужно показывать или скрывать **целый блок разметки**, а не только текст.

---

## 6. Когда использовать `v-if`

- показать/скрыть panel
- empty state
- loading/error/success blocks
- admin-only UI
- modal content

---

## 7. Частые ошибки

- ставить `v-else` не сразу после `v-if` / `v-else-if`
- использовать `v-if` и `v-for` на одном элементе *(лучше избегать на старте)*
- ожидать, что элемент просто скрыт CSS — при `false` его нет в DOM

---

## 8. Что важно понять после этого блока

Проверь себя:

1. Что происходит с элементом в DOM при `v-if="false"`?
2. Можно ли поставить `v-else` через другой элемент после `v-if`?
3. Когда лучше `v-if`, а когда достаточно ternary в `{{ }}`?
4. Чем `v-if` отличается от `v-show` *(следующий урок)*?

---

## 9. Что почитать

### Официальное

- [Conditional Rendering](https://vuejs.org/guide/essentials/conditional.html)
- [RU · Условный рендеринг](https://ru.vuejs.org/guide/essentials/conditional.html)

### Playground / доп. ресурсы

- [Vue SFC Playground](https://play.vuejs.org/) — loading / error / success через `v-if` / `v-else-if` / `v-else`
- [DEMOS.md](../DEMOS.md) · [RESOURCES.md](../RESOURCES.md)

---

## 10. Практическое мини-задание

Сделай todo snippet:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const todos = ref<{ id: number; text: string }[]>([])
</script>

<template>
  <p v-if="todos.length === 0">No todos yet</p>
  <ul v-else>
    <li v-for="todo in todos" :key="todo.id">{{ todo.text }}</li>
  </ul>
</template>
```

Задачи:

1. Временно добавь 1–2 todo в `ref([...])` и сравни DOM
2. Добавь ветку `v-else-if` для «слишком много todos» (`length > 5`)
3. Тот же пример — в [play.vuejs.org](https://play.vuejs.org/)

---

## 11. Мини-конспект

- `v-if` добавляет или удаляет элемент из DOM
- есть `v-else` и `v-else-if`
- хорошо подходит для переключения блоков UI

---

## 12. Что делать дальше

Следующий теоретический блок Module 1:

- [`v-show`](./09-v-show.md)
