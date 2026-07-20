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

## 7. Мини-конспект

- `v-show` = toggle visibility через CSS
- элемент остаётся в DOM
- для частых переключений часто удобнее, чем `v-if`

---

## 8. Практика

Сделай collapsible block:

```vue
<button @click="isOpen = !isOpen">Toggle</button>
<div v-show="isOpen">Hidden content</div>
```

Сравни поведение с `v-if` на таком же примере.
