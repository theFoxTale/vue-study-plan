# Module 6 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 6**: добавить **shared client state** через Pinia — корзина, избранное, сессия (и опционально wizard) — **без god store**.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 5 должен быть закрыт

- [ ] Vue Router подключён, ≥3 pages + detail
- [ ] `useRouter` / `useRoute` уже использовались
- [ ] catalog list → detail работает
- [ ] lazy routes на месте

### Прочитай теорию Module 6

- [01 · локальное vs глобальное](01-local-vs-global-state.md)
- [02 · provide/inject](02-provide-inject.md)
- [03 · когда store не нужен](03-when-store-is-not-needed.md)
- [04 · Pinia](04-pinia.md)
- [05 · state](05-state.md)
- [06 · getters](06-getters.md)
- [07 · actions](07-actions.md)
- [08 · setup stores](08-setup-stores.md)
- [09 · best practices](09-store-best-practices.md)

---

## Шаг 1. Выбрать базу

| Вариант | Когда |
|---------|------|
| **Product Catalog + Router из Module 5** | recommended |
| **Blog** | cart → «reading list» / bookmarks |
| **Dashboard** | session + wizard настроек |

### Рекомендация

Не начинай новый app. Module 6 — про **где жить shared state** поверх routing и UI.

### Checklist

- [ ] выбран проект
- [ ] `npm run dev` ок
- [ ] понятно, какие фичи будут stores

---

## Шаг 2. Зафиксировать MVP Module 6

### MVP (обязательно)

- `pinia` установлен, `app.use(pinia)`
- минимум **2 отдельных store** по доменам (не один mega-store)
- **Cart** (или эквивалент): add/remove, badge в header, page `/cart`
- **Favorites** *или* **Auth session** (лучше оба, если успеваешь)
- getters с понятными именами (`totalQty`, `isAuthenticated`, …)
- мутации домена **только через actions**
- явный пример **local state** (modal / draft input / panel open)
- явный пример «почему это в store, а не в component» (1–2 предложения в заметке)

### Из README practice — покрытие

| Тема README | MVP |
|-------------|-----|
| корзина | обязательно |
| избранное | обязательно *или* stretch, если сделал auth глубже |
| сессия пользователя | mock login/logout + optional guard |
| wizard на несколько шагов | optional / stretch |

### Не обязательно в MVP

- persist в localStorage
- реальный backend auth
- Pinia plugins
- Vuex-style modules tree
- класть catalog products list в store «для кеша»

### Checklist

- [ ] MVP записан
- [ ] scope не уехал в полный Module 7 data layer

---

## Шаг 3. Подключить Pinia

```bash
npm install pinia
```

```ts
// main.ts
const pinia = createPinia()
app.use(pinia)
app.use(router)
```

### Checklist

- [ ] pinia до использования stores
- [ ] DevTools → Pinia видна
- [ ] структура `src/stores/` создана

---

## Шаг 4. Таблица Local vs Store

До кода заполни:

| State | Local / URL / Store | Почему |
|-------|---------------------|--------|
| filters panel open | | |
| category filter | | |
| cart items | | |
| favorite ids | | |
| current user | | |
| add-to-cart toast visible | | |
| wizard draft *(если есть)* | | |

### Checklist

- [ ] таблица заполнена
- [ ] в Store-колонке только то, что шарится / session-критично
- [ ] хотя бы 2 строки в Local

---

## Шаг 5. `useCartStore`

### Минимальный API

```text
state:  items: { productId, qty }[]
getters: totalQty, isEmpty
actions: add, remove, setQty, clear
```

Стиль: Options **или** Setup — один на проект.

### UI

- [ ] кнопка Add на Product Details (и/или карточке)
- [ ] badge `totalQty` в header (`App.vue`)
- [ ] page `/cart` (lazy route): список линий, изменить qty, remove, clear
- [ ] переход Catalog → Details → Cart **сохраняет** items

### Checklist

- [ ] нет прямых `cart.items.push` из UI
- [ ] одно предложение: «Cart store отвечает за …»
- [ ] имена actions — глаголы домена

---

## Шаг 6. `useFavoritesStore` *(recommended)*

```text
state:  ids: string[]
getters: count, has(id)
actions: toggle, clear
```

### UI

- [ ] toggle на карточке и/или details
- [ ] индикатор в header **или** page `/favorites`
- [ ] состояние общее между list и details

### Checklist

- [ ] отдельный файл store, не поля внутри cart
- [ ] `has(id)` через getter-функцию или эквивалент

---

## Шаг 7. `useAuthStore` — сессия *(recommended)*

Mock достаточно:

```text
state:  user, token? , status?, error?
getters: isAuthenticated, displayName
actions: login, logout  (login может быть async fake)
```

### UI / Router

