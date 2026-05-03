import { useState } from 'react'

function isPlaceholderImageUrl(src) {
  if (!src) {
    return true
  }

  // Relative paths (e.g. "/image.jpg") are valid local assets — never treat as placeholder
  if (src.startsWith('/') || src.startsWith('./') || src.startsWith('../')) {
    return false
  }

  try {
    const url = new URL(src)
    return url.hostname === 'example.com' || url.hostname.endsWith('.example.com')
  } catch {
    return true
  }
}

function getInitials({ alt, brand }) {
  const source = brand || alt || 'Laptop'
  const parts = source
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

export function ProductImage({ src, alt, brand, width, height, loading = 'lazy' }) {
  const [hasError, setHasError] = useState(false)

  if (hasError || isPlaceholderImageUrl(src)) {
    return (
      <div className="product-image-fallback" role="img" aria-label="Product image unavailable">
        <span aria-hidden="true">{getInitials({ alt, brand })}</span>
        <p>Image unavailable</p>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      width={width}
      height={height}
      onError={() => setHasError(true)}
    />
  )
}
