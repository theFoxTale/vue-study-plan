# Module 1 · Теория: интерполяция

Этот материал закрывает пятый теоретический пункт `Module 1`: понять, **что такое интерполяция во Vue**, **как выводить данные в template** и **как mustache-синтаксис `{{ }}` связан с реактивностью**.

Связанные материалы:

- [04 · секции template, script setup, style](04-sfc-sections-template-script-style.md)
- [03 · Single File Components](03-single-file-components.md)

---

## 1. Что такое интерполяция

**Интерполяция** — это способ вставить данные из `<script setup>` в `<template>`.

В Vue для этого используется **mustache-синтаксис**:

```vue
<span>{{ message }}</span>
```

Это читается так:

> «Покажи здесь значение переменной `message`».

Официально: [Template Syntax · Vue.js](https://vuejs.org/guide/essentials/template-syntax.html)

---

## 2. Самый простой пример

```vue
<script setup lang="ts">
const username = 'Ann'
</script>

<template>
  <p>Hello, {{ username }}</p>
</template>
```

Результат в браузере:

```text
Hello, Ann
```

### Что происходит

1. Vue читает template
2. Находит `{{ username }}`
3. Подставляет текущее значение переменной
4. Обновляет DOM, если значение изменится

---

## 3. Интерполяция и реактивность

Главная сила интерполяции не в «один раз показать текст», а в **автоматическом обновлении UI**.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <p>Count: {{ count }}</p>
  <button @click="count++">+1</button>
</template>
```

Когда `count` меняется, Vue автоматически обновляет текст в `<p>`.

### Главная мысль

```text
data changes → template updates
```

Это базовая идея реактивности Vue.

---

## 4. `ref` и интерполяция

В `<script setup>` для reactive values часто используется `ref`.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const title = ref('Todo List')
</script>

<template>
  <h1>{{ title }}</h1>
</template>
```

### Важно

- в script: `title.value`
- в template: просто `title`

Vue автоматически «распаковывает» ref в template.

---

## 5. Mustache-синтаксис

Mustache — это просто название для двойных фигурных скобок:

```vue
{{ expression }}
```

Примеры:

```vue
<p>{{ username }}</p>
<p>{{ 2 + 2 }}</p>
<p>{{ isDone ? 'Done' : 'Pending' }}</p>
```

---

## 6. JavaScript expressions внутри `{{ }}`

Vue позволяет использовать **JavaScript expressions**, но не произвольные statements.

### Можно

```vue
<p>{{ count + 1 }}</p>
<p>{{ message.split('').reverse().join('') }}</p>
<p>{{ ok ? 'YES' : 'NO' }}</p>
<p>{{ user.name }}</p>
```

### Нельзя

```vue
<!-- statements -->
<p>{{ let x = 1 }}</p>
<p>{{ if (ok) { return 'yes' } }}</p>
<p>{{ for (const item of items) {} }}</p>
```

### Правило

В mustache можно писать **выражение**, которое возвращает значение, а не полноценный блок кода.

---

## 7. Интерполяция vs HTML

Mustache выводит **plain text**, а не HTML.

```vue
<script setup lang="ts">
const rawHtml = '<strong>Hello</strong>'
</script>

<template>
  <p>{{ rawHtml }}</p>
</template>
```

Результат:

```text
<strong>Hello</strong>
```

Браузер покажет это как текст, а не как жирный HTML.

### Если нужен HTML

Используется директива `v-html`:

```vue
<p v-html="rawHtml"></p>
```

Но на Module 1 для обычного текста достаточно `{{ }}`.

`v-html` подробнее разберём в блоке про директивы.

---

## 8. Интерполяция только в содержимом элементов

Mustache работает **между тегами**, а не внутри HTML-атрибутов.

### Работает

```vue
<p>{{ title }}</p>
```

### Не работает

```vue
<p class="{{ className }}">Title</p>
```

Для атрибутов нужен `v-bind`:

```vue
<p :class="className">Title</p>
```

Это важное ограничение, которое часто путают новички.

---

## 9. Интерполяция с объектами и массивами

Можно выводить вложенные данные:

```vue
<script setup lang="ts">
const user = {
  name: 'Ann',
  role: 'Developer',
}

const tags = ['vue', 'typescript', 'vite']
</script>

<template>
  <p>{{ user.name }}</p>
  <p>{{ user.role }}</p>
  <p>{{ tags[0] }}</p>
</template>
```

Позже такие структуры станут reactive через `ref` или `reactive`.

---

## 10. Интерполяция и форматирование текста

Иногда хочется «красиво отформатировать» значение прямо в template.

```vue
<script setup lang="ts">
const price = 1299
</script>

<template>
  <p>{{ price }} ₽</p>
  <p>Total: {{ price * 2 }} ₽</p>
</template>
```

### На старте это нормально

Но если форматирование становится сложным, лучше вынести его в:

- function;
- `computed` *(Module 2)*.

Пример:

```vue
<script setup lang="ts">
const price = 1299

function formatPrice(value: number) {
  return `${value} ₽`
}
</script>

<template>
  <p>{{ formatPrice(price) }}</p>
</template>
```

---

## 11. `v-once` — интерполяция без обновления

Иногда значение нужно показать один раз и больше не обновлять:

```vue
<p v-once>{{ createdAt }}</p>
```

Это редкий случай на Module 1, но полезно знать, что существует.

---

## 12. Типичные примеры из учебных проектов

### Todo List

```vue
<template>
  <h1>{{ title }}</h1>
  <p>{{ todos.length }} tasks</p>
</template>
```

### Notes App

```vue
<template>
  <h2>{{ note.title }}</h2>
  <p>{{ note.text }}</p>
</template>
```

### Habit Tracker

```vue
<template>
  <p>{{ habit.name }}</p>
  <p>Streak: {{ habit.streak }} days</p>
</template>
```

---

## 13. Частые ошибки

### Путают script и template syntax

Плохо:

```vue
<p>{{ count.value }}</p>
```

Хорошо:

```vue
<p>{{ count }}</p>
```

### Пытаются использовать mustache в атрибутах

Плохо:

```vue
<input placeholder="{{ text }}" />
```

Хорошо:

```vue
<input :placeholder="text" />
```

### Пишут слишком сложную логику в mustache

Плохо:

```vue
<p>
  {{
    items
      .filter(item => item.done)
      .map(item => item.title)
      .join(', ')
  }}
</p>
```

Лучше вынести в function или `computed`.

### Ожидают, что mustache вставит HTML

```vue
<p>{{ '<strong>Hi</strong>' }}</p>
```

Будет plain text, не HTML.

---

## 14. Когда использовать интерполяцию

Используй `{{ }}`, когда нужно показать:

- текст;
- число;
- результат простого expression;
- значение reactive state;
- свойство объекта.

Не используй mustache для:

- HTML-атрибутов → `v-bind`
- raw HTML → `v-html`
- сложной логики → script / computed
- условного рендера → `v-if`
- списков → `v-for`

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Что такое mustache-синтаксис?
2. Как вывести значение переменной в template?
3. Почему UI обновляется при изменении `ref`?
4. Можно ли писать `if/for` внутри `{{ }}`?
5. Почему mustache нельзя использовать в HTML-атрибутах?
6. Чем `{{ rawHtml }}` отличается от `v-html`?

---

## 16. Что почитать

### Официальное

- [Template Syntax · Vue.js](https://vuejs.org/guide/essentials/template-syntax.html)
- [Template Syntax · Vue.js RU](https://ru.vuejs.org/guide/essentials/template-syntax.html)
- [Text Interpolation · Vue.js](https://vuejs.org/guide/essentials/template-syntax.html#text-interpolation)

### Связанные материалы этого плана

- [04 · секции SFC](04-sfc-sections-template-script-style.md)
- [03 · Single File Components](03-single-file-components.md)

---

## 17. Практическое мини-задание

Создай компонент `UserGreeting.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const username = ref('Ann')
const role = ref('Frontend Developer')
</script>

<template>
  <section>
    <h2>Hello, {{ username }}</h2>
    <p>Role: {{ role }}</p>
    <p>Status: {{ username ? 'Active' : 'Guest' }}</p>
  </section>
</template>
```

Задачи:

1. Выведи `username` и `role` через mustache
2. Добавь простое expression в template
3. Измени `username` в Vue DevTools и посмотри, как обновляется UI

---

## 18. Мини-конспект

- Интерполяция = вывод данных через `{{ }}`
- Mustache автоматически обновляется при изменении reactive data
- В template `ref` unwrap-ится автоматически
- В mustache можно использовать JS expressions, но не statements
- Mustache работает только в содержимом элементов, не в атрибутах

---

## 19. Что делать дальше

Следующий теоретический блок Module 1:

- **события**

После интерполяции логично изучить, как пользователь взаимодействует с UI через `@click`, `@submit` и другие event handlers.
