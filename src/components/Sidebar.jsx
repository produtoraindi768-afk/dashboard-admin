import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Activity, 
  Code, 
  Menu,
  X,
  Home,
  BarChart3,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useFirebaseStreamers, useFirebaseStreamerStatistics } from '../hooks/useFirebaseStreamers';

const Sidebar = ({ isOpen, onToggle, className = '' }) => {
  const location = useLocation();
  const { streamers, toggleRealTime } = useFirebaseStreamers();
  const { statistics } = useFirebaseStreamerStatistics();

  // Ativa tempo real automaticamente quando o componente monta
  React.useEffect(() => {
    toggleRealTime(true);
  }, [toggleRealTime]);

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: Home,
      description: 'Visão geral'
    },
    {
      title: 'Cadastro',
      href: '/cadastro',
      icon: Users,
      description: 'Gerenciar streamers',
      badge: streamers.length
    },
    {
      title: 'Status',
      href: '/status',
      icon: Activity,
      description: 'Controlar online/offline',
      badge: statistics?.online || 0,
      badgeVariant: 'default'
    },
    {
      title: 'API Preview',
      href: '/api',
      icon: Code,
      description: 'Visualizar dados JSON'
    }
  ];

  const secondaryItems = [
    {
      title: 'Estatísticas',
      href: '/estatisticas',
      icon: BarChart3,
      description: 'Relatórios detalhados'
    },
    {
      title: 'Configurações',
      href: '/configuracoes',
      icon: Settings,
      description: 'Firebase e migração'
    },
    {
      title: 'Ajuda',
      href: '/ajuda',
      icon: HelpCircle,
      description: 'Documentação e suporte'
    }
  ];

  const isActiveRoute = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const NavItem = ({ item, isActive }) => (
    <NavLink
      to={item.href}
      className={`
        group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
        hover:bg-accent hover:text-accent-foreground
        ${isActive 
          ? 'bg-accent text-accent-foreground shadow-sm' 
          : 'text-muted-foreground hover:text-foreground'
        }
      `}
    >
      <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="truncate">{item.title}</span>
          {item.badge !== undefined && (
            <Badge 
              variant={item.badgeVariant || 'secondary'} 
              className="ml-2 h-5 text-xs"
            >
              {item.badge}
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">
            {item.description}
          </p>
        )}
      </div>
    </NavLink>
  );

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 transform bg-background border-r transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${className}
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">StreamerHub</h1>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {/* Navegação Principal */}
              <div className="space-y-1">
                <h2 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Principal
                </h2>
                {navigationItems.map((item) => (
                  <NavItem 
                    key={item.href} 
                    item={item} 
                    isActive={isActiveRoute(item.href)}
                  />
                ))}
              </div>

              <Separator className="my-4" />

              {/* Navegação Secundária */}
              <div className="space-y-1">
                <h2 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ferramentas
                </h2>
                {secondaryItems.map((item) => (
                  <NavItem 
                    key={item.href} 
                    item={item} 
                    isActive={isActiveRoute(item.href)}
                  />
                ))}
              </div>
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Resumo</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium">{statistics?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Online:</span>
                  <span className="font-medium text-green-600">{statistics?.online || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Offline:</span>
                  <span className="font-medium text-gray-500">{statistics?.offline || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

