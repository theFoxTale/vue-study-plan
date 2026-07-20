# Module 3 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 3**: спроектировать **дерево компонентов**, собрать **базовый UI-kit**, сделать **catalog + cards + modal** и пройти **a11y pass**.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 2 должен быть закрыт

- [ ] понимаешь `ref` / `reactive` / `computed` / `watch`
- [ ] есть минимум 2 composables
- [ ] есть async scenario с loading/error
- [ ] уверенно пишешь `<script setup lang="ts">`

### Прочитай теорию Module 3

- [01 · props](01-props.md)
- [02 · emits](02-emits.md)
- [03 · slots](03-slots.md)
- [04 · named slots](04-named-slots.md)
- [05 · scoped slots](05-scoped-slots.md) *(можно легко на первом проходе)*
- [06 · component registration](06-component-registration.md)
- [07 · container / presentational](07-container-presentational.md)
- [08 · UI decomposition](08-ui-decomposition.md)
- [09 · accessibility basics](09-accessibility-basics.md)

---

## Шаг 1. Выбрать базу проекта

Для Module 3 лучше **продолжить Product Catalog из Module 2**.

| Вариант | Когда выбирать |
|---------|----------------|
| **Продолжить Module 2 catalog** | recommended |
| **Movie Search UI** | если catalog ещё не начинал, но хочешь cards + modal |
| **Recipe Book** | если удобнее category cards + details modal |

### Рекомендация

Не начинай новый pet-project с нуля, если уже есть catalog.
Module 3 про architecture и UI-kit, а не про новый domain.

### Checklist

- [ ] выбран проект-база
- [ ] понятно, что улучшаем: decomposition + UI-kit + modal + a11y

---

## Шаг 2. Зафиксировать MVP Module 3

Не строй design system целиком. Для Module 3 достаточно:

### MVP

- дерево components с понятными ролями
- UI-kit: `BaseButton`, `BaseCard`, `BaseModal` *(optional: `BaseInput`)*
- catalog page как container
- product cards
- modal с details / confirm
- named slots в card/modal
- props/emits без лишней logic duplication
- keyboard-friendly interactive UI

### Не нужно в MVP

- router
- Pinia
- full focus-trap library
- theme system
- storybook

### Checklist

- [ ] MVP записан в 6-8 пунктов
- [ ] scope не расползся в Module 4+

---

## Шаг 3. Нарисовать component tree

Перед кодом нарисуй дерево:

```text
CatalogPage (container)
├─ BaseCard
│  └─ ProductFilters (presentational)
├─ ProductList (presentational/semi)
│  └─ ProductCard (presentational)
└─ BaseModal (presentational shell)
   ├─ #header
   ├─ default content
   └─ #actions → BaseButton
```

### Checklist

- [ ] дерево нарисовано
- [ ] для каждого node понятна роль: container / feature / base
- [ ] нет God Component в плане

---

## Шаг 4. Разложить папки

Рекомендуемая структура:

```text
src/
  components/
    base/
      BaseButton.vue
      BaseCard.vue
      BaseModal.vue
      BaseInput.vue          # optional
    catalog/
      ProductFilters.vue
      ProductList.vue
      ProductCard.vue
  composables/
    useProducts.ts
    useProductFilters.ts
  types/
    product.ts
  pages/                    # or keep in App.vue
    CatalogPage.vue
  App.vue
  main.ts
```

### Checklist

- [ ] `base/` отделён от `catalog/`
- [ ] registration = local imports
- [ ] нет global `app.component()` без причины

---

## Шаг 5. Собрать UI-kit: `BaseButton`

Требования:

- `<button>` semiantic
- prop `type` с default `'button'`
- prop `disabled`
- default slot + fallback text
- `:focus-visible` styles
- optional `ariaLabel` для icon-only

### Checklist

- [ ] `BaseButton.vue` создан
- [ ] используется минимум в 2 местах
- [ ] нет clickable `div` вместо button

---

## Шаг 6. Собрать UI-kit: `BaseCard`

