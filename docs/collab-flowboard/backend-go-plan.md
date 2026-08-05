# Backend plan — Go · Gin · PostgreSQL

Учебный трек для self-taught backend-разработчика.  
Каждый модуль = теория + упражнение + критерий готовности + материалы.  
Сложность растёт. Итоговый продукт — API для **FlowBoard** ([README](README.md), ТЗ: [product-spec.md](product-spec.md)).

> Совет: не прыгать через модули. Если застрял > 2 дня — упростить упражнение, но не пропускать идею.

---

## Карта модулей

| # | Тема | Сложность |
|---|------|-----------|
| [B0](#b0--основы-go) | Основы Go | ★☆☆☆☆ |
| [B1](#b1--первый-http-сервер-на-gin) | Gin Hello + routing | ★☆☆☆☆ |
| [B2](#b2--json-api-без-бд) | JSON REST in-memory | ★★☆☆☆ |
| [B3](#b3--postgresql-с-нуля) | PostgreSQL + SQL | ★★☆☆☆ |
| [B4](#b4--gin--postgres-crud) | CRUD Projects | ★★★☆☆ |
| [B5](#b5--auth-jwt) | Auth JWT | ★★★☆☆ |
| [B6](#b6--tasks-связи-и-запросы) | Tasks, FK, filters | ★★★☆☆ |
| [B7](#b7--теги-и-many-to-many) | Tags M2M | ★★★★☆ |
| [B8](#b8--комментарии-и-слоистая-архитектура) | Comments + layers | ★★★★☆ |
| [B9](#b9--ошибки-валидация-безопасность) | Errors, validation, security | ★★★★☆ |
| [B10](#b10--тесты-docker-деплой) | Tests, Docker, deploy | ★★★★★ |

Параллельный фронт: [frontend-vue-plan.md](frontend-vue-plan.md).  
Контракт: [api-contract.md](api-contract.md).

---

## B0 · Основы Go

### Цель
Писать простые программы, понимать пакеты, ошибки, структуры, слайсы, интерфейсы на базовом уровне.

### Упражнение
1. Установить Go, настроить `GOPATH`/`GOMOD` (модули).
2. Пройти A Tour of Go (хотя бы до Methods / Interfaces).
3. CLI-утилита `todo`: add / list / done, хранение в JSON-файле.

### Готово, когда
- `go run .` работает;
- ошибки обрабатываются через `if err != nil`;
- можешь объяснить разницу `slice` vs `array`, `var` vs `:=`.

### Материалы
- [A Tour of Go](https://go.dev/tour/)
- [How to write Go code](https://go.dev/doc/code)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go by Example](https://gobyexample.com/)
- [Learning Go (free chapters / overview)](https://www.oreilly.com/library/view/learning-go-2nd/9781098139285/) — опционально как книга

---

## B1 · Первый HTTP-сервер на Gin

### Цель
Понять routing, handlers, middleware, JSON-ответ.

### Упражнение
1. Модуль `flowboard-api`, зависимость Gin.
2. `GET /health` → `{ "status": "ok" }`.
3. `GET /version` → версия из константы/`ldflags`.
4. Лог каждого запроса (свой middleware или встроенный logger Gin).

### Готово, когда
- сервер слушает `:8080`;
- Postman/`curl` получают JSON;
- README: как запустить.

### Материалы
- [Tutorial: RESTful API with Go and Gin (official)](https://go.dev/doc/tutorial/web-service-gin)
- [Gin documentation](https://gin-gonic.com/docs/)
- [Gin GitHub](https://github.com/gin-gonic/gin)

---

## B2 · JSON API без БД

### Цель
CRUD в памяти, path params, status codes, валидация входа.

### Упражнение
In-memory `projects`:
- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`
- `POST /api/v1/projects`
- `PUT /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`

Правила:
- 404 если нет id;
- 400 если пустое `name`;
- ответы в едином JSON-формате (см. контракт).

### Готово, когда
- полный CRUD через HTTP-клиент;
- данные пропадают после рестарта (это ок);
- написан короткий чеклист ручных тестов.

### Материалы
- снова [Gin web-service tutorial](https://go.dev/doc/tutorial/web-service-gin)
- [HTTP status codes (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [RFC 7807 problem details](https://datatracker.ietf.org/doc/html/rfc7807) — идея единого формата ошибок (можно упростить)

---

## B3 · PostgreSQL с нуля

### Цель
Уметь поднять Postgres, писать SQL, понимать таблицы/ключи/типы.

### Упражнение
1. Postgres в Docker (`postgres:16`).
2. Создать БД `flowboard`.
3. Таблица `projects` вручную (`psql` или GUI).
4. Вставить 5 строк, сделать `SELECT` с `WHERE` / `ORDER BY`.
5. Нарисовать на бумаге схему: `users`, `projects`, `tasks`, `tags`, `task_tags`, `comments`.

### Готово, когда
- контейнер поднимается одной командой;
- схема нарисована и согласована с фронтом;
- понимаешь `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `UNIQUE`.

### Материалы
- [PostgreSQL Tutorial (official-ish community)](https://www.postgresql.org/docs/current/tutorial.html)
- [PostgreSQL docs — Getting started](https://www.postgresql.org/docs/current/)
- [SQLBolt](https://sqlbolt.com/) — интерактивный SQL
- [Docker Hub postgres](https://hub.docker.com/_/postgres)
- [pgAdmin](https://www.pgadmin.org/) или [DBeaver](https://dbeaver.io/) — по желанию

---

## B4 · Gin + Postgres CRUD

### Цель
Подключить БД к API, вынести SQL в repository, миграции.

### Упражнение
1. Драйвер **pgx** (`pgxpool`).
2. Миграции через [golang-migrate](https://github.com/golang-migrate/migrate): `projects`.
3. Перенести CRUD projects с in-memory на Postgres.
4. Конфиг через env: `DATABASE_URL`, `PORT`, `GIN_MODE`.

### Готово, когда
- после рестарта данные на месте;
- миграции применяются командой из README;
- нет SQL в handlers (хотя бы минимальный слой `repository`).

### Материалы
- [pgx documentation](https://pkg.go.dev/github.com/jackc/pgx/v5)
- [database/sql (Go)](https://pkg.go.dev/database/sql) — полезно понимать даже с pgx
- [golang-migrate](https://github.com/golang-migrate/migrate)
- [12-factor config](https://12factor.net/config)
- Пример архитектуры: [Task API with Go, PostgreSQL and Docker](https://oshy.tech/en/blog/go-task-api-postgresql-docker/)

---

## B5 · Auth JWT

### Цель
Регистрация, логин, защищённые роуты, пароли не в открытом виде.

### Упражнение
1. Таблица `users` (email unique, password_hash).
2. `POST /api/v1/auth/register`, `POST /api/v1/auth/login`.
3. Hash: **bcrypt**.
4. JWT access token (и опционально refresh — можно позже).
5. Middleware `AuthRequired` → кладёт `userID` в context.
6. Projects только для владельца (`user_id`).

### Готово, когда
- без токена CRUD projects → 401;
- чужой project → 403/404;
- пароль в БД не plaintext.

### Материалы
- [jwt-go / golang-jwt](https://github.com/golang-jwt/jwt)
- [bcrypt (golang.org/x/crypto/bcrypt)](https://pkg.go.dev/golang.org/x/crypto/bcrypt)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Gin middleware](https://gin-gonic.com/docs/using-middleware/)
- Введение в JWT: [jwt.io Introduction](https://jwt.io/introduction)

---

## B6 · Tasks: связи и запросы

### Цель
Связь 1:N, фильтры, пагинация, сортировка.

### Упражнение
Таблица `tasks`:
- `project_id`, `title`, `description`, `status`, `priority`, `due_date`, timestamps.

Endpoints:
- CRUD `/api/v1/projects/:projectId/tasks` и/или `/api/v1/tasks/:id`
- Query: `status`, `priority`, `q` (поиск по title), `page`, `limit`, `sort`

Статусы: `todo` | `doing` | `done`.  
Приоритеты: `low` | `medium` | `high`.

### Готово, когда
- нельзя создать task в чужом project;
- пагинация возвращает `items` + `total` (или `meta`);
- индекс на `(project_id, status)` в миграции.

### Материалы
- [PostgreSQL indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Pagination patterns](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design#paginate-long-running-requests) — общие идеи
- [SQL JOIN](https://www.postgresql.org/docs/current/tutorial-join.html)

---

## B7 · Теги и many-to-many

### Цель
Понять M2M, связующую таблицу, фильтрацию по тегу.

### Упражнение
1. `tags` + `task_tags`.
2. Создать/назначить/снять теги у задачи.
3. `GET /api/v1/tasks?tag=backend`.
4. При удалении tag — поведение явное (restrict / cascade) и описано в README.

### Готово, когда
- у задачи несколько тегов;
- фильтр по тегу работает;
- нет дублей в `task_tags` (`UNIQUE(task_id, tag_id)`).

### Материалы
- [Many-to-many in SQL](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [UNIQUE constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS)

---

## B8 · Комментарии и слоистая архитектура

### Цель
Nested resource + привести структуру проекта к «взрослому» виду.

### Упражнение
1. `comments` (task_id, user_id, body).
2. `GET/POST /api/v1/tasks/:id/comments`, `DELETE /api/v1/comments/:id`.
3. Рефакторинг папок, например:

```text
cmd/api/main.go
internal/config/
internal/http/          # router, middleware, handlers
internal/domain/        # entities
internal/service/       # business rules
internal/repository/    # SQL
internal/auth/
migrations/
```

### Готово, когда
- handlers тонкие;
- бизнес-правила не в SQL-файлах «наобум»;
- новый endpoint добавляется без копипасты на 100 строк.

### Материалы
- [Standard Go Project Layout](https://github.com/golang-standards/project-layout) (ориентир, не догма)
- [Go blog: Package names](https://go.dev/blog/package-names)
- [Clean Architecture notes (Go)](https://manuel.kiessling.net/2012/09/28/applying-the-clean-architecture-in-go/) — идеи, адаптировать по силам

---

## B9 · Ошибки, валидация, безопасность

### Цель
Предсказуемые ошибки для фронта, базовая безопасность API.

### Упражнение
1. Единый error JSON: `{ "error": { "code": "...", "message": "..." } }`.
2. Валидация через `binding` tags Gin + свои проверки.
3. CORS только для origin фронта.
4. Rate limit на `/auth/login` (простой in-memory ок).
5. Не логировать пароли/токены.
6. `.env.example` без секретов.

### Готово, когда
- фронт может мапить `code` → UI-сообщение;
- CORS не «*» в проде;
- checklist security в README (хотя бы 5 пунктов).

### Материалы
- [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [Gin model binding & validation](https://gin-gonic.com/docs/examples/binding-and-validation/)
- [CORS MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Go Secure Coding Practices](https://github.com/OWASP/Go-SCP)

---

## B10 · Тесты, Docker, деплой

### Цель
Уверенность при изменениях + воспроизводимый запуск.

### Упражнение
1. Unit-тесты service (таблицами).
2. Integration-тест хотя бы на projects CRUD (testcontainers или docker postgres в CI).
3. `Dockerfile` multi-stage + `docker-compose.yml` (api + db).
4. Деплой API (Railway / Fly.io / Render / VPS — на выбор).
5. Короткий `API.md` или Swagger UI.

### Готово, когда
- `docker compose up` поднимает API;
- `go test ./...` зелёный;
- фронт ходит на staging URL.

### Материалы
- [testing package](https://pkg.go.dev/testing)
- [table-driven tests](https://go.dev/wiki/TableDrivenTests)
- [testcontainers-go](https://golang.testcontainers.org/)
- [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [swaggo/swag](https://github.com/swaggo/swag) — опционально OpenAPI из аннотаций

---

## Мини-чеклист прогресса (для него)

Скопируй в Issue и отмечай:

- [ ] B0 Tour + CLI todo
- [ ] B1 `/health`
- [ ] B2 in-memory projects
- [ ] B3 Postgres + схема
- [ ] B4 projects в БД + migrations
- [ ] B5 JWT auth
- [ ] B6 tasks + filters
- [ ] B7 tags M2M
- [ ] B8 comments + folder layout
- [ ] B9 errors/CORS/security
- [ ] B10 tests + docker + deploy

---

## Частые ловушки self-taught

1. **Сразу ORM + clean architecture** — сначала `pgx` + простой repository.
2. **Игнор миграций** — схема «руками в GUI» быстро разъедется.
3. **Один огромный `main.go`** — боль после B6.
4. **Токен в query string** — только `Authorization: Bearer`.
5. **Молчать о контракте** — ломает фронт; любые breaking changes писать в PR/чат.

---

## Что читать параллельно (по 20–40 мин в день)

| Тема | Ссылка |
|------|--------|
| Go FAQ | https://go.dev/doc/faq |
| Go Code Review Comments | https://go.dev/wiki/CodeReviewComments |
| PostgreSQL exercises | https://pgexercises.com/ |
| REST best practices (overview) | https://restfulapi.net/ |
| JSON API design (pragmatic) | https://cloud.google.com/blog/products/api-management/practical-api-design-best-practices-google-cloud |

Удачи. Цель — не «идеальный enterprise», а **законченный API**, которым можно пользоваться с Vue-фронта.

Параллельный сценарий на Java: [backend-java-plan.md](backend-java-plan.md).
