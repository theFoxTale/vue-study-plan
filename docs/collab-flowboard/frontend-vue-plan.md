# Frontend plan — Vue 3 (FlowBoard)

Параллельный трек к backend:

- Go: [backend-go-plan.md](backend-go-plan.md) (модули B*)
- Java: [backend-java-plan.md](backend-java-plan.md) (модули J*)

Ты можешь идти по своему [Vue study plan](../../README.md); ниже — **привязка к общему продукту**.  
Ожидаемые экраны и компоненты: [product-spec.md](product-spec.md).  
Контракт один: [api-contract.md](api-contract.md).

---

## Принцип

| Пока backend… | Frontend делает… |
|---------------|------------------|
| Go B0–B2 **или** Java J0–J3 | F0–F2 на **mock** |
| Go B3–B4 **или** Java J4–J5 | F3 projects → real API |
| Go B5 **или** Java J6 | F4 auth real JWT |
| Go B6–B7 **или** Java J7–J8 | F5–F6 tasks + tags |
| Go B8–B10 **или** Java J9–J10 | F7–F9 detail, polish, deploy |

Если одновременно два API — переключатель base URL; UI и типы не меняются.

---

## F0 · Каркас приложения

- Vite + Vue 3 + TypeScript
- Vue Router: `/login`, `/register`, `/projects`, `/projects/:id`
- Базовый layout (nav + content)
- Env: `VITE_API_BASE_URL`

**Материалы:** твой Module 1–5 study plan; [Vite](https://vitejs.dev/guide/), [Vue Router](https://router.vuejs.org/).

---

## F1 · API client + типы

- `src/shared/api/http.ts` (fetch/axios)
- Типы DTO 1:1 с контрактом
- Interceptor: `Authorization` header
- Единый разбор ошибок `{ error: { code, message } }`

**Готово:** один typed `getHealth()`.

---

## F2 · Auth UI (mock)

- Формы register/login (VeeValidate + Zod — по желанию, Module 9)
- Сохранение token (memory + `localStorage`)
- Navigation guard на protected routes
- Mock handlers под контракт auth

**Материалы:** Pinia (Module 6), Router guards (Module 5).

---

## F3 · Projects

- Список проектов, создание, rename, delete
- Empty / loading / error states
- Сначала mock → потом real `GET/POST /projects`

---

## F4 · Real auth

- Подключить B5 endpoints
- Logout, «сессия протухла» → на login
- Не хранить password; не логировать token

---

## F5 · Tasks board/list

- Список задач проекта
- Смена статуса (select или колонки kanban — на выбор)
- Фильтры: status, priority, search
- Пагинация
- Vue Query для server state (Module 8)

---

## F6 · Tags

- Чипы тегов на задаче
- Фильтр `?tag=`
- Создание тега / assign / unassign

---

## F7 · Task detail + comments

- Страница/drawer задачи
- Список комментариев + форма
- Оптимистичное добавление комментария (по желанию)

---

## F8 · UX hardening

- Toasts / inline errors по `error.code`
- Skeleton loaders
- Confirm на delete
- Адаптив базовый

---

## F9 · Deploy + demo

- Frontend: Netlify / Cloudflare Pages / Vercel
- CORS origin согласовать с backend
- README: скриншоты, тест-аккаунт, ссылки

---

## Definition of Done (frontend)

Экран считается готовым, если:

1. Работает на mock **или** real API (явный режим в README).
2. Есть loading / empty / error.
3. Типы не расходятся с [api-contract.md](api-contract.md).
4. Можно показать на синке за 3 минуты.

---

## Мини-чеклист

- [ ] F0 scaffold + routes
- [ ] F1 http client + types
- [ ] F2 auth UI mock
- [ ] F3 projects
- [ ] F4 real JWT
- [ ] F5 tasks + filters
- [ ] F6 tags
- [ ] F7 comments
- [ ] F8 polish
- [ ] F9 deploy
