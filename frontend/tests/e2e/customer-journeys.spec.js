import { test, expect } from '@playwright/test'
import { setupTestPage, fillAddressForm } from './testHelpers.js'

test('customer can remove a cart item', async ({ page }) => {
  await setupTestPage(page, { role: 'customer' })
  await page.goto('/cart')

  const cartRow = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Dell XPS 14 (9440)' }) })
  await cartRow.getByLabel('Quantity').fill('2')
  await cartRow.getByRole('button', { name: 'Update' }).click()

  await expect(page.getByText('Cart updated')).toBeVisible()

  await cartRow.getByRole('button', { name: 'Remove' }).click()

  await expect(page.getByText('Item removed', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dell XPS 14 (9440)' })).toHaveCount(0)
})

test('customer can place and cancel an order', async ({ page }) => {
  await setupTestPage(page, { role: 'customer' })
  await page.goto('/checkout')

  await page.getByRole('radio', { name: /123 Market Street/i }).check()
  await page.getByRole('button', { name: 'Place order' }).click()

  await expect(page).toHaveURL(/\/account\/orders\/order-/)
  const orderId = page.url().split('/').pop()

  await page.getByRole('button', { name: 'Cancel order' }).click()
  await expect(page.getByText('Order canceled')).toBeVisible()

  await page.getByRole('link', { name: 'Back to order history' }).click()
  await expect(page).toHaveURL(/\/account\/orders$/)
  const canceledOrderCard = page.getByRole('article').filter({ hasText: orderId.slice(0, 8) })
  await expect(canceledOrderCard.getByText('Canceled')).toBeVisible()
  await expect(canceledOrderCard.getByRole('link', { name: 'View details' })).toBeVisible()
})

test('customer can filter order history and reset the filters', async ({ page }) => {
  await setupTestPage(page, { role: 'customer' })
  await page.goto('/account/orders')

  const statusFilter = page.getByRole('combobox', { name: /^Status/ })
  const fromFilter = page.getByLabel('From', { exact: true })
  const toFilter = page.getByLabel('To', { exact: true })
  const sortByFilter = page.getByRole('combobox', { name: /^Sort by/ })
  const minTotalFilter = page.getByLabel('Min total', { exact: true })
  const maxTotalFilter = page.getByLabel('Max total', { exact: true })

  await statusFilter.selectOption('processing')
  await fromFilter.fill('2026-04-29')
  await toFilter.fill('2026-04-30')
  await sortByFilter.selectOption('total:asc')
  await minTotalFilter.fill('1500')
  await maxTotalFilter.fill('2000')

  await expect(page.getByRole('heading', { name: 'Order history' })).toBeVisible()

  await page.getByRole('button', { name: 'Reset filters' }).click()

  await expect(statusFilter).toHaveValue('')
  await expect(fromFilter).toHaveValue('')
  await expect(toFilter).toHaveValue('')
  await expect(sortByFilter).toHaveValue('placedAt:desc')
  await expect(minTotalFilter).toHaveValue('')
  await expect(maxTotalFilter).toHaveValue('')
})

test('empty cart disables checkout', async ({ page }) => {
  await setupTestPage(page, { role: 'customer', scenario: 'empty' })
  await page.goto('/cart')

  await expect(page.getByRole('button', { name: 'Continue to checkout' })).toBeDisabled()
})

test('customer can create, edit, default, and delete addresses', async ({ page }) => {
  await setupTestPage(page, { role: 'customer' })
  await page.goto('/account/addresses')

  await fillAddressForm(page, {
    receiver: 'Flow User',
    phone: '+1 (555) 777-0000',
    line1: '400 Flow Avenue',
    ward: 'Ward 5',
    district: 'Uptown',
    city: 'Austin',
  })
  await page.getByRole('button', { name: 'Save address' }).click()

  await expect(page.getByText('Address saved')).toBeVisible()

  const createdAddress = page.getByRole('article').filter({ hasText: 'Flow User' })
  await createdAddress.getByRole('button', { name: 'Edit' }).click()
  const editingAddress = page.getByRole('article').filter({ has: page.getByRole('button', { name: 'Save changes' }) })
  await fillAddressForm(editingAddress, {
    receiver: 'Flow User',
    phone: '+1 (555) 777-0001',
    line1: '401 Flow Avenue',
    ward: 'Ward 6',
    district: 'Uptown',
    city: 'Austin',
    },
  )

  const addressUpdateRequest = page.waitForRequest(
    (request) => request.url().includes('/api/v1/addresses/') && request.method() === 'PATCH',
  )
  await editingAddress.getByRole('button', { name: 'Save changes' }).click()
  const addressUpdate = await addressUpdateRequest
  expect(addressUpdate.postDataJSON()).toEqual({
    receiver: 'Flow User',
    phone: '+1 (555) 777-0001',
    line1: '401 Flow Avenue',
    ward: 'Ward 6',
    district: 'Uptown',
    city: 'Austin',
    isDefault: false,
  })
  await expect(page.getByText('Address updated')).toBeVisible()

  const otherAddress = page.getByRole('article').filter({ hasText: '500 Tech Ridge Blvd' })
  await otherAddress.getByRole('button', { name: 'Set as default' }).click()
  await expect(page.getByText('Default set')).toBeVisible()

  await createdAddress.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Address deleted')).toBeVisible()
  await expect(page.getByText('Flow User')).toHaveCount(0)
})
