# Module 9 · Практический checklist

Пошаговый чеклист для закрытия **практической части Module 9**: собрать **реальные формы** в catalog app — **login**, **register**, **profile** или **checkout wizard** — с **Zod**, **VeeValidate**, custom fields и понятным UX.

Используй этот файл как рабочий документ: проходи шаги по порядку и отмечай выполненные пункты.

---

## Перед стартом

### Module 6–8 должны быть на месте

- [ ] Router + catalog + detail работают
- [ ] Pinia: **cart** (и желательно **auth** session из Module 6)
- [ ] Products — **vue-query** или api layer *(Module 7–8)*
- [ ] login draft **не** в Pinia store *(только session после submit)*

### Прочитай теорию Module 9

- [01 · сложный v-model](01-complex-v-model.md)
- [02 · кастомные поля](02-custom-fields.md)
- [03 · controlled patterns](03-controlled-patterns.md)
- [04 · VeeValidate](04-veevalidate.md)
- [05 · Zod](05-zod.md)
- [06 · sync/async validation](06-sync-async-validation.md)
- [07 · auth, profile, checkout](07-auth-profile-checkout-forms.md)

---

## Шаг 1. Выбрать проект

| Вариант | Когда |
|---------|--------|
| **Product Catalog Module 5–8** | recommended |
| **Blog + comments form** | если catalog исчерпан |
| **Dashboard settings** | profile-like forms |

### Рекомендация

Module 9 — **формы поверх** существующего app, не новый проект.

### Checklist

- [ ] выбран проект
- [ ] `npm run dev` стартует
- [ ] cart/auth stores уже есть или добавишь в шаге 3

---

## Шаг 2. Зафиксировать MVP Module 9

### MVP (критерии README)

- `vee-validate` + `zod` + `@vee-validate/zod`
- **`components/form/`**: минимум `FormField` + `BaseInput` + `TextField`
- **`schemas/`**: Zod schemas **не** в `.vue` files
- **Login** — ≥2 поля, validation, submit, pending/disabled
- **Register** **или** **Profile edit** — multi-field + validation
- ошибки **понятно и вовремя** *(touched/blur policy)*
- **одна** schema на форму — без copy-paste rules в pages
- auth session → Pinia *(mock ok)*; profile → mutation/query *(если profile в MVP)*

### Из README practice — покрытие

| Тема README | MVP |
|-------------|-----|
| логин | обязательно |
| регистрация | обязательно *или* profile edit вместо register |
| редактирование профиля | обязательно *или* register вместо profile |
| многошаговая форма | stretch *(checkout wizard)* |

**Минимум для закрытия:** login + **(register OR profile)** с validation.

### Не обязательно в MVP

- реальный backend auth / OAuth
- все 4 формы сразу
- i18n error messages
- full checkout + payment gateway
- captcha, 2FA
- form persist sessionStorage

### Checklist

- [ ] MVP записан *(какие pages делаешь)*
- [ ] scope не уехал в Module 10 UI kit

---

## Шаг 3. Установить зависимости

```bash
npm install vee-validate zod @vee-validate/zod
```

*(опционально)* `@vee-validate/rules` — если используешь string rules параллельно.

### Checklist

- [ ] пакеты установлены
- [ ] `npm run build` без ошибок типов

---

## Шаг 4. Form components layer

```text
src/components/form/
  FormField.vue
  BaseInput.vue
  TextField.vue
  BaseCheckbox.vue      # register terms — recommended
  types.ts              # optional
```

Требования:

- [ ] `defineModel` в BaseInput/TextField
- [ ] label + error + hint в FormField
- [ ] `useId()` + `aria-describedby` + `aria-invalid`
- [ ] prop `:error="string | undefined"`

### Checklist

- [ ] layer создан
- [ ] demo page или Story не обязателен — достаточно login

---

## Шаг 5. Schemas folder

```text
src/schemas/
  loginSchema.ts
  registerSchema.ts   # или profileSchema.ts
  shared.ts           # emailField, passwordField — optional
```

```ts
export const loginSchema = z.object({ … })
export type LoginForm = z.infer<typeof loginSchema>
```

### Checklist

- [ ] schemas вынесены из components
- [ ] `z.infer` типы используются в `useForm<T>`
- [ ] нет дублирования email rules в login и register *(shared partial ok)*

---

## Шаг 6. Login page (`/login`)

- route + lazy page component
- `useForm` + `toTypedSchema(loginSchema)`
- `defineField` + `TextField` + `v-bind="fieldAttrs"`
- `handleSubmit` → mock `loginApi` → `authStore.setSession`
- redirect: `route.query.redirect` или `/`
- `setFieldError` на invalid credentials
- `isSubmitting` → disabled button + fields
- link → `/register`

### Checklist

- [ ] login работает end-to-end
- [ ] validation блокирует empty submit
- [ ] pending state виден
- [ ] session в Pinia после success
- [ ] credentials **не** остаются в store как draft

---

## Шаг 7. Register **или** Profile

### Вариант A · Register (`/register`)

- [ ] `registerSchema` + confirmPassword refine
- [ ] `agreed` checkbox + `z.literal(true)`
- [ ] async email unique *(mock GET)* on blur — recommended
- [ ] 422 → `setErrors` demo
- [ ] success → auth session → redirect

