import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Activity, 
  Eye, 
  EyeOff, 
  TrendingUp,
  Clock,
  ExternalLink,
  Plus,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseStreamers, useFirebaseStreamerStatistics } from '../hooks/useFirebaseStreamers';
import { 
  formatDate, 
  formatRelativeTime,
  formatPlatform, 
  generateDefaultAvatar,
  sortStreamers
} from '../utils/formatters';

const Dashboard = () => {
  const navigate = useNavigate();
  const { streamers, loading, toggleRealTime } = useFirebaseStreamers();
  const { statistics } = useFirebaseStreamerStatistics();

  // Ativa tempo real automaticamente quando o componente monta
  React.useEffect(() => {
    toggleRealTime(true);
  }, [toggleRealTime]);

  // Streamers recentes (últimos 5 cadastrados)
  const recentStreamers = React.useMemo(() => {
    return sortStreamers(streamers, 'createdAt', 'desc').slice(0, 5);
  }, [streamers]);

  // Streamers online
  const onlineStreamers = React.useMemo(() => {
    return streamers.filter(s => s.isOnline).slice(0, 5);
  }, [streamers]);

  // Estatísticas por plataforma
  const platformStats = React.useMemo(() => {
    const stats = {};
    streamers.forEach(streamer => {
      if (!stats[streamer.platform]) {
        stats[streamer.platform] = { total: 0, online: 0 };
      }
      stats[streamer.platform].total++;
      if (streamer.isOnline) {
        stats[streamer.platform].online++;
      }
    });
    return Object.entries(stats)
      .map(([platform, data]) => ({
        platform,
        ...data,
        percentage: data.total > 0 ? Math.round((data.online / data.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [streamers]);

  const StatCard = ({ title, value, description, icon: Icon, color = 'text-primary' }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <Icon className={`h-4 w-4 ${color}`} />
          <div className="ml-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StreamerCard = ({ streamer, showStatus = true }) => {
    const platformInfo = formatPlatform(streamer.platform);
    const defaultAvatar = generateDefaultAvatar(streamer.name);

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <Avatar className="h-10 w-10">
          <AvatarImage src={streamer.avatarUrl} alt={streamer.name} />
          <AvatarFallback className={`${defaultAvatar.bgColor} ${defaultAvatar.textColor} text-xs`}>
            {defaultAvatar.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{streamer.name}</p>
            {showStatus && (
              <Badge variant={streamer.isOnline ? "default" : "secondary"} className="text-xs">
                {streamer.isOnline ? 'Online' : 'Offline'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-xs ${platformInfo.color}`}>
              {platformInfo.name}
            </Badge>
            <span className="text-xs text-muted-foreground">{streamer.category}</span>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => window.open(streamer.streamUrl, '_blank')}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral dos streamers e estatísticas
          </p>
        </div>
        <Button onClick={() => navigate('/cadastro')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Streamer
        </Button>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Streamers"
          value={statistics?.total || 0}
          description="Cadastrados no sistema"
          icon={Users}
        />
        <StatCard
          title="Online Agora"
          value={statistics?.online || 0}
          description={`${statistics?.total > 0 ? Math.round((statistics.online / statistics.total) * 100) : 0}% do total`}
          icon={Activity}
          color="text-green-600"
        />
        <StatCard
          title="Offline"
          value={statistics?.offline || 0}
          description="Não estão transmitindo"
          icon={EyeOff}
          color="text-gray-500"
        />
        <StatCard
          title="Taxa de Atividade"
          value={`${statistics?.total > 0 ? Math.round((statistics.online / statistics.total) * 100) : 0}%`}
          description="Streamers ativos"
          icon={TrendingUp}
          color="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streamers Online */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Streamers Online
                </CardTitle>
                <CardDescription>
                  {onlineStreamers.length} streamer{onlineStreamers.length !== 1 ? 's' : ''} transmitindo agora
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/status')}
              >
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {onlineStreamers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum streamer online no momento</p>
              </div>
            ) : (
              <div className="space-y-2">
                {onlineStreamers.map((streamer) => (
                  <StreamerCard key={streamer.id} streamer={streamer} showStatus={false} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Streamers Recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Cadastros Recentes
                </CardTitle>
                <CardDescription>
                  Últimos streamers adicionados
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/cadastro')}
              >
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentStreamers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum streamer cadastrado ainda</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigate('/cadastro')}
                >
                  Cadastrar Primeiro Streamer
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentStreamers.map((streamer) => (
                  <div key={streamer.id}>
                    <StreamerCard streamer={streamer} />
                    <p className="text-xs text-muted-foreground ml-13 mt-1">
                      Cadastrado {formatRelativeTime(streamer.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas por Plataforma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribuição por Plataforma
          </CardTitle>
          <CardDescription>
            Streamers cadastrados e taxa de atividade por plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma estatística disponível</p>
            </div>
          ) : (
            <div className="space-y-4">
              {platformStats.map((stat) => {
                const platformInfo = formatPlatform(stat.platform);
                return (
                  <div key={stat.platform} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={platformInfo.color}>
                          {platformInfo.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {stat.online}/{stat.total} online
                        </span>
                      </div>
                      <span className="text-sm font-medium">{stat.percentage}%</span>
                    </div>
                    <Progress value={stat.percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

