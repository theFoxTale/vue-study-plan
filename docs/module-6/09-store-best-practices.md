# Module 6 · Теория: best practices проектирования store

Этот материал закрывает последний теоретический пункт `Module 6`: научиться **проектировать stores без избыточности** — границы доменов, naming, ответственность слоёв и красные флаги god store.

Связанные материалы:

- [Module 6 · когда store не нужен](./03-when-store-is-not-needed.md)
- [Module 6 · Pinia](./04-pinia.md)
- [Module 6 · actions](./07-actions.md)
- [Module 5 · practice checklist](../module-5/12-practice-checklist.md)

---

## 1. Цель проектирования

Хороший store:

```text
один понятный domain
ясные данные и действия
минимум сюрпризов для UI
легко объяснить «почему это здесь»
```

Плохой store:

```text
склад всего подряд
неясные имена
логика и UI и API вперемешку
нельзя сказать, кто имеет право менять что
```

Критерии Module 6 из README ровно про это.

---

## 2. Один store — один domain

Дроби по **смыслу**, не по «экранам вчера».

| Store | Отвечает за |
|-------|-------------|
| `useCartStore` | линии корзины, qty, clear |
| `useFavoritesStore` | ids избранного, toggle |
| `useAuthStore` | user/session, login/logout |
| `useCheckoutWizardStore` | draft шагов wizard *(если нужен)* |

Не:

```ts
useAppStore // cart + user + products + theme + modals + filters
```

Если store нельзя описать **одним предложением** — режь.

---

## 3. Naming: данные и действия

### Stores

```text
use + Domain + Store
useCartStore
useAuthStore
```

Id: `'cart'`, `'auth'` — короткий и стабильный.

### State

Существительные / факты:

```text
items, user, token, ids, step, status, error
```

### Getters

Прилагательные / производные nouns:

```text
isEmpty, isAuthenticated, totalQty, displayName, has
```

### Actions

Глаголы:

```text
add, remove, setQty, toggle, login, logout, clear, resetWizard
```

Плохо:

```text
handleClick, doStuff, data, temp, update  // update чего?
```

Имена должны читаться в UI без комментария:

```ts
cart.add(product.id)
favorites.toggle(product.id)
auth.logout()
```

---

## 4. Что класть в store, а что нет

### Да (обычно)

- client state, нужный **нескольким** далёким consumers
- domain invariants (как merge qty в cart)
- session-факты (user)
- draft, который переживает смену pages (wizard / cart)

### Нет (обычно)

| Данные | Куда вместо |
|--------|-------------|
| `isModalOpen` одной page | local `ref` |
| catalog filters для share | `route.query` |
| одноразовый form draft до submit | page state |
| сырой HTTP response «на всякий» | api + page/composable |
| список всех products «глобальный кеш» без стратегии | data layer (Module 7) |
| router instance | `useRouter()` на месте |

Перед новым полем state спроси:

> Кто ещё это читает кроме текущего component?

Если ответ «никто / только дети» — не store.

---

## 5. Слои ответственности

```text
Page / Component
  → вызывает actions, читает state/getters
  → local UI state

Store
  → domain state + rules + orchestration

api/*  (глубже в Module 7)
  → HTTP, URL, headers, parse

Router
  → URL as source of truth для navigation/filters-in-link
```

Action не должен стать «вторым Vue app»:
не парси разметку, не знай про конкретные CSS classes, не дублируй router целиком.

Допустимо: `router.push` после login — тонкая оркестрация.
Лучше часто: action возвращает результат, page сам навигирует.

---

## 6. Зависимости между stores

Ок:

```text
cart читает products (цены) через useProductsStore в getter/action
checkout читает auth.isAuthenticated
```

Осторожно:

```text
A импортирует B, B импортирует A
```

Держи направление **односторонним**.
Общий кусок вынеси в третий модуль (types/api), не в циклические stores.

---

## 7. Публичный API store

Думай о store как о маленьком модуле с API:

