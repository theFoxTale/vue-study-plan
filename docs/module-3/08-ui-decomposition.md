# Module 3 · Теория: принципы декомпозиции UI

Этот материал закрывает восьмой теоретический пункт `Module 3`: понять, **как резать интерфейс на components правильного размера**, **когда выделять новый component**, а **когда не дробить зря**, и как собрать из этого читаемое дерево для catalog / modal / UI-kit.

Связанные материалы:

- [Module 3 · container / presentational](./07-container-presentational.md)
- [Module 3 · props](./01-props.md)
- [Module 3 · emits](./02-emits.md)
- [Module 3 · slots](./03-slots.md)

---

## 1. Что такое декомпозиция UI

**Декомпозиция** — это умение разбить экран на части с понятной ответственностью.

```text
один большой шаблон
   ↓
дерево components
   ↓
каждый кусок про одну задачу
```

Хорошая декомпозиция даёт:

- читаемость
- переиспользование
- проще props/emits API
- проще менять UI без ломки logic

Плохая декомпозиция даёт:

- God Component
- или наоборот — Component Soup из 30 крошечных файлов

---

## 2. Главный вопрос

Перед тем как создавать новый `.vue`, спроси:

```text
У этого куска есть своя ответственность,
понятное имя
и стабильный API (props/emits/slots)?
```

Если да — выделяй component.
Если нет — пока оставь inline в parent.

---

## 3. Принцип одной ответственности

Один component ≈ одна задача.

| Component | Одна задача |
|-----------|-------------|
| `ProductFilters` | ввод filters |
| `ProductList` | render списка + states |
| `ProductCard` | карточка одного product |
| `BaseModal` | dialog shell |
| `CatalogPage` | wiring feature |

Плохо:

```text
ProductStuff.vue
→ filters + list + modal + fetch + toast + analytics
```

---

## 4. Режь по UI-границам, не по случайным `<div>`

Хорошие границы обычно совпадают с тем, что пользователь видит как блок:

```text
page header
filters panel
products grid
product card
empty/loading/error state
modal dialog
action buttons
```

Не каждый `<div class="row">` достоин отдельного component.

### Эвристика

Выделяй component, если блок:

1. повторяется
2. имеет собственный state/behavior
3. достаточно большой, чтобы мешать чтению parent
4. может переиспользоваться
5. имеет смысл как отдельная единица дизайна

---

## 5. Правило «сначала склей, потом режь»

Частая ошибка новичков — дробить слишком рано.

Лучший путь для учебного проекта:

```text
1. Собрать рабочий экран
2. Найти перегруженные куски
3. Вынести 2–4 очевидных component
4. Повторить при росте сложности
```

Не начинай с идеальной архитектуры из 20 файлов до первого working UI.

---

## 6. Три уровня компонентов

Для Module 3 удобна такая модель:

### 1. Page / feature container

`CatalogPage.vue`

- собирает feature
- подключает composables
- раздаёт data

### 2. Feature UI

`ProductFilters`, `ProductList`, `ProductCard`

- знают domain language (`product`, `query`, `sortBy`)
- не обязаны быть universal

### 3. Base / UI-kit

`BaseButton`, `BaseCard`, `BaseModal`, `BaseInput`

- domain-agnostic
- переиспользуются между features

```text
Page
 └─ Feature components
     └─ Base components
```

---

## 7. Когда выделять Base component

Выделяй в UI-kit, если:

- паттерн повторяется 2+ раза
- это generic control (`button`, `input`, `modal`, `card`)
- API можно описать без слов `product` / `cart` / `user`

### Пример

```vue
<!-- ❌ слишком early abstraction -->
<ProductPrimaryActionButton />

<!-- ✅ -->
<BaseButton variant="primary">
  Add to cart
</BaseButton>
```

Не делай base-component из разовой domain-кнопки.

---

## 8. Когда оставлять feature-specific component

Не всё нужно обобщать.

```vue
<ProductCard />
```

может оставаться catalog-specific даже если внутри использует `BaseCard` / `BaseButton`.

```text
BaseCard     → generic shell
ProductCard  → product meaning + product actions
```

Это нормальная и полезная граница.

---

## 9. Признаки, что component слишком большой

Пора резать, если:

- template > ~80–120 строк и трудно читать
- в одном файле и fetch, и form, и list, и modal
- много несвязанных `ref`
- сложно объяснить component одной фразой
- изменения в filters ломают card UI и наоборот

### Пример разреза

Было:

```text
CatalogPage.vue (всё)
```

Стало:

```text
CatalogPage.vue
ProductFilters.vue
ProductList.vue
ProductCard.vue
BaseModal usage for details
```

---

## 10. Признаки, что component слишком мелкий

Не надо выделять:

```vue
<ProductName :value="name" />
<ProductPrice :value="price" />
<ProductCurrency symbol="$" />
```

если они используются только вместе внутри одной card и не несут отдельного behavior.

Мелкая нарезка:

- усложняет навигацию по проекту
- раздувает props plumbing
- не даёт reuse

```text
лучше одна ProductCard,
чем 8 однострочных wrappers
```

---

## 11. Декомпозиция по состоянию экрана

Отдельные куски UI часто соответствуют states:

```text
loading
error
empty
content
```

Варианты:

### A. inline в list/page

```vue
<p v-if="isLoading">Loading...</p>
<p v-else-if="error">{{ error }}</p>
...
```

