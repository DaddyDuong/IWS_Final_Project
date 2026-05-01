import { test, expect } from '@playwright/test'
import { setupTestPage } from './testHelpers.js'

async function submitActiveAuthForm(page, buttonName) {
  await page.locator('form').getByRole('button', { name: buttonName }).click()
}

test('public home page exposes primary entry points', async ({ page }) => {
  await setupTestPage(page)
  await page.goto('/')

  const primaryNav = page.getByRole('navigation', { name: 'Primary' })
  await expect(primaryNav).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Home' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Shop' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Cart' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Account' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Studio' })).toHaveCount(0)

  await expect(page.getByRole('heading', { name: /find the laptop that fits your next move/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Shop the catalog' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create account' })).toBeVisible()
})

test('/auth hides the primary navigation', async ({ page }) => {
  await setupTestPage(page)
  await page.goto('/auth')

  await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
})

test('anonymous checkout redirects to auth with source preserved', async ({ page }) => {
  await setupTestPage(page)
  await page.goto('/checkout')

  await expect(page).toHaveURL(/\/auth$/)
  await page.getByLabel('Email').fill('john.doe@email.com')
  await page.getByLabel('Password').fill('Password@123')
  await submitActiveAuthForm(page, 'Sign in')

  await expect(page).toHaveURL(/\/checkout$/)
})

test('sign in returns users to account', async ({ page }) => {
  await setupTestPage(page)
  await page.goto('/auth')
  await page.getByLabel('Email').fill('john.doe@email.com')
  await page.getByLabel('Password').fill('Password@123')
  await submitActiveAuthForm(page, 'Sign in')

  await expect(page).toHaveURL(/\/account$/)
})

test('registration returns to sign in and pre-fills the email', async ({ page }) => {
  await setupTestPage(page)
  await page.goto('/auth')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByLabel('Full name').fill('Jane Sample')
  await page.getByLabel('Email').fill('jane@example.com')
  await page.getByLabel('Phone').fill('+1 (555) 100-2000')
  await page.getByLabel('Password').fill('Password@123')
  await submitActiveAuthForm(page, 'Create account')

  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveValue('jane@example.com')
  await expect(page.getByText('Account created')).toBeVisible()
})

test('password recovery sends a reset link, copies the demo token, and completes reset', async ({ page, context }) => {
  await setupTestPage(page)
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/auth/recovery')

  await page.getByLabel('Email').fill('john.doe@email.com')
  await page.getByRole('button', { name: 'Send reset link' }).click()

  await expect(page.getByText('Reset link sent')).toBeVisible()
  await expect(page.getByText('demo-reset-token')).toBeVisible()

  await page.getByRole('button', { name: 'Copy token' }).click()
  await expect(page.getByText('Token copied', { exact: true })).toBeVisible()

  await page.getByLabel('Reset token').fill('demo-reset-token')
  await page.getByLabel('New password').fill('Password@456')
  await page.getByLabel('Confirm password').fill('Password@456')
  await page.getByRole('button', { name: 'Update password' }).click()

  await expect(page.getByText('Password updated')).toBeVisible()
})

test('customer sessions show account but not studio', async ({ page }) => {
  await setupTestPage(page, { role: 'customer' })
  await page.goto('/account')

  const primaryNav = page.getByRole('navigation', { name: 'Primary' })
  await expect(primaryNav.getByRole('link', { name: 'Account' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Studio' })).toHaveCount(0)
})

test('manager sessions show studio in the primary navigation', async ({ page }) => {
  await setupTestPage(page, { role: 'manager' })
  await page.goto('/account')

  const primaryNav = page.getByRole('navigation', { name: 'Primary' })
  await expect(primaryNav.getByRole('link', { name: 'Account' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Studio' })).toBeVisible()
})
