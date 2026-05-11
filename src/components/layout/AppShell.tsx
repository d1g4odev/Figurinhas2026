import type { User } from 'firebase/auth';
import { Album, CopyCheck, Home, UserRound } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/album', label: 'Álbum', icon: Home },
  { to: '/faltantes', label: 'Faltam', icon: Album },
  { to: '/repetidas', label: 'Repetidas', icon: CopyCheck },
  { to: '/perfil', label: 'Perfil', icon: UserRound }
];

export function AppShell({ children, user }: PropsWithChildren<{ user: User }>) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <span className="eyebrow">Copa 2026</span>
          <h1>Meu álbum</h1>
        </div>
        <img className="avatar" src={user.photoURL || '/icons/icon-192.png'} alt="" />
      </header>

      <main className="app-main">{children}</main>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