```ts
// можно снаружи
cart.items          // читать
cart.totalQty       // getter
cart.add / remove   // менять

// не размазывать
cart.items[0].qty = -5  // лучше setQty с правилами
```

Практика:

- мутации сложных правил — только actions
- UI не знает про внутренние структуры сверх необходимости
- после logout / leave wizard — `$reset` / явный clear

---

## 8. Local vs store: обязательная пара примеров

Критерий Module 6: должен быть **и** пример local, **и** пример store.

Зафиксируй у себя явно:

| Local достаточно | Store нужен |
|------------------|-------------|
| open/close filters panel | cart lines + header badge |
| draft search input | favorites across pages |
| tab UI на details *(если не в URL)* | auth session для guards |

Если в app только stores и ноль local — ты overusing Pinia.
Если только local при живой корзине в header — underusing.

---

## 9. Размер и рост store

Красные флаги:

- файл store > ~200–300 строк без явной структуры
- больше 15–20 actions «на всё»
- state смешивает 3+ несвязанных темы
- комментарии «temporary» живут неделями
- каждый новый feature = новые поля в том же `useAppStore`

Лечение: split store, вынести helpers, вернуть UI state в components.

---

## 10. Persist и URL

| Нужно переживать | Инструмент |
|------------------|------------|
| refresh + share link | URL |
| refresh без share (cart) | persist plugin / localStorage + hydrate action |
| только пока SPA жива | in-memory Pinia |

Не дублируй одно и то же в URL и Pinia без sync-стратегии.

---

## 11. Чеклист перед merge store в проект

- [ ] Domain описан одним предложением
- [ ] Имена state/getters/actions читаются вслух
- [ ] Есть consumers минимум в 2 несвязанных местах **или** явный session use-case
- [ ] Нет UI-only флагов «на будущее»
- [ ] Мутации домена идут через actions
- [ ] Нет цикла store↔store
- [ ] Понятно, что остаётся local / в URL / в api
- [ ] Можешь объяснить преподавателю/себе «почему не в component»

---

## 12. Частые ошибки

### God store «для удобства»

Удобство заканчивается на второй неделе.

### Store = замена props

Для parent/child props всё ещё лучше.

### Actions-названия от UI

`onHeaderCartClick` — нет; `openCart` / `add` — да.

### Спрятать всю app logic в Pinia

Pages/composables тоже имеют право на логику view/feature.

### Копировать Vuex-модули 1:1 в один файл

Pinia любит **плоские** stores по доменам, не огромное дерево modules.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Как выбрать границы store?
2. Какие имена у state / getters / actions?
3. Что категорически не класть в store?
4. Как доказать, что local-пример у тебя есть?
5. Чем плох цикл между stores?
6. Что должно быть в «одном предложении» про store?

---

## 14. Что почитать

### Официальное

- [Pinia · Introduction](https://pinia.vuejs.org/introduction.html)
- [Defining a Store](https://pinia.vuejs.org/core-concepts/)
- [State Management · Vue.js](https://vuejs.org/guide/scaling-up/state-management.html)

### Связанные материалы этого плана

- [Module 6 · когда store не нужен](./03-when-store-is-not-needed.md)
- [Module 6 · setup stores](./08-setup-stores.md)

---

## 15. Практическое мини-задание

1. Напиши одно предложение для каждого своего store  
2. Вычеркни поля, которые не проходят вопрос «кто ещё читает?»  
3. Переименуй кривые actions в глаголы домена  
4. Добавь в README проекта / заметку таблицу Local vs Store  
5. Если есть `useAppStore` — составь план split на 2–3 store

---

## 16. Мини-конспект

- store = узкий domain API, не склад
- naming: facts / derived / verbs
- local + URL + api остаются законными соседями Pinia
- критерии Module 6: local-пример, store-пример, без god store, объяснимые решения
- теория Module 6 закрыта → практика

---

## 17. Что делать дальше

Теория Module 6 закрыта.

Следующий шаг:

- [практический checklist Module 6](./10-practice-checklist.md)
