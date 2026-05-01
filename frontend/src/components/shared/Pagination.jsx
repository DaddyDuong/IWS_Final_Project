import styles from './Pagination.module.css'

function buildPageList(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) {
    pages.push('...')
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (end < totalPages - 1) {
    pages.push('...')
  }

  pages.push(totalPages)
  return pages
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages < 2) {
    return null
  }

  const pages = buildPageList(page, totalPages)

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button type="button" className={styles.navButton} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>

      <div className={styles.pageList}>
        {pages.map((entry, index) => {
          if (entry === '...') {
            return (
              <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                ...
              </span>
            )
          }

          return (
            <button
              key={entry}
              type="button"
              className={`${styles.pageButton} ${entry === page ? styles.active : ''}`.trim()}
              onClick={() => onPageChange(entry)}
            >
              {entry}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className={styles.navButton}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  )
}
