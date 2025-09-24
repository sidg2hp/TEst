import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { APP_CONFIG } from '@/config';
import { 
  Home, 
  Wallet, 
  UserPlus, 
  Store, 
  Send, 
  BarChart3,
  Brain,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Connect Wallet', href: '/connect', icon: Wallet },
  { name: 'Register Agent', href: '/register', icon: UserPlus },
  { name: 'Marketplace', href: '/marketplace', icon: Store },
  { name: 'Submit Request', href: '/request', icon: Send },
  { name: 'Results', href: '/results', icon: BarChart3 },
  { name: 'Transformers Demo', href: '/demo', icon: Brain },
  { name: 'Contract Debug', href: '/debug', icon: Settings },
];

export function Sidebar() {
  return (
    <div className="w-64 bg-card border-r border-border">
      <div className="p-6">
        <h1 className="text-xl font-bold">{APP_CONFIG.name}</h1>
      </div>
      <nav className="mt-6">
        <ul role="list" className="space-y-1 px-4">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}