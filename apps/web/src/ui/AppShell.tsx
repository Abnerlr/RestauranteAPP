'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Role } from '@restaurante-app/contracts';
import { useAuthStore } from '@/core/auth/auth.store';
import { Badge } from './Badge';
import { Button } from './Button';
import { cn } from './utils';
import styles from './AppShell.module.css';

interface NavItem {
  label: string;
  href: string;
}

interface AppShellProps {
  role: Role;
  socketStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  children: React.ReactNode;
}

function getNavItems(role: Role): NavItem[] {
  const items: NavItem[] = [];

  if (role === Role.ADMIN) {
    items.push(
      { label: 'Kitchen', href: '/kitchen' },
      { label: 'Waiter', href: '/waiter' },
      { label: 'Cashier', href: '/cashier' },
      { label: 'Debug', href: '/debug/realtime' }
    );
  } else if (role === Role.KITCHEN) {
    items.push(
      { label: 'Kitchen', href: '/kitchen' },
      { label: 'Debug', href: '/debug/realtime' }
    );
  } else if (role === Role.WAITER) {
    items.push(
      { label: 'Waiter', href: '/waiter' },
      { label: 'Debug', href: '/debug/realtime' }
    );
  } else if (role === Role.CASHIER) {
    items.push(
      { label: 'Cashier', href: '/cashier' },
      { label: 'Debug', href: '/debug/realtime' }
    );
  }

  return items;
}

function getSocketStatusVariant(
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
): 'success' | 'warn' | 'danger' | 'muted' {
  switch (status) {
    case 'connected':
      return 'success';
    case 'connecting':
      return 'warn';
    case 'error':
      return 'danger';
    default:
      return 'muted';
  }
}

function getSocketStatusLabel(
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting';
    case 'error':
      return 'Error';
    default:
      return 'Disconnected';
  }
}

export function AppShell({ role, socketStatus, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const navItems = getNavItems(role);
  const showBanner = socketStatus === 'disconnected' || socketStatus === 'error';

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className={styles.shell}>
      {showBanner && (
        <div className={styles.banner}>
          {socketStatus === 'disconnected'
            ? 'Reconectando...'
            : 'Error de conexión. Verificando...'}
        </div>
      )}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <div className={styles.appName}>RestauranteApp</div>
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  styles.navLink,
                  pathname === item.href && styles.navLinkActive
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.topbarRight}>
          <Badge variant="muted">{role}</Badge>
          <Badge variant={getSocketStatusVariant(socketStatus)}>
            {getSocketStatusLabel(socketStatus)}
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            style={{ marginLeft: '0.5rem' }}
          >
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className={styles.main}>
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
