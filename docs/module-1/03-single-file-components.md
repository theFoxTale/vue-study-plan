# Module 1 · Теория: `Single File Components`

Этот материал закрывает третий теоретический пункт `Module 1`: понять, **что такое Single File Components (SFC)**, **зачем Vue использует `.vue`-файлы** и **из каких частей состоит один компонент**.

Связанные материалы:

- [01 · create-vue](01-create-vue.md)
- [02 · структура приложения на Vite](02-vite-project-structure.md)

---

## 1. Что такое Single File Component

**Single File Component (SFC)** — формат Vue-компонента в одном файле с расширением `.vue`.

В одном файле собраны:

- разметка;
- логика;
- стили.

Пример:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const greeting = ref('Hello Vue!')
</script>

<template>
  <p class="greeting">{{ greeting }}</p>
</template>

<style scoped>
.greeting {
  color: #42b883;
  font-weight: bold;
}
</style>
```

Официальная документация: [Single-File Components · Vue.js](https://vuejs.org/guide/scaling-up/sfc.html)

---

## 2. Зачем Vue использует SFC

Vue-компонент можно было бы разбивать на отдельные `.js`, `.html`, `.css` файлы. Но на практике это неудобно.

SFC решает несколько задач сразу:

- держит **template, logic и style рядом**;
- делает компонент **модульным и переносимым**;
- упрощает работу с IDE;
- позволяет компилятору Vue оптимизировать код;
- хорошо работает с Vite HMR.

### Главная идея

Один UI-блок = один `.vue`-файл.

---

## 3. Структура `.vue`-файла

Стандартный SFC состоит из трёх top-level блоков:

| Блок | Назначение |
|------|-----------|
| `<script setup>` | логика компонента |
| `<template>` | HTML-разметка |
| `<style>` | CSS-стили |

Пример mental model:

```text
MyComponent.vue
  ├─ script setup → data, functions, imports
  ├─ template     → UI
  └─ style        → appearance
```

### Важно

- `<template>` может быть единственным блоком, но на практике почти всегда есть и `<script setup>`
- порядок блоков не фиксирован
- для Module 1 основной стиль — `<script setup lang="ts">`

---

## 4. Как SFC вписывается в Vue-проект

Цепочка выглядит так:

```text
App.vue
  └─ imports TodoList.vue
       └─ imports TodoItem.vue
```

Пример:

```vue
<!-- App.vue -->
<script setup lang="ts">
import TodoList from './components/TodoList.vue'
</script>

<template>
  <TodoList />
</template>
```

### Что происходит при импорте

`.vue`-файл сам по себе браузер не понимает.

Его компилирует toolchain:

```text
.vue
  ↓
@vitejs/plugin-vue + @vue/compiler-sfc
  ↓
JavaScript + CSS
  ↓
browser
```

Поэтому SFC — это **формат для разработки**, а не «сырой браузерный формат».

---

## 5. `<script setup>` — современный способ писать логику

В этом учебном плане используется именно `<script setup lang="ts">`.

Пример:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>
```

### Почему это рекомендуемый стиль

- меньше boilerplate;
- top-level переменные сразу доступны в template;
- импортированные компоненты сразу можно использовать;
- хорошо работает с TypeScript;
- это стандарт для Vue 3 + Composition API.

