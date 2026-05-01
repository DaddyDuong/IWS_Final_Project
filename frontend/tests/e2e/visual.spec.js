import { test, expect } from '@playwright/test'
import { fillAddressForm, fillProductForm, setupTestPage } from './testHelpers.js'

const successRoutes = [
  { name: '01-home', path: '/' },
  { name: '02-shop', path: '/shop' },
  { name: '03-product-detail', path: '/shop/prod-2' },
  { name: '04-auth', path: '/auth' },
  { name: '05-recovery', path: '/auth/recovery' },
  { name: '06-account', path: '/account', role: 'customer' },
  { name: '07-cart', path: '/cart', role: 'customer' },
  { name: '08-checkout', path: '/checkout', role: 'customer' },
  { name: '09-orders', path: '/account/orders', role: 'customer' },
  { name: '10-order-detail', path: '/account/orders/order-2', role: 'customer' },
  { name: '11-addresses', path: '/account/addresses', role: 'customer' },
  { name: '12-manager-studio', path: '/manager/studio', role: 'manager' },
]

for (const routeConfig of successRoutes) {
  test(`visual success state: ${routeConfig.name}`, async ({ page }) => {
    await setupTestPage(page, { role: routeConfig.role })
    await page.goto(routeConfig.path)
    await page.waitForTimeout(100)
    await expect(page).toHaveScreenshot(`${routeConfig.name}.png`, { fullPage: true })
  })
}

test('visual state set: loading, error, and empty', async ({ page }) => {
  await setupTestPage(page, { scenario: 'loading' })
  const holdCatalogRequests = async (_route) => {
    await new Promise(() => {})
  }

  await page.route('**/api/v1/products**', holdCatalogRequests)
  await page.goto('/shop')
  const loadingState = page.getByText('Loading product catalog...', { exact: true }).locator('..')
  await expect(loadingState).toHaveScreenshot('state-shop-loading.png')
  await page.unroute('**/api/v1/products**', holdCatalogRequests)

  await setupTestPage(page, { scenario: 'error' })
  await page.goto('/shop')
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('state-shop-error.png', { fullPage: true })

  await setupTestPage(page, { scenario: 'empty' })
  await page.goto('/shop')
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('state-shop-empty.png', { fullPage: true })

  await setupTestPage(page, { role: 'customer', scenario: 'empty' })
  await page.goto('/account/orders')
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('state-orders-empty.png', { fullPage: true })

  await setupTestPage(page, { role: 'customer', scenario: 'empty' })
  await page.goto('/cart')
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('state-cart-empty.png', { fullPage: true })
})

test('visual state set: key mutation feedback', async ({ page }) => {
  await setupTestPage(page, { role: 'customer' })

  await page.goto('/cart')
  const quantityInput = page.locator('input[type="number"]').first()
  await quantityInput.fill('2')
  await page.getByRole('button', { name: 'Update' }).first().click()
  await expect(page.getByText('Cart updated')).toBeVisible()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('state-cart-update-success.png', { fullPage: true })

  await setupTestPage(page, { role: 'customer' })
  await page.goto('/account/addresses')
  await fillAddressForm(page, {
    receiver: 'Snapshot User',
    phone: '+1 (555) 333-9999',
    line1: '88 Snapshot Street',
    ward: 'Ward 9',
    district: 'Central',
    city: 'Austin',
  })
  await page.getByRole('button', { name: 'Save address' }).click()
  await expect(page.getByText('Address saved')).toBeVisible()
  await page.waitForTimeout(100)
  await expect(page).toHaveScreenshot('state-address-create-success.png', { fullPage: true })

  await setupTestPage(page, { role: 'manager' })
  await page.goto('/manager/studio')
  await fillProductForm(page, {
    sku: 'NS-SNAPSHOT-001',
    name: 'Snapshot Studio 14',
    brand: 'Nova',
    cpu: 'Intel Core i7',
    ramGb: '16',
    storageGb: '512',
    screenSize: '14.0',
    price: '1199',
    stockQty: '8',
    description: 'Snapshot scenario model.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-dell-xps-14-9440.png',
  })
  await page.getByRole('button', { name: 'Create product' }).click()
  await expect(page.getByText('Product created')).toBeVisible()
  await expect(page.getByRole('article').filter({ hasText: 'Snapshot Studio 14' }).first()).toBeVisible()
  await page.evaluate(() => {
    const activeElement = document.activeElement

    if (activeElement instanceof HTMLElement) {
      activeElement.blur()
    }
  })
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete))
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(100)
  await expect(page.getByRole('status').filter({ hasText: 'Product created' })).toHaveScreenshot('state-manager-create-success.png', { animations: 'disabled', caret: 'hide' })
})
