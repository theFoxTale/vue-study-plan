# Module 13 · Теория: базовые принципы масштабируемости

Этот материал закрывает последний теоретический пункт Module 13: **базовые принципы масштабируемости** — как держать Product Catalog живым при росте фич и людей, без переписывания каждые полгода; чеклист «масштабируется / нет».

Связанные материалы:

- [Module 13 · слои](./03-shared-ui-entities-features-pages.md)
- [Module 13 · feature-based](./02-feature-based.md)
- [Module 12 · practice](../module-12/11-practice-checklist.md)

---

## 1. Что значит «масштабируется» здесь

```text
Не «миллионы RPS».
А: новый экран / человек / фича —
   не ломает половину app и не требует недельного поиска «куда положить».
```

| Масштаб | Признак здоровья |
|---------|------------------|
| **Код** | изменение cart не трогает login |
| **Команда** | два PR в разных features без merge hell |
| **Время** | через 6 месяцев находишь ProductCard за минуту |
| **Качество** | tests + границы слоёв ловят регрессии |

Module 13 дал **инструменты** (папки, слои, api, stores, env). Этот урок — **принципы**, которые решают споры.

---

## 2. Принцип 1 — границы важнее папок

```text
Папки без правил импорта = перестановка мебели.
Правила зависимостей = несущие стены.
```

```text
pages → features → entities → shared
```

Нарушение «на пять минут» становится постоянным coupling.

**Практика:** в `ARCHITECTURE.md` одна диаграмма + «запрещено: shared → features».

---

## 3. Принцип 2 — меняй по фиче, не по слою целиком

Плохой PR:

```text
«Refactor all components» — 80 файлов
```

Хороший:

```text
features/cart: add coupon line item
  ui + store action + test
```

Feature-based + public API → **blast radius** маленький.

Если правка одного бага требует 15 папок — граница feature слишком дырявая.

---

## 4. Принцип 3 — composition over god-modules

```text
CatalogPage = filters + grid + badge
не = useEntireCatalogWorld()
```

То же для stores и composables ([уроки 06–07](./06-composables-layer.md)).

```text
Масштабирование = складывать маленькие куски,
не растить один файл до 2000 строк.
```

---

## 5. Принцип 4 — явные контракты (public API)

```ts
import { CartBadge, useCartStore } from '@/features/cart'
```

```text
Внутри feature можно ломать папки.
Снаружи — только то, что в index.ts.
```

Без контракта deep imports → рефакторинг cart ломает admin, checkout, tests по всему репо.

---

## 6. Принцип 5 — один источник правды на тип знания

| Знание | Источник |
|--------|----------|
| `Product` shape | `entities/product` |
| products cache | vue-query |
| cart lines | `useCartStore` |
| API base URL | `shared/config/env` |
| «Add to cart» UX | `features/cart` |

Дублирование `interface Product` в трёх features — масштабируется в **баги рассинхрона**.

---

## 7. Принцип 6 — server/client/UI не смешивать

```text
fetch + parse     → api
cache/status      → vue-query
session/cart      → pinia
button look       → shared/ui
scenario glue     → feature composable
```

Смешение = невозможность тестировать и кешировать независимо (Modules 8, 11, 12).

---

## 8. Принцип 7 — оптимизируй после измерения

Module 12:

```text
Сначала граница и подписки,
потом v-memo / shallowRef.
```

«Масштабируемая архитектура» не равна «всё memoized». Лишняя сложность тоже не масштабируется (когнитивно).

---

## 9. Принцип 8 — тесты на границах

Высокий ROI при росте:

| Граница | Тест |
|---------|------|
| parse/schema | unit |
| store invariants | store test |
| critical form | component |
| api contract | mock api module |

Не нужно 100% coverage. Нужны **замки на дверях** между слоями.

Tests позволяют **перекладывать папки** (practice Module 13) без страха.

---

## 10. Принцип 9 — документируй мало, но жёстко

```markdown
# ARCHITECTURE.md (1–2 экрана)
- Layers + import rule
- Naming (Base*, use*, *Page)
- Where: api / stores / env
- How to add a feature (5 steps)
```

```text
20 страниц «видения» никто не читает.
12 правил, которые PR review enforce — работают.
```

