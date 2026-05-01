import { test, expect } from '@playwright/test'
import { setupTestPage } from './testHelpers.js'

async function openShop(page) {
  await page.goto('/shop')
}

async function signInWithReturn(page, email = 'john.doe@email.com', password = 'Password@123') {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByLabel('Password').press('Enter')
}

function productCard(page, name) {
  return page.getByRole('article').filter({ has: page.getByRole('heading', { name }) })
}

test('shop filters reset after searching, sorting, and narrowing by numeric controls', async ({ page }) => {
  await setupTestPage(page)
  await openShop(page)

  await page.getByLabel('Search').fill('Dell')
  await page.getByLabel('Sort').selectOption('price:asc')
  await page.getByLabel('Brand').fill('Dell')
  await page.getByLabel('CPU').fill('Ultra 7')
  await page.getByLabel('RAM (GB)').fill('16')
  await page.getByLabel('Storage (GB)').fill('512')
  await page.getByLabel('Min price').fill('1500')
  await page.getByLabel('Max price').fill('2500')
  await page.getByLabel('In-stock only').focus()
  await page.keyboard.press('Space')

  await expect(page.getByText('Dell XPS 14 (9440)')).toBeVisible()

  await page.getByRole('button', { name: 'Reset filters' }).click()

  await expect(page.getByLabel('Search')).toHaveValue('')
  await expect(page.getByLabel('Brand')).toHaveValue('')
  await expect(page.getByLabel('CPU')).toHaveValue('')
  await expect(page.getByLabel('RAM (GB)')).toHaveValue('')
  await expect(page.getByLabel('Storage (GB)')).toHaveValue('')
  await expect(page.getByLabel('Min price')).toHaveValue('')
  await expect(page.getByLabel('Max price')).toHaveValue('')
  await expect(page.getByLabel('In-stock only')).not.toBeChecked()
  await expect(productCard(page, 'Surface Laptop 7 (13.8")')).toBeVisible()
})

test('pagination and quick comparison work across both shop pages', async ({ page }) => {
  await setupTestPage(page)
  await page.goto('/shop?limit=2')

  await expect(productCard(page, 'Surface Laptop 7 (13.8")')).toBeVisible()
  await expect(productCard(page, 'HP Spectre x360 14 (2024)')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled()
  await productCard(page, 'Surface Laptop 7 (13.8")').getByRole('button', { name: 'Add to quick comparison' }).click()
  await productCard(page, 'HP Spectre x360 14 (2024)').getByRole('button', { name: 'Add to quick comparison' }).click()

  await expect(page.getByRole('heading', { name: 'Quick comparison' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear all' })).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(productCard(page, 'ThinkPad X1 Carbon Gen 12')).toBeVisible()
  await expect(productCard(page, 'Dell XPS 14 (9440)')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled()

  await productCard(page, 'ThinkPad X1 Carbon Gen 12').getByRole('button', { name: 'Add to quick comparison' }).click()
  await productCard(page, 'Dell XPS 14 (9440)').getByRole('button', { name: 'Add to quick comparison' }).click()

  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(productCard(page, 'Surface Laptop 7 (13.8")')).toBeVisible()
  await expect(productCard(page, 'HP Spectre x360 14 (2024)')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Quick comparison' })).toBeVisible()
  await expect(page.getByRole('button', { name: '×' })).toHaveCount(4)
  await expect(productCard(page, 'Surface Laptop 7 (13.8")').getByRole('button', { name: 'Remove from quick comparison' })).toBeVisible()
  await expect(productCard(page, 'HP Spectre x360 14 (2024)').getByRole('button', { name: 'Remove from quick comparison' })).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Quick comparison' })).toBeVisible()
  await page.getByRole('button', { name: '×' }).first().click()
  await page.getByRole('button', { name: 'Clear all' }).click()

  await expect(page.getByRole('heading', { name: 'Quick comparison' })).toHaveCount(0)
})

test('anonymous add to cart redirects to auth and returns to product detail', async ({ page }) => {
  await setupTestPage(page)
  await page.goto('/shop?limit=2&page=2')
  await expect(productCard(page, 'Dell XPS 14 (9440)')).toBeVisible()
  await productCard(page, 'Dell XPS 14 (9440)').getByRole('link', { name: 'View details' }).click()

  await page.getByRole('button', { name: 'Add to cart' }).click()
  await expect(page).toHaveURL(/\/auth$/)
  await expect.poll(async () => page.evaluate(() => {
    const state = window.history.state
    return state?.usr?.from ?? state?.from ?? state?.state?.from ?? null
  })).toBe('/shop/prod-2')

  await signInWithReturn(page)
  await expect(page).toHaveURL(/\/shop\/prod-2$/)
})

test('customer review lifecycle edits and deletes the submitted review', async ({ page }) => {
  await setupTestPage(page, { role: 'customer' })
  await page.goto('/shop/prod-2')

  await page.getByRole('button', { name: 'Submit review' }).click()
  await page.getByLabel('Your rating').selectOption('5')
  await page.getByLabel('Your review').fill('Great product after the handoff.')
  await page.getByRole('button', { name: 'Submit review' }).click()
  await expect(page.getByText('Review submitted')).toBeVisible()

  const createdReview = page.getByRole('article').filter({ hasText: 'Great product after the handoff.' })
  await expect(createdReview).toBeVisible()

  await createdReview.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Comment').fill('Updated after a few days of use.')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Review updated')).toBeVisible()

  const updatedReview = page.getByRole('article').filter({ hasText: 'Updated after a few days of use.' })
  await expect(updatedReview).toBeVisible()
  await updatedReview.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Review deleted')).toBeVisible()
})
