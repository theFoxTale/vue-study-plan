# Module 6 · Теория: когда store не нужен

Этот материал закрывает третий теоретический пункт `Module 6`: закрепить **decision framework** — когда хватает local / URL / composable / provide, и какие **ложные поводы** заводят Pinia слишком рано.

Связанные материалы:

- [Module 6 · локальное vs глобальное](./01-local-vs-global-state.md)
- [Module 6 · provide/inject](./02-provide-inject.md)
- [Module 5 · useRoute](../module-5/06-use-route.md)

---

## 1. Зачем отдельный урок «не делать store»

Pinia простая. Поэтому легко сделать её default на всё:

```text
modal open? → store
filters? → store
один fetch products? → store
```

Потом store становится складом всего подряд — как раз то, что критерии Module 6 запрещают.

Цель урока:

```text
уметь сказать «store здесь не нужен» и объяснить чем заменить
```

Официально по духу:

- [State Management · Vue.js](https://vuejs.org/guide/scaling-up/state-management.html)
- [Pinia · Introduction](https://pinia.vuejs.org/introduction.html) *(зачем Pinia — но не значит «всегда»)*

---

## 2. Лестница решений (снизу вверх)

Иди **снизу**. Поднимайся только при реальной боли.

```text
1. Local ref / reactive в component
2. Lift state в ближайшего общего родителя (props/emits)
3. Feature composable (useX), вызванный в page/container
4. provide/inject в поддереве
5. URL (params / query) — если должно шариться / переживать back
6. Pinia — если нужно нескольким далёким parts app
```

Большинство UI-флагов умирают на шаге 1–2.
Много catalog-логики — на 3 или 5.
Cart / auth — часто 6.

---

## 3. Store не нужен, если…

### A) Данные живут и умирают с одним screen

```ts
const isOpen = ref(false)
const draft = ref('')
```

Modal, tooltip, временный draft input, local validation.

### B) Достаточно ближайшего родителя

```text
Page
├─ Filters  ──emits──┐
└─ List     ←props───┘
```

Два-три уровня props — нормально, не «плохая архитектура».

### C) Правда должна быть в URL

```text
/catalog?category=phones&page=2
/products/42
```

Share, refresh, back/forward — Router уже shared store для этого среза.

Дублировать те же filters ещё и в Pinia без нужды = два source of truth.

### D) Логика переиспользуется, state — нет

Composable может быть **stateless** или создавать **новый** state на каждый вызов:

```ts
export function useProductSearch() {
  const q = ref('')
  const results = ref<Product[]>([])
  // ...
  return { q, results, search }
}
```

Каждая page, вызвавшая composable, получает **свой** экземпляр — это не global store.
И это часто то, что нужно.

### E) Server data без cross-page UI sync

Список products, загруженный на `/catalog`, не обязан лежать в Pinia «чтобы был».
Page/composable + Module 7 data layer часто достаточно.

Кеш в store — отдельное решение, не default.

---

## 4. Ложные поводы завести store

| Повод | Почему слабый | Что вместо |
|-------|---------------|------------|
| «В туториале сразу Pinia» | учебный shortcut ≠ твой case | лестница решений |
| «Чтобы был порядок» | store без нужды = новый беспорядок | composable / folders |
| «Может понадобится на другой page» | YAGNI | подними, когда вторая page реально появится |
| «Устал прокидывать 1 prop» | drilling из одного уровня — не проблема | props |
| «Хочу DevTools для modal» | overkill | Vue component state |
| «Все filters в одном месте» | место ≠ global | page state / URL |
| «Чтобы пережило navigation» | иногда да | URL или pinia — выбери явно |
| «Чтобы не вызывать fetch дважды» | это caching | composable/module cache / later query lib |

---

## 5. Когда store **уже** пора (preview)

Заводи Pinia (следующий уроки), если **несколько пунктов** совпадают:

- одни и те же данные читают **несвязанные** pages/layout
- нужен **один** source of truth в сессии app
- меняют из разных мест (Add to cart с details + badge в header)
- логика домена (cart totals, auth) должна быть собрана в API store
- нужны guards / plugins, которым неудобно лезть в page state

Классика Module 6 practice:

- корзина
- избранное
- user session
- multi-step wizard draft *(иногда; иногда хватает page + router)*

---

## 6. Catalog: разбор «нужен / не нужен»

| Данные | Store? | Почему |
|--------|--------|--------|
| `isFiltersOpen` | нет | local UI |
| draft search до Apply | нет | local |
| `category` после Apply | чаще нет | `route.query` |
| products list текущего запроса | чаще нет | page/composable |
| cart line items | **да** | header + cart page + details |
| favorite ids | **да** (если шарится) | list + details + favorites page |
| `document.title` helper | нет | `afterEach` / util |
| theme | зависит | layout provide или маленький store |

---

## 7. Composable ≠ Store (важное различие)

```ts
// каждый вызов = свой state
export function useCounter() {
  const n = ref(0)
  return { n, inc: () => n.value++ }
}
```

```ts
// module singleton — уже «самодельный store» (осторожно с SSR)
const n = ref(0)
export function useGlobalCounter() {
  return { n, inc: () => n.value++ }
}
```

| | Feature composable | Module singleton | Pinia |
|---|--------------------|------------------|-------|
| Новый state на вызов | да | нет | store один на app/pinia |
| DevTools stores | нет | нет | да |
| SSR-safe default | да | нет | да |
| Для Module 6 app-wide | редко как singleton | лучше не изобретать | **да** |

Для учебного SPA singleton «сработает», но план ведёт к **Pinia** как стандартному shared state — не плоди свои global refs без причины.

---

## 8. Мини-алгоритм на 30 секунд

Перед `defineStore` спроси:

1. **Кто ещё читает?** Если только этот component/page-ветка → не store.  
2. **Должно быть в URL?** Если да → Router.  
3. **Переживёт ли unmount page и это нужно?** Если нет → local/composable.  
4. **Уже болит props drilling?** Сначала provide/lift, не Pinia.  
5. **Это server cache?** Не путай с UI store — подумай про data layer.  
6. Если после 1–5 всё ещё «нужен общий клиентский state» → **Pinia**.

Запиши ответ одной фразой в комментарии к store:

```ts
// Shared across Header badge, CartPage, and ProductDetails "Add" button.
```

Если фразу сформулировать не можешь — store, скорее всего, рано.

---

## 9. Частые ошибки

### Store «на будущее»

Будущее обычно приходит другим shape — потом всё равно переписываешь.

### Filters и в query, и в Pinia без sync

Рассинхрон после Back.

### Все fetches в actions store

Store превращается в API-клиент + UI dump. Позже Module 7 поможет разделить.

### Один `useAppStore` на всё

Даже когда store нужен — не god object (будет в best practices).

### Стыд за props

Props — нормальный, явный инструмент. Не лечи «явность» inject/store.

---

## 10. Что важно понять после этого блока

Проверь себя:

1. Назови 3 случая, когда store не нужен.
2. Почему URL иногда лучше Pinia для filters?
3. Чем composable отличается от store?
4. Какие ложные поводы самые частые?
5. Какая фраза должна объяснять каждый store?
6. Для cart — почему store обычно оправдан?

---

## 11. Что почитать

### Официальное

- [State Management · Vue.js](https://vuejs.org/guide/scaling-up/state-management.html)
- [Pinia · Introduction](https://pinia.vuejs.org/introduction.html)

### Связанные материалы этого плана

- [Module 6 · локальное vs глобальное](./01-local-vs-global-state.md)
- [Module 6 · provide/inject](./02-provide-inject.md)

---

## 12. Практическое мини-задание

1. Выпиши 8–12 кусков state своего app.  
2. Для каждого отметь: Local / URL / Composable / Provide / Pinia.  
3. Pinia разреши максимум 2–3 домена (например cart, favorites, auth).  
4. Если в Pinia больше пяти «куч» без связи — вычёркивай обратно вниз по лестнице.

---

## 13. Мини-конспект

- store — не default, а ответ на shared app-wide client state
- лестница: local → lift → composable → provide → URL → Pinia
- ложный повод «на будущее» / «для порядка» — красный флаг
- следующий шаг Module 6 — когда store **нужен**, делаем его правильно через Pinia

---

## 14. Что делать дальше

Следующий теоретический блок Module 6:

- [`Pinia`](./04-pinia.md)