### Вариант B · Profile (`/profile`)

- [ ] `useQuery` load profile *(mock)*
- [ ] `resetForm({ values })` on data load
- [ ] **не** bind query cache directly
- [ ] `updateProfile` mutation + invalidate/setQueryData
- [ ] save disabled when `!meta.dirty` *(recommended)*
- [ ] guard `requiresAuth`

### Checklist

- [ ] выбран A или B — реализован полностью
- [ ] ≥3 поля с validation
- [ ] errors после blur/submit policy осознанна

---

## Шаг 8. Auth guard *(recommended)*

```ts
meta: { requiresAuth: true }  // profile, checkout
```

- [ ] unauthenticated → `/login?redirect=…`
- [ ] после login → return to intended page

### Checklist

- [ ] guard работает на одной protected page

---

## Шаг 9. Stretch · Checkout wizard (`/checkout`)

Только если MVP login + (register|profile) закрыт.

- [ ] 2–3 steps: contact → shipping → review
- [ ] step validation отдельно
- [ ] cart из Pinia на review step
- [ ] empty cart → redirect `/cart`
- [ ] place order mock → clear cart

### Checklist

- [ ] wizard optional — отметь если сделал

---

## Шаг 10. Stretch · Product form

- [ ] `productFormSchema` + admin create/edit
- [ ] `z.coerce.number()` для price
- [ ] submit → vue-query mutation + invalidate

---

## Шаг 11. Error & pending UX audit

Проверь на каждой форме:

| Check | |
|-------|---|
| Field error text visible | [ ] |
| Not showing errors before touch *(policy)* | [ ] |
| Submit disabled while pending | [ ] |
| Form-level alert for network error | [ ] |
| `novalidate` if custom validation | [ ] |
| autocomplete on login/register | [ ] |

---

## Шаг 12. Структура проекта (ориентир)

```text
src/
  schemas/
  components/form/
  pages/
    LoginPage.vue
    RegisterPage.vue    # or ProfilePage.vue
    CheckoutPage.vue    # stretch
  stores/
    auth.ts
  api/
    auth.ts
  router/
    index.ts
```

### Checklist

- [ ] pages тонкие — logic в schemas + api + stores
- [ ] нет inline `if (!email) errors…` дублирования

---

## Шаг 13. Ручной QA

1. Login empty submit → field errors  
2. Login invalid → error message  
3. Login valid → session + redirect  
4. Register/profile invalid → errors on right fields  
5. Register confirmPassword mismatch  
6. Async email taken *(if implemented)*  
7. Profile: load → edit → save → UI updates  
8. Protected route without auth → login → back  
9. Double submit → no duplicate API calls *(disabled)*  
10. Logout → profile inaccessible  

### Checklist

- [ ] все релевантные пункты пройдены

---

## Шаг 14. Финальная самопроверка

1. Где живёт draft формы vs session?
2. Зачем `toTypedSchema`?
3. Кто рендерит error — field или page?
4. Sync vs async validation — пример из проекта?
5. Почему schema в `schemas/`?
6. Как работает redirect после login?

### Checklist

- [ ] ответы своими словами

---

## Финальный checklist Module 9

Module 9 можно считать завершённым, если:

### Проект

- [ ] login с validation работает
- [ ] register **или** profile с validation работает
- [ ] custom TextField используется на forms
- [ ] app собирается

### Критерии README

- [ ] ≥1 форма с **несколькими полями** и validation
- [ ] ошибки понятны и вовремя
- [ ] submit + pending + disabled корректны
- [ ] schema **не** дублируется хаотично по components

### Архитектура

- [ ] Zod + VeeValidate + form components
- [ ] auth session в Pinia; form draft local
- [ ] profile/server data через query/mutation *(if profile)*

---

## Stretch goals *(optional)*

- full checkout wizard 3 steps
- product admin CRUD form
- shared `emailField` / `passwordField` in `schemas/shared.ts`
- password show/hide toggle slot
- focus first invalid field on submit
- `@vee-validate/i18n`
- integration test: `loginSchema.safeParse`

---

## Если что-то пошло не так

### `defineField` attrs не работают с TextField

- `v-model="field"` + `v-bind="fieldAttrs"` together

### Errors не показываются

- `toTypedSchema` подключён?
- `:error="errors.email"` passed?
- validateOnBlur only — нужен blur or submit

### Types mismatch в handleSubmit

- `useForm<LoginForm>` + `initialValues` match schema

### Profile edits query cache

- hydrate via `resetForm`, edit local form only

### Login puts email in Pinia

- only session user/token after success

### Double validation (Zod + manual)

- one path: schema or rules, not both duplicate

### Checkout validates all steps at once

- validate current step schema only

---

## Что делать после Module 9

Переходи к **Module 10 · Переиспользуемый UI и продвинутые возможности Vue**:

- `Teleport`, `Suspense`, transitions
- custom directives
- composables для modal, dropdown, tabs, notifications

Формы готовы — Module 10 улучшит **modal dialogs**, **toasts** и переиспользуемый UI вокруг них.

---

## Мини-конспект

- Module 9 = schemas + VeeValidate + form components + real pages
- login/register/profile/checkout — patterns from lesson 07
- draft local, session Pinia, server data query
- MVP: login + (register OR profile)
- Module 10 = advanced UI primitives
