# Backend plan — Java · Spring Boot · PostgreSQL

Учебный трек для self-taught backend-разработчика на **Java**.  
Продукт тот же — **FlowBoard** ([README](README.md), полное ТЗ: [product-spec.md](product-spec.md)), контракт тот же — [api-contract.md](api-contract.md).

Альтернатива на Go: [backend-go-plan.md](backend-go-plan.md).

---

## Стартовая точка (важно)

| Курс | Статус |
|------|--------|
| [JavaRush «Java»](https://javarush.com/courses/java) | **Java Syntax** завершён |
| [JavaRush «Java 25»](https://javarush.com/courses/java25) | Раздел **«ООП и современные возможности»**, урок **5 · Интерфейсы** |

Значит: синтаксис уже есть, ООП в процессе, до Spring/SQL ещё рано «прыгать с двух ног».  
План ниже **не заменяет** JavaRush — он идёт **параллельно**: после каждого блока JR — маленькое упражнение для FlowBoard.

### Что добить в Java 25 до «уверенного Spring»

| Раздел JR Java 25 | Зачем для FlowBoard |
|-------------------|---------------------|
| Интерфейсы → продвинутые интерфейсы / functional | Репозитории, сервисы, `Comparator`, колбэки |
| Records | DTO / API-модели без бойлерплейта |
| ООП mistakes + exceptions | Чистый домен, нормальные ошибки |
| Git/GitHub (конец OOP-блока) | Совместная работа с фронтом |
| **Коллекции и Stream API** | Списки задач, фильтры, группировки |
| Файлы / JSON (хотя бы JSON) | Понимание сериализации до Spring |
| Лямбды | Streams, Spring callbacks |

Многопоточность / Virtual Threads / модули — **после** первых REST+DB вех (или фоном).

Полезные следующие курсы JR (когда дойдёте):

- [Spring in Practice](https://javarush.com/courses/spring-in-practice) — REST, JPA, Security, JWT, PostgreSQL  
- [Spring in Production](https://javarush.com/courses/spring-in-production) — тесты, Testcontainers, Docker  

---

## Карта модулей

| # | Тема | Сложность | Параллель с JR |
|---|------|-----------|----------------|
| [J0](#j0--добить-ооп-интерфейсы--records) | OOP: interfaces → records | ★☆☆☆☆ | Сейчас → конец «ООП…» |
| [J1](#j1--коллекции-и-домен-flowboard-в-памяти) | Collections + domain | ★★☆☆☆ | «Коллекции и Stream API» |
| [J2](#j2--сборка-проекта-и-spring-boot-hello) | Maven/Gradle + Boot | ★★☆☆☆ | После коллекций (можно раньше) |
| [J3](#j3--rest-api-без-бд) | REST in-memory | ★★☆☆☆ | Spring Web |
| [J4](#j4--postgresql--миграции--jdbc) | Postgres + SQL + JDBC | ★★★☆☆ | SQL с нуля |
| [J5](#j5--spring-data-jpa-crud-projects) | JPA Projects CRUD | ★★★☆☆ | Spring Data JPA |
| [J6](#j6--spring-security--jwt) | Auth JWT | ★★★★☆ | Spring Security |
| [J7](#j7--tasks-фильтры-пагинация) | Tasks + queries | ★★★★☆ | JPQL / Specifications |
| [J8](#j8--теги-many-to-many) | Tags M2M | ★★★★☆ | `@ManyToMany` |
| [J9](#j9--комментарии-ошибки-cors) | Comments + API polish | ★★★★☆ | ExceptionHandler, validation |
| [J10](#j10--тесты-docker-деплой) | Tests + Docker | ★★★★★ | Spring in Production |

Ориентир по срокам: **12–16 недель** спокойнее, чем Go-трек — часть времени уходит на JR.

---

## J0 · Добить ООП (Interfaces → Records)

### Цель
Уверенно пользоваться интерфейсами, абстракцией, records — языком «контрактов», как в API.

### Упражнение (параллельно JR)
1. Закончить JR: Interfaces → Advanced interfaces → Records → OOP best practices.
2. Свой мини-домен **без Spring**:
   - `interface TaskRepository { List<Task> findAll(); void save(Task t); }`
   - `class InMemoryTaskRepository implements TaskRepository`
   - `record Task(String id, String title, String status) {}`
3. Консольное меню: add / list / set status.

### Готово, когда
- Можешь объяснить: интерфейс vs абстрактный класс; зачем `record`.
- Реализацию репозитория можно заменить другой — вызовы кода не ломаются.

### Материалы
- JR: [Java 25 · OOP](https://javarush.com/courses/java25)
- [Oracle: Interfaces](https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html)
- [JEP 395: Records](https://openjdk.org/jeps/395)
- [Effective Java (Bloch)](https://www.oracle.com/java/technologies/effectivejava.html) — главы про interfaces/immutability (по желанию)

---

## J1 · Коллекции и домен FlowBoard в памяти

### Цель
`List` / `Map` / `Set`, generics, Stream — фильтры задач «как в API», но без HTTP.

### Упражнение
1. Пройти JR «Коллекции и Stream API» (хотя бы до уверенных Stream basics).
2. Модели: `User`, `Project`, `Task`, `Tag` (пока классы/records).
3. Сервис `TaskService`:
   - фильтр по `status`, `priority`;
   - поиск по title (`q`);
   - группировка `Map<String, Long>` count by status.
4. Написать 5–10 unit-тестов на сервис (**JUnit 5**) — даже без Spring.

### Готово, когда
- Фильтры работают на коллекциях;
- Есть тесты `./gradlew test` или Maven equivalent;
- Понимаешь `Optional`, `equals/hashCode` для entity-ключей.

### Материалы
- JR: Collections & Stream API (Java 25)
- [Oracle Collections tutorial](https://docs.oracle.com/javase/tutorial/collections/)
- [Stream API (Oracle)](https://docs.oracle.com/javase/8/docs/api/java/util/stream/package-summary.html)
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)

---

## J2 · Сборка проекта и Spring Boot Hello

### Цель
Собрать runnable backend-скелет, понять DI «на пальцах».

### Упражнение
1. JDK **21** или **25** (LTS/удобная версия под курс).
2. Spring Boot 3.x через [start.spring.io](https://start.spring.io/):
   - dependencies: Spring Web, Validation, PostgreSQL (пока можно не использовать), Flyway (позже).
3. `GET /health` → `{ "status": "ok" }`.
4. `application.yml` + profile `dev`.
5. README: как запустить.

### Готово, когда
- Приложение стартует одной командой;
- Понимаешь `@RestController`, `@GetMapping`, `@SpringBootApplication`.

### Материалы
- [Spring Boot Getting Started](https://spring.io/guides/gs/spring-boot/)
- [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
- [start.spring.io](https://start.spring.io/)
- IntelliJ + JR plugin (уже из курса)

---

## J3 · REST API без БД

### Цель
Те же endpoints, что у Go-трека на этапе B2: CRUD projects in-memory.

### Упражнение
Реализовать по [api-contract.md](api-contract.md):
- `GET/POST /api/v1/projects`
- `GET/PATCH/DELETE /api/v1/projects/{id}`
- Единый error body `{ "error": { "code", "message" } }`
- `@Valid` + DTO records
- `@ControllerAdvice` для ошибок

Пока **без auth** (добавите в J6) — либо заглушка `X-User-Id` для обучения.

### Готово, когда
- CRUD через Postman/`curl`;
- 400/404 отдаются в формате контракта;
- Controllers тонкие, логика в `@Service`.

### Материалы
- [Spring REST guide](https://spring.io/guides/gs/rest-service/)
- [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
- [Validation](https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html)
- [Problem Details / error handling overview](https://www.baeldung.com/exception-handling-for-rest-with-spring)

---

## J4 · PostgreSQL + миграции + JDBC

### Цель
Научиться SQL и доступу к БД **до** магии JPA (так проще понять, что делает Hibernate).

### Упражнение
1. Postgres 16 в Docker.
2. Flyway (или Liquibase): таблица `projects`.
3. Вариант A (рекомендуется сначала): **Spring JDBC** / `JdbcClient` / `JdbcTemplate`.
4. Перенести projects CRUD на БД.
5. Env: `SPRING_DATASOURCE_*`.

### Готово, когда
- Данные переживают рестарт;
- Миграции в git;
- Хотя бы один SQL ты можешь объяснить построчно.

### Материалы
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- [SQLBolt](https://sqlbolt.com/)
- [Flyway](https://documentation.red-gate.com/fd/quickstart-how-flyway-works-184127599.html)
- [Spring Data JDBC / JdbcClient](https://docs.spring.io/spring-framework/reference/data-access/jdbc.html)
- [Docker Hub postgres](https://hub.docker.com/_/postgres)

> После J4 можно начинать JR [Spring in Practice](https://javarush.com/courses/spring-in-practice) — будет сильно легче.

---

## J5 · Spring Data JPA — CRUD Projects

### Цель
Entity, repository, связи на уровне «один пользователь — много проектов» (пока упрощённо).

### Упражнение
1. `@Entity Project`, `JpaRepository`.
2. Слой: Controller → Service → Repository.
3. DTO ≠ Entity (маппинг вручную или MapStruct — по желанию).
4. Не отдавать entity напрямую в JSON, если там лишние поля.

### Готово, когда
- JPA CRUD projects работает;
- Понимаешь `Lazy/Eager` хотя бы на словах;
- Нет «Open Session in View»-сюрпризов (или осознанно настроено).

### Материалы
- [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)
- [Spring Data JPA docs](https://docs.spring.io/spring-data/jpa/reference/)
- JR: [Spring in Practice](https://javarush.com/courses/spring-in-practice)

---

## J6 · Spring Security + JWT

### Цель
Register/Login + protected routes, как в контракте.

### Упражнение
1. Entity `User` (email unique, password hash — BCrypt).
2. `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
3. JWT filter / resource server style (без избыточного OAuth2-зоопарка на старте).
4. Projects только владельца.

### Готово, когда
- Без токена → 401;
- Чужой project → 403/404;
- Пароли не plaintext.

### Материалы
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [Baeldung: JWT with Spring Security](https://www.baeldung.com/spring-security-oauth-jwt) — выбрать простой JWT-гайд под Boot 3
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- JR Spring in Practice · Security/JWT блоки

---

## J7 · Tasks: фильтры и пагинация

### Цель
1:N, query params, `Pageable`.

### Упражнение
По контракту: tasks CRUD + `status`, `priority`, `q`, `page`, `limit`, `sort`.  
Индекс `(project_id, status)` в Flyway.

### Готово, когда
- Пагинация отдаёт `items` + `meta.total`;
- Нельзя трогать чужой project;
- Фильтры покрыты тестами сервиса или `@DataJpaTest` / MockMvc.

### Материалы
- [Pagination and sorting (Spring Data)](https://docs.spring.io/spring-data/jpa/reference/repositories/core-extensions.html#repositories.limit-query-result)
- [JPA Specifications](https://docs.spring.io/spring-data/jpa/reference/jpa/specifications.html) — когда фильтров станет много

---

## J8 · Теги many-to-many

### Цель
`@ManyToMany` / связующая таблица, фильтр `?tag=`.

### Упражнение
Как в контракте: tags CRUD + assign/unassign + filter.  
`UNIQUE(task_id, tag_id)`.

### Материалы
- [Hibernate associations](https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#associations)
- PostgreSQL UNIQUE / FK docs

---

## J9 · Комментарии, ошибки, CORS

### Цель
Nested comments + «удобный» API для Vue.

### Упражнение
1. Comments endpoints из контракта.
2. `@ControllerAdvice` + стабильные `error.code`.
3. CORS на `http://localhost:5173`.
4. Validation messages понятные фронту.
5. Не логировать password/token.

### Материалы
- [CORS in Spring](https://spring.io/guides/gs/rest-service-cors/)
- [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)

---

## J10 · Тесты, Docker, деплой

### Цель
Воспроизводимый стенд и уверенный рефакторинг.

### Упражнение
1. Unit (service) + MockMvc (controller) + Testcontainers (Postgres).
2. `Dockerfile` + `docker-compose` (api + db).
3. Деплой (Railway / Render / VPS).
4. OpenAPI: springdoc-openapi (Swagger UI).

### Материалы
- [Testing in Spring Boot](https://docs.spring.io/spring-boot/reference/testing/index.html)
- [Testcontainers](https://testcontainers.com/guides/getting-started-with-testcontainers-for-java/)
- [springdoc-openapi](https://springdoc.org/)
- JR: [Spring in Production](https://javarush.com/courses/spring-in-production)

---

## Рекомендуемый стек (фиксируем)

| Слой | Выбор |
|------|--------|
| Language | Java 21+ (или 25 под курс) |
| Framework | Spring Boot 3.x |
| Web | Spring MVC (REST) |
| DB | PostgreSQL 16 |
| Access | сначала JDBC, затем Spring Data JPA |
| Migrations | Flyway |
| Security | Spring Security + JWT |
| Build | Maven или Gradle |
| Docs | springdoc-openapi |

---

## Мини-чеклист прогресса

- [ ] J0 Interfaces/Records + InMemory repo
- [ ] J1 Collections domain + JUnit
- [ ] J2 Spring Boot `/health`
- [ ] J3 REST projects in-memory
- [ ] J4 Postgres + Flyway + JDBC
- [ ] J5 JPA projects
- [ ] J6 JWT auth
- [ ] J7 tasks + filters
- [ ] J8 tags M2M
- [ ] J9 comments + CORS/errors
- [ ] J10 tests + docker + deploy

---

## Как совмещать с JavaRush (практический ритм)

**Пример недели:**

| Дни | JR | FlowBoard |
|-----|----|-----------|
| Пн–Ср | 1–2 уровня Java 25 | — |
| Чт–Пт | — | упражнение текущего J-модуля |
| Сб | короткий рефакторинг / тесты | демо себе в Postman |
| Вс | запас / отдых | синк с фронтом 20 мин |

Правило: **не начинать J5 (JPA), пока J0–J1 не закрыты** — иначе Spring будет «магией».

---

## Частые ловушки

1. Сразу Hibernate + Security + Microservice — нет, сначала J0–J4.
2. Entity в JSON наружу — протекут поля/ленивые связи.
3. Игнор миграций — «схема только у меня локально».
4. Учить многопоточность вместо SQL — для FlowBoard SQL важнее раньше.
5. Ломать [api-contract.md](api-contract.md) без версии — ломает Vue.

---

## С чего начать ему сегодня

1. Добить JR урок **Interfaces** и следующий (functional interfaces).
2. Сделать упражнение **J0** (record + interface repository).
3. Прочитать [api-contract.md](api-contract.md) вместе с фронтом.
4. Когда дойдёт до Collections — сразу **J1**.
