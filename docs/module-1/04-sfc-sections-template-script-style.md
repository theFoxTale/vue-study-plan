# Module 1 · Теория: секции `<template>`, `<script setup>`, `<style>`

Этот материал закрывает четвёртый теоретический пункт `Module 1`: подробно разобрать **три основные секции `.vue`-файла** — что каждая из них делает, как они связаны между собой и как правильно использовать их на старте.

Связанные материалы:

- [03 · Single File Components](03-single-file-components.md)
- [02 · структура приложения на Vite](02-vite-project-structure.md)

---

## 1. Три секции одного компонента

Любой базовый Vue SFC состоит из трёх блоков:

```vue
<script setup lang="ts">
// logic
</script>

<template>
  <!-- markup -->
</template>

<style scoped>
/* styles */
</style>
```

| Секция | Отвечает за |
|--------|------------|
| `<script setup>` | данные, функции, imports, props, emits |
| `<template>` | HTML-разметку и UI |
| `<style>` | внешний вид компонента |

### Как они работают вместе

```text
<script setup>
  создаёт state и functions
        ↓
<template>
  использует их в UI
        ↓
<style>
  оформляет результат
```

---

# Часть A · `<script setup>`

## 2. Что такое `<script setup>`

`<script setup>` — рекомендуемый способ писать логику Vue-компонента в SFC.

Это compile-time sugar для Composition API.

