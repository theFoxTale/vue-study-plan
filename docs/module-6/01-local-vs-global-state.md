# Module 6 · Теория: локальное состояние vs глобальное

Этот материал открывает **Module 6** и закрывает первый теоретический пункт: понять, **где жить данным**, **чем local state отличается от shared/global**, и **как не тащить всё в store заранее**.

Связанные материалы:

- [Module 5 · practice checklist](../module-5/12-practice-checklist.md)
- [Module 3 · container / presentational](../module-3/07-container-presentational.md)
- [Module 2 · practice checklist](../module-2/11-practice-checklist.md)

---

## 1. Зачем Module 6 после Router

К Module 6 у тебя уже есть:

- components + composables
- typed models
- pages и URL

Но появляется новый класс задач:

```text
корзина видна в header и на /cart
избранное нужно на catalog и на details
user session нужна guards и нескольким pages
wizard: шаг 1 → шаг 2 → шаг 3 без потери данных
```

Это **shared state across components/pages** — главный повод говорить про global state и Pinia.

Официально (Pinia / state mindset):

- [Pinia · Introduction](https://pinia.vuejs.org/introduction.html)
- [State Management · Vue.js](https://vuejs.org/guide/scaling-up/state-management.html)

---

## 2. Три «этажа» состояния

Упрощённая модель:

```text
1. Local UI state     — живёт в одном component
2. Shared feature     — несколько components одной фичи
3. App-wide state     — многие pages / layout / guards
```

| Этаж | Примеры | Где обычно |
|------|---------|------------|
| Local | open modal, input draft, hover | `ref` в component |
| Shared feature | filters + list одной page-ветки | props/emits, composable, иногда provide/inject |
| App-wide | cart, auth user, theme | Pinia store (или provide на корне — редко) |

Module 6 учит **выбирать этаж**, а не «всегда Pinia».

---

## 3. Локальное состояние

**Local state** — данные, которые нужны только одному component (или его прямым детям через props).

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)
const draftTitle = ref('')

function open() {
  isOpen.value = true
}
</script>
```

Признаки local:

- при unmount данные можно выбросить
- никто за пределами дерева не читает это же значение
- URL не обязан отражать это состояние *(хотя иногда query удобен)*

Типичный local:

- `isModalOpen`
- `searchDraft` до Apply
- `isSubmitting` одной формы
- temporary validation errors

**Правило:** начинай с local. Поднимай выше только при реальной боли.

---

## 4. Глобальное (shared) состояние

**Global / app state** — данные, к которым обращаются **несвязанные** части UI.

```text
HeaderCartBadge  ←── cart items ──→  CartPage
CatalogPage      ←── favorites  ──→  ProductDetailsPage
Router guard     ←── auth user  ──→  ProfilePage
```

Признаки, что state уже не local:

- один и тот же факт нужен в **разных pages**
- источник правды должен быть **один**
- после ухода со страницы данные **должны сохраниться** в рамках сессии app
- много уровней props drilling (`App → Layout → Page → List → Card → Badge`)

Для Vue 3 / учебного плана основной инструмент app-wide state — **Pinia** (уроки дальше).

---

## 5. Props drilling: когда «поднять» ещё не значит «в store»

Иногда state shared только внутри одной page:

```text
CatalogPage
  ├─ ProductFilters   (меняет filters)
  └─ ProductList      (читает filters)
```

Варианты **без Pinia**:

1. State в `CatalogPage` + props/emits  
2. Composable `useCatalogFilters()` вызванный в page (и переданный детям)  
3. `provide/inject` внутри page-ветки (следующий урок)

Это всё ещё **feature-local**, не app-global.

В store имеет смысл выносить filters, только если они реально шарятся:

- между `/catalog` и другой page
- с persist
- с сложной бизнес-логикой, нужной вне catalog UI

Иначе store = преждевременная сложность.

---

## 6. Таблица решений

| Вопрос | Если да → |
|--------|-----------|
| Нужно только здесь? | local `ref` |
| Нужно родителю и детям одной фичи? | lift state / composable / provide |
| Нужно нескольким routes / layout? | Pinia |
| Должно переживать reload? | persist (localStorage) ± store — позже аккуратно |
| Должно быть в URL (share/back)? | `route.query` / params, не обязательно store |

Частый правильный ответ для catalog filters: **URL query** (Module 5) + local/page state, а не сразу Pinia.

Частый правильный ответ для cart: **Pinia** (или эквивалент shared store).

---

## 7. Примеры на Product Catalog

### Оставить local

| State | Почему |
|-------|--------|
| `isFiltersPanelOpen` | UI одной page |
| `selectedTab` внутри details *(если не в URL)* | только этот screen |
| `formError` на login | ephemeral |

### Кандидаты в shared / store

| State | Почему |
|-------|--------|
| `cartItems` | header badge + cart page + add с details |
| `favoriteIds` | list + details + отдельная page |
| `currentUser` / token | guards + profile + API headers |
| `wizardDraft` | несколько steps/pages без потери |

### Серая зона

| State | Как решить |
|-------|------------|
| catalog `category` filter | чаще `query` в URL |
| последний просмотренный product | local/sessionStorage или лёгкий store |
| products list cache | data layer / composable; store не обязателен |

---

## 8. Антипаттерн: «God store»

Плохо:

```ts
useAppStore() // products, cart, user, theme, modals, filters, apiCache, …
```

Симптомы:

- непонятно, кто может менять что
- любой component тянет «всё»
- сложно тестировать и объяснять

Лучше **по доменам**:

```text
useCartStore
useAuthStore
useFavoritesStore
```

Проектирование stores — отдельный урок Module 6; здесь важно: global ≠ один мешок.

---

## 9. State vs server data

Не всё reactive — «состояние приложения».

| | Client state | Server state |
|---|--------------|--------------|
| Источник правды | UI / user session | backend |
| Примеры | cart draft, UI flags, auth session client-side | список products с API |
| Типичный дом | component / Pinia | fetch + cache (Module 7 углубит) |

Можно кешировать server data в store, но это уже решение data layer.
Module 6 фокус — **client/app state** и границы ответственности.

---

## 10. Связь с Module 5

Router уже дал тебе один вид shared truth — **URL**.

```text
URL          → какой page, какой id, какие query filters
Pinia/local  → то, что не обязано/не должно быть в URL
```

Примеры:

- `/products/42` — id в URL (хорошо)
- количество в корзине — обычно не в URL (store)
- `?category=phones` — filter в URL (хорошо для share)

Сначала спроси: «это должно быть в ссылке?»  
Потом: «это local или app-wide?»

---

## 11. Частые ошибки

### Сразу Pinia «потому что так в туториалах»

Для modal open — overkill.

### Дублировать одни данные в page и в store

Два source of truth → рассинхрон.

### Хранить в store огромные формы «на всякий случай»

Часто хватает page state + router (wizard routes).

### Путать «поднял в родителя» и «сделал global»

Lift state up ≠ app store.

### Пихать в store весь API response «как есть»

Сначала model/parse (Module 4), потом решай про cache.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Чем local state отличается от global?
2. Какие признаки, что нужен shared state?
3. Почему props drilling ещё не равен Pinia?
4. Какие catalog-данные лучше держать в URL?
5. Что такое god store и почему это плохо?
6. Приведи по одному примеру: local достаточно / store нужен?

---

## 13. Что почитать

### Официальное

- [State Management · Vue.js](https://vuejs.org/guide/scaling-up/state-management.html)
- [Pinia · Introduction](https://pinia.vuejs.org/introduction.html)

### Связанные материалы этого плана

- [Module 5 · practice checklist](../module-5/12-practice-checklist.md)
- [Module 3 · container / presentational](../module-3/07-container-presentational.md)

---

## 14. Практическое мини-задание

На бумаге разложи state своего catalog app на три колонки:

| Local | Shared feature (page) | App-wide |
|-------|------------------------|----------|
| … | … | … |

Для каждой app-wide строки одной фразой: **кто ещё читает эти данные?**

Если строка пустая («никто») — скорее всего это не app-wide.

---

## 15. Мини-конспект

- начинай с local state
- shared внутри фичи ≠ сразу Pinia
- app-wide: несколько pages/layout/guards + один source of truth
- URL — тоже shared state (Module 5)
- Module 6 дальше: provide/inject, когда store не нужен, затем Pinia

---

## 16. Что делать дальше

Следующий теоретический блок Module 6:

- [`provide/inject`](./02-provide-inject.md)
