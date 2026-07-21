# Module 14 · Теория: когда Nuxt, а когда Vue + Vite

Этот материал закрывает последний теоретический пункт Module 14: **decision guide** — когда Nuxt 3 оправдан, когда достаточно Vue + Vite SPA, как объяснить выбор для pet-project / storefront / admin, и типичные ложные причины миграции.

Связанные материалы:

- [Module 14 · зачем Nuxt](./02-why-nuxt.md)
- [Module 14 · CSR/SSR/SSG](./01-csr-ssr-ssg-hybrid.md)
- [Module 13 · scalability](../module-13/09-scalability.md)

---

## 1. Нет универсального «правильного» стека

```text
Nuxt — не апгрейд личности разработчика.
Vue + Vite — не «устаревший учебный костыль».
```

Оба валидны. Выбор = **продуктовые ограничения** + команда + хостинг + SEO/HTML нужды.

Критерий README Module 14: уметь объяснить, **почему для этого проекта выбран Nuxt** (или почему нет).

---

## 2. Быстрый decision tree

```text
Нужен HTML с контентом до JS для ботов/превью/LCP?
  ├─ нет → Vue + Vite SPA обычно достаточно
  └─ да
       Нужны server routes / BFF / hybrid modes в одном репо?
         ├─ да → Nuxt сильный кандидат
         └─ нет, только статика из MD/CMS
              → Nuxt SSG ИЛИ Vite SSG (Astro/VitePress…) тоже ок
```

```text
Приложение только за логином (admin, CRM, internal)?
  → Vue + Vite (или Nuxt с ssr: false) — SSR редко окупается
```

---

## 3. Когда **достаточно Vue + Vite**

| Сигнал | Пример |
|--------|--------|
| App-like UX за auth | admin panel, settings |
| SEO не цель | внутренний tool |
| Уже сильный SPA стек | Router + Pinia + vue-query Modules 5–13 |
| Деплой = static CDN | GitHub Pages, простой S3 |
| Команда знает SPA, нет SSR опыта | меньше рисков |
| Учебный Product Catalog | цель — Vue skills, не витрина Google |

```text
Modules 5–13 catalog на Vite — правильный выбор для обучения.
Переписывать его на Nuxt «чтобы было» — не обязательно.
```

Nuxt practice Module 14 = **отдельный маленький проект** (blog/docs/mini-storefront), не долг переписать всё.

---

## 4. Когда **Nuxt действительно нужен** (или очень уместен)

| Сигнал | Пример |
|--------|--------|
| Публичные landing / product / blog URL | storefront, media |
| Share preview (OG) из HTML | маркетинг ссылки |
| Hybrid: public SSR + private CSR | shop + account |
| BFF /api рядом с UI | один деплой MVP |
| File routing + layouts как стандарт команды | скорость фич |
| Prerender docs/content | documentation site |
| Нужен Nitro deploy story | Node/edge presets |

```text
Сильный аргумент: «нам нужен HTML на /products/:id и /api BFF».
Слабый аргумент: «auto-import приятнее».
```

---

## 5. Серые зоны — оба варианта ок

| Проект | Vue + Vite | Nuxt |
|--------|------------|------|
| Marketing one-pager | Vite + prerender plugin | Nuxt prerender |
| Blog | VitePress / Astro | Nuxt Content |
| Storefront MVP | SPA + prerender critical URLs | Nuxt hybrid |
| SaaS marketing + app | два репо (site Nuxt + app Vite) | monorepo Nuxt hybrid |

```text
Иногда лучше ДВА приложения:
  www (Nuxt SSG) + app (Vite SPA)
чем один гигантский hybrid с конфликтующими требованиями
```

Архитектура Module 13 помогает решить границы даже между репозиториями.

---

## 6. Ложные причины выбрать Nuxt

| Миф | Реальность |
|-----|------------|
| «Nuxt быстрее всегда» | SSR может поднять TTFB; JS всё ещё важен |
| «Без Nuxt нет карьеры» | Vue SPA вакансий много; SSR — плюс, не культ |
| «Pinia только в Nuxt» | Pinia отлично в Vite |
| «File routing обязателен» | Vue Router явный — норма |
| «SEO включил ssr: true» | нужны meta, контент, sitemap… |
| «Перепишем за выходные» | hydration, env, deploy — недооценка |

---

## 7. Ложные причины остаться на SPA навсегда

| Миф | Реальность |
|-----|------------|
| «Боты всё равно исполняют JS» | нестабильно; OG часто нет |
| «Prerender никогда не нужен» | docs/landing выигрывают сильно |
| «Server в Nuxt = микросервисы» | BFF MVP ≠ платформа компании |
| «Мы добавим SEO потом» | миграция дороже, чем заложить hybrid рано |

Если продукт **становится** публичной витриной — пересмотри выбор.

---

## 8. Стоимость Nuxt (честно)