---

## 11. Принцип 10 — эволюционируй, не big-bang

```text
Плоский src → shared/ui
           → pages/
           → features/cart
           → entities/product
```

Каждый шаг shippable. Rewrite «под FSD за выходные» часто умирает на половине.

Критерии README Module 13: **переразложить** проект + короткий документ — инкрементально ok.

---

## 12. Когда усложнять структуру

| Сигнал | Действие |
|--------|----------|
| `components/` > 30 файлов без доменов | feature / entity split |
| два Product type | entity + parse |
| circular imports | public API + dependency rule |
| PR conflict каждый раз в App.vue | thin pages + features |
| onboarding > 1 день «где код» | ARCHITECTURE.md + naming |

| Ещё рано | Не делай |
|----------|----------|
| 8 файлов todo | полный FSD + widgets + processes |
| один разработчик, 2 недели жизни | microfrontends |

**Масштабируемость ≠ максимальная структура сейчас.**

---

## 13. Catalog: «здоровый» целевой снимок

```text
app/           bootstrap
pages/         thin routes
features/      cart, auth, catalog, checkout?
entities/      product, user, cart-line
shared/        ui, api, config, lib, composables
tests green
ARCHITECTURE.md
.env.example
```

Новый «wishlist»:

```text
1. entities/product already has Product
2. features/wishlist/ + store or query
3. page или slot на detail
4. tests на store/api
```

Без трогания login и http client.

---

## 14. Чеклист «масштабируется ли мой PR?»

Перед merge спроси:

1. Затронуты ли чужие features без нужды?
2. Соблюдён ли import direction?
3. Есть ли новый deep import вместо public API?
4. Не появился ли god composable/store?
5. Env/URL не захардкожены?
6. Есть ли тест на новую границу (parse/action)?
7. Имена по `ARCHITECTURE.md`?

Если 2+ «нет» — PR ухудшает масштаб.

---

## 15. Частые ошибки «роста»

### Framework churn вместо границ

«Перейдём на X» каждые полгода — не масштабирование продукта.

### Shared как свалка

Всё «переиспользуемое» → shared → снова monolith.

### Преждевременная абстракция

`createGenericCrudFeatureFactory` на одном ресурсе.

### Игнор Module 11–12

Архитектура без tests и без изоляции подписок — хрупкая.

### Документ без enforcement

Правила только в Notion; в коде deep imports процветают.

---

## 16. Что важно понять после этого блока

Проверь себя:

1. Масштабируемость в Module 13 — про что?
2. Почему границы важнее красивых папок?
3. Пример маленького blast radius PR?
4. Один источник правды — приведи 2 примера catalog?
5. Когда FSD-полный стек рано?
6. Что должно быть в коротком `ARCHITECTURE.md`?

---

## 17. Что почитать

### Связанные материалы этого плана

- [Module 13 · слои](./03-shared-ui-entities-features-pages.md)
- [Module 13 · feature-based](./02-feature-based.md)
- [Module 11 · testing philosophy](../module-11/09-testing-philosophy.md)
- [Module 12 · лишние rerenders](../module-12/02-unnecessary-rerenders.md)

### Ориентиры

- [Feature-Sliced Design · Motivations](https://feature-sliced.design/docs/get-started/overview)
- [Vue Style Guide](https://vuejs.org/style-guide/)

---

## 18. Практическое мини-задание

1. Оцени catalog: какой принцип нарушен сильнее всего?
2. Напиши 10–15 строк `ARCHITECTURE.md` (слои + naming + «how to add feature»).
3. Один PR: вынеси один домен с маленьким blast radius.
4. Добавь правило в review: no `shared` → `features` imports.
5. Список «ещё рано» vs «сделать сейчас» для своего проекта.

---

## 19. Мини-конспект

- масштаб = **дешёвые изменения** и ясный поиск кода
- границы, composition, public API, single source of truth
- server/client/UI разделены; tests на границах
- документ короткий; эволюция incremental
- **теория Module 13 завершена** → practice checklist

---

## 20. Что делать дальше

Теория Module 13 завершена. Переходи к практике:

- [Module 13 · practice checklist](./10-practice-checklist.md) — слои + ARCHITECTURE.md, build/tests green
