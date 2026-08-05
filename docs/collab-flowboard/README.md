# FlowBoard — совместный fullstack-проект

Один продукт (**FlowBoard**), общий API-контракт, **два сценария backend** на выбор + Vue frontend.

| Роль | Стек | Документ |
|------|------|----------|
| **Продукт (что строим)** | Экраны, домен, слои, DoD | [product-spec.md](product-spec.md) |
| Frontend (ты) | Vue 3, TypeScript, Vite, Router, Pinia, Vue Query | [frontend-vue-plan.md](frontend-vue-plan.md) |
| Backend · сценарий A | Go, Gin, PostgreSQL | [backend-go-plan.md](backend-go-plan.md) |
| Backend · сценарий B | Java, Spring Boot, PostgreSQL | [backend-java-plan.md](backend-java-plan.md) |
| Общее | REST JSON, JWT | [api-contract.md](api-contract.md) |

Фронтенд **не зависит** от языка backend: оба сценария обязаны соблюдать один контракт. Можно вести два API-репозитория параллельно (Go-друг и Java-друг) и переключать `VITE_API_BASE_URL`.

> Перед кодом прочитайте [product-spec.md](product-spec.md) — там эскизы UI, доменная модель, внутренние компоненты и критерии «готово».

---

## Сценарии backend

### A · Go + Gin + PostgreSQL
Для знакомого, который целится в Go-backend.  
Старт с нуля по модулям **B0–B10**, ориентир **10–12 недель**.

→ [backend-go-plan.md](backend-go-plan.md)

### B · Java + Spring Boot + PostgreSQL
Для знакомого на JavaRush:

- [Java Syntax](https://javarush.com/courses/java) — **завершён**
- [Java 25](https://javarush.com/courses/java25) — раздел **«ООП и современные возможности»**, урок **Interfaces**

План **J0–J10** идёт **параллельно** курсу (не вместо него): сначала добить OOP/Collections, затем Spring + Postgres. Ориентир **12–16 недель**.

→ [backend-java-plan.md](backend-java-plan.md)

| | Сценарий A (Go) | Сценарий B (Java) |
|--|-----------------|-------------------|
| HTTP | Gin | Spring Web |
| DB access | pgx → repository | JDBC → Spring Data JPA |
| Migrations | golang-migrate | Flyway |
| Auth | JWT middleware | Spring Security + JWT |
| Курс «сбоку» | Tour of Go + доки | JavaRush Java 25 → Spring in Practice |

---

## Идея продукта

**FlowBoard** — лёгкий трекер личных/учебных задач. Кратко ниже; полное ТЗ: **[product-spec.md](product-spec.md)**.

- регистрация и вход;
- проекты (например «Vue», «Java API», «Go API»);
- задачи: статус, приоритет, дедлайн, теги;
- комментарии к задачам;
- простой дашборд: «сегодня», «просрочено», статистика по статусам.

Достаточно «настоящее» для портфолио и достаточно узкое, чтобы дойти до конца.

---

## Зачем именно это

| Для frontend | Для любого backend |
|--------------|--------------------|
| Auth-формы, protected routes | JWT / security filter |
| CRUD + фильтры + пагинация | SQL, индексы, query params |
| Pinia / Vue Query | Слои: controller → service → repository |
| Optimistic UI, ошибки API | Валидация, коды ошибок, CORS |
| Деплой SPA | Docker, migrations, env |

---

## Правила совместной работы

1. **Контракт раньше кода.** Сначала [api-contract.md](api-contract.md) v0.1, потом реализация.
2. **Репозитории:** `flowboard-web` + `flowboard-api-go` и/или `flowboard-api-java` (или monorepo `web/`, `api-go/`, `api-java/`).
3. **Mock-first на frontend.** Пока API нет — MSW / фикстуры по контракту.
4. **Одна неделя = один milestone** внутри выбранного сценария.
5. **Definition of Done:** работает end-to-end (или mock), есть README запуска, баги в Issues.
6. **Синк 1–2 раза в неделю** с тем backend-партнёром, с которым сейчас идёт интеграция.

---

## Общий таймлайн продукта (одинаковый для A и B)

| Неделя* | Milestone | Backend (идея) | Frontend |
|--------|-----------|----------------|----------|
| 0 | Setup | Hello server | Vite Vue TS, layout |
| 1 | Health + CORS | `GET /health` | Env, API client |
| 2 | Auth v1 | Register/Login JWT | Login/Register |
| 3 | Projects CRUD | Таблица + CRUD | Projects list/create |
| 4 | Tasks CRUD | Tasks + FK | Tasks board/list |
| 5 | Filters | Query, pagination | Filters, Vue Query |
| 6 | Tags | M2M | Tag chips |
| 7 | Comments | Nested resource | Task detail |
| 8 | Hardening | Validation, errors | Error/empty/loading |
| 9 | Tests + Docker | Tests, compose | E2E smoke |
| 10+ | Polish | Deploy, docs | Deploy, demo |

\*Для **Java (B)** недели 0–2 часто растягиваются: сначала J0–J1 (OOP/Collections) параллельно JavaRush.

Детали упражнений: [backend-go-plan.md](backend-go-plan.md) или [backend-java-plan.md](backend-java-plan.md).

---

## Рекомендуемые инструменты

**Общие**

- Git + GitHub Issues / Projects
- Контракт → позже OpenAPI/Swagger
- Postman / Insomnia / Bruno или `curl`

**Backend A (Go):** Go 1.22+, Gin, pgx, golang-migrate, Docker Postgres  

**Backend B (Java):** JDK 21+, Spring Boot 3, Flyway, Spring Data JPA, Spring Security, Docker Postgres  

**Frontend:** Vue 3 + TypeScript + Vite + Router + Pinia + Vue Query — [Vue study plan](../../README.md)

---

## Критерий «проект готов»

- Регистрация → проект → задача → комментарий.
- Фильтры и пагинация задач.
- Frontend ходит в **реальный** API выбранного сценария.
- `docker compose up` для API + Postgres.
- README со скринами и инструкцией.

---

## С чего начать

### С Go-знакомцем
1. Контракт v0.1  
2. Он: **B0–B1**  
3. Ты: **F0–F1** (mock)  
4. Демо: `/health` + «API online»

### С Java-знакомцем
1. Контракт v0.1  
2. Он: добить JR **Interfaces** + упражнение **J0**  
3. Ты: **F0–F1** (mock) — не блокируешься  
4. Когда у него Collections (J1) + Boot `/health` (J2) — первое совместное демо

### Если оба backend сразу
Держать два base URL (`VITE_API_GO_URL` / `VITE_API_JAVA_URL` или переключатель в UI) и гонять одни и те же e2e-сценарии по контракту — отличное сравнение стеков.
