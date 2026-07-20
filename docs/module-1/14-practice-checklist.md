# Module 1 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 1**: собрать первое Vue 3 приложение на базовых директивах, SFC и простых формах.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 0 должен быть закрыт

- [ ] Node.js установлен
- [ ] editor настроен для `.vue`
- [ ] Vue Devtools работает
- [ ] есть рабочий Vue 3 проект или готовность создать новый

### Прочитай теорию Module 1

- [01 · create-vue](01-create-vue.md)
- [03 · Single File Components](03-single-file-components.md)
- [04 · секции SFC](04-sfc-sections-template-script-style.md)
- [05 · интерполяция](05-interpolation.md)
- [06 · события](06-events.md)
- [07 · v-bind](07-v-bind.md)
- [08 · v-if](08-v-if.md)
- [09 · v-show](09-v-show.md)
- [10 · v-for](10-v-for.md)
- [11 · v-model](11-v-model.md)
- [13 · basic forms](13-basic-forms.md)

---

## Шаг 1. Выбрать pet-project

Для Module 1 выбери **один** проект:

| Проект | Сложность | Что тренирует |
|--------|-----------|---------------|
| **Todo List** | easy | form, list, delete, done state |
| **Notes App** | easy | form, list, edit/delete |
| **Habit Tracker** | easy | form, list, checkbox, streak *(optional)* |

### Рекомендация

Если сомневаешься — начни с **Todo List**.

### Checklist

- [ ] выбран один pet-project
- [ ] понятен MVP scope проекта

---

## Шаг 2. Определить MVP

Не делай слишком большой проект. Для Module 1 достаточно:

### Todo List MVP

- добавить todo
- показать список
- удалить todo
- отметить done / not done
- empty state

### Notes App MVP

- добавить note
- показать список notes
- удалить note
- empty state

### Habit Tracker MVP

- добавить habit
- показать список habits
- отметить выполнение за сегодня
- empty state

### Checklist

- [ ] MVP записан в 4-6 пунктов
- [ ] нет лишних фич вроде auth, API, router

---

## Шаг 3. Создать или переиспользовать проект

### Вариант A — новый проект

```bash
npm create vue@latest
```

Рекомендуемые опции:

- TypeScript → Yes
- Router → No
- Pinia → No
- ESLint → Yes
- Prettier → Yes

```bash
cd <project-name>
npm install
npm run dev
```

### Вариант B — использовать проект из Module 0

Если у тебя уже есть рабочий setup-проект, можно продолжить в нём.

### Checklist

- [ ] проект запускается через `npm run dev`
- [ ] открывается в браузере
- [ ] Vue Devtools видит приложение

---

## Шаг 4. Подготовить структуру компонентов

Минимальная структура для Module 1:

```text
src/
  components/
    AppHeader.vue
    TodoForm.vue
    TodoList.vue
    TodoItem.vue
  App.vue
  main.ts
```

Для Notes / Habits просто переименуй компоненты логически.

### Checklist

- [ ] создана папка `src/components`
- [ ] `App.vue` не перегружен всей логикой
- [ ] компоненты названы в `PascalCase`

---

## Шаг 5. Сделать базовый layout в `App.vue`

```vue
<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import TodoForm from './components/TodoForm.vue'
import TodoList from './components/TodoList.vue'
</script>

<template>
  <main class="app">
    <AppHeader />
    <TodoForm />
    <TodoList />
  </main>
</template>

<style scoped>
.app {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px;
}
</style>
```

### Checklist

- [ ] `App.vue` использует `<script setup lang="ts">`
- [ ] есть один root layout
- [ ] компоненты импортируются и используются

---

## Шаг 6. Реализовать интерполяцию

В любом компоненте выведи данные через `{{ }}`.

Пример:

```vue
<h1>{{ title }}</h1>
<p>{{ todos.length }} items</p>
```

### Checklist

- [ ] используется mustache interpolation
- [ ] UI обновляется при изменении данных

---

## Шаг 7. Реализовать форму добавления

Используй:

- `<form @submit.prevent="...">`
- `v-model`
- validation пустого поля

Пример:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('')

const emit = defineEmits<{
  add: [title: string]
}>()

function submitForm() {
  if (!title.value.trim()) return
  emit('add', title.value.trim())
  title.value = ''
}
</script>

<template>
  <form @submit.prevent="submitForm">
    <input v-model.trim="title" placeholder="New todo" />
    <button type="submit" :disabled="!title.trim()">Add</button>
  </form>
</template>
```

> `defineEmits` здесь опционален на самом первом проходе. Можно держать state в `App.vue`, если так проще.

### Checklist

- [ ] есть form submit
- [ ] используется `@submit.prevent`
- [ ] используется `v-model`
- [ ] пустое значение не добавляется

---

## Шаг 8. Реализовать список через `v-for`

```vue
<ul>
  <li v-for="todo in todos" :key="todo.id">
    {{ todo.text }}
  </li>
