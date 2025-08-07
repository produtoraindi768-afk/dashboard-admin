import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Users, 
  Activity, 
  Code, 
  Menu,
  X,
  Home,
  BarChart3,
  Settings,
  HelpCircle,
  Shield,
  Trophy,
  Newspaper,
  Sun,
  Moon,
  Swords
} from 'lucide-react';
import { useFirebaseStreamers, useFirebaseStreamerStatistics } from '../hooks/useFirebaseStreamers';
import { useFirebaseTeams } from '../hooks/useFirebaseTeams';
import { useFirebaseTournaments } from '../hooks/useFirebaseTournaments';
import { useFirebaseMatches } from '../hooks/useFirebaseMatches';
import useFirebaseTeamStatistics from '../hooks/useFirebaseTeamStatistics';

const Sidebar = ({ isOpen, onToggle, className = '' }) => {
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();
  
  const { streamers } = useFirebaseStreamers();
  const { statistics } = useFirebaseStreamerStatistics();
  const { teams } = useFirebaseTeams();
  const { tournaments } = useFirebaseTournaments();
  const { matches, statistics: matchStatistics } = useFirebaseMatches();
  const { statistics: teamStatistics } = useFirebaseTeamStatistics();

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
      title: 'Times',
      href: '/times',
      icon: Shield,
      description: 'Cadastrar novos times',
      badge: teams.length
    },
    {
      title: 'Torneios',
      href: '/torneios',
      icon: Trophy,
      description: 'Gerenciar torneios',
      badge: tournaments.length
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
      title: 'Partidas',
      href: '/partidas',
      icon: Swords,
      description: 'Gerenciar confrontos',
      badge: matchStatistics?.live || 0,
      badgeVariant: 'destructive'
    },
    {
      title: 'Notícias',
      href: '/noticias',
      icon: Newspaper,
      description: 'Gerenciar notícias'
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
                <img src="/logo sz.svg" alt="SAFEzone Logo" className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">SAFEzone</h1>
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

          {/* Navegação Principal */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  Principal
                </h2>
                <div className="space-y-1">
                  {navigationItems.map((item) => (
                    <NavItem 
                      key={item.href} 
                      item={item} 
                      isActive={isActiveRoute(item.href)}
                    />
                  ))}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  Configurações
                </h2>
                <div className="space-y-1">
                  {secondaryItems.map((item) => (
                    <NavItem 
                      key={item.href} 
                      item={item} 
                      isActive={isActiveRoute(item.href)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Sistema Online</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {streamers.length} streamers • {statistics?.online || 0} online
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

