import { test, expect } from '@playwright/test'
import { setupTestPage, fillProductForm } from './testHelpers.js'

function productCard(page, name) {
  return page.getByRole('article').filter({ hasText: name })
}

test('manager can create, edit, and soft delete a product', async ({ page }) => {
  await setupTestPage(page, { role: 'manager' })
  await page.goto('/manager/studio')

  const createdProduct = {
    sku: 'NS-JOURNEY-001',
    name: 'Journey Studio 14',
    brand: 'Nova',
    cpu: 'Intel Core Ultra 7',
    ramGb: '32',
    storageGb: '1024',
    screenSize: '14.0',
    price: '1499',
    stockQty: '4',
    description: 'Journey test product.',
    imageUrl: 'http://127.0.0.1:4173/assets/generated/prod-dell-xps-14-9440.png',
  }

  await fillProductForm(page, createdProduct)
  await page.getByRole('button', { name: 'Create product' }).click()

  await expect(page.getByText('Product created')).toBeVisible()

  const createdCard = productCard(page, createdProduct.name)
  await expect(createdCard).toBeVisible()

  await createdCard.getByRole('button', { name: 'Edit' }).click()
  const editingCard = page.getByRole('article').filter({ has: page.getByRole('button', { name: 'Save changes' }) })
  await editingCard.getByRole('textbox', { name: 'Name' }).fill('Journey Studio 14 Pro')
  await editingCard.getByRole('spinbutton', { name: 'Price' }).fill('1599')
  await editingCard.getByRole('spinbutton', { name: 'Stock' }).fill('2')
  await editingCard.getByRole('textbox', { name: 'Description' }).fill('Updated journey test product.')

  const productUpdateRequest = page.waitForRequest(
    (request) => request.url().includes('/api/v1/internal/products/') && request.method() === 'PATCH',
  )
  await editingCard.getByRole('button', { name: 'Save changes' }).click()

  const productUpdate = await productUpdateRequest
  expect(productUpdate.postDataJSON()).toEqual({
    sku: createdProduct.sku,
    name: 'Journey Studio 14 Pro',
    brand: createdProduct.brand,
    cpu: createdProduct.cpu,
    ramGb: 32,
    storageGb: 1024,
    screenSize: createdProduct.screenSize,
    price: 1599,
    stockQty: 2,
    description: 'Updated journey test product.',
    imageUrl: createdProduct.imageUrl,
  })

  await expect(page.getByText('Product updated')).toBeVisible()
  await expect(productCard(page, 'Journey Studio 14 Pro')).toBeVisible()

  const updatedCard = productCard(page, 'Journey Studio 14 Pro')
  page.once('dialog', async (dialog) => dialog.accept())
  await updatedCard.getByRole('button', { name: 'Soft delete' }).click()

  await expect(page.getByText('Product soft-deleted')).toBeVisible()
  await expect(updatedCard).toHaveCount(0)
})
