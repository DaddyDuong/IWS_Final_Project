import { AlertBox } from './AlertBox'
import styles from './StateBlock.module.css'

export function StateBlock({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyTitle = 'No data found',
  emptyMessage = 'Try changing your filters or refresh the page.',
  loadingText = 'Loading data...',
  errorFallback = 'Unable to load data right now.',
  children,
}) {
  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading} aria-live="polite">{loadingText}</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.wrapper}>
        <AlertBox
          variant="error"
          title="Request failed"
          message={error?.response?.data?.error?.message ?? error?.response?.data?.message ?? error?.message ?? errorFallback}
        />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className={styles.wrapper}>
        <section className={styles.empty}>
          <h3>{emptyTitle}</h3>
          <p>{emptyMessage}</p>
        </section>
      </div>
    )
  }

  return children
}
