# Module 9 · Теория: формы авторизации, профиля, checkout flow

Этот материал закрывает последний теоретический пункт `Module 9`: **реальные формы** в catalog app — login, register, profile edit, **multi-step checkout** — schemas, Pinia session, vue-query, wizard UX.

Связанные материалы:

- [Module 9 · Zod](./05-zod.md)
- [Module 9 · sync/async validation](./06-sync-async-validation.md)
- [Module 6 · auth session](../module-6/10-practice-checklist.md)
- [Module 8 · mutations](../module-8/04-mutations.md)

---

## 1. Карта форм в Product Catalog

```text
/login          → LoginForm      → auth store session
/register       → RegisterForm   → async email + create user
/profile        → ProfileForm    → hydrate query → update mutation
/checkout       → CheckoutWizard → cart (Pinia) + shipping + confirm
/admin/product  → ProductForm    → create/update mutation (stretch)
```

Все формы делят:

- `components/form/*` — TextField, FormField
- `schemas/*` — Zod
- VeeValidate `useForm` + `toTypedSchema`
- submit → api / mutation; errors → field или form-level

---

## 2. Login — эталонная простая форма

### Schema

```ts
// schemas/loginSchema.ts
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email(),
  password: z.string().min(1, 'Password is required').min(8),
})
```

### Flow

```text
1. local form state (VeeValidate)
2. handleSubmit → loginApi(values)
3. success → authStore.login(user/token)
4. redirect: route.query.redirect ?? '/'
5. fail → setFieldError или form alert «Invalid credentials»
```

```vue
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { loginSchema, type LoginForm } from '@/schemas/loginSchema'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/api/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const { defineField, handleSubmit, errors, isSubmitting, setFieldError } =
  useForm<LoginForm>({
    validationSchema: toTypedSchema(loginSchema),
    initialValues: { email: '', password: '' },
  })

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  try {
    const session = await login(values)
    auth.setSession(session)
    await router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } catch {
    setFieldError('email', 'Invalid email or password')
  }
})
</script>
```

### Границы state

| Данные | Где |
|--------|-----|
| email/password **draft** | VeeValidate form |
| user/token **session** | Pinia `auth` |
| products | vue-query |

Login fields **не** в auth store до успешного submit — [Module 6](../module-6/10-practice-checklist.md).

### UX checklist

- [ ] `autocomplete="username"` / `current-password`
- [ ] link «Create account» → `/register`
- [ ] `isSubmitting` disables button + fields
- [ ] generic error не дублирует field error без нужды

---

## 3. Register — sync + async + terms

### Schema

```ts
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(80),
    email: z.string().trim().min(1).email(),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    agreed: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
```

Async email unique — [урок 06](./06-sync-async-validation.md): blur + `refine` или field rule.

### Submit

```ts
const onSubmit = handleSubmit(async (values) => {
  try {
    const session = await register({
      name: values.name,
      email: values.email,
      password: values.password,
    })
    auth.setSession(session)
    await router.push('/')
  } catch (e) {
    map422ToForm(e) // setErrors
  }
})
```

`agreed` — `BaseCheckbox` + `defineField('agreed')`.

---

## 4. Profile edit — read server, write form

### Read: vue-query

```ts
const { data: profile, isPending } = useQuery({
  queryKey: ['profile', 'me'],
  queryFn: fetchMyProfile,
  enabled: auth.isAuthenticated,
})
```

### Form: hydrate once

```ts
export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  bio: z.string().max(500).optional().or(z.literal('')),
  website: z.union([z.literal(''), z.string().url('Invalid URL')]),
})

const { defineField, handleSubmit, errors, resetForm, isSubmitting } = useForm({
  validationSchema: toTypedSchema(profileSchema),
  initialValues: { name: '', bio: '', website: '' },
})

watch(profile, (p) => {
  if (!p) return
  resetForm({
    values: {
      name: p.name,
      bio: p.bio ?? '',
      website: p.website ?? '',
    },
  })
}, { immediate: true })
```

**Не** `v-model` напрямую в `profile` query data.

### Update: mutation

```ts
const queryClient = useQueryClient()

const { mutateAsync } = useMutation({
  mutationFn: updateProfile,
  onSuccess: (updated) => {
    queryClient.setQueryData(['profile', 'me'], updated)
  },
})

const onSubmit = handleSubmit(async (values) => {
  await mutateAsync(values)
  toast.success('Profile saved')
})
```

### UX

- loading skeleton пока `isPending && !profile`
- `meta.dirty` → «Unsaved changes» / confirm on leave *(optional)*
- save button `:disabled="isSubmitting || !meta.dirty"`

---

## 5. Checkout — multi-step wizard

Cart уже в **Pinia** (Module 6). Checkout form — **шаги** поверх cart.

```text
Step 1 · Contact     — email, phone
Step 2 · Shipping    — address (nested object)
Step 3 · Review      — read-only cart summary + place order
```

### Routes

| Подход | Пример |
|--------|--------|
| one page, step state | `/checkout?step=2` |
| nested routes | `/checkout/shipping` |

Recommended: **`route.query.step`** или path `/checkout/shipping` — Back button работает предсказуемо.

### Schemas per step

```ts
export const checkoutContactSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10, 'Enter a valid phone'),
})

export const checkoutAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  zip: z.string().min(4),
  country: z.string().min(1),
})

export const checkoutStepSchemas = [
  checkoutContactSchema,
  checkoutAddressSchema,
] as const
```

### Wizard state