Требования:

- named slots: `header`, `default`, `footer`
- conditional wrappers через `$slots`
- только presentational shell

Пример API:

```vue
<BaseCard>
  <template #header>Filters</template>
  <ProductFilters ... />
  <template #footer>Tip text</template>
</BaseCard>
```

### Checklist

- [ ] `BaseCard.vue` создан
- [ ] `$slots.header` / `$slots.footer` учитываются
- [ ] card используется для filters и/или list

---

## Шаг 7. Собрать UI-kit: `BaseModal`

Требования:

- props: `open`
- emit: `close`
- slots: `header`, `default`, `actions`
- `role="dialog"`
- `aria-modal="true"`
- close button с `aria-label`
- закрытие по `Escape`
- focus-visible на controls внутри

### Checklist

- [ ] `BaseModal.vue` создан
- [ ] modal open/close работает
- [ ] content задаётся через slots, а не через десяток props

---

## Шаг 8. Сделать `ProductCard` presentational

Props минимум:

- `id`, `name`, `price`
- optional `isSelected`

Emits минимум:

- `select`

Optional:

- `#badge` / `#actions` named slots

### Checklist

- [ ] card не делает fetch
- [ ] card не знает про весь catalog state
- [ ] select идёт через emit
- [ ] actions используют `BaseButton`

---

## Шаг 9. Сделать `ProductList`

Вариант A — простой:

- props: `products`, `isLoading`, `error`
- внутри всегда `ProductCard`

Вариант B — flexible *(optional)*:

- scoped slot `#item="{ product }"`

### Checklist

- [ ] loading / error / empty states есть
- [ ] list не владеет fetch
- [ ] `@select` пробрасывается наверх или обрабатывается осознанно

---

## Шаг 10. Сделать `ProductFilters` controlled

Props:

- `query`
- `sortBy`

Emits:

- `update:query`
- `update:sortBy`

A11y:

- labels для search/sort
- native `input` / `select`
- не только placeholder

### Checklist

- [ ] filters controlled через props/emits или `v-model:*`
- [ ] labels связаны через `for`/`id`
- [ ] нет mutation props

---

## Шаг 11. Собрать `CatalogPage` как container

Container должен:

- подключать composables
- владеть selected product / modal open state
- передавать props вниз
- слушать emits
- не содержать весь card markup inline

```vue
<ProductFilters v-model:query="query" v-model:sort-by="sortBy" />
<ProductList ... @select="openProduct" />
<BaseModal :open="Boolean(selected)" @close="selected = null">
  ...
</BaseModal>
```

### Checklist

- [ ] page = container
- [ ] fetch/filter logic не размазана по cards
- [ ] modal content собирается на page/feature уровне

---

## Шаг 12. Добавить modal scenario

Минимум один сценарий:

### A. Product details

- click card → open modal
- show name/price
- action: Add to cart *(можно mock)* / Close

### B. Confirm delete/reset

- reset filters через confirm modal

### Checklist

- [ ] modal открывается из user action
- [ ] modal закрывается button + Escape
- [ ] selected/trigger state принадлежит container

---

## Шаг 13. Проверить props / emits design

Для каждого feature component заполни:

| Component | Props | Emits | Slots |
|-----------|-------|-------|-------|
| ProductFilters | | | |
| ProductList | | | |
| ProductCard | | | |
| BaseModal | | | |

### Checklist

- [ ] нет god props (`data`, `flags`, `everything`)
- [ ] event names semantic (`select`, `close`, не `clickStuff`)
- [ ] slots там, где иначе начался boolean props hell

---

## Шаг 14. Проверить decomposition quality

Ответь честно:

1. Можно ли объяснить каждый component одной фразой?
2. Есть ли файл, который хочется назвать `Stuff.vue`?
3. Не слишком ли мелко нарезано?
4. Не остался ли God Component?

### Checklist

- [ ] 1 component ≈ 1 responsibility
- [ ] base отделён от feature
- [ ] дерево читается без боли

---

## Шаг 15. A11y pass

