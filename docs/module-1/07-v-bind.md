# Module 1 · Теория: директива `v-bind`

Этот материал закрывает блок Module 1 про **`v-bind`**: понять, **как привязывать HTML-атрибуты к данным компонента**.

Связанные материалы:

- [08 · v-if](08-v-if.md)
- [07 · v-bind](07-v-bind.md)

---

## 1. Что такое `v-bind`

**`v-bind`** — директива Vue для **динамической привязки атрибутов**.

Короткая форма: **`:`**

```vue
<img :src="logoUrl" />
```

Полная форма:

```vue
<img v-bind:src="logoUrl" />
```

Официально: [Class and Style Bindings · Vue.js](https://vuejs.org/guide/essentials/class-and-style.html)

---

## 2. Зачем нужен `v-bind`

Mustache `{{ }}` работает только в содержимом элементов.

Для атрибутов нужен `v-bind`:

```vue
<!-- ❌ так нельзя -->
<img src="{{ logoUrl }}" />

<!-- ✅ так правильно -->
<img :src="logoUrl" />
```

---

## 3. Базовый пример

```vue
<script setup lang="ts">
const title = 'Todo List'
const inputId = 'todo-input'
const isDisabled = false
</script>

<template>
  <label :for="inputId">{{ title }}</label>
  <input :id="inputId" :disabled="isDisabled" />
</template>
```

---

## 4. Что можно биндить

| Атрибут | Пример |
|---------|--------|
| `src` | `:src="imageUrl"` |
| `href` | `:href="link"` |
| `id` | `:id="fieldId"` |
| `disabled` | `:disabled="isLoading"` |
| `placeholder` | `:placeholder="text"` |
| `class` | `:class="className"` |
| `style` | `:style="styleObject"` |

---

## 5. Boolean attributes

```vue
<script setup lang="ts">
const isDisabled = ref(true)
</script>

<template>
  <button :disabled="isDisabled">Save</button>
</template>
```

Если значение `false`, атрибут обычно не применяется.

---

## 6. Binding `class`

### Строка

```vue
<p :class="isActive ? 'active' : ''">Item</p>
```

### Объект

```vue
<p :class="{ active: isActive, done: isDone }">Item</p>
```

### Массив

```vue
<p :class="['card', { active: isActive }]">Item</p>
```

---

## 7. Binding props в компоненты

`v-bind` также передаёт данные в дочерние компоненты:

```vue
<TodoItem :text="todo.text" :done="todo.done" />
```

Короткая форма — просто `:` перед именем prop.

---

## 8. `v-bind` без аргумента

Можно передать объект сразу:

```vue
<TodoItem v-bind="todo" />
```

Эквивалентно передаче всех свойств объекта как props.

---

## 9. Частые ошибки

- использовать `{{ }}` в атрибутах
- забывать `:` перед prop name
- путать `:click` *(binding)* и `@click` *(event)*

---

## 10. Что важно понять после этого блока

Проверь себя:

1. Почему `src="{{ url }}"` не работает?
2. Чем `:disabled="false"` отличается от статичного `disabled`?
3. Как записать object-синтаксис для `:class`?
4. Что делает `v-bind="todo"` на компоненте?

---

## 11. Что почитать

### Официальное

- [Class and Style Bindings](https://vuejs.org/guide/essentials/class-and-style.html)
- [Template Syntax · v-bind](https://vuejs.org/guide/essentials/template-syntax.html#attribute-bindings)
- [RU · Class and Style](https://ru.vuejs.org/guide/essentials/class-and-style.html)

### Playground / доп. ресурсы

- [Vue SFC Playground](https://play.vuejs.org/) — кнопка с `:disabled` и `:class`
- [DEMOS.md](../DEMOS.md) · [RESOURCES.md](../RESOURCES.md)

---

## 12. Практическое мини-задание

Сделай кнопку:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isLoading = ref(false)
</script>

<template>
  <button :disabled="isLoading" :class="{ loading: isLoading }" @click="isLoading = !isLoading">
    Save
  </button>
</template>
```

Задачи:

1. Переключи `isLoading` и посмотри атрибуты в DevTools Elements
2. Добавь `:title="isLoading ? 'Busy' : 'Ready'"`
3. Открой тот же пример в [play.vuejs.org](https://play.vuejs.org/)

---

## 13. Мини-конспект

- `v-bind` = dynamic attribute binding
- короткая форма: `:attr="value"`
- mustache в атрибутах не работает
- через `:` передаются props в компоненты

---

## 14. Что делать дальше

Следующий теоретический блок Module 1:

- [`v-if`](./08-v-if.md)

