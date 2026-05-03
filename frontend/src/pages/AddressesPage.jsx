import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAddress, deleteAddress, fetchAddresses, updateAddress } from '../lib/customerApi'
import { formatApiError } from '../lib/formatters'

const initialAddressForm = {
  receiver: '',
  phone: '',
  line1: '',
  ward: '',
  district: '',
  city: '',
  isDefault: false,
}

function AddressFields({ value, onChange, prefix = 'address' }) {
  return (
    <div className="destination-form-grid">
      <div className="dest-field">
        <label htmlFor={`${prefix}-receiver`}>Receiver Name</label>
        <input
          id={`${prefix}-receiver`}
          value={value.receiver}
          onChange={(event) => onChange('receiver', event.target.value)}
          placeholder="e.g. CA Nguyen"
          required
        />
      </div>

      <div className="dest-field">
        <label htmlFor={`${prefix}-phone`}>Phone Number</label>
        <input
          id={`${prefix}-phone`}
          value={value.phone}
          onChange={(event) => onChange('phone', event.target.value)}
          placeholder="033 477 9407"
          required
        />
      </div>

      <div className="dest-field dest-field--full">
        <label htmlFor={`${prefix}-line1`}>Street Address</label>
        <input
          id={`${prefix}-line1`}
          value={value.line1}
          onChange={(event) => onChange('line1', event.target.value)}
          placeholder="House number, street name..."
          required
        />
      </div>

      <div className="dest-field dest-field--third">
        <label htmlFor={`${prefix}-ward`}>Ward</label>
        <input
          id={`${prefix}-ward`}
          value={value.ward}
          onChange={(event) => onChange('ward', event.target.value)}
          required
        />
      </div>

      <div className="dest-field dest-field--third">
        <label htmlFor={`${prefix}-district`}>District</label>
        <input
          id={`${prefix}-district`}
          value={value.district}
          onChange={(event) => onChange('district', event.target.value)}
          required
        />
      </div>

      <div className="dest-field dest-field--third">
        <label htmlFor={`${prefix}-city`}>City</label>
        <input
          id={`${prefix}-city`}
          value={value.city}
          onChange={(event) => onChange('city', event.target.value)}
          required
        />
      </div>

      <div className="dest-checkbox-row" onClick={() => onChange('isDefault', !value.isDefault)}>
        <input
          id={`${prefix}-is-default`}
          type="checkbox"
          checked={Boolean(value.isDefault)}
          onChange={(event) => onChange('isDefault', event.target.checked)}
        />
        <label htmlFor={`${prefix}-is-default`}>Set as Default Address</label>
      </div>
    </div>
  )
}

