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
    <>
      <label htmlFor={`${prefix}-receiver`}>Receiver</label>
      <input
        id={`${prefix}-receiver`}
        value={value.receiver}
        onChange={(event) => onChange('receiver', event.target.value)}
        required
      />

      <label htmlFor={`${prefix}-phone`}>Phone</label>
      <input
        id={`${prefix}-phone`}
        value={value.phone}
        onChange={(event) => onChange('phone', event.target.value)}
        required
      />

      <label htmlFor={`${prefix}-line1`}>Street</label>
      <input
        id={`${prefix}-line1`}
        value={value.line1}
        onChange={(event) => onChange('line1', event.target.value)}
        required
      />

      <label htmlFor={`${prefix}-ward`}>Ward</label>
      <input
        id={`${prefix}-ward`}
        value={value.ward}
        onChange={(event) => onChange('ward', event.target.value)}
        required
      />

      <label htmlFor={`${prefix}-district`}>District</label>
      <input
        id={`${prefix}-district`}
        value={value.district}
        onChange={(event) => onChange('district', event.target.value)}
        required
      />

      <label htmlFor={`${prefix}-city`}>City</label>
      <input
        id={`${prefix}-city`}
        value={value.city}
        onChange={(event) => onChange('city', event.target.value)}
        required
      />

      <label className="checkbox-field" htmlFor={`${prefix}-is-default`}>
        <input
          id={`${prefix}-is-default`}
          type="checkbox"
          checked={Boolean(value.isDefault)}
          onChange={(event) => onChange('isDefault', event.target.checked)}
        />
        Set as default address
      </label>
    </>
  )
}

export function AddressesPage() {
  const queryClient = useQueryClient()
  const [newAddress, setNewAddress] = useState(initialAddressForm)
  const [editingId, setEditingId] = useState('')
  const [editingAddress, setEditingAddress] = useState(initialAddressForm)
  const [feedback, setFeedback] = useState('')

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  })

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      setFeedback('Address saved.')
      setNewAddress(initialAddressForm)
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: (error) => {
      setFeedback(formatApiError(error, 'Unable to save this address.'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateAddress,
    onSuccess: () => {
      setFeedback('Address updated.')
      setEditingId('')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: (error) => {
      setFeedback(formatApiError(error, 'Unable to update this address.'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      setFeedback('Address removed.')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: (error) => {
      setFeedback(formatApiError(error, 'Unable to delete this address.'))
    },
  })

  const addresses = addressesQuery.data || []

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
  }

  function handleUpdate(event) {
    event.preventDefault()
    updateMutation.mutate({
      id: editingId,
      payload: editingAddress,
    })
  }

  return (
    <section className="page page--customer" aria-labelledby="addresses-title">
      <p className="eyebrow">Addresses</p>
      <h1 id="addresses-title">Saved addresses</h1>

      {feedback ? <p className="catalog-feedback">{feedback}</p> : null}

      <article className="customer-card">
        <h2>Add a new address</h2>
        <form className="address-form" onSubmit={handleCreate}>
          <AddressFields value={newAddress} onChange={updateNewAddress} prefix="new-address" />
          <button type="submit" className="button button--primary" disabled={createMutation.isPending}>
            Save address
          </button>
        </form>
      </article>

      {addressesQuery.isLoading ? <p>Loading addresses...</p> : null}

      {addressesQuery.isError ? (
        <p className="catalog-feedback catalog-feedback--error">
          {formatApiError(addressesQuery.error, 'Unable to load addresses right now.')}
        </p>
      ) : null}

      {addresses.length > 0 ? (
        <ul className="address-list">
          {addresses.map((address) => {
            const isEditing = editingId === address.id
            return (
              <li key={address.id}>
                <article className="customer-card">
                  {!isEditing ? (
                    <>
                      <h2>
                        {address.receiver}
                        {address.isDefault ? <span className="default-tag">Default</span> : null}
                      </h2>
                      <p>{address.phone}</p>
                      <p>
                        {address.line1}, {address.ward}, {address.district}, {address.city}
                      </p>

                      <div className="cta-row">
                        {!address.isDefault ? (
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() =>
                              updateMutation.mutate({
                                id: address.id,
                                payload: { isDefault: true },
                              })
                            }
                            disabled={updateMutation.isPending}
                          >
                            Set as default
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() => startEditing(address)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() => deleteMutation.mutate(address.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <form className="address-form" onSubmit={handleUpdate}>
                      <AddressFields
                        value={editingAddress}
                        onChange={updateEditingAddress}
                        prefix={`edit-address-${address.id}`}
                      />
                      <div className="cta-row">
                        <button
                          type="submit"
                          className="button button--primary"
                          disabled={updateMutation.isPending}
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() => setEditingId('')}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