Официально: [`<script setup>` · Vue.js](https://vuejs.org/api/sfc-script-setup.html)

### Важное правило

Всё, что объявлено на верхнем уровне `<script setup>`, автоматически доступно в `<template>`.

---

## 6. `<template>` — разметка компонента

`<template>` описывает, **что показывать**.

Пример:

```vue
<template>
  <section>
    <h1>{{ title }}</h1>
    <p v-if="isVisible">Content is visible</p>
  </section>
</template>
```

### Особенности

- должен иметь **один корневой элемент** *(в большинстве случаев)*;
- может использовать интерполяцию `{{ }}`;
- может использовать директивы Vue: `v-if`, `v-for`, `v-model`, `@click` и др.;
- видит переменные из `<script setup>`.

### Template — это не просто HTML

Vue добавляет поверх HTML:

- реактивные выражения;
- директивы;
- компонентный синтаксис.

---

## 7. `<style>` — стили компонента

`<style>` задаёт внешний вид компонента.

Пример:

```vue
<style scoped>
.card {
  padding: 16px;
  border-radius: 8px;
}
</style>
```

### `scoped`

Атрибут `scoped` ограничивает CSS **только текущим компонентом**.

Это помогает:

- не ломать стили других компонентов;
- писать более локальные и безопасные CSS-правила.

Пример:

```vue
<style scoped>
button {
  background: #42b883;
}
</style>
```

Эти стили не должны применяться ко всем `button` на странице — только к button внутри этого компонента.

---

## 8. Именование компонентов

Хорошие практики:

| Что | Рекомендация |
|-----|-------------|
| имя файла | `PascalCase.vue` |
| использование в template | `<TodoItem />` |
| маленькие локальные компоненты | тоже лучше PascalCase |

Примеры:

```text
TodoList.vue
TodoItem.vue
AppButton.vue
UserCard.vue
```

### Почему PascalCase

- проще отличать компоненты от обычных HTML-тегов;
- так рекомендует Vue;
- IDE лучше подсказывает компоненты.

---

## 9. Минимальный учебный компонент

Пример простого SFC для Module 1:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('My first SFC')
const isDone = ref(false)
</script>

<template>
  <article class="card">
    <h2>{{ title }}</h2>
    <label>
      <input v-model="isDone" type="checkbox" />
      Done
    </label>
    <p v-if="isDone">Task completed</p>
  </article>
</template>

<style scoped>
.card {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
</style>
```

Здесь уже есть всё базовое:

- reactive state;
- template;
- event/input through `v-model`;
- conditional rendering through `v-if`;
- scoped styles.

---

## 10. Как один SFC использует другой

Компоненты собираются как конструктор.

```vue
<!-- TodoList.vue -->
<script setup lang="ts">
import TodoItem from './TodoItem.vue'

const todos = [
  { id: 1, text: 'Learn SFC' },
  { id: 2, text: 'Build Todo app' },
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

```vue
<!-- TodoItem.vue -->
<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<template>
  <li>{{ text }}</li>
</template>
```

### Главная идея

- родитель импортирует ребёнка;
- родитель передаёт данные;
- ребёнок отображает UI.

Подробнее про props и emits — в Module 2–3.

---

## 11. Преимущества SFC на практике

### 1. Локальность

Не нужно прыгать между тремя файлами, чтобы понять один UI-блок.

### 2. Переиспользование

Один `.vue`-файл можно импортировать где угодно.

### 3. Изоляция стилей

`scoped` помогает не устраивать CSS-хаос.

### 4. Хорошая поддержка tooling

Vue - Official extension понимает:

- template expressions;
- props;
- imports;
- TypeScript inside SFC.

### 5. Hot reload

При изменении `.vue` Vite обновляет компонент без полной перезагрузки страницы.

---

## 12. SFC vs «обычный JS-компонент»

Иногда Vue-комponent можно описать и в `.ts` / `.js`, но для UI это редко удобно.

| Подход | Когда уместен |
|--------|--------------|
| `.vue` SFC | почти всегда для UI |
| `.ts` composable | для переиспользуемой логики |
| `.ts` utility | для чистых функций |

Правило для этого плана:

- **UI → `.vue`**
- **логика без UI → composable**

---

## 13. Частые ошибки новичков

### Пишут логику прямо в template

Плохо:

```vue
<template>
  <button @click="count = count + 1">{{ count }}</button>
</template>
```

Лучше вынести в `<script setup>`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}
</script>
```

### Забывают `lang="ts"`

Для этого плана лучше сразу писать:

```vue
<script setup lang="ts">
```

### Путают HTML и Vue template

В template нельзя просто писать произвольный JavaScript. Нужны Vue-выражения и директивы.

### Делают слишком большие компоненты

Если `.vue`-файл разросся и стал трудно читаться — это сигнал разбить его на smaller components.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Что такое SFC?
2. Из каких блоков состоит `.vue`-файл?
3. Зачем используется `<script setup>`?
4. Что делает `<template>`?
5. Зачем нужен `scoped` в `<style>`?
6. Почему `.vue` нужно компилировать через Vite?
7. Как один компонент подключает другой?

---

## 15. Что почитать

### Официальное

- [Single-File Components · Vue.js](https://vuejs.org/guide/scaling-up/sfc.html)
- [Single-File Components · Vue.js RU](https://ru.vuejs.org/guide/scaling-up/sfc.html)
- [`<script setup>` · Vue.js](https://vuejs.org/api/sfc-script-setup.html)
- [SFC Syntax Specification](https://github.com/vuejs/language-tools/wiki/SFC-syntax)

### Связанные материалы этого плана

- [02 · структура приложения на Vite](02-vite-project-structure.md)
- [Module 0 · Editor setup](../module-0/05-editor-setup-for-vue.md)

---

## 16. Что посмотреть

### Рекомендуется

1. **Vue 3 фундаментальный курс · Ulbi TV**  
   [YouTube](https://www.youtube.com/watch?v=XzLuMtDelGk)  
   В начале курса хорошо показывают, как устроены `.vue`-компоненты.

2. **Getting started with Vue · MDN**  
   [MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/Vue_getting_started)  
   Полезный обзор SFC и роли `App.vue`.

### Дополнительно

3. **Vue SFC Guide RU**  
   [ru.vuejs.org/guide/scaling-up/sfc.html](https://ru.vuejs.org/guide/scaling-up/sfc.html)

---

## 17. Практическое мини-задание

1. Создай файл `src/components/WelcomeCard.vue`
2. Добавь:
   - `<script setup lang="ts">`
   - `<template>`
   - `<style scoped>`
3. Выведи заголовок и checkbox `Done`
4. Подключи компонент в `App.vue`
5. Проверь компонент в Vue DevTools

Если компонент рендерится, обновляется и виден в component tree — блок усвоен.

---

## 18. Мини-конспект

- SFC = один Vue-компонент в одном `.vue`-файле.
- Стандартные блоки: `<script setup>`, `<template>`, `<style>`.
- `<script setup lang="ts">` — основной стиль для этого плана.
- `<template>` описывает UI.
- `<style scoped>` изолирует CSS компонента.
- SFC компилируются Vite и используются как обычные модули.

---

## 19. Что делать дальше

Следующие теоретические блоки Module 1:

- секции `<template>`, `<script setup>`, `<style>` — более детально
- интерполяция
- события
- директивы
- базовые формы

Практически после этого материала уже можно начинать свой первый pet-project: `Todo List`, `Notes App` или `Habit Tracker`.
