import { Outlet, useLocation } from 'react-router-dom'
import { MainNav } from './MainNav'
import styles from './AppLayout.module.css'

function shouldHideNav(pathname) {
  return pathname === '/auth'
}

export function AppLayout() {
  const location = useLocation()
  const hideNav = shouldHideNav(location.pathname)

  return (
    <div className={styles.shell}>
      <div className={styles.background} aria-hidden="true" />
      {!hideNav ? <MainNav /> : null}
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  )
}