Ок для MVP.

### B. tiny presentational states

```vue
<LoadingState />
<ErrorState :message="error" @retry="reload" />
<EmptyState message="No products found" />
```

Полезно, если states повторяются в нескольких screens.

Не выноси слишком рано — сначала повторение, потом abstraction.

---

## 12. Декомпозиция modal flow

Modal почти всегда состоит из двух слоёв:

```text
BaseModal          → shell (open/close, overlay, slots)
ProductDetails...  → content (что показать)
```

Или content остаётся inline в container через slots:

```vue
<BaseModal :open="open" @close="close">
  <h2>{{ product.name }}</h2>
  ...
</BaseModal>
```

Выделяй `ProductDetailsModal.vue`, только если:

- content сложный
- переиспользуется
- modal имеет свою feature logic

---

## 13. Повторяющиеся actions → slot или base control

Если в cards/modals много похожих кнопок:

```vue
<BaseButton @click="buy">Buy</BaseButton>
```

Если разные action areas:

```vue
<template #actions>
  <BaseButton>Cancel</BaseButton>
  <BaseButton>Confirm</BaseButton>
</template>
```

Не плоди props вроде:

```ts
showBuyButton
showCancelButton
showConfirmButton
buyButtonText
cancelButtonText
```

Это сигнал, что нужна декомпозиция через slots.

---

## 14. Практический алгоритм декомпозиции

Используй как checklist:

1. Нарисуй экран блоками на бумаге
2. Подпиши, какой блок за что отвечает
3. Отметь container vs presentational
4. Выпиши props/emits/slots для каждого блока
5. Вынеси сначала самые очевидные 3–5 components
6. Запусти UI
7. Рефакторь только там, где болит

### Для Product Catalog

```text
CatalogPage
├─ AppHeader? (optional)
├─ ProductFilters
├─ ProductList
│  └─ ProductCard
├─ Loading/Error/Empty (inline or components)
└─ BaseModal (details)
```

Этого достаточно для Module 3 MVP.

---

## 15. Связь декомпозиции с API компонента

Каждый новый component должен получить ясный contract.

Плохо вынести кусок и оставить:

```ts
defineProps<{ data: any; flags: Record<string, boolean> }>()
```

Хорошо:

```ts
defineProps<{
  products: Product[]
  isLoading: boolean
  error: string
}>()

defineEmits<{
  select: [id: number]
}>()
```

Если не можешь назвать props без `data` / `stuff` / `flags` — граница component, скорее всего, кривая.

---

## 16. Декомпозиция ≠ больше файлов любой ценой

Цель не «много `.vue`», а:

```text
понятное дерево
маленькие API
лёгкие изменения
```

Иногда 4 хороших component лучше, чем 12 случайных.

---

## 17. Частые ошибки

### Premature abstraction

Сразу делать `BaseEverything` до второго use-case.

### Copy-paste вместо component

Три одинаковых card markup в разных местах — пора выделять.

### Разрез по technical layers вместо UI

Например, отдельный component только потому что «тут computed».
Computed может жить в composable/parent без нового UI file.

### Прокидывание всего подряд после разреза

Разрезали файл, но теперь через 4 уровня тащат 12 props.
Значит, границы или ownership state выбраны плохо.

---

## 18. Что важно понять после этого блока

Проверь себя:

1. По каким признакам пора выделять новый component?
2. Когда component слишком мелкий?
3. Чем feature component отличается от base UI-kit?
4. Почему лучше сначала собрать экран, а потом резать?
5. Как slots помогают избежать boolean props explosion?
6. Какое минимальное дерево подходит для Product Catalog?

---

## 19. Что почитать

### Связанные материалы этого плана

- [Module 3 · container / presentational](./07-container-presentational.md)
- [Module 3 · named slots](./04-named-slots.md)
- [Module 3 · component registration](./06-component-registration.md)
- [Module 2 · practice checklist](../module-2/11-practice-checklist.md)

### Практический смысл

Официальные Vue docs хорошо объясняют mechanics components/slots/props.
Декомпозиция — это engineering judgment поверх этих mechanics: **где провести границы**.

---

## 20. Практическое мини-задание

Возьми текущий catalog (или набросок) и сделай decomposition pass:

1. Нарисуй blocks экрана
2. Собери дерево из 5–8 components max для MVP
3. Для каждого файла напиши one-liner responsibility
4. Вынеси минимум:
   - filters
   - list
   - card
   - modal shell
   - button/card base
5. Проверь, нет ли component без понятного API

### Результат

```text
CatalogPage — wiring
ProductFilters — controlled filters UI
ProductList — list + states
ProductCard — one product
BaseButton / BaseCard / BaseModal — reusable shells
```

---

## 21. Мини-конспект

- декомпозиция = нарезка UI по ответственности
- режь по смысловым блокам экрана
- сначала working UI, потом refactor boundaries
- page → feature → base
- слишком крупно плохо, слишком мелко тоже плохо
- хороший component имеет ясное имя и ясный API

---

## 22. Что делать дальше

Следующий теоретический блок Module 3:

- **[базовая доступность: семантика, `label`, `button`, focus states](./09-accessibility-basics.md)**

После того как дерево components собрано, нужно убедиться, что interactive UI можно нормально использовать с клавиатуры и screen-reader-friendly разметкой.
