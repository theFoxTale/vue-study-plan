# Module 3 · Теория: локальная и глобальная регистрация компонентов

Этот материал закрывает шестой теоретический пункт `Module 3`: понять, **как Vue находит component в template**, **чем local registration отличается от global** и **какой подход использовать в современных SFC-проектах**.

Связанные материалы:

- [Module 3 · props](./01-props.md)
- [Module 3 · slots](./03-slots.md)
- [Module 1 · Single File Components](../module-1/03-single-file-components.md)

---

## 1. Зачем нужна registration

Когда Vue видит в template:

```vue
<ProductCard />
```

он должен понять, **какой именно component** имеется в виду.

Для этого component нужно **зарегистрировать**:

```text
global registration → доступен во всём app
local registration  → доступен только в текущем component
```

Официально:

- [Component Registration · Vue.js](https://vuejs.org/guide/components/registration.html)

---

## 2. Локальная регистрация — default для этого плана

В `<script setup>` достаточно **import**:

```vue
<script setup lang="ts">
import ProductCard from './ProductCard.vue'
import ProductFilters from './ProductFilters.vue'
</script>

<template>
  <ProductFilters />
  <ProductCard />
</template>
```

Отдельной `components: {}` опции не нужно: imported bindings автоматически доступны в template.

Это и есть **local registration** в современном Composition API / SFC стиле.

---

## 3. Local registration без `<script setup>`

В Options API / обычном `setup()`:

```vue
<script lang="ts">
import ProductCard from './ProductCard.vue'

export default {
  components: {
    ProductCard,
  },
}
</script>

<template>
  <ProductCard />
</template>
```

Ключ в `components` — имя в template, значение — implementation.

Local component **не прокидывается автоматически** в descendants: каждый parent импортирует то, что использует.

---

## 4. Глобальная регистрация

Component регистрируется на app instance:

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import BaseButton from './components/BaseButton.vue'
import BaseCard from './components/BaseCard.vue'

const app = createApp(App)

app.component('BaseButton', BaseButton)
app.component('BaseCard', BaseCard)

app.mount('#app')
```

После этого в любом template:

```vue
<template>
  <BaseCard>
    <BaseButton>Save</BaseButton>
  </BaseCard>
</template>
```

Import в каждом parent не нужен.

Можно chain'ить:

```ts
app
  .component('BaseButton', BaseButton)
  .component('BaseCard', BaseCard)
  .component('BaseModal', BaseModal)
```

---

## 5. Сравнение local vs global

| | Local | Global |
|---|------|--------|
| Где регистрируется | import в component | `app.component()` |
| Scope | только текущий component | весь app |
| Dependencies | явные | скрытые |
| Tree-shaking | лучше | хуже |
| IDE jump-to-definition | проще | сложнее |
| Для UI-kit | optional auto-import / plugin | иногда удобно |
| Для feature components | ✅ preferred | обычно нет |

---

## 6. Почему local registration предпочтительнее

### 1. Явные зависимости

Сразу видно, от чего зависит page:

```ts
import ProductList from './ProductList.vue'
import ProductFilters from './ProductFilters.vue'
```

В большом app это критично для maintainability.

### 2. Tree-shaking

Если component импортирован и не используется — bundler может его выкинуть.
Глобально зарегистрированный component часто попадает в bundle даже без использования.

### 3. Меньше «магии»

Не нужно гадать, откуда взялся `<WeirdThing />` в template.

---

## 7. Когда global registration всё же встречается

Глобально иногда регистрируют:

- очень частые UI primitives (`BaseButton`, `BaseIcon`)
- components из UI library через plugin
- legacy apps без build tooling discipline

Но даже для UI-kit в Vite/Vue 3 проектах часто лучше:

```text
local import
или
unplugin-vue-components (auto-import)
```

Auto-import — это удобство DX, при этом зависимости всё равно резолвятся на уровне tooling, а не «ручного global soup».

На Module 3 достаточно понимать trade-off; auto-import не обязателен.

---

## 8. Naming: PascalCase vs kebab-case

Рекомендуемый стиль в SFC:

```vue
<ProductCard />
<BaseButton />
```

PascalCase:

- отличается от native HTML tags
- удобен как JS identifier
- лучше для IDE

Vue также понимает kebab-case:

```vue
<product-card />
```

если component зарегистрирован как `ProductCard`.

В этом учебном плане пиши **PascalCase в template**.

---

## 9. Структура папок и imports

Типичная структура catalog app:

```text
src/
  components/
    base/
      BaseButton.vue
      BaseCard.vue
      BaseModal.vue
    catalog/
      ProductCard.vue
      ProductFilters.vue
      ProductList.vue
  App.vue
  main.ts
```

### Local imports

```ts
import BaseCard from '@/components/base/BaseCard.vue'
import ProductList from '@/components/catalog/ProductList.vue'
```

Явный import = явная architecture map.

---

## 10. Пример: catalog page на local registration

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ProductFilters from '@/components/catalog/ProductFilters.vue'
import ProductList from '@/components/catalog/ProductList.vue'
import { useProducts } from '@/composables/useProducts'
import { useProductFilters } from '@/composables/useProductFilters'

const { products, isLoading, error, loadProducts } = useProducts()
const { query, sortBy, visibleProducts } = useProductFilters(products)

const selectedId = ref<number | null>(null)

onMounted(loadProducts)
</script>

<template>
  <main>
    <BaseCard>
      <ProductFilters
        v-model:query="query"
        v-model:sort-by="sortBy"
      />
    </BaseCard>

    <ProductList
      :products="visibleProducts"
      :is-loading="isLoading"
      :error="error"
      @select="selectedId = $event"
    />

    <BaseModal :open="selectedId !== null" @close="selectedId = null">
      Selected: {{ selectedId }}
    </BaseModal>
  </main>
</template>
```

Все dependencies читаются из script. Global registration здесь не нужна.

---

## 11. Пример global registration *(для сравнения)*

```ts
// main.ts
import BaseButton from './components/base/BaseButton.vue'
import BaseCard from './components/base/BaseCard.vue'

app.component('BaseButton', BaseButton)
app.component('BaseCard', BaseCard)
```

```vue
<!-- где угодно без import -->
<template>
  <BaseCard>
    <BaseButton>OK</BaseButton>
  </BaseCard>
</template>
```

Удобно на старте, но в большом проекте сложнее отслеживать ownership и unused code.

---

## 12. Async / lazy components *(preview)*

Иногда component загружают лениво:

```ts
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
```

Это всё ещё local usage pattern: import/define рядом с местом использования.
К registration это соседняя тема; подробно понадобится позже для code splitting.

---

## 13. Частые ошибки

### Забыли import в `<script setup>`

```vue
<template>
  <ProductCard /> <!-- ❌ Component not found -->
</template>
```

Нужен:

```ts
import ProductCard from './ProductCard.vue'
```

### Глобально зарегистрировали всё подряд

```ts
app.component('A', A)
app.component('B', B)
app.component('C', C)
// ... 40 components
```

Bundle растёт, зависимости непрозрачны.

### Путают local availability

Locally registered component **недоступен** автоматически детям.
Каждый file импортирует то, что использует в своём template.

### Несогласованные имена

```ts
app.component('product-card', ProductCard)
```

```vue
<ProductCard /> <!-- может работать, но лучше единообразие -->
```

Держи один стиль: PascalCase registration + PascalCase usage.

---

## 14. Практическое правило для Module 3

```text
feature components → всегда local import
base UI components → local import by default
global registration → только если есть сильная причина
```

Для practice Module 3:

- `ProductCard`, `ProductList`, `ProductFilters` — local
- `BaseButton`, `BaseCard`, `BaseModal` — local
- `main.ts` без `app.component(...)`, если нет особой нужды

---

## 15. Что важно понять после этого блока

Проверь себя:

1. Чем local registration отличается от global?
2. Почему в `<script setup>` достаточно import?
3. Какие минусы у global registration?
4. Почему local лучше для tree-shaking и maintainability?
5. Как именуем components в SFC template?
6. Нужно ли глобально регистрировать весь UI-kit в учебном проекте?

---

## 16. Что почитать

### Официальное

- [Component Registration · Vue.js](https://vuejs.org/guide/components/registration.html)
- [Component Registration · Vue.js RU](https://ru.vuejs.org/guide/components/registration.html)
- [Async Components · Vue.js](https://vuejs.org/guide/components/async.html) *(preview)*

### Связанные материалы этого плана

- [Module 3 · slots](./03-slots.md)
- [Module 1 · Single File Components](../module-1/03-single-file-components.md)

---

## 17. Практическое мини-задание

1. Собери catalog page только на **local imports**
2. Вынеси `BaseButton` / `BaseCard` / `BaseModal` в `components/base`
3. Вынеси feature components в `components/catalog`
4. *(optional experiment)* зарегистрируй `BaseButton` глобально и сравни DX:
   - удобнее ли template?
   - понятнее ли зависимости?

---

## 18. Мини-конспект

- Vue должен знать, какой component стоит за тегом в template
- local registration = import в текущем component
- global registration = `app.component()` на всё приложение
- в `<script setup>` local — default и preferred
- global удобен, но хуже для tree-shaking и прозрачности зависимостей
- для Module 3 practice используй local imports

---

## 19. Что делать дальше

Следующий теоретический блок Module 3:

- **[контейнерные и презентационные компоненты](./07-container-presentational.md)**

После того как components подключены в дерево, важно разделить роли: **кто владеет data/logic**, а **кто только рисует UI**.
