# Module 12 · Теория: `v-once`

Этот материал закрывает четвёртый теоретический пункт Module 12: **`v-once`** — однократный рендер поддерева, когда данные **не должны** обновляться, и как не заморозить UI catalog по ошибке.

Связанные материалы:

- [Module 12 · key](./03-key.md)
- [Module 12 · лишние перерендеры](./02-unnecessary-rerenders.md)

---

## 1. Что делает `v-once`

```vue
<footer v-once>
  <p>© 2026 Product Catalog</p>
  <p>{{ companyName }}</p>
</footer>
```

```text
Первый render  → вычислить интерполяции, создать VDOM
Дальнейшие parent rerender → поддерево v-once ПРОПУСКАЕТСЯ (no update)
```

**`v-once`** помечает узел (и **всех потомков**) как **статический после первого mount**: Vue не запускает для них update pass, когда перерисовывается родитель.

Официально:

- [Built-in Directives · v-once](https://vuejs.org/api/built-in-directives.html#v-once)
- [Performance · Stable Templates](https://vuejs.org/guide/best-practices/performance.html)

---

## 2. Зачем это в perf-стеке

После [урока 02](./02-unnecessary-rerenders.md) ты снижаешь **число** rerender. `v-once` — узкий инструмент: parent **всё ещё** rerender'ится, но **тяжёлое статическое** поддерево не участвует в diff.

```text
CatalogPage rerender (filters, query)
  ├─ ProductGrid        ← обновляется
  ├─ MarketingBanner    ← v-once, skip
  └─ AppFooter          ← v-once, skip
```

Экономия: CPU на diff/patch **frozen** веток. Не замена архитектуре.

---

## 3. Синтаксис и область действия

### На элементе

```vue
<article v-once>
  <h1>{{ product.title }}</h1>
  <div v-html="sanitizedDescription" />
</article>
```

Весь `<article>` и дети — **freeze at first paint**.

### На компоненте

```vue
<LegalNotice v-once />
```

Root компонента + его template — once. **Props при первом render** «запекаются» — см. §6.

### Внутри `v-for` *(редко)*

```vue
<li v-for="item in items" :key="item.id">
  <span v-once>{{ expensiveFormat(item) }}</span>
  <span>{{ item.livePrice }}</span>
</li>
```

Только `expensiveFormat` block once **per item instance** — первое значение при создании строки.

---

## 4. Когда `v-once` уместен

| Сценарий catalog | Пример |
|------------------|--------|
| Статический footer / legal | copyright, links |
| Marketing block без reactive deps | hero text from build-time constant |
| «Snapshot» после load | редко — см. осторожность |
| Heavy pure markup | long policy text, docs sidebar |
| Dev-only labels | `v-once` + static string |

**Критерий:** «После первого показа этот DOM **никогда** не должен меняться от reactive state».

```vue
<!-- ok: constant from env at build -->
<p v-once>API: {{ import.meta.env.VITE_API_URL }}</p>

<!-- ok: no reactive refs in subtree -->
<aside v-once>
  <h2>How to shop</h2>
  <ol><li>Browse</li><li>Add to cart</li></ol>
</aside>
```

---

## 5. Когда НЕ использовать

| ❌ | Почему |
|----|--------|
| `ProductCard` price/qty | данные меняются |
| Cart total, badges | reactive |
| I18n locale switch | текст должен обновиться |
| Theme dark/light | классы/стили меняются |
| Любой user input | v-model dead after first render |
| «Parent rerender часто — заморожу всё» | сломаешь UX |

```vue
<!-- ❌ цена заморожена на первом refetch -->
<ProductCard v-once :product="product" />
```

**Правило:** если сомневаешься — **без** `v-once`. Сначала isolate rerender ([02](./02-unnecessary-rerenders.md)).

---

## 6. Props и «запекание» на первом render

```vue
<!-- Parent -->
<StaticSummary v-once :product="product" />
```

```vue
<!-- StaticSummary.vue — первый product навсегда -->
<template>
  <p>{{ product.title }}</p>
</template>
```

Parent меняет `product` → **`StaticSummary` не обновится**.

**Fix:** не вешать `v-once` на компонент с **live props**. Либо only static slots:

```vue
<StaticFrame v-once>
  <!-- slot content evaluated once — тоже freeze! -->
</StaticFrame>
```

Slot content — часть parent render → при `v-once` на child slot **тоже** once.

---

## 7. `v-once` vs `v-memo`

| | `v-once` | `v-memo` |
|---|----------|----------|
| Updates | **никогда** | когда deps изменились |
| Use case | truly static | skip diff if props same |
| Control | zero | `[dep1, dep2]` array |
| Risk | stale UI | wrong deps → stale UI |

```vue
<!-- v-memo: skip if product.id and title unchanged -->
<div v-memo="[product.id, product.title]">
  <HeavyProductCard :product="product" />
</div>
```

`v-once` — частный случай «deps никогда не меняются». Подробнее — [урок 05](./05-v-memo.md).

---

## 8. Catalog: практичные примеры

### Footer

```vue
<template>
  <main><!-- reactive catalog --></main>
  <AppFooter v-once />
</template>
```

`AppFooter` — links, copyright; не зависит от cart/filters.

### Product detail: static «About shipping»

```vue
<section class="product-main">
  <ProductBuyBox :product="product" />
</section>

<section v-once class="shipping-info">
  <h2>Shipping</h2>
  <p>Free over $50. Delivery 3–5 days.</p>
</section>
```

Copy одинаков для всех товаров — ok.

### НЕ v-once: описание товара из API

```vue
<!-- product может refetch / edit admin -->
<div>{{ product.description }}</div>
```

Если description приходит с server и может обновиться — без `v-once`.

### Expensive format один раз *(осторожно)*

```vue
<p v-once>{{ formatSpecs(product.specs) }}</p>
```

Только если `specs` **immutable** после load detail page. Смена route → new component instance → новый once.

---

## 9. Взаимодействие с reactivity

```text
v-once subtree НЕ подписывается на последующие изменения refs,
прочитанных при первом render этого subtree
```

Parent rerender из-за `cartCount` → `v-once` footer **не** читает cart → skip.

Если внутри `v-once` был `{{ cartCount }}` — значение **навсегда** первое.

**DevTools:** frozen subtree не мигает при highlight updates — норма.

---

## 10. SSR и hydration

На SSR первый render = server HTML. `v-once` на client продолжит skip updates — hydration согласована с «один раз».

Не используй `v-once` чтобы **скрыть** hydration mismatch — fix data/template.

---

## 11. Альтернативы до `v-once`

```text
1. Вынести static block в отдельный component без reactive imports
2. Hardcode / import markdown as string constant
3. Split layout — hot/cold branches (урок 02)
4. v-memo — если данные редко меняются, но меняются
```

Отдельный `AppFooter.vue` **без** store в setup — часто достаточно без директивы.

---

## 12. Частые ошибки

### `v-once` на page root

Вся страница frozen — filters/cart «не работают».

### Забыли про i18n

Locale switch — footer остаётся на старом языке.

### v-once + live props

См. §6 — классический «цена не обновилась после refetch».

### v-once вместо fix architecture

Parent rerender 50 child — лучше split, не 50× once.

### v-once на `<form>`

Submit, validation, errors — всё мёртвое.

### Думать что v-once = cache computed

Computed **reactive**; v-once **не**.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Что происходит с поддеревом `v-once` при parent rerender?
2. Можно ли `v-once` на `ProductCard` с live price?
3. Чем `v-once` отличается от `v-memo`?
4. Пример **static** блока в catalog для `v-once`?
5. Что случится со slot content внутри `v-once` child?
6. Когда лучше отдельный component без store, чем `v-once`?

---

## 14. Что почитать

### Официальное

- [v-once](https://vuejs.org/api/built-in-directives.html#v-once)
- [v-memo](https://vuejs.org/api/built-in-directives.html#v-memo)
- [Performance](https://vuejs.org/guide/best-practices/performance.html)

### Связанные материалы этого плана

- [Module 12 · лишние перерендеры](./02-unnecessary-rerenders.md)
- [Module 12 · key](./03-key.md)

---

## 15. Практическое мини-задание

1. Найди footer / static sidebar — кандидат на `v-once` или cold component?
2. Проверь: есть ли `v-once` на reactive data — bug?
3. Parent rerender + DevTools — frozen block не обновляется?
4. Сравни: cold `AppFooter` без store vs `v-once` — что проще?
5. Product detail: какие секции **static** vs **live** — список.

---

## 16. Мини-конспект

- **v-once** = render subtree **один раз**, skip all future updates
- только **truly static** content
- live props / i18n / theme → **не** v-once
- parent rerender ok; frozen branch skips diff
- альтернатива — cold component; **`v-memo`** — conditional skip
- дальше — **`v-memo`**

---

## 17. Что делать дальше

Следующий теоретический блок Module 12:

- [`v-memo`](./05-v-memo.md)
