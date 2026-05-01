import { useState } from 'react'
import { AccountSidebar } from '../components/layout/AccountSidebar'
import { AlertBox } from '../components/shared/AlertBox'
import { StateBlock } from '../components/shared/StateBlock'
import { useAuthStore } from '../stores/authStore'
import { useAddressMutations, useAddressesQuery } from '../hooks/useDomainData'
import styles from './AddressesPage.module.css'

const EMPTY_FORM = {
  receiver: '',
  phone: '',
  line1: '',
  ward: '',
  district: '',
  city: '',
  isDefault: false,
}

function buildAddressPayload(form) {
  return {
    receiver: form.receiver,
    phone: form.phone,
    line1: form.line1,
    ward: form.ward,
    district: form.district,
    city: form.city,
    isDefault: Boolean(form.isDefault),
  }
}

export function AddressesPage() {
  const user = useAuthStore((state) => state.user)
  const addressesQuery = useAddressesQuery()
  const { createMutation, updateMutation, deleteMutation } = useAddressMutations()

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [editingForm, setEditingForm] = useState(EMPTY_FORM)
  const [feedback, setFeedback] = useState(null)

  const addresses = addressesQuery.data?.items ?? []

  function updateField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  async function handleCreate(event) {
    event.preventDefault()
    setFeedback(null)

    await createMutation.mutateAsync(buildAddressPayload(form), {
      onSuccess: () => {
        setForm(EMPTY_FORM)
        setFeedback({ variant: 'success', title: 'Address saved', message: 'New address was added successfully.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Unable to save address', message: 'Please review your input and try again.' })
      },
    })
  }

  async function handleSaveEdit(addressId) {
    setFeedback(null)

    await updateMutation.mutateAsync({ id: addressId, payload: buildAddressPayload(editingForm) }, {
      onSuccess: () => {
        setEditingId(null)
        setFeedback({ variant: 'success', title: 'Address updated', message: 'Address changes were saved.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Update failed', message: 'Unable to update address right now.' })
      },
    })
  }

  async function handleSetDefault(addressId) {
    setFeedback(null)

    await updateMutation.mutateAsync({ id: addressId, payload: { isDefault: true } }, {
      onSuccess: () => {
        setFeedback({ variant: 'success', title: 'Default set', message: 'Default address was updated.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Unable to set default', message: 'Please try again.' })
      },
    })
  }

  async function handleDelete(addressId) {
    setFeedback(null)

    await deleteMutation.mutateAsync(addressId, {
      onSuccess: () => {
        setFeedback({ variant: 'success', title: 'Address deleted', message: 'Address removed from your account.' })
      },
      onError: () => {
        setFeedback({ variant: 'error', title: 'Delete failed', message: 'Unable to delete address right now.' })
      },
    })
  }

  return (
    <section className={styles.layout}>
      <AccountSidebar isManager={user?.role === 'manager'} />

      <div className={styles.content}>
        <header className="pageHeader">
          <h1 className="pageTitle">Saved addresses</h1>
          <p className="pageSubtitle">Create, edit, delete, and set your default shipping address.</p>
        </header>

        {feedback ? (
          <AlertBox
            variant={feedback.variant}
            title={feedback.title}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        ) : null}

        <section className="panel">
          <h2 className={styles.sectionTitle}>Add a new address</h2>
          <form className={styles.form} onSubmit={handleCreate}>
            <div className="fieldGrid">
              <label className="field">
                <span className="fieldLabel">Receiver</span>
                <input value={form.receiver} required onChange={(event) => updateField('receiver', event.target.value)} />
              </label>
              <label className="field">
                <span className="fieldLabel">Phone</span>
                <input value={form.phone} required onChange={(event) => updateField('phone', event.target.value)} />
              </label>
              <label className="field">
                <span className="fieldLabel">Street</span>
                <input value={form.line1} required onChange={(event) => updateField('line1', event.target.value)} />
              </label>
              <label className="field">
                <span className="fieldLabel">Ward</span>
                <input value={form.ward} required onChange={(event) => updateField('ward', event.target.value)} />
              </label>
              <label className="field">
                <span className="fieldLabel">District</span>
                <input value={form.district} required onChange={(event) => updateField('district', event.target.value)} />
              </label>
              <label className="field">
                <span className="fieldLabel">City</span>
                <input value={form.city} required onChange={(event) => updateField('city', event.target.value)} />
              </label>
            </div>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) => updateField('isDefault', event.target.checked)}
              />
              Set as default
            </label>

            <div className="inlineActions">
              <button type="submit" className="primaryButton" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save address'}
              </button>
              <button type="button" className="secondaryButton" onClick={() => setForm(EMPTY_FORM)}>
                Clear
              </button>
            </div>
          </form>
        </section>

        <StateBlock
          isLoading={addressesQuery.isLoading}
          isError={addressesQuery.isError}
          error={addressesQuery.error}
          isEmpty={!addresses.length}
          emptyTitle="No addresses saved"
          emptyMessage="Add your first shipping address above."
          loadingText="Loading addresses..."
        >
          <section className={styles.cards}>
            {addresses.map((address) => {
              const isEditing = editingId === address.id

              if (isEditing) {
                return (
                  <article key={address.id} className={`${styles.card} ${styles.editingCard}`.trim()}>
                    <div className="fieldGrid">
                      <label className="field">
                        <span className="fieldLabel">Receiver</span>
                        <input value={editingForm.receiver} onChange={(event) => setEditingForm((previous) => ({ ...previous, receiver: event.target.value }))} />
                      </label>
                      <label className="field">
                        <span className="fieldLabel">Phone</span>
                        <input value={editingForm.phone} onChange={(event) => setEditingForm((previous) => ({ ...previous, phone: event.target.value }))} />
                      </label>
                      <label className="field">
                        <span className="fieldLabel">Street</span>
                        <input value={editingForm.line1} onChange={(event) => setEditingForm((previous) => ({ ...previous, line1: event.target.value }))} />
                      </label>
                      <label className="field">
                        <span className="fieldLabel">Ward</span>
                        <input value={editingForm.ward} onChange={(event) => setEditingForm((previous) => ({ ...previous, ward: event.target.value }))} />
                      </label>
                      <label className="field">
                        <span className="fieldLabel">District</span>
                        <input value={editingForm.district} onChange={(event) => setEditingForm((previous) => ({ ...previous, district: event.target.value }))} />
                      </label>
                      <label className="field">
                        <span className="fieldLabel">City</span>
                        <input value={editingForm.city} onChange={(event) => setEditingForm((previous) => ({ ...previous, city: event.target.value }))} />
                      </label>
                    </div>

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={editingForm.isDefault}
                        onChange={(event) => setEditingForm((previous) => ({ ...previous, isDefault: event.target.checked }))}
                      />
                      Set as default
                    </label>

                    <div className="inlineActions">
                      <button type="button" className="primaryButton" onClick={() => handleSaveEdit(address.id)}>
                        Save changes
                      </button>
                      <button type="button" className="secondaryButton" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </article>
                )
              }

              return (
                <article key={address.id} className={styles.card}>
                  <div>
                    <p className={styles.receiver}>{address.receiver}</p>
                    <p className="mutedText">{address.phone}</p>
                    <p className="mutedText">{address.line1}, {address.ward}, {address.district}, {address.city}</p>
                    {address.isDefault ? <span className="badge badgeSuccess">Default</span> : null}
                  </div>

                  <div className={styles.cardActions}>
                    {!address.isDefault ? (
                      <button type="button" className="secondaryButton" onClick={() => handleSetDefault(address.id)}>
                        Set as default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="secondaryButton"
                      onClick={() => {
                        setEditingId(address.id)
                        setEditingForm({ ...address })
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className="ghostDangerButton" onClick={() => handleDelete(address.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        </StateBlock>
      </div>
    </section>
  )
}
