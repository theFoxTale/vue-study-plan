# Module 1 · Теория: директива `v-show`

Этот материал закрывает блок Module 1 про **`v-show`**: понять, **как скрывать элементы через CSS**, не удаляя их из DOM.

Связанные материалы:

- [08 · v-if](08-v-if.md)

---

## 1. Что такое `v-show`

**`v-show`** — директива для **условного отображения через CSS**.

```vue
<p v-show="isVisible">Hello</p>
```

Если `false`, элемент остаётся в DOM, но получает `display: none`.

Официально: [Conditional Rendering · v-show](https://vuejs.org/guide/essentials/conditional.html#v-show)

---

## 2. Базовый пример

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(true)
</script>

<template>
  <section v-show="isOpen">
    Panel content
  </section>
</template>
```

---

## 3. `v-if` vs `v-show`

| | `v-if` | `v-show` |
|--|--------|----------|
| DOM | создаёт / удаляет элемент | элемент остаётся |
| Переключение | дороже при частых toggle | дешевле при частых toggle |
| Начальный render | не рендерит, если false | рендерит, но скрывает |
| Когда использовать | редкие переключения, разные ветки UI | частые show/hide |

---

## 4. Когда использовать `v-show`

- toggle panel
- показать/скрыть sidebar
- временно скрыть блок без уничтожения DOM

---

## 5. Когда лучше `v-if`

- empty state
- loading/error blocks
- компонент не нужен вообще, пока условие false

---

## 6. Частые ошибки

- использовать `v-show` там, где нужен `v-else`
- думать, что `v-show` удаляет элемент из DOM
- прятать через `v-show` тяжёлые компоненты, которые лучше вообще не монтировать

---

## 7. Что важно понять после этого блока

Проверь себя:

1. Остаётся ли элемент в DOM при `v-show="false"`?
2. Когда `v-show` выгоднее `v-if`?
3. Почему у `v-show` нет `v-else`?
4. Стоит ли `v-show` на тяжёлом chart-компоненте, который почти никогда не открывают?

---

## 8. Что почитать

### Официальное

- [Conditional Rendering · v-show](https://vuejs.org/guide/essentials/conditional.html#v-show)
- [RU · v-show](https://ru.vuejs.org/guide/essentials/conditional.html#v-show)

### Playground / доп. ресурсы

- [Vue SFC Playground](https://play.vuejs.org/) — сравни `v-if` vs `v-show` на одном toggle
- [DEMOS.md](../DEMOS.md) · [RESOURCES.md](../RESOURCES.md)

---

## 9. Практическое мини-задание

Сделай collapsible block:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(true)
</script>

<template>
  <button type="button" @click="isOpen = !isOpen">Toggle</button>
  <div v-show="isOpen">Hidden content</div>
</template>
```

Задачи:

1. В Elements посмотри `display: none` при закрытии
2. Замени на `v-if` и сравни: узел исчезает из DOM
3. Тот же эксперимент — в [play.vuejs.org](https://play.vuejs.org/)

---

## 10. Мини-конспект

- `v-show` = toggle visibility через CSS
- элемент остаётся в DOM
- для частых переключений часто удобнее, чем `v-if`

---

## 11. Что делать дальше

Следующий теоретический блок Module 1:

- [`v-for`](./10-v-for.md)
