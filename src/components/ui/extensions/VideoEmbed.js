import { Node, mergeAttributes } from '@tiptap/core';

// Função para extrair ID do YouTube
const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Função para extrair ID do Vimeo
const getVimeoVideoId = (url) => {
  const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

// Função para detectar tipo de vídeo
const getVideoType = (url) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (url.includes('twitch.tv')) {
    return 'twitch';
  }
  return 'iframe'; // Para outros embeds genéricos
};

// Função para gerar embed URL
const getEmbedUrl = (url, type) => {
  switch (type) {
    case 'youtube':
      const youtubeId = getYouTubeVideoId(url);
      return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null;
    
    case 'vimeo':
      const vimeoId = getVimeoVideoId(url);
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
    
    case 'twitch':
      // Para Twitch, extrair o nome do canal ou ID do vídeo
      const twitchMatch = url.match(/twitch\.tv\/(\w+)/);
      if (twitchMatch) {
        return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}`;
      }
      return null;
    
    case 'iframe':
    default:
      // Para outros embeds, assumir que a URL já está pronta para embed
      return url;
  }
};

export const VideoEmbed = Node.create({
  name: 'videoEmbed',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      type: {
        default: 'youtube',
      },
      width: {
        default: '100%',
      },
      height: {
        default: 315,
      },
      title: {
        default: 'Vídeo incorporado',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, type, width, height, title } = HTMLAttributes;
    
    if (!src) {
      return ['div', { class: 'video-embed-placeholder' }, 'URL do vídeo inválida'];
    }

    const embedUrl = getEmbedUrl(src, type);
    
    if (!embedUrl) {
      return ['div', { class: 'video-embed-error' }, 'Não foi possível incorporar este vídeo'];
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-video-embed': '',
        class: 'video-embed-container',
        style: `position: relative; width: ${width}; padding-bottom: 56.25%; height: 0; overflow: hidden;`,
      }),
      [
        'iframe',
        {
          src: embedUrl,
          width: '100%',
          height: '100%',
          frameborder: '0',
          allowfullscreen: 'true',
          title: title,
          style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setVideoEmbed: (options) => ({ commands }) => {
        const { url, width = '100%', height = 315 } = options;
        
        if (!url) {
          return false;
        }

        const type = getVideoType(url);
        const embedUrl = getEmbedUrl(url, type);
        
        if (!embedUrl) {
          return false;
        }

        return commands.insertContent({
          type: this.name,
          attrs: {
            src: url,
            type: type,
            width: width,
            height: height,
            title: `Vídeo incorporado - ${type}`,
          },
        });
      },
    };
  },
});

export default VideoEmbed;