export function AddressesPage() {
  const queryClient = useQueryClient()
  const [newAddress, setNewAddress] = useState(initialAddressForm)
  const [editingId, setEditingId] = useState('')
  const [editingAddress, setEditingAddress] = useState(initialAddressForm)
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  })

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      setFeedback({ message: 'Address saved successfully.', type: 'success' })
      setNewAddress(initialAddressForm)
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setTimeout(() => setFeedback({ message: '', type: 'success' }), 4000)
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to save this address.'),
        type: 'error',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateAddress,
    onSuccess: () => {
      setFeedback({ message: 'Address updated.', type: 'success' })
      setEditingId('')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setTimeout(() => setFeedback({ message: '', type: 'success' }), 4000)
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to update this address.'),
        type: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: (error) => {
      setFeedback({
        message: formatApiError(error, 'Unable to delete this address.'),
        type: 'error',
      })
    },
  })

  const addresses = [...(addressesQuery.data || [])].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))

  function updateNewAddress(field, value) {
    setNewAddress((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateEditingAddress(field, value) {
    setEditingAddress((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleCreate(event) {
    event.preventDefault()
    createMutation.mutate(newAddress)
  }

  function startEditing(address) {
    setEditingId(address.id)
    setEditingAddress({
      receiver: address.receiver,
      phone: address.phone,
      line1: address.line1,
      ward: address.ward,
      district: address.district,
      city: address.city,
      isDefault: address.isDefault,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleUpdate(event) {
    event.preventDefault()
    updateMutation.mutate({
      id: editingId,
      payload: editingAddress,
    })
  }

  return (
    <div className="manage-destinations-page">
      <div className="destinations-container">
        <header className="destinations-header">
          <h1>Manage Addresses</h1>
          <p>Scholarly Precision in Delivery Logistics</p>
        </header>

        {feedback.message && (
          <div className={`catalog-feedback ${feedback.type === 'error' ? 'catalog-feedback--error' : 'catalog-feedback--success'}`}
            style={{ marginBottom: '40px', borderRadius: '12px' }}>
            {feedback.message}
          </div>
        )}

        <div className="destinations-layout">
          {/* Left Column: Add/Edit Form */}
          <aside className="destinations-sidebar">
            <article className="add-address-card">
              <h2>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add New Address
              </h2>

              <form onSubmit={handleCreate}>
                <AddressFields
                  value={newAddress}
                  onChange={updateNewAddress}
                  prefix="new"
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
                  <button type="submit" className="btn-save-destination" disabled={createMutation.isPending || updateMutation.isPending}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    {editingId ? (updateMutation.isPending ? 'Updating...' : 'Save Address') : (createMutation.isPending ? 'Saving...' : 'Save Address')}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="btn-save-destination"
                      style={{ background: '#6c757d' }}
                      onClick={() => setEditingId('')}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </article>
          </aside>

          {/* Right Column: Address List */}
          <main className="destinations-main">
            <div className="address-list-header">
              <h2>Your Addresses</h2>
              <span className="address-count-badge">{addresses.length} SAVED RECORDS</span>
            </div>

            {addressesQuery.isLoading ? (
              <p style={{ padding: '20px', color: '#8e8e8e', fontWeight: '600' }}>Loading records...</p>
            ) : addresses.length === 0 ? (
              <div style={{ padding: '80px', background: 'white', borderRadius: '12px', textAlign: 'center', color: '#adb5bd', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px', opacity: 0.3 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p style={{ fontSize: '18px', fontWeight: '600' }}>No destination records found.</p>
                <p style={{ fontSize: '14px' }}>Add your first address using the form on the left.</p>
              </div>
            ) : (
              <div className="destinations-list">
                {addresses.map((address) => (
                  <article key={address.id} className={`dest-card-modern ${address.isDefault ? 'dest-card-modern--default' : 'dest-card-modern--secondary'}`}>
                    <div className="dest-card-header">
                      <h3>
                        {address.receiver}
                        {address.isDefault && <span className="tag-primary-contact">Primary Contact</span>}
                      </h3>
                      {address.isDefault ? (
                        <span className="badge-dest-default">DEFAULT</span>
                      ) : (
                        <button
                          className="btn-dest-set-default"
                          onClick={() => updateMutation.mutate({ id: address.id, payload: { isDefault: true } })}
                          disabled={updateMutation.isPending}
                        >
                          SET AS DEFAULT
                        </button>
                      )}
                    </div>

                    <div className="dest-card-info">
                      <div className="dest-info-row">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#003366' }}>
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.19-2.19a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <strong>{address.phone}</strong>
                      </div>
                      <div className="dest-info-row">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#003366' }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <div>
                          <strong>{address.line1}</strong>
                          <span style={{ fontSize: '15px' }}>{address.ward}, {address.district}, {address.city}</span>
                        </div>
                      </div>
                    </div>

                    {address.isDefault ? (
                      <div className="dest-card-actions-modern">
                        <button
                          className="action-link-delete"
                          onClick={() => deleteMutation.mutate(address.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          DELETE
                        </button>
                      </div>
                    ) : (
                      <div className="dest-card-actions-mini">
                        <button
                          className="icon-btn-delete"
                          onClick={() => deleteMutation.mutate(address.id)}
                          aria-label="Delete"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
