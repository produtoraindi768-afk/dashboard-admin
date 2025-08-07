// Utilitários de validação para streamers

// Valida URL
export const isValidUrl = (url) => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Valida URL de stream específica
export const isValidStreamUrl = (url, platform) => {
  if (!isValidUrl(url)) return false;
  
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();
  
  switch (platform?.toLowerCase()) {
    case 'twitch':
      return hostname.includes('twitch.tv');
    case 'youtube':
      return hostname.includes('youtube.com') || hostname.includes('youtu.be');
    case 'kick':
      return hostname.includes('kick.com');
    case 'facebook gaming':
      return hostname.includes('facebook.com') && url.includes('gaming');
    case 'tiktok live':
      return hostname.includes('tiktok.com');
    case 'instagram live':
      return hostname.includes('instagram.com');
    default:
      return true; // Para outras plataformas, aceita qualquer URL válida
  }
};

// Valida dados do streamer
export const validateStreamerData = (data) => {
  const errors = {};
  
  // Nome é obrigatório
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Nome é obrigatório';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres';
  } else if (data.name.trim().length > 50) {
    errors.name = 'Nome deve ter no máximo 50 caracteres';
  }
  
  // Plataforma é obrigatória
  if (!data.platform || data.platform.trim().length === 0) {
    errors.platform = 'Plataforma é obrigatória';
  }
  
  // URL da stream é obrigatória e deve ser válida
  if (!data.streamUrl || data.streamUrl.trim().length === 0) {
    errors.streamUrl = 'URL da stream é obrigatória';
  } else if (!isValidUrl(data.streamUrl)) {
    errors.streamUrl = 'URL da stream deve ser válida';
  } else if (!isValidStreamUrl(data.streamUrl, data.platform)) {
    errors.streamUrl = `URL deve ser compatível com a plataforma ${data.platform}`;
  }
  
  // Avatar URL é opcional, mas se fornecida deve ser válida
  if (data.avatarUrl && data.avatarUrl.trim().length > 0) {
    if (!isValidUrl(data.avatarUrl)) {
      errors.avatarUrl = 'URL do avatar deve ser válida';
    }
  }
  
  // Categoria é obrigatória
  if (!data.category || data.category.trim().length === 0) {
    errors.category = 'Categoria é obrigatória';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sanitiza dados do streamer
export const sanitizeStreamerData = (data) => {
  return {
    name: data.name?.trim() || '',
    platform: data.platform?.trim() || '',
    streamUrl: data.streamUrl?.trim() || '',
    avatarUrl: data.avatarUrl?.trim() || '',
    category: data.category?.trim() || ''
  };
};

// Valida busca
export const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return { isValid: false, error: 'Consulta de busca inválida' };
  }
  
  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length === 0) {
    return { isValid: false, error: 'Consulta de busca não pode estar vazia' };
  }
  
  if (trimmedQuery.length < 2) {
    return { isValid: false, error: 'Consulta de busca deve ter pelo menos 2 caracteres' };
  }
  
  if (trimmedQuery.length > 100) {
    return { isValid: false, error: 'Consulta de busca deve ter no máximo 100 caracteres' };
  }
  
  return { isValid: true, query: trimmedQuery };
};

