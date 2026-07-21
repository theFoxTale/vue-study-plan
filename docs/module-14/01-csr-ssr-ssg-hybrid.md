# Module 14 · Теория: CSR, SSR, SSG и hybrid rendering

Этот материал открывает **Module 14** и закрывает первый теоретический пункт: **CSR / SSR / SSG / hybrid** — что отдаёт сервер, что делает браузер, как это влияет на SEO, TTFB и catalog/storefront, и зачем потом появляется Nuxt.

Связанные материалы:

- [Module 13 · practice checklist](../module-13/10-practice-checklist.md)
- [Module 12 · load optimization](../module-12/09-page-load-optimization.md)

---

## 1. Зачем Module 14 после Module 13

```text
Module 5–13  → Vue + Vite SPA: router, query, architecture
Module 14    → как HTML появляется до/вместо «пустого #app»
```

До сих пор типичный путь:

```text
index.html (почти пустой) → JS bundle → Vue mount → fetch → UI
```

Это **CSR** (Client-Side Rendering). Отлично для dashboard / logged-in app. Хуже, когда важны:

- первый HTML с контентом (SEO, шаринг ссылок)
- LCP на медленной сети без ожидания всего JS
- маркетинг / блог / storefront product pages

Module 14 — **модели доставки HTML**, не отмена Vue.

Официально / ориентиры:

- [Nuxt · Rendering Modes](https://nuxt.com/docs/guide/concepts/rendering)
- [web.dev · Rendering on the Web](https://web.dev/articles/rendering-on-the-web)

---

## 2. CSR — Client-Side Rendering

```text
Server:  отдаёт shell HTML + JS/CSS
Browser: скачивает JS → hydrate/mount → data fetch → paint content
```

```html
<!-- типичный Vite index.html -->
<div id="app"></div>
<script type="module" src="/src/main.ts"></script>
```

| Плюсы | Минусы |
|-------|--------|
| простой деплой (static hosting) | пустой/бедный первый HTML |
| богатый интерактивный UI | SEO/соцпревью слабее без доработки |
| знакомый Vue SPA | TTI зависит от JS budget |

**Когда ок:** admin, cart после login, внутренние tools, твой catalog как **учебный SPA**.

**Product page для Google/OG:** CSR часто недостаточно без prerender/SSR.

---

## 3. SSR — Server-Side Rendering

```text
Request /product/42
  → server runs Vue → HTML с title, price, description
  → browser показывает контент сразу
  → JS грузится → hydration → app становится интерактивным
```

```text
TTFB выше (сервер считает HTML)
FCP/LCP контента часто лучше
нужен Node (или edge) runtime, не только CDN static
```

| Плюсы | Минусы |
|-------|--------|
| HTML с данными для ботов и людей | сложность: server + client bundle |
| лучше SEO / share cards | hydration cost; state sync |
| персонализация на запросе | нагрузка на сервер |

**Hydration** — клиент «оживляет» серверный HTML: вешает listeners, подключает reactivity. Ошибки hydration (HTML ≠ то, что client ожидает) — классическая боль SSR.

```text
SSR ≠ «без JavaScript».
SSR = первый HTML полный; интерактив — после JS.
```

---

## 4. SSG — Static Site Generation

```text
Build time:
  для /about, /blog/hello, /product/1…N
  → заранее сгенерировать HTML файлы

Runtime:
  CDN отдаёт готовый HTML (как static)
  → опционально hydrate в SPA
```

| Плюсы | Минусы |
|-------|--------|
| очень быстрый TTFB (CDN) | данные на build могут устареть |
| дешёвый хостинг | тысячи products → долгий build |
| отлично для docs/blog | не для per-user HTML |

**Incremental / on-demand** re-generation (в экосистеме Nuxt/Nitro) смягчает «всё пересобрать».

```text
SSG = SSR, но «заранее», не на каждый request
```

---

## 5. Hybrid rendering

Реальный продукт редко «только SSR» или «только SSG»:

```text
/                  → SSG (landing)
/blog/[slug]       → SSG или ISR
/product/[id]      → SSR (цена/сток свежие)
/account/**        → CSR (SPA, за login)
/admin/**          → CSR
```

**Hybrid** = разные стратегии на разные routes.

Nuxt 3 это first-class: `routeRules`, `ssr: false` per route, `prerender: true`, etc. — детали в следующих уроках.

```text
Выбирай режим на уровне URL, не «религии фреймворка».
```

---

## 6. Сравнительная таблица

| | CSR | SSR | SSG |
|---|-----|-----|-----|
| HTML с контентом | после JS | на request | на build |
| Hosting | static | Node/edge | static/CDN |
| SEO | слабо из коробки | сильно | сильно |
| Свежесть данных | runtime fetch | per request | build / revalidate |
| Сложность | низкая | выше | средняя |
| Catalog list | ok SPA | ok | ok если не huge |
| Product SEO page | слабо | ✅ | ✅ если стабильно |
| Cart/checkout | ✅ | optional | редко |

---

## 7. Метрики: что меняется

Из Module 12 load lens:

| Метрика | CSR risk | SSR/SSG help |
|---------|----------|--------------|
| **LCP** | ждёт JS + API | HTML/image раньше |
| **TTFB** | низкий (static) | SSR выше; SSG низкий |
| **CLS** | skeleton → content | HTML уже с размерами — легче |
| **INP** | после hydrate | hydrate + тот же JS |

```text
SSR не отменяет толстый bundle.
Плохой JS → плохой INP даже с красивым первым HTML.
```

Code splitting и архитектура Module 12–13 **всё ещё нужны**.

---

## 8. Data fetching: где выполняется

```text
CSR:     browser → API
SSR:     server (при request) → API → HTML; browser может reuse payload
SSG:     build machine → API → HTML files
```

**Payload / payload extraction** — сервер сериализует данные в HTML/JSON, клиент не обязан refetch сразу (Nuxt `useAsyncData` / `useFetch` — следующие уроки).

Опасности SSR:

```text
localStorage на server → нет
window на server → нет
разный HTML от Date.now() / random → hydration mismatch
```

Пиши **universal** код или ветви `import.meta.client` / `import.meta.server` (Nuxt).

---

## 9. Catalog / storefront: какая модель

| Страница | Разумный default |
|----------|------------------|
| Marketing landing | SSG |
| Product detail (SEO) | SSR или SSG+revalidate |
| Catalog filters (много комбинаций) | CSR или SSR с cache |
| Cart / checkout | CSR (SPA mode) |
| Blog/docs | SSG |
| Admin | CSR |

Учебный **Vue + Vite catalog** остаётся CSR — это нормально. Module 14 учит **когда** вынести витрину на Nuxt.

---

## 10. Куда здесь Nuxt 3

Собрать SSR вручную на Vite + `vue/server-renderer` + Express — можно, но много glue:

- server entry + client entry
- router sync
- data serialization
- head/meta
- deployment

**Nuxt 3** = conventions + Nitro server + file routing + rendering modes из коробки.

Следующий урок: [зачем Nuxt 3](./02-why-nuxt.md).

```text
Rendering modes — понятие.
Nuxt — удобный способ их применять в Vue-экосистеме.
```

---

## 11. Частые ошибки

### «SSR = быстрее всегда»

TTFB может вырасти; без cache SSR медленнее SSG.

### CSR + «SEO потом»

Соцсети и боты видят пустой `#app`.

### SSG на каталог 100k SKU без стратегии

Build на часы; нужен SSR/ISR/partition.

### Hydration mismatch игнор

Мигание, сломанный UI, warning в консоли.

### Думать что SPA «устарел»

Для app-like UX SPA/CSR часто лучший DX и деплой.

---

## 12. Что важно понять после этого блока

Проверь себя:

1. Чем CSR отличается от SSR в момент первого байта HTML?
2. SSG vs SSR — когда что?
3. Что такое hybrid rendering на примере storefront?
4. Зачем hydration?
5. Почему толстый JS всё ещё важен при SSR?
6. Какой режим для `/account` vs `/product/:id`?

---

## 13. Что почитать

### Официальное / ориентиры

- [Nuxt · Rendering Modes](https://nuxt.com/docs/guide/concepts/rendering)
- [Vue · SSR Guide](https://vuejs.org/guide/scaling-up/ssr.html)
- [web.dev · Rendering on the Web](https://web.dev/articles/rendering-on-the-web)

### Связанные материалы этого плана

- [Module 12 · page load](../module-12/09-page-load-optimization.md)
- [Module 13 · architecture](../module-13/01-folder-structure.md)

---

## 14. Практическое мини-задание

1. Открой свой Vite catalog → View Source: есть ли product title в HTML?
2. Таблица: 5 URL будущего storefront → CSR/SSR/SSG.
3. Объясни другу hydration одной фразой.
4. Найди один риск hydration в коде (`window`, `localStorage`, `Date`).
5. Запиши: для текущего pet-project Nuxt **нужен / не нужен** и почему.

---

## 15. Мини-конспект

- **CSR** — JS рисует UI; простой деплой, слабый первый HTML
- **SSR** — HTML на request; SEO/контент раньше; нужен server
- **SSG** — HTML на build; CDN-fast; данные могут устареть
- **Hybrid** — разные режимы на разные routes
- Nuxt упрощает режимы; архитектура Vue всё ещё важна
- дальше — **зачем Nuxt 3**

---

## 16. Что делать дальше

Следующий теоретический блок Module 14:

- [Зачем нужен Nuxt 3](./02-why-nuxt.md)