```ts
const step = computed(() => Number(route.query.step ?? 1))
const wizardData = reactive({
  contact: { email: '', phone: '' },
  address: { street: '', city: '', zip: '', country: '' },
})
```

Каждый step — свой `useForm` **или** один `useForm` с full object + validate subset:

```ts
async function nextStep() {
  const schema = checkoutStepSchemas[step.value - 1]
  const result = schema.safeParse(getStepValues(step.value))
  if (!result.success) {
    applyZodErrors(result.error)
    return
  }
  await router.push({ query: { step: step.value + 1 } })
}
```

VeeValidate на каждом step page — проще mentally:

```vue
<!-- CheckoutContactStep.vue -->
<form @submit="onSubmit">
  <!-- TextFields + handleSubmit validates contact only -->
  <button type="submit">Continue</button>
</form>
```

Parent wizard сохраняет submitted values в `wizardData` через emit/store.

### Step 3 — review без input validation

```vue
<CartSummary :items="cart.items" />
<button type="button" :disabled="isPlacing" @click="placeOrder">
  Place order
</button>
```

`placeOrder` → mutation POST `/orders` → clear cart → `/orders/:id/success`.

---

## 6. Wizard UX patterns

```text
Progress: Step 1 of 3 — Contact
Back     → previous step, preserve wizardData
Guard    → empty cart → redirect /cart
```

```ts
watch(
  () => cart.totalQty,
  (qty) => {
    if (qty === 0 && route.name === 'checkout') {
      router.replace({ name: 'cart' })
    }
  },
)
```

| Правило | Зачем |
|---------|--------|
| validate **текущий** step only | не overwhelm |
| persist wizardData in `sessionStorage` | refresh optional stretch |
| не класть wizard draft в Pinia cart store | разные domains |

---

## 7. Auth + Router guards

```ts
// router guard (Module 5 concept)
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
```

```ts
{ path: '/profile', meta: { requiresAuth: true } }
{ path: '/checkout', meta: { requiresAuth: true } } // или guest checkout — решай явно
```

Form redirect после login использует `route.query.redirect`.

---

## 8. Product admin form *(stretch, но типично)*

```ts
export const productFormSchema = z.object({
  title: z.string().trim().min(1).max(120),
  price: z.coerce.number().min(0),
  category: z.string().min(1),
  description: z.string().max(2000).optional(),
})
```

Create: `handleSubmit` → `createProduct` mutation → invalidate lists → redirect detail.

Edit: hydrate from `productKeys.detail(id)` like profile pattern.

---

## 9. Общая таблица: форма → слои

| Form | Schema | Submit | Server state after |
|------|--------|--------|---------------------|
| Login | loginSchema | loginApi | Pinia auth |
| Register | registerSchema | registerApi | Pinia auth |
| Profile | profileSchema | updateProfile mutation | query cache |
| Checkout | step schemas | placeOrder mutation | cart clear |
| Product | productFormSchema | create/update mutation | invalidate products |

---

## 10. Error UX по типам форм

| Form | Field errors | Form-level |
|------|--------------|------------|
| Login | invalid credentials → email | rare |
| Register | 422 fields, async email | terms |
| Profile | 422 name/website | save failed banner |
| Checkout step | address invalid | payment declined step 3 |
| Wizard | per-step only | cart empty |

---

## 11. Accessibility по формам

- login/register: focus first error on submit fail
- wizard: announce step change (`aria-live="polite"` on title)
- checkout review: readable cart table/list
- profile: associate hints («Public bio») via FormField hint

---

## 12. Частые ошибки

### Session draft в Pinia на каждый keystroke login

Только post-success session.

### Profile form binds query cache directly

Edit desync + cache corruption.

### Wizard one giant schema validate all steps on step 1

User видит shipping errors too early.

### Checkout без empty cart guard

Order empty cart.

### Skip redirect after login

User lost context.

### Duplicate schemas login vs register email rules

Shared `emailFieldSchema` partial:

```ts
export const emailField = z.string().trim().min(1).email()
```

### Confirm password в API payload

Omit before `register()`.

---

## 13. Что важно понять после этого блока

Проверь себя:

1. Где draft login vs session?
2. Как hydrate profile form из query?
3. Зачем step schemas в checkout?
4. Cart vs wizard contact data — где что?
5. Как redirect после login?
6. Profile update — mutation + cache?

---

## 14. Что почитать

### Официальное

- [Vue Router · navigation guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
- [vee-validate · handling forms](https://vee-validate.logaretm.com/v4/guide/composition-api/handling-forms)

### Связанные материалы этого плана

- [Module 5 · navigation guards](../module-5/10-navigation-guards.md)
- [Module 9 · кастомные поля](./02-custom-fields.md)
- [Module 8 · practice checklist](../module-8/09-practice-checklist.md)

---

## 15. Практическое мини-задание

1. `/login` + `/register` с schemas + TextField
2. Mock auth store session
3. `/profile` hydrate + save mutation
4. `/checkout` 3 steps + cart guard
5. Один redirect `?redirect=` сценарий

---

## 16. Мини-конспект

- login/register → form local → auth Pinia
- profile → query hydrate → mutation → cache
- checkout → Pinia cart + step forms + place order
- wizard = validate per step + preserved wizardData
- guards + redirect для auth flows
- **теория Module 9 завершена** → practice checklist

---

## 17. Что делать дальше

Теория Module 9 завершена. Переходи к практике:

- [Module 9 · practice checklist](./08-practice-checklist.md) — login + register или profile, Zod, VeeValidate, TextField
