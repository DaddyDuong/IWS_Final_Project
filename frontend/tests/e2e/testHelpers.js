import { installMockApi, seedAuthSession } from './fixtures/mockApi.js'

const addressFields = [
  ['receiver', 'Receiver'],
  ['phone', 'Phone'],
  ['line1', 'Street'],
  ['ward', 'Ward'],
  ['district', 'District'],
  ['city', 'City'],
]

const productFields = [
  ['sku', 'SKU'],
  ['name', 'Name'],
  ['brand', 'Brand'],
  ['cpu', 'CPU'],
  ['ramGb', 'RAM (GB)'],
  ['storageGb', 'Storage (GB)'],
  ['screenSize', 'Screen size'],
  ['price', 'Price'],
  ['stockQty', 'Stock'],
  ['description', 'Description'],
  ['imageUrl', 'Image URL'],
]

async function fillLabeledForm(page, form, fields) {
  const values = form ?? {}

  for (const [key, label] of fields) {
    if (!(key in values)) continue

    await page.getByLabel(label, { exact: true }).fill(String(values[key]))
  }
}

export async function setupTestPage(page, { role = null, scenario = 'success' } = {}) {
  await installMockApi(page, { scenario })

  if (role) {
    await seedAuthSession(page, role)
  }
}

export async function fillAddressForm(page, form) {
  await fillLabeledForm(page, form, addressFields)
}

export async function fillProductForm(page, form) {
  await fillLabeledForm(page, form, productFields)
}
