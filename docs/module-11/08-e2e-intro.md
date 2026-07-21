# Module 11 · Теория: базовый e2e-подход

Этот материал закрывает восьмой теоретический пункт `Module 11`: **E2E testing** — Playwright vs Cypress, test pyramid, первый flow catalog app, `data-testid`, когда e2e нужен.

Связанные материалы:

- [Module 11 · component tests](./04-component-tests.md)
- [Module 11 · API mocking](./07-api-mocking.md)
- [Module 5 · Router](../module-5/01-vue-router-4.md)

---

## 1. E2E — определение

```text
End-to-End test = real browser + full app + user journey
```

```text
Unit/Component (Vitest)  →  isolated pieces, jsdom, mocks
E2E (Playwright/Cypress) →  catalog → detail → cart → checkout path
```

E2E ловит:

- router + guards + lazy routes
- real DOM + Teleport + CSS layout
- integration bugs между layers

E2E **не заменяет** unit/component — медленнее, flakier, дороже в поддержке.

---

## 2. Test pyramid (catalog)

```text
        /  E2E  \           few — critical paths
       / component \        some — forms, modal, query pages
      /    unit     \       many — schemas, parse, store, composables
```

| Layer | Count (pet-project) | Examples |
|-------|---------------------|----------|
| Unit | 15–40 | loginSchema, parseProduct, cart store |
| Component | 5–15 | LoginPage, TextField, BaseModal |
| E2E | 2–5 | login flow, add to cart, browse catalog |

README Module 11: **critical user scenarios** — 2–3 e2e enough для MVP.

---

## 3. Playwright vs Cypress

| | **Playwright** | **Cypress** |
|---|----------------|-------------|
| Browsers | Chromium, Firefox, WebKit | Chromium-family primary |
| API style | async/await native | chain `.click().should()` |
| Multi-tab | yes | limited |
| Vue/Vite | excellent | excellent |
| CI | first-class | first-class |

**Recommendation для плана:** **Playwright** — modern default, multi-browser, `webServer` для Vite.

Оба ok — pick one, don't mix in one project.

Официально:

