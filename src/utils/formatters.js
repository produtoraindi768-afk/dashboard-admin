// Utilitários de formatação para o dashboard

// Formata data para exibição
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Data inválida';
  }
};

// Formata data relativa (ex: "há 2 horas")
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Agora mesmo';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `Há ${diffInMonths} mês${diffInMonths > 1 ? 'es' : ''}`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `Há ${diffInYears} ano${diffInYears > 1 ? 's' : ''}`;
  } catch {
    return 'Data inválida';
  }
};

// Formata status online/offline
export const formatStatus = (isOnline) => {
  return isOnline ? 'Online' : 'Offline';
};

// Obtém cor do status
export const getStatusColor = (isOnline) => {
  return isOnline ? 'text-green-600' : 'text-gray-500';
};

// Obtém cor de fundo do status
export const getStatusBgColor = (isOnline) => {
  return isOnline ? 'bg-green-100' : 'bg-gray-100';
};

// Formata nome da plataforma com ícone
export const formatPlatform = (platform) => {
  const platformMap = {
    'Twitch': { name: 'Twitch', color: 'text-purple-600' },
    'YouTube': { name: 'YouTube', color: 'text-red-600' },
    'Kick': { name: 'Kick', color: 'text-green-600' },
    'Facebook Gaming': { name: 'Facebook Gaming', color: 'text-blue-600' },
    'TikTok Live': { name: 'TikTok Live', color: 'text-black' },
    'Instagram Live': { name: 'Instagram Live', color: 'text-pink-600' },
    'Outro': { name: 'Outro', color: 'text-gray-600' }
  };
  
  return platformMap[platform] || { name: platform, color: 'text-gray-600' };
};

// Trunca texto longo
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Formata URL para exibição
export const formatUrl = (url, maxLength = 40) => {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    const displayUrl = urlObj.hostname + urlObj.pathname;
    return truncateText(displayUrl, maxLength);
  } catch {
    return truncateText(url, maxLength);
  }
};

// Gera avatar padrão baseado no nome
export const generateDefaultAvatar = (name) => {
  if (!name) return '';
  
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
  
  // Cores baseadas no hash do nome
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500'
  ];
  
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const colorIndex = Math.abs(hash) % colors.length;
  
  return {
    initials,
    bgColor: colors[colorIndex],
    textColor: 'text-white'
  };
};

// Formata estatísticas
export const formatStatistics = (stats) => {
  if (!stats) return {};
  
  return {
    total: stats.total || 0,
    online: stats.online || 0,
    offline: stats.offline || 0,
    onlinePercentage: stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0,
    offlinePercentage: stats.total > 0 ? Math.round((stats.offline / stats.total) * 100) : 0
  };
};

// Ordena streamers por diferentes critérios
export const sortStreamers = (streamers, sortBy = 'name', sortOrder = 'asc') => {
  if (!Array.isArray(streamers)) return [];
  
  const sorted = [...streamers].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'platform':
        aValue = a.platform?.toLowerCase() || '';
        bValue = b.platform?.toLowerCase() || '';
        break;
      case 'category':
        aValue = a.category?.toLowerCase() || '';
        bValue = b.category?.toLowerCase() || '';
        break;
      case 'status':
        aValue = a.isOnline ? 1 : 0;
        bValue = b.isOnline ? 1 : 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt || 0);
        bValue = new Date(b.createdAt || 0);
        break;
      case 'lastStatusUpdate':
        aValue = new Date(a.lastStatusUpdate || 0);
        bValue = new Date(b.lastStatusUpdate || 0);
        break;
      default:
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
};

// Filtra streamers por texto de busca
export const filterStreamersBySearch = (streamers, searchQuery) => {
  if (!searchQuery || !Array.isArray(streamers)) return streamers;
  
  const query = searchQuery.toLowerCase().trim();
  
  return streamers.filter(streamer => 
    streamer.name?.toLowerCase().includes(query) ||
    streamer.platform?.toLowerCase().includes(query) ||
    streamer.category?.toLowerCase().includes(query)
  );
};