Пройди UI только клавиатурой:

- [ ] `Tab` / `Shift+Tab` по filters, cards actions, modal controls
- [ ] buttons активируются `Enter` / `Space`
- [ ] focus ring виден (`:focus-visible`)
- [ ] у inputs есть labels
- [ ] icon-only close имеет `aria-label`
- [ ] нет clickable `div` для actions
- [ ] modal имеет `role="dialog"` и закрывается по `Escape`

### Checklist

- [ ] keyboard flow работает
- [ ] semantic HTML на месте
- [ ] a11y blockers из теории Module 3 закрыты

---

## Шаг 16. Visual polish без overdesign

Минимум:

- readable spacing
- card/list hierarchy
- modal overlay/panel
- loading/error/empty понятны

Не нужен pixel-perfect design system.

### Checklist

- [ ] UI понятен без объяснений
- [ ] base components выглядят согласованно
- [ ] `<style scoped>` используется

---

## Шаг 17. Lint + build

```bash
npm run lint
npm run build
```

### Checklist

- [ ] lint проходит
- [ ] build проходит

---

## Шаг 18. Финальная самопроверка

Ответь без подсказок:

1. Чем container отличается от presentational?
2. Когда нужен slot вместо prop?
3. Зачем named slots в modal/card?
4. Почему local registration предпочтительнее global?
5. Какие a11y правила ты сознательно соблюл?
6. Где в проекте props down / events up?

### Checklist

- [ ] могу объяснить дерево components
- [ ] могу объяснить UI-kit boundaries
- [ ] могу пройти UI с клавиатуры и объяснить focus behavior

---

## Финальный checklist Module 3

Module 3 можно считать завершённым, если:

### Проект

- [ ] есть catalog/cards/modal scenario
- [ ] UI разбит на небольшие components с понятной ответственностью
- [ ] есть базовый reusable UI-kit

### Технические требования

- [ ] props и emits не дублируют лишнюю logic
- [ ] slots используются там, где реально упрощают reuse
- [ ] есть named slots минимум в card или modal
- [ ] container/presentational роли соблюдены
- [ ] registration через local imports

### A11y

- [ ] semantic buttons/labels
- [ ] visible focus states
- [ ] базовые interactive elements доступны с клавиатуры

### Понимание

- [ ] понимаю, как проектировать component API
- [ ] понимаю, когда резать UI, а когда не дробить
- [ ] понимаю разницу base vs feature components

---

## Stretch goals *(optional)*

Если MVP уже готов:

- `BaseInput` с label API
- scoped slot `#item` в `ProductList`
- focus move into modal on open + restore on close
- empty/error as small presentational components
- `#badge` slot в `ProductCard`
- darken/disable background interaction while modal open
- очень лёгкий UI tokens: spacing/colors CSS variables

Не обязательно для закрытия Module 3.

---

## Если что-то пошло не так

### Слишком много props

- вынеси custom UI в slots
- проверь, не тащишь ли domain object туда, где хватит primitives

### Modal неудобен с клавиатуры

- добавь Escape
- проверь focus ring
- сделай close настоящим `<button>`

### Card знает слишком много

- убери fetch/composables из card
- оставь props + emits

### UI-kit получился domain-specific

- переименуй/вынеси product logic в `catalog/`
- base оставь без слов `product` / `cart`

### Непонятно, куда класть state

- page/feature state → container
- pure UI local state → presentational
- shared logic → composable

---

## Что делать после Module 3

Переходи к **Module 4 · TypeScript во Vue**:

- typing props/emits
- generics в components *(по мере необходимости)*
- более строгие models для product/filters

Если catalog стал сквозным проектом — сохрани его.
В Module 4 можно ужесточить types без смены UI architecture.

---

## Мини-конспект

- Module 3 = component architecture + reusable UI-kit + basic a11y
- цель — уметь проектировать дерево, а не только «вынести кусок в файл»
- props/emits/slots = полный contract
- container orchestrates, presentational renders
- keyboard-ready UI — часть Definition of Done