- [Playwright](https://playwright.dev/)
- [Cypress](https://www.cypress.io/)

---

## 4. Install Playwright

```bash
npm init playwright@latest
```

Or manual:

```bash
npm install -D @playwright/test
npx playwright install
```

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

```text
e2e/
  catalog.spec.ts
  auth.spec.ts
playwright.config.ts
```

Separate from Vitest — **не** смешивай в один config.

---

## 5. `playwright.config.ts` — Vite dev server

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

```text
webServer → поднимает Vite перед tests
baseURL   → page.goto('/catalog') relative paths
```

---

## 6. Первый spec — catalog loads

```ts
// e2e/catalog.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Catalog', () => {
  test('shows product list', async ({ page }) => {
    await page.goto('/catalog')

    await expect(page.getByRole('heading', { name: /catalog/i })).toBeVisible()
    await expect(page.getByTestId('product-card').first()).toBeVisible()
  })

  test('navigates to product detail', async ({ page }) => {
    await page.goto('/catalog')

    const firstCard = page.getByTestId('product-card').first()
    const title = await firstCard.getByRole('heading').textContent()

    await firstCard.getByRole('link').click()

    await expect(page).toHaveURL(/\/products\//)
    if (title) {
      await expect(page.getByRole('heading', { level: 1 })).toContainText(title)
    }
  })
})
```

Requires `data-testid="product-card"` in app — stable selectors.

---

## 7. Locators — user-facing priority

Playwright (like Testing Library philosophy):

```text
1. getByRole
2. getByLabel
3. getByPlaceholder
4. getByTestId
5. getByText
6. CSS/XPath — last resort
```

```ts
await page.getByRole('button', { name: 'Sign in' }).click()
await page.getByLabel('Email').fill('user@example.com')
await page.getByTestId('add-to-cart').click()
```

Match Module 11 component test selector strategy.

---

## 8. Auth flow e2e

```ts
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can log in and see catalog', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('Email').fill('demo@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByText(/welcome|catalog/i)).toBeVisible()
})

test('protected route redirects to login', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login/)
})
```

Use **mock auth backend** or fixed demo credentials in dev — document in README.

---

## 9. Cart flow e2e

```ts
test('add product to cart updates badge', async ({ page }) => {
  await page.goto('/catalog')

  await page.getByTestId('product-card').first().getByTestId('add-to-cart').click()

  await expect(page.getByTestId('cart-badge')).toHaveText('1')

  await page.getByRole('link', { name: /cart/i }).click()
  await expect(page.getByTestId('cart-line')).toHaveCount(1)
})
```

Full stack: Router + Pinia + UI — no mocks.

---

## 10. API в E2E — options

| Strategy | When |
|----------|------|
| **Real public API** (DummyJSON) | demo; flaky if offline |
| **MSW in dev** | stable demo data |
| **Mock server** | team backend |
| **route intercept** | Playwright `page.route` |

```ts
await page.route('**/products*', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ products: [{ id: 1, title: 'Phone', price: 99 }], total: 1 }),
  })
})
```

Pet-project: real DummyJSON **or** Playwright route mock for CI stability.

---

## 11. Assertions и waiting

Playwright auto-waits:

```ts
await expect(locator).toBeVisible() // retries until timeout
```

```text
❌ page.click('#btn'); expect(page.locator('.x')).toBeTruthy() // immediate
✓ await expect(page.getByTestId('x')).toBeVisible()
```

Avoid `page.waitForTimeout(3000)` — flaky; use `expect` auto-wait.

---

## 12. Screenshots / trace on failure

```ts
// playwright.config
use: {
  screenshot: 'only-on-failure',
  trace: 'on-first-retry',
},
```

```bash
npx playwright show-report
```

Debug failed CI — open trace viewer.

---

## 13. Cypress equivalent *(кратко)*

```ts
// cypress/e2e/catalog.cy.ts
describe('Catalog', () => {
  it('loads products', () => {
    cy.visit('/catalog')
    cy.findByRole('heading', { name: /catalog/i }).should('be.visible')
    cy.get('[data-testid="product-card"]').should('have.length.at.least', 1)
  })
})
```

```js
// cypress.config.js
e2e: {
  baseUrl: 'http://localhost:5173',
  setupNodeEvents(on, config) { … },
},
```

Same ideas — different syntax.

---

## 14. E2E vs component — duplicate?

| E2E | Component |
|-----|-----------|
| login → redirect → catalog visible | login shows error on empty submit |
| add to cart badge | ProductCard emits add-to-cart |
| full router guard | mock router push |

**Don't** e2e-test every validation rule — already in unit/component.

**Do** e2e critical happy paths user cares about.

---

## 15. CI

```yaml
# .github/workflows/test.yml excerpt
- run: npm run test:run
- run: npx playwright install --with-deps chromium
- run: npm run test:e2e
```

E2E in CI — slower job; run on PR main paths only.

---

## 16. Catalog MVP e2e set

1. Catalog list visible
2. Navigate to product detail
3. Login success *(if auth exists)*
4. Add to cart *(stretch)*

2 tests minimum для Module 11 practice stretch; 1 ok with theory.

---

## 17. Частые ошибки

### Too many e2e tests

Slow CI, maintenance pain — keep pyramid.

### Brittle CSS selectors

`.card:nth-child(3) .btn-primary` — use roles/testid.

### No `baseURL` / wrong port

Flaky local vs CI.

### Test depends on catalog sort order

Assert count/visibility, not exact first product title unless mocked.

### Same data as production

Never run destructive e2e against prod.

### Skip unit tests because e2e exists

E2E doesn't replace fast feedback loop.

---

## 18. Что важно понять после этого блока

Проверь себя:

1. E2E vs component test?
2. Test pyramid for catalog?
3. Playwright `baseURL` + `webServer`?
4. Locator priority?
5. How many e2e for MVP?
6. When `page.route` mock?

---

## 19. Что почитать

### Официальное

- [Playwright · Intro](https://playwright.dev/docs/intro)
- [Playwright · Best practices](https://playwright.dev/docs/best-practices)
- [Cypress · Getting started](https://docs.cypress.io/guides/getting-started/installing-cypress)

### Связанные материалы этого плана

- [Module 11 · component tests](./04-component-tests.md)

---

## 20. Практическое мини-задание

1. `npm init playwright@latest`
2. `e2e/catalog.spec.ts` — list + detail navigation
3. Add `data-testid="product-card"` to app
4. `npm run test:e2e` green
5. Optional: auth or cart flow

---

## 21. Мини-конспект

- E2E = real browser, full journeys, few tests
- Playwright recommended; separate from Vitest
- getByRole / getByTestId; auto-wait expect
- mock API via route or stable public API
- complement unit/component — don't replace
- дальше — **что тестировать / behavior vs implementation**

---

## 22. Что делать дальше

Следующий теоретический блок Module 11:

- [что тестировать и behavior vs implementation](./09-testing-philosophy.md)
