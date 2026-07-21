# Vue 3 Cheatsheet (по этому плану)

Карманная шпаргалка под **Modern Vue Study Plan**. Не заменяет уроки — быстрый recall перед кодом / интервью.

```text
Глубже → docs/module-N/…
Практика → *-practice-checklist.md
Внешнее → RESOURCES.md · DEMOS.md
```

---

## 1. SFC skeleton

```vue
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

watch(count, (n) => console.log(n))
onMounted(() => { /* … */ })
</script>

<template>
  <button type="button" @click="count++">{{ count }} / {{ doubled }}</button>
</template>

<style scoped>
button { /* … */ }
</style>
```

| Script | Template |
|--------|----------|
| `count.value` | `{{ count }}` (auto-unwrap) |

→ [Module 1](./module-1/03-single-file-components.md) · [Module 2](./module-2/01-ref.md)

---

## 2. Reactivity

| API | Когда |
|-----|--------|
| `ref(x)` | примитивы, replace value, чаще default |
| `reactive(obj)` | объект формы; не деструктурируй без `toRefs` |
| `computed` | derived, кэш по deps |
| `watch(source, cb)` | явный source, old/new |
| `watchEffect(fn)` | auto-track, сразу + при deps |
| `shallowRef` | большой list, replace `.value` only |

```ts
const state = reactive({ n: 0 })
const { n } = toRefs(state) // сохранить reactivity
```

→ [Module 2](./module-2/01-ref.md) · [Module 12 · internals](./module-12/01-reactivity-internals.md)

---

## 3. Template essentials

```vue
{{ text }}
:src="url"          <!-- v-bind -->
@click="save"       <!-- v-on -->
v-if / v-else-if / v-else
v-show              <!-- CSS hide, DOM остаётся -->
v-for="item in items" :key="item.id"
v-model="title"
v-model.trim="name"
```

| | `v-if` | `v-show` |
|--|--------|----------|
| DOM | create/destroy | `display: none` |
| Когда | редкие ветки | частый toggle |

**Key:** stable id, не index в CRUD-списках.

→ [Module 1 · directives](./module-1/07-v-bind.md) · [Module 12 · key](./module-12/03-key.md)

---

## 4. Props / emits / slots

```vue
<script setup lang="ts">
const props = defineProps<{ title: string; open?: boolean }>()
const emit = defineEmits<{ save: [id: string]; 'update:modelValue': [v: string] }>()
</script>

<template>
  <slot name="header" />
  <slot :item="row" />  <!-- scoped -->
  <button type="button" @click="emit('save', id)">Save</button>
</template>
```

```vue
<!-- parent -->
<Child v-model="text" @save="onSave">
  <template #header>Title</template>
</Child>
```

→ [Module 3](./module-3/01-props.md)

---

## 5. Composables

```ts
export function useDisclosure(initial = false) {
  const isOpen = ref(initial)
  const open = () => { isOpen.value = true }
  const close = () => { isOpen.value = false }
  return { isOpen, open, close }
}
```

```text
use* · один composable — одна ответственность
shared vs feature placement → Module 13
```

→ [Module 10](./module-10/05-composables-reuse-layer.md) · [Module 13 · composables](./module-13/06-composables-layer.md)

---

## 6. Vue Router

```ts
{ path: '/products/:id', name: 'product', component: () => import('…'), meta: { auth: true } }
```

```ts
const route = useRoute()
const router = useRouter()
route.params.id
router.push({ name: 'product', params: { id } })
```

```vue
<RouterLink :to="{ name: 'product', params: { id } }">…</RouterLink>
<RouterView />
```

Guards: `beforeEach` / per-route `meta` · lazy routes = code split.

→ [Module 5](./module-5/01-vue-router-4.md)

---

## 7. Pinia

```ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartLine[]>([])
  const total = computed(() => items.value.reduce((n, i) => n + i.qty, 0))
  function add(product: Product) { /* … */ }
  return { items, total, add }
})
```

```ts
const cart = useCartStore()
const { total } = storeToRefs(cart) // reactive fields
cart.add(product)                   // actions as-is
```

```text
Server list → vue-query · Cart/session → Pinia
Не god store · не useStore в каждом leaf card
```

→ [Module 6](./module-6/04-pinia.md) · [Module 13 · stores](./module-13/07-stores-layer.md)

---

## 8. API + vue-query

