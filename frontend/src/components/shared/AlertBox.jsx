import styles from './AlertBox.module.css'

const VARIANT_CLASS = {
  success: styles.success,
  error: styles.error,
  info: styles.info,
}

export function AlertBox({
  variant = 'info',
  title,
  message,
  onClose,
  className = '',
}) {
  return (
    <div className={`${styles.alert} ${VARIANT_CLASS[variant] ?? styles.info} ${className}`.trim()} role="status">
      <div className={styles.content}>
        {title ? <p className={styles.title}>{title}</p> : null}
        <p className={styles.message}>{message}</p>
      </div>
      {onClose ? (
        <button type="button" className={styles.close} aria-label="Dismiss message" onClick={onClose}>
          ×
        </button>
      ) : null}
    </div>
  )
}