</ul>
```

### Checklist

- [ ] используется `v-for`
- [ ] у каждого item есть `:key`
- [ ] список обновляется после добавления

---

## Шаг 9. Добавить empty state через `v-if`

```vue
<p v-if="todos.length === 0">No todos yet</p>

<ul v-else>
  <li v-for="todo in todos" :key="todo.id">
    {{ todo.text }}
  </li>
</ul>
```

### Checklist

- [ ] используется `v-if` или `v-else`
- [ ] empty state показывается, когда список пуст

---

## Шаг 10. Добавить действия через события

Минимум два действия:

- delete
- toggle done *(или аналог)*

Примеры:

```vue
<button @click="removeTodo(todo.id)">Delete</button>
<input v-model="todo.done" type="checkbox" />
```

### Checklist

- [ ] используются `@click` или другие event handlers
- [ ] delete работает
- [ ] toggle / update state работает

---

## Шаг 11. Использовать `v-bind`

Примеры:

```vue
<button :disabled="!title.trim()">Add</button>
<li :class="{ done: todo.done }">{{ todo.text }}</li>
```

### Checklist

- [ ] используется `:attr` binding
- [ ] `:class` или `:disabled` применяются по state

---

## Шаг 12. Добавить `v-show` *(optional, but recommended)*

Используй `v-show` хотя бы в одном месте, чтобы понять разницу с `v-if`.

Пример:

```vue
<p v-show="todos.length > 0">Total: {{ todos.length }}</p>
```

### Checklist

- [ ] `v-show` использован хотя бы один раз
- [ ] понятна разница между `v-if` и `v-show`

---

## Шаг 13. Проверить поток данных

Открой Vue DevTools и проверь:

1. где хранится state
2. как form меняет state
3. как list rerender-ится
4. что происходит после delete / toggle

### Checklist

- [ ] могу объяснить, где живут данные
- [ ] могу объяснить путь `input → state → list`
- [ ] DevTools показывает component tree

---

## Шаг 14. Привести UI в порядок

Минимальный UX:

- заголовок приложения
- понятная form
- readable list
- empty state
- базовые отступы и spacing

Не нужен pixel-perfect design. Нужна **читаемость**.

### Checklist

- [ ] приложение выглядит аккуратно
- [ ] form и list понятны без объяснений
- [ ] используется `<style scoped>`

---

## Шаг 15. Прогнать lint и build

```bash
npm run lint
npm run build
```

### Checklist

- [ ] lint проходит
- [ ] build проходит
- [ ] приложение не ломается после build

---

## Шаг 16. Сделать финальную самопроверку

Ответь без подсказок:

1. Где entry point приложения?
2. Что делает `App.vue`?
3. Как данные попадают из form в list?
4. Зачем нужен `:key` в `v-for`?
5. Чем `@click` отличается от `:disabled`?
6. Почему submit form нужно делать через `.prevent`?

### Checklist

- [ ] могу объяснить поток данных
- [ ] могу объяснить роль каждого базового компонента
- [ ] могу объяснить, зачем использованы директивы

---

## Финальный checklist Module 1

Module 1 можно считать завершённым, если:

### Проект

- [ ] есть 1 законченное приложение
- [ ] проект запускается без ошибок
- [ ] UI решает простую пользовательскую задачу

### Технические требования

- [ ] компоненты написаны через `<script setup lang="ts">`
- [ ] используется interpolation
- [ ] используется `v-if`
- [ ] используется `v-for`
- [ ] используется `v-model`
- [ ] используются event handlers
- [ ] используется `v-bind`
- [ ] есть базовая form

### Понимание

- [ ] понимаю SFC structure
- [ ] понимаю template syntax
- [ ] понимаю поток данных в простом компоненте
- [ ] могу прочитать и написать простой `.vue` без подсказок

---

## Stretch goals *(optional)*

Если основной MVP уже готов, можно добавить:

- filter: all / active / done
- edit todo inline
- localStorage save
- simple counter / stats block
- keyboard submit via Enter *(если ещё не сделано)*

Не обязательно для закрытия Module 1, но полезно для закрепления.

---

## Если что-то пошло не так

### UI не обновляется

- проверь, что state reactive (`ref`)
- в script используй `.value`
- в template — без `.value`

### Form перезагружает страницу

```vue
<form @submit.prevent="save">
```

### `v-for` ведёт себя странно после delete

- проверь `:key`
- не используй index как key в изменяемом списке

### Слишком много логики в одном файле

- вынеси form, list и item в отдельные components

---

## Что делать после Module 1

Переходи к **Module 2 · Реактивность и Composition API**:

- `ref` vs `reactive`
- `computed`
- `watch`
- composables

Если выбрал **Todo List** или **Notes App** как сквозной проект, не выбрасывай его — в Module 2 можно улучшить ту же кодовую базу.

---

## Мини-конспект

- Module 1 = первый рабочий Vue UI без router/store/API
- цель — уверенно читать и писать простые `.vue`
- лучше один законченный MVP, чем три недоделанных проекта
