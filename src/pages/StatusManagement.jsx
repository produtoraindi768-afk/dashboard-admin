import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  ExternalLink,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  Activity
} from 'lucide-react';
import { useFirebaseStreamers } from '../hooks/useFirebaseStreamers';
import {
  formatRelativeTime,
  formatPlatform,
  formatUrl,
  generateDefaultAvatar,
} from '../utils/formatters';

const StatusManagement = () => {
  const { streamers, loading, error, updateStreamerStatus, refreshStreamers, toggleRealTime } = useFirebaseStreamers();

  // Ativa tempo real automaticamente quando o componente monta
  React.useEffect(() => {
    toggleRealTime(true);
  }, [toggleRealTime]);
  const [isUpdating, setIsUpdating] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleStatusChange = async (streamerId, newStatus) => {
    setIsUpdating(prev => ({ ...prev, [streamerId]: true }));
    try {
      await updateStreamerStatus(streamerId, newStatus);
      setSuccessMessage(`Status atualizado para ${newStatus ? 'online' : 'offline'}`);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setIsUpdating(prev => ({ ...prev, [streamerId]: false }));
    }
  };

  const stats = useMemo(() => {
    const total = streamers.length;
    const online = streamers.filter(s => s.isOnline).length;
    const offline = total - online;
    return { total, online, offline };
  }, [streamers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Status</h1>
        <p className="text-muted-foreground">
          Controle o status online/offline dos streamers
        </p>
      </div>

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-gray-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-gray-500">{stats.offline}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Taxa Online</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Streamers</CardTitle>
          <CardDescription>
            {streamers.length} streamer{streamers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : streamers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum streamer cadastrado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {streamers.map((streamer) => {
                const platformInfo = formatPlatform(streamer.platform);
                const defaultAvatar = generateDefaultAvatar(streamer.name);
                const isUpdatingStatus = isUpdating[streamer.id];
                
                return (
                  <div key={streamer.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={streamer.avatarUrl} alt={streamer.name} />
                        <AvatarFallback className={`${defaultAvatar.bgColor} ${defaultAvatar.textColor}`}>
                          {defaultAvatar.initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{streamer.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={platformInfo.color}>
                                {platformInfo.name}
                              </Badge>
                              <Badge variant="outline">
                                {streamer.category}
                              </Badge>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <p>URL: {formatUrl(streamer.streamUrl)}</p>
                              <p>Última atualização: {formatRelativeTime(streamer.lastStatusUpdate)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                Status: <span className={streamer.isOnline ? 'text-green-600' : 'text-gray-500'}>
                                  {streamer.isOnline ? 'Online' : 'Offline'}
                                </span>
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isUpdatingStatus && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                              <Switch
                                checked={streamer.isOnline}
                                onCheckedChange={(checked) => handleStatusChange(streamer.id, checked)}
                                disabled={isUpdatingStatus}
                              />
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(streamer.streamUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default StatusManagement;

