# Module 6 · Теория: provide / inject

Этот материал закрывает второй теоретический пункт `Module 6`: понять, **как избежать props drilling**, **как работает `provide` / `inject`**, и **чем это отличается от Pinia**.

Связанные материалы:

- [Module 6 · локальное vs глобальное](./01-local-vs-global-state.md)
- [Module 3 · props](../module-3/01-props.md)
- [Module 3 · container / presentational](../module-3/07-container-presentational.md)

---

## 1. Проблема: props drilling

Данные нужны глубоко в дереве, но промежуточные components их не используют:

```text
CatalogPage  (держит filters)
  └─ CatalogLayout      (просто передаёт props дальше)
       └─ ProductToolbar
            └─ ActiveFiltersBadge  ← реально нужны filters
```

Каждый уровень вынужден объявлять и прокидывать props «транзитом». Это **props drilling**.

`provide` / `inject` позволяют ancestor **отдать** значение всем descendants напрямую.

Официально:

- [Provide / Inject · Vue.js](https://vuejs.org/guide/components/provide-inject.html)

---

## 2. Базовый API

### Provider

```vue
<script setup lang="ts">
import { provide, ref } from 'vue'

const theme = ref('light')
provide('theme', theme)
</script>
```

### Injector (любой потомок)

```vue
<script setup lang="ts">
import { inject, type Ref } from 'vue'

const theme = inject<Ref<string>>('theme')
</script>
```

Если несколько ancestors provide'ят один key — берётся **ближайший** provider.

---

## 3. Default value

```ts
const theme = inject('theme', 'light')
```

Без default и без provider — runtime warning.

Для дорогого default — factory:

```ts
const state = inject('key', () => createHeavyState(), true)
```

---

## 4. Реактивность

Provide'ить можно `ref` / `reactive` / объект с ними:

```ts
const filters = ref({ category: 'all', q: '' })
provide('catalogFilters', filters)
```

Потомок, который inject'ит этот `ref`, остаётся связан с provider реактивно.

Важно:

- injected `ref` **не** unwrap'ится автоматически в script — работай с `.value`
- в template unwrap обычно есть, как у обычных refs

---

## 5. Мутации: держи их у provider

Рекомендация Vue: менять state лучше в provider, а потомкам отдавать **readonly + функции**.

```vue
<!-- CatalogPage.vue (provider) -->
<script setup lang="ts">
import { provide, reactive, readonly } from 'vue'

const filters = reactive({
  category: 'all',
  q: '',
})

function setCategory(category: string) {
  filters.category = category
}

function setQuery(q: string) {
  filters.q = q
}

provide('catalogFilters', {
  filters: readonly(filters),
  setCategory,
  setQuery,
})
</script>
```

```vue
<!-- DeepChild.vue -->
<script setup lang="ts">
import { inject } from 'vue'

const catalog = inject('catalogFilters')
// catalog.filters — читать
// catalog.setCategory('phones') — менять через API
</script>
```

Так источник правды и правила изменения остаются в одном месте.

---

## 6. Symbol keys (рекомендуется)

Строковые keys легко столкнуть в большом app.

```ts
// src/injectionKeys.ts
import type { InjectionKey, Ref } from 'vue'

export type CatalogFilters = {
  category: string
  q: string
}

export const catalogFiltersKey: InjectionKey<{
  filters: Readonly<CatalogFilters>
  setCategory: (category: string) => void
  setQuery: (q: string) => void
}> = Symbol('catalogFilters')
```

```ts
provide(catalogFiltersKey, { filters: readonly(filters), setCategory, setQuery })

const catalog = inject(catalogFiltersKey)
if (!catalog) {
  // нет provider — явная обработка
}
```

`InjectionKey<T>` улучшает TypeScript inference.

---

## 7. App-level provide

```ts
// main.ts
app.provide('appName', 'Product Catalog')
```

Доступно **всем** components. Удобно для plugins / редких app constants.

Для cart/auth в учебном плане дальше лучше **Pinia**, не `app.provide` всего подряд.

---

## 8. Типичный catalog scenario

```text
CatalogPage
  provide(catalogFiltersKey)
  ├─ ProductFilters      inject + setCategory
  ├─ ProductList         inject filters (read)
  └─ … глубокий badge    inject filters (read)
```

Когда это уместно:

- state нужен **внутри одной page-ветки**
- props drilling уже раздражает (3+ уровня)
- store ещё не оправдан (другие pages не читают эти filters)

Если filters должны жить в URL — часть правды всё равно в `route.query`; provide может быть удобным API поверх page composable.

---

## 9. provide/inject vs props vs Pinia

| Инструмент | Связь | Когда |
|------------|-------|--------|
| props/emits | явный parent → child | близкие уровни, понятный контракт |
| provide/inject | ancestor → any descendant | убрать drilling в **поддереве** |
| Pinia | любой component app | shared across **pages** / layout / guards |

```text
props          — default, самый явный
provide/inject — «беспроводной» props для subtree
Pinia          — app-wide store
```

Не заменяй props на inject «везде» — скрытые зависимости хуже читаются.

---

## 10. Когда provide/inject — плохой выбор

- данные нужны на `/catalog` и `/cart` одинаково → Pinia
- один уровень parent/child → обычные props
- хочешь DevTools timeline actions / стандартный store API → Pinia
- SSR / большой team app с жёсткими границами → чаще Pinia + явные imports

provide/inject отлично для:

- theme / locale внутри layout
- form context
- page-level feature context
- library components (tabs, accordion context)

---

## 11. Частые ошибки

### Mutate injected state откуда попало

Ломай инкапсуляцию → `readonly` + action functions.

### String key collisions

Переходи на `Symbol` / `InjectionKey`.

### Inject вне setup

`inject()` / `provide()` — синхронно в `setup` / `<script setup>` (или app context).

### Считать provide заменой store

Это **tree-scoped** DI, не глобальный registry на все pages.

### Забыть, что нет provider

Проверяй `undefined` или задавай default.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Какую проблему решают provide/inject?
2. Кто побеждает при нескольких providers с одним key?
3. Как правильно разрешать мутации из потомка?
4. Зачем `InjectionKey` / Symbol?
5. Чем provide отличается от Pinia?
6. Пример, где props лучше inject?

---

## 13. Что почитать

### Официальное

- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html)
- [Typing Provide / Inject](https://vuejs.org/guide/typescript/composition-api.html#typing-provide-inject)

### Связанные материалы этого плана

- [Module 6 · локальное vs глобальное](./01-local-vs-global-state.md)
- [Module 3 · props](../module-3/01-props.md)

---

## 14. Практическое мини-задание

1. В `CatalogPage` заведи `filters` + `provide` с `readonly` и setters
2. В глубоком child сделай `inject` и покажи active category
3. Сравни с версией на props: что стало короче, что менее явно?
4. Вынеси key в `injectionKeys.ts` с `InjectionKey`

---

## 15. Мини-конспект

- provide/inject = DI по дереву компонентов, анти-drilling
- provide reactive values; мутации — у provider (или через provided functions)
- Symbol + `InjectionKey` для TS и безопасности keys
- scope = subtree (или app.provide), не замена Pinia для app-wide state

---

## 16. Что делать дальше

Следующий теоретический блок Module 6:

- [когда store не нужен](./03-when-store-is-not-needed.md)