```ts
// api (pure)
export async function fetchProducts(): Promise<Product[]> { /* http + parse */ }

// query
const { data, isPending, error, refetch } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => fetchProducts(filters),
  staleTime: 60_000,
})
```

```ts
useMutation({
  mutationFn: updateProduct,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
})
```

```text
Мокай @/api/*, не global fetch · parse на границе
```

→ [Module 7](./module-7/01-fetch.md) · [Module 8](./module-8/02-vue-query.md)

---

## 9. Forms

```vue
<input v-model.trim="email" />
<form @submit.prevent="onSubmit">
```

VeeValidate + Zod (идея):

```ts
const schema = z.object({ email: z.string().email() })
// useForm({ validationSchema: toTypedSchema(schema) })
```

```text
draft state в page/feature · submit → api/mutation
```

→ [Module 9](./module-9/01-complex-v-model.md)

---

## 10. UI patterns

```vue
<Teleport to="body">…modal…</Teleport>
<Transition name="fade">…</Transition>
```

```text
Modal/toast → Teleport · useModal / useToast composables
```

→ [Module 10](./module-10/01-teleport.md)

---

## 11. Testing (шпаргалка)

```ts
// unit
expect(parseProduct(raw)).toEqual(…)

// store
setActivePinia(createPinia())
const cart = useCartStore()

// component
const w = mount(LoginPage, { global: { plugins: […] } })
await w.find('button[type=submit]').trigger('click')
```

```text
it('shows error when email empty') — behavior, не wrapper.vm.internals
```

→ [Module 11](./module-11/01-vitest.md)

---

## 12. Perf (порядок)

```text
1. Measure (DevTools highlight)
2. Isolate store / stable props
3. computed вместо filter() в template
4. key = entity id
5. v-memo / shallowRef / lazy — после архитектуры
```

```vue
<div v-memo="[product.id, product.price]">…</div>
```

→ [Module 12](./module-12/02-unnecessary-rerenders.md)

---

## 13. Architecture layers

```text
pages → features → entities → shared
```

| Слой | Пример |
|------|--------|
| `shared/ui` | `BaseButton` |
| `entities/product` | type, api, `ProductCard` |
| `features/cart` | `useCartStore`, add-to-cart |
| `pages` | тонкая композиция |

```ts
import { CartBadge } from '@/features/cart' // public API
```

Env: `import.meta.env.VITE_*` → `shared/config` · never secrets in `VITE_`.

→ [Module 13](./module-13/03-shared-ui-entities-features-pages.md)

---

## 14. Nuxt (если нужен HTML/SEO)

| | CSR Vite | Nuxt SSR/SSG |
|--|----------|--------------|
| Первый HTML | пустой shell | контент в ответе |
| Data | onMounted / query | `useFetch` / `useAsyncData` |
| Routes | `router.ts` | `pages/` |
| API BFF | отдельный server | `server/api` |

```ts
const { data } = await useFetch('/api/products')
useSeoMeta({ title: () => data.value?.title })
definePageMeta({ layout: 'default', ssr: false }) // точечно
```

```text
Auth admin → Vite ok · Public product SEO → Nuxt
```

→ [Module 14](./module-14/01-csr-ssr-ssg-hybrid.md) · [vs Vite](./module-14/11-nuxt-vs-vue-vite.md)

---

## 15. UX states (всегда)

```text
loading · error · empty · success
skeleton > blank spinner на весь экран
```

---

## 16. Interview blitz

1. `ref` vs `reactive`?  
2. Почему `:key="index"` опасен?  
3. Server state vs Pinia?  
4. Зачем `invalidateQueries`?  
5. Rerender ≠ DOM patch?  
6. Когда Nuxt, а не Vite SPA?  
7. Что тестировать в первую очередь?

---

## Свои дополнения

```text
Допиши сюда после финалки:
- любимые snippets проекта
- грабли, на которые наступил
- команды deploy
```

Шаблон для портфолио: скопируй этот файл в свой репо и урежь под стек проекта.

---

## Навигация плана

| | |
|--|--|
| Ресурсы | [RESOURCES.md](./RESOURCES.md) |
| Демо / playgrounds | [DEMOS.md](./DEMOS.md) |
| Финалка | [Module 15 checklist](./module-15/01-practice-checklist.md) |
| Оглавление | [README](../README.md) |