- [ ] page `/login` с простой формой (email/password локально в page!)
- [ ] login → action → user в store
- [ ] logout в header
- [ ] optional: `meta.requiresAuth` + `beforeEach` на одну page (например `/cart` checkout или `/profile`)

### Важно

Form inputs (`email`, `password`) — **local** page state.
В store только результат сессии (`user`), не каждый keystroke.

### Checklist

- [ ] local form vs store session разделены
- [ ] logout делает `$reset` / clear session
- [ ] можешь объяснить, зачем session в store

---

## Шаг 8. Local-пример (обязательный критерий)

Сделай и пометь в коде/заметке что-то **осознанно local**:

Примеры:

- [ ] open/close cart drawer / filters panel
- [ ] controlled inputs на login до submit
- [ ] temporary «added!» tip на кнопке
- [ ] tab UI на details без store

### Checklist

- [ ] есть working local example
- [ ] записано: «Store здесь не нужен, потому что …»

---

## Шаг 9. Wizard *(optional stretch)*

Если делаешь:

- [ ] 2–3 steps (routes или один page + step state)
- [ ] draft в `useCheckoutWizardStore` **или** осознанно только в page+router
- [ ] `next` / `back` / `resetWizard`
- [ ] после submit — reset draft

Не обязателен для закрытия Module 6, если cart + (favorites|auth) + local example готовы.

---

## Шаг 10. provide/inject *(optional)*

Если props drilling на catalog filters уже болит:

- [ ] page-level `provide` filters API
- [ ] **не** заменяй этим cart/auth

Иначе skip с фразой: «drilling не болит — props ок».

---

## Шаг 11. Анти–god-store review

Пройди каждый store:

- [ ] описан одним предложением
- [ ] нет UI-флагов чужих pages
- [ ] нет полного products catalog «кешем без стратегии»
- [ ] нет цикла store↔store
- [ ] actions названы последовательно
- [ ] файл не свалка несвязанных тем

Если что-то лишнее — вынеси в local / URL / api / другой store.

---

## Шаг 12. Ручной QA

1. Add product → badge растёт  
2. Refresh **не** обязателен для persist; но navigation между pages cart жив  
3. Favorites toggle на list и details синхронен  
4. Login → protected UI доступен; logout → сброс  
5. Local modal/panel не протекает в Pinia state  
6. DevTools: видны отдельные stores и actions  

### Checklist

- [ ] сценарии пройдены
- [ ] нет full reload на внутренних переходах (Router на месте)

---

## Шаг 13. Финальная самопроверка

Ответь устно/письменно:

1. Где у тебя local достаточно — и почему?
2. Почему cart в store, а не только в `CartPage`?
3. Чем getters отличаются от state в твоём cart?
4. Почему login fields не в auth store?
5. Что бы ты отказался класть в Pinia «на будущее»?
6. Options vs Setup — что выбрал и почему?

### Checklist

- [ ] ответы своими словами, на своём коде

---

## Финальный checklist Module 6

Module 6 можно считать завершённым, если:

### Проект

- [ ] Pinia подключена
- [ ] ≥2 domain stores
- [ ] cart (или эквивалент) работает across pages
- [ ] app собирается и работает

### Критерии README

- [ ] есть пример, где local достаточно
- [ ] есть пример, где store нужен
- [ ] store не «склад всего подряд»
- [ ] данные и действия названы ясно
- [ ] можно объяснить, почему логика в store, а не в component

### Понимание

- [ ] лестница local → provide/URL → Pinia
- [ ] state / getters / actions роли
- [ ] Setup и Options хотя бы читаешь оба

---

## Stretch goals *(optional)*

- persist cart в `localStorage` + hydrate
- wizard checkout 3 steps
- `provide/inject` для catalog filters context
- Pinia + guard на checkout
- `store.$subscribe` для debug logging
- второй стиль store (переписать один Options ↔ Setup)

---

## Если что-то пошло не так

### UI не обновляется после деструктуризации

- `storeToRefs` для state/getters

### `useStore()` падает при старте

- `app.use(pinia)` до mount и до вызова в guards

### Cart сбрасывается при смене page

- store должен быть Pinia, не local state page
- не вызывай `$reset` случайно в `onUnmounted` page

### Всё оказалось в одном store

- split по таблице domains; не «потом»

### Filters «прыгают» после Back

- источник правды — URL; не дублируй в Pinia без sync

---

## Что делать после Module 6

Переходи к **Module 7 · Работа с сервером**:

- `fetch` / `axios`
- loading / error / success / empty
- pagination, abort, retries
- когда нужен отдельный data layer

Stores уже есть — Module 7 научит **не превращать Pinia в единственный HTTP-слой**.

---

## Мини-конспект

- Module 6 = shared client state без свалки
- cart / favorites / session — типичные stores
- local UI и URL остаются законными
- следующий фокус — **серверные данные и их состояния** (Module 7)