Официально: [`<script setup>` · Vue.js](https://vuejs.org/api/sfc-script-setup.html)

### Базовый пример

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('Todo List')
const count = ref(0)

function increment() {
  count.value++
}
</script>
```

---

## 3. Главное правило `<script setup>`

**Всё, что объявлено на верхнем уровне, автоматически доступно в `<template>`.**

Не нужно:

- писать `return`;
- регистрировать methods отдельно;
- вручную экспортировать переменные для template.

### Пример

```vue
<script setup lang="ts">
const message = 'Hello'
</script>

<template>
  <p>{{ message }}</p>
</template>
```

---

## 4. Что обычно пишут в `<script setup>`

| Что | Пример |
|-----|--------|
| reactive state | `const count = ref(0)` |
| functions | `function save() {}` |
| imports | `import TodoItem from './TodoItem.vue'` |
| props | `defineProps<{ title: string }>()` |
| emits | `defineEmits<{ save: [] }>()` |
| composables | `const { user } = useUser()` |

### Для Module 1 достаточно

- `ref`
- functions
- imports компонентов
- простые константы

`defineProps` и `defineEmits` подробнее будут в Module 2–3.

---

## 5. Imports в `<script setup>`

Импортированные компоненты можно сразу использовать в template.

```vue
<script setup lang="ts">
import AppButton from './AppButton.vue'
</script>

<template>
  <AppButton />
</template>
```

Не нужен старый синтаксис:

```js
components: { AppButton }
```

---

## 6. Reactive state и template

Для реактивности на старте чаще всего используется `ref`.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)
</script>

<template>
  <button @click="isOpen = !isOpen">
    Toggle
  </button>

  <p v-if="isOpen">Panel is open</p>
</template>
```

### Важно

- в `<script setup>` пишешь `count.value`
- в `<template>` Vue unwrap-ит ref автоматически → просто `count`

---

## 7. Почему нужен `lang="ts"`

Для этого учебного плана используй:

```vue
<script setup lang="ts">
```

Это даёт:

- типизацию props позже;
- автодополнение в editor;
- меньше ошибок по мере роста проекта.

---

## 8. Что не стоит делать в `<script setup>` на старте

### Не пихать туда UI-разметку

Template живёт в `<template>`, не в script.

### Не делать слишком много логики в одном компоненте

Если script разрастается — выноси логику в composable позже.

### Не смешивать старый Options API без причины

Для новых компонентов используй только `<script setup lang="ts">`.

---

# Часть B · `<template>`

## 9. Что такое `<template>`

`<template>` описывает **структуру UI компонента**.

Это HTML-подобная разметка + Vue-синтаксис.

```vue
<template>
  <section class="card">
    <h2>{{ title }}</h2>
    <button @click="save">Save</button>
  </section>
</template>
```

---

## 10. Что можно использовать в `<template>`

| Возможность | Пример |
|------------|--------|
| HTML-теги | `<div>`, `<button>`, `<input>` |
| интерполяция | `{{ title }}` |
| директивы | `v-if`, `v-for`, `v-model`, `v-bind` |
| события | `@click`, `@submit` |
| компоненты | `<TodoItem />` |
| HTML-атрибуты | `class`, `id`, `disabled` |

---

## 11. Template видит script bindings

```vue
<script setup lang="ts">
import { ref } from 'vue'

const username = ref('Ann')
const isAdmin = ref(true)
</script>

<template>
  <p>{{ username }}</p>
  <p v-if="isAdmin">Admin panel</p>
</template>
```

Template не импортирует данные сам — он использует то, что объявлено в `<script setup>`.

---

## 12. Один корневой элемент

В большинстве случаев template должен иметь **один root element**.

Хорошо:

```vue
<template>
  <div class="wrapper">
    <h1>Title</h1>
    <p>Text</p>
  </div>
</template>
```

Плохо для новичка:

```vue
<template>
  <h1>Title</h1>
  <p>Text</p>
</template>
```

На практике Vue 3 уже более терпим к multiple root nodes, но на Module 1 лучше придерживаться одного wrapper-элемента — так проще читать и стилизовать.

---

## 13. HTML vs Vue template

Template похож на HTML, но это не просто HTML.

### Обычный HTML

```html
<button>Click</button>
```

### Vue template

```vue
<button @click="increment">{{ count }}</button>
```

Разница:

- `{{ }}` — reactive expressions
- `@click` — обработка событий
- `v-if`, `v-for`, `v-model` — директивы Vue

---

## 14. Использование компонентов в template

```vue
<script setup lang="ts">
import TodoItem from './TodoItem.vue'

const todos = [
  { id: 1, text: 'Learn template' },
  { id: 2, text: 'Build todo app' },
]
</script>

<template>
  <ul>
    <TodoItem
      v-for="todo in todos"
      :key="todo.id"
      :text="todo.text"
    />
  </ul>
</template>
```

### Важно

- компоненты пишутся в **PascalCase**
- props передаются через `:propName="value"`
- lists обычно рендерятся через `v-for`

---

## 15. Semantic HTML в template

Даже на Module 1 полезно писать осмысленную разметку:

```vue
<template>
  <main>
    <h1>Todo List</h1>
    <form @submit.prevent="addTodo">
      <label for="todo-input">New todo</label>
      <input id="todo-input" v-model="newTodo" />
      <button type="submit">Add</button>
    </form>
  </main>
</template>
```

Это помогает:

- accessibility;
- читаемости;
- SEO *(позже)*;
- структурированию UI.

---

## 16. Чего не стоит делать в `<template>`

### Не писать сложную бизнес-логику

Плохо:

```vue
<template>
  <p>{{ items.filter(i => i.done).map(i => i.title).join(', ') }}</p>
</template>
```

Лучше вынести в script/computed.

### Не дублировать большие куски разметки

Если блок повторяется — выдели компонент.

### Не использовать template как «склад всего UI приложения»

`App.vue` не должен превращаться в монолит на 300 строк без декомпозиции.

---

# Часть C · `<style>`

## 17. Что такое `<style>`

`<style>` содержит CSS для компонента.

```vue
<style scoped>
.card {
  padding: 16px;
  border-radius: 8px;
}
</style>
```

---

## 18. Зачем нужен `scoped`

`scoped` ограничивает CSS **только текущим компонентом**.

```vue
<style scoped>
button {
  background: #42b883;
  color: white;
}
</style>
```

Без `scoped` такой selector может случайно изменить **все** `button` на странице.

Официально: [SFC CSS Features · Vue.js](https://vuejs.org/api/sfc-css-features.html)

---

## 19. Как работает `scoped`

Vue добавляет уникальный attribute selector к элементам компонента.

Упрощённо:

```css
/* ты пишешь */
.card { padding: 16px; }

/* Vue превращает примерно в */
.card[data-v-abc123] { padding: 16px; }
```

Поэтому стиль не «утекает» в соседние компоненты.

---

## 20. Global vs scoped styles

| Подход | Когда использовать |
|--------|-------------------|
| `<style scoped>` | почти всегда в компонентах |
| `<style>` без scoped | редко, для truly global styles |
| отдельный `main.css` | base styles, reset, typography |

### Рекомендация для Module 1

- component styles → `<style scoped>`
- global base styles → `src/assets/main.css`

---

## 21. Несколько `<style>` блоков

В одном `.vue` может быть несколько style-блоков.

```vue
<style scoped>
.card {
  padding: 16px;
}
</style>

<style>
/* global override, use rarely */
body {
  margin: 0;
}
</style>
```

На старте лучше придерживаться **одного scoped block** на компонент.

---

## 22. CSS и class naming

Лучше использовать классы, а не голые tag selectors.

Хорошо:

```vue
<style scoped>
.primary-button {
  background: #42b883;
}
</style>
```

Менее предсказуемо:

```vue
<style scoped>
button {
  background: #42b883;
}
</style>
```

Классы:

- понятнее;
- безопаснее;
- проще переиспользовать.

---

## 23. Dynamic styles через `:class`

На Module 1 часто достаточно class binding:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isActive = ref(true)
</script>

<template>
  <button :class="{ active: isActive }">
    Toggle
  </button>
</template>

<style scoped>
.active {
  background: #42b883;
  color: white;
}
</style>
```

Inline styles тоже возможны, но для обучения удобнее начинать с классов.

---

# Часть D · Как секции работают вместе

## 24. Полный пример компонента

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('My Notes')
const draft = ref('')

function clearDraft() {
  draft.value = ''
}
</script>

<template>
  <section class="note-card">
    <h2>{{ title }}</h2>

    <textarea v-model="draft" placeholder="Write a note..." />

    <div class="actions">
      <button class="secondary" @click="clearDraft">Clear</button>
      <button class="primary">Save</button>
    </div>
  </section>
</template>

<style scoped>
.note-card {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.primary {
  background: #42b883;
  color: white;
}

.secondary {
  background: #f3f3f3;
}
</style>
```

### Разбор

- `<script setup>` — state + functions
- `<template>` — UI + events + `v-model`
- `<style scoped>` — локальные стили

---

## 25. Рекомендуемый порядок блоков

Порядок не обязателен, но удобный convention:

```vue
<script setup lang="ts"></script>
<template></template>
<style scoped></style>
```

Так проще читать файл сверху вниз:

1. logic
2. markup
3. styles

---

## 26. Частые ошибки по секциям

### `<script setup>`

- забывают `lang="ts"`
- используют `count.value` в template *(не нужно)*
- пишут слишком много логики прямо в компоненте

### `<template>`

- смешивают HTML и сложную JS-логику
- забывают `:key` в `v-for`
- используют `<div>` вместо semantic tags без необходимости

### `<style>`

- забывают `scoped`
- стилизуют через tag selectors вместо class
- делают один огромный global CSS без структуры

---

## 27. Что важно понять после этого блока

Проверь себя:

1. За что отвечает `<script setup>`?
2. Почему top-level bindings доступны в template?
3. Чем `<template>` отличается от обычного HTML?
4. Зачем нужен `scoped`?
5. Почему лучше использовать class selectors?
6. Как связаны все три секции в одном `.vue`?

---

## 28. Что почитать

### Официальное

- [`<script setup>` · Vue.js](https://vuejs.org/api/sfc-script-setup.html)
- [Template Syntax · Vue.js](https://vuejs.org/guide/essentials/template-syntax.html)
- [Template Syntax · Vue.js RU](https://ru.vuejs.org/guide/essentials/template-syntax.html)
- [SFC CSS Features · Vue.js](https://vuejs.org/api/sfc-css-features.html)
- [SFC Syntax Specification · Vue.js](https://vuejs.org/api/sfc-spec.html)

### Связанные материалы этого плана

- [03 · Single File Components](03-single-file-components.md)
- [Module 0 · Editor setup](../module-0/05-editor-setup-for-vue.md)

---

## 29. Практическое мини-задание

Создай компонент `ProfileCard.vue`:

### `<script setup lang="ts">`

- `name`
- `role`
- `isOnline`
- function `toggleOnline()`

### `<template>`

- заголовок с именем
- подзаголовок с role
- badge `Online` / `Offline`
- кнопка toggle

### `<style scoped>`

- card layout
- online/offline badge styles
- button styles

Подключи компонент в `App.vue` и проверь его в Vue DevTools.

---

## 30. Мини-конспект

- `<script setup lang="ts">` — логика компонента
- `<template>` — UI и Vue-директивы
- `<style scoped>` — локальные стили
- template использует bindings из script
- scoped защищает CSS от «утечки» в другие компоненты
- один `.vue` = logic + markup + styles в одном месте

---

## 31. Что делать дальше

Следующие теоретические блоки Module 1:

- интерполяция
- события
- директивы
- базовые формы

После этого уже можно уверенно собирать первый pet-project на простых SFC.
