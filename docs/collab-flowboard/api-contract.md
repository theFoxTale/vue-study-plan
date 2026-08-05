# FlowBoard API Contract v0.1

Согласуйте v0.1 **до** большой реализации.  
Контракт **общий** для сценариев:

- Backend A — Go / Gin ([backend-go-plan.md](backend-go-plan.md))
- Backend B — Java / Spring Boot ([backend-java-plan.md](backend-java-plan.md))

Breaking changes → поднять версию (`v0.2`) и написать в чат/Issue.

Base URL (dev): `http://localhost:8080`  
Prefix: `/api/v1`  
Format: JSON (`Content-Type: application/json`)  
Auth: `Authorization: Bearer <access_token>`

---

## Общие правила

### Успех
Тело — ресурс или список. Для списков:

```json
{
  "items": [],
  "meta": { "page": 1, "limit": 20, "total": 0 }
}
```

### Ошибка

```json
{
  "error": {
    "code": "validation_error",
    "message": "Human readable message"
  }
}
```

Частые `code`: `unauthorized`, `forbidden`, `not_found`, `validation_error`, `conflict`, `internal_error`.

### Даты
ISO-8601 strings, например `"2026-08-05T17:00:00Z"`.  
Для due date достаточно `"2026-08-05"` (дата без времени) — зафиксируйте один вариант и не мешайте.

---

## Resources (черновик схемы)

```text
users
projects      (owner user_id)
tasks         (project_id)
tags          (owner user_id or global — выбрать: per-user)
task_tags
comments      (task_id, user_id)
```

Рекомендация для старта: **tags per-user** (проще auth-правила).

---

## Auth

### `POST /api/v1/auth/register`
Body:
```json
{ "email": "a@b.c", "password": "secret123", "name": "Ann" }
```
Response `201`:
```json
{
  "user": { "id": "uuid", "email": "a@b.c", "name": "Ann" },
  "access_token": "jwt..."
}
```

### `POST /api/v1/auth/login`
Body:
```json
{ "email": "a@b.c", "password": "secret123" }
```
Response `200`: как register.

### `GET /api/v1/auth/me` 🔒
Response `200`:
```json
{ "id": "uuid", "email": "a@b.c", "name": "Ann" }
```

---

## Health

### `GET /health`
(без prefix — удобно для probe)

```json
{ "status": "ok" }
```

---

## Projects 🔒

### `GET /api/v1/projects`
Query: `page`, `limit`  
Response: список проектов текущего пользователя.

### `POST /api/v1/projects`
```json
{ "name": "Vue Study", "description": "optional" }
```
`201` → project.

### `GET /api/v1/projects/:id`
### `PATCH /api/v1/projects/:id`
### `DELETE /api/v1/projects/:id` → `204`

**Project object**
```json
{
  "id": "uuid",
  "name": "Vue Study",
  "description": "",
  "created_at": "...",
  "updated_at": "..."
}
```

---

## Tasks 🔒

Статус: `todo` | `doing` | `done`  
Приоритет: `low` | `medium` | `high`

### `GET /api/v1/projects/:projectId/tasks`
Query: `status`, `priority`, `tag`, `q`, `page`, `limit`, `sort`  
`sort` примеры: `due_date`, `-due_date`, `created_at`

### `POST /api/v1/projects/:projectId/tasks`
```json
{
  "title": "Read Gin docs",
  "description": "",
  "status": "todo",
  "priority": "medium",
  "due_date": "2026-08-10",
  "tag_ids": []
}
```

### `GET /api/v1/tasks/:id`
### `PATCH /api/v1/tasks/:id`
### `DELETE /api/v1/tasks/:id` → `204`

**Task object**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "title": "Read Gin docs",
  "description": "",
  "status": "todo",
  "priority": "medium",
  "due_date": "2026-08-10",
  "tags": [{ "id": "uuid", "name": "backend" }],
  "created_at": "...",
  "updated_at": "..."
}
```

---

## Tags 🔒

### `GET /api/v1/tags`
### `POST /api/v1/tags` → `{ "name": "backend" }`
### `DELETE /api/v1/tags/:id` → `204`

### `POST /api/v1/tasks/:id/tags` → `{ "tag_id": "uuid" }`
### `DELETE /api/v1/tasks/:id/tags/:tagId` → `204`

---

## Comments 🔒

### `GET /api/v1/tasks/:id/comments`
### `POST /api/v1/tasks/:id/comments` → `{ "body": "text" }`
### `DELETE /api/v1/comments/:id` → `204` (только автор)

**Comment object**
```json
{
  "id": "uuid",
  "task_id": "uuid",
  "author": { "id": "uuid", "name": "Ann" },
  "body": "text",
  "created_at": "..."
}
```

---

## CORS

Dev origin фронта (пример): `http://localhost:5173`  
Методы: `GET, POST, PATCH, DELETE, OPTIONS`  
Headers: `Authorization, Content-Type`

---

## Changelog

| Версия | Дата | Изменения |
|--------|------|-----------|
| v0.1 | 2026-08-05 | Первый черновик контракта |