```text
+ conventions, SSR/SSG, server routes, SEO helpers
− новая mental model (server/client boundaries)
− hydration bugs
− сложнее деплой, чем static SPA
− часть библиотек «window-only» требует .client components
```

```text
Стоимость Vite SPA:
+ простота, знакомый Module 5–13 стек
− бедный первый HTML; SEO/OG вручную или отдельный сайт
```

Считай **стоимость команды**, не только npm install.

---

## 9. Как объяснить выбор (шаблон)

Для README / practice Module 14:

```markdown
## Why Nuxt (or not)

Project: mini storefront / blog / …

Chose Nuxt because:
- public product/blog URLs need HTML in first response
- useFetch + server/api as BFF for mock catalog
- routeRules: prerender home, SSR product, CSR account

(or)

Chose Vue + Vite because:
- app is behind auth / learning SPA architecture
- no SEO requirement for this codebase
- deploy static; Nuxt would add unused SSR complexity
```

Рекрутер/ментор хочет **связку проблема → инструмент**, не название фреймворка.

---

## 10. Миграция Vite SPA → Nuxt (когда всё же да)

Инкрементально:

```text
1. Новый Nuxt app для публичных pages (не big-bang)
2. Перенос pages/components постепенно
3. API → server/api или оставить backend
4. Pinia/composables — почти as-is
5. vue-query → useAsyncData точечно или оставить
```

```text
Не мигрируй admin CRM «за компанию» с витриной.
```

---

## 11. Матрица «учебный трек этого плана»

| Артефакт плана | Стек |
|-----------------|------|
| Product Catalog Modules 5–13 | **Vue + Vite** |
| Module 14 practice | **Nuxt 3** маленький проект |
| Module 15 final | по требованиям README — часто Vue; Nuxt если SSR/SEO в скоупе |

Ты **владеешь обоими** решениями — это и есть цель Module 14.

---

## 12. Чеклист перед выбором на реальном проекте

1. Кто потребитель URL: пользователь-за-логином или Google/OG?  
2. Нужен ли first HTML с контентом?  
3. Нужен ли server/BFF в том же репо?  
4. Какой хостинг уже есть (static-only vs Node)?  
5. Есть ли у команды SSR опыт / время на hydration?  
6. Один app или site+app?  
7. Можно ли объяснить выбор в 5 предложениях?

Если п.7 не получается — выбор ещё не ясен.

---

## 13. Частые ошибки

### Nuxt для todo за auth «как в туториале»

Overkill.

### Vite SPA для SEO-магазина «потом meta добавим»

Техдолг.

### Смешать Nuxt 2 советы с Nuxt 3 проектом

Другая эпоха.

### Выбрать Nuxt ради одной landing

Иногда Vite + prerender быстрее; Nuxt ок, если дальше будет контент/API.

### Игнорировать Module 13 в Nuxt

God `pages/` на любом фреймворке.

---

## 14. Что важно понять после этого блока

Проверь себя:

1. Когда SPA на Vite — правильный default?
2. Три сильных сигнала «нужен Nuxt»?
3. Пример ложной причины взять Nuxt?
4. Зачем отдельный Nuxt practice, не миграция catalog?
5. Что написать в «Why Nuxt» для storefront?
6. Когда лучше два репозитория (www + app)?

---

## 15. Что почитать

### Официальное

- [Nuxt · Introduction](https://nuxt.com/docs/getting-started/introduction)
- [Nuxt · Rendering Modes](https://nuxt.com/docs/guide/concepts/rendering)
- [Vue · SSR](https://vuejs.org/guide/scaling-up/ssr.html)

### Связанные материалы этого плана

- [Module 14 · why Nuxt](./02-why-nuxt.md)
- [Module 14 · deployment](./10-deployment.md)
- [Module 13 · scalability](../module-13/09-scalability.md)

---

## 16. Практическое мини-задание

1. Возьми 3 своих идеи проектов — для каждого Vue или Nuxt + 1 предложение why.
2. Catalog Modules 5–13: оставить Vite — аргументы (минимум 3).
3. Module 14 practice: выбери blog **или** mini-storefront — why Nuxt.
4. Напиши абзац «Why Nuxt» в README будущего Nuxt-репо.
5. Список «не мигрируем на Nuxt» для текущего SPA.

---

## 17. Мини-конспект

- выбор = **HTML/SEO/BFF/hybrid нужды**, не хайп
- Vite SPA — default для app-like / auth / учёбы Modules 5–13
- Nuxt — публичные URL, hybrid, server/api, content sites
- избегай ложных причин; считай стоимость SSR
- умей объяснить выбор письменно
- **теория Module 14 завершена** → practice checklist

---

## 18. Что делать дальше

Теория Module 14 завершена. Переходи к практике:

- [Module 14 · practice checklist](./12-practice-checklist.md) — Nuxt MVP + SEO/prerender + Why Nuxt
