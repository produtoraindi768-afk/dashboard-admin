import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Alert, AlertDescription } from './alert';
import { Youtube, Video, Twitch, Globe, AlertCircle } from 'lucide-react';

const VideoEmbedDialog = ({ isOpen, onClose, onEmbed }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState('auto');
  const [customWidth, setCustomWidth] = useState('100%');
  const [customHeight, setCustomHeight] = useState('315');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  // Função para detectar tipo de vídeo
  const detectVideoType = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    if (url.includes('vimeo.com')) {
      return 'vimeo';
    }
    if (url.includes('twitch.tv')) {
      return 'twitch';
    }
    return 'iframe';
  };

  // Função para validar URL
  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Função para gerar preview
  const generatePreview = (url, type) => {
    const detectedType = type === 'auto' ? detectVideoType(url) : type;
    
    switch (detectedType) {
      case 'youtube':
        const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (youtubeMatch) {
          return {
            type: 'youtube',
            embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
            title: 'Vídeo do YouTube'
          };
        }
        break;
      
      case 'vimeo':
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
          return {
            type: 'vimeo',
            embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
            title: 'Vídeo do Vimeo'
          };
        }
        break;
      
      case 'twitch':
        const twitchMatch = url.match(/twitch\.tv\/(\w+)/);
        if (twitchMatch) {
          return {
            type: 'twitch',
            embedUrl: `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}`,
            title: 'Stream do Twitch'
          };
        }
        break;
      
      default:
        return {
          type: 'iframe',
          embedUrl: url,
          title: 'Vídeo incorporado'
        };
    }
    
    return null;
  };

  // Handler para mudança de URL
  const handleUrlChange = (url) => {
    setVideoUrl(url);
    setError('');
    
    if (url && validateUrl(url)) {
      const previewData = generatePreview(url, videoType);
      setPreview(previewData);
    } else {
      setPreview(null);
    }
  };

  // Handler para mudança de tipo
  const handleTypeChange = (type) => {
    setVideoType(type);
    if (videoUrl && validateUrl(videoUrl)) {
      const previewData = generatePreview(videoUrl, type);
      setPreview(previewData);
    }
  };

  // Handler para incorporar vídeo
  const handleEmbed = () => {
    if (!videoUrl) {
      setError('Por favor, insira uma URL de vídeo');
      return;
    }

    if (!validateUrl(videoUrl)) {
      setError('URL inválida');
      return;
    }

    if (!preview) {
      setError('Não foi possível processar este vídeo');
      return;
    }

    onEmbed({
      url: videoUrl,
      type: preview.type,
      width: customWidth,
      height: parseInt(customHeight),
    });

    handleClose();
  };

  // Handler para fechar modal
  const handleClose = () => {
    setVideoUrl('');
    setVideoType('auto');
    setCustomWidth('100%');
    setCustomHeight('315');
    setError('');
    setPreview(null);
    onClose();
  };

  const videoTypeIcons = {
    youtube: <Youtube className="h-4 w-4" />,
    vimeo: <Video className="h-4 w-4" />,
    twitch: <Twitch className="h-4 w-4" />,
    iframe: <Globe className="h-4 w-4" />
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Incorporar Vídeo
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-url">URL do Vídeo</Label>
              <Input
                id="video-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Suporta YouTube, Vimeo, Twitch e outros embeds
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {preview && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    {videoTypeIcons[preview.type]}
                    <span className="text-sm font-medium capitalize">
                      {preview.type === 'iframe' ? 'Embed Genérico' : preview.type}
                    </span>
                  </div>
                  <div className="aspect-video bg-black rounded-md flex items-center justify-center">
                    <iframe
                      src={preview.embedUrl}
                      className="w-full h-full rounded-md"
                      frameBorder="0"
                      allowFullScreen
                      title={preview.title}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="video-type">Tipo de Vídeo</Label>
                <Select value={videoType} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Detectar Automaticamente</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="twitch">Twitch</SelectItem>
                    <SelectItem value="iframe">Embed Genérico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-height">Altura (px)</Label>
                <Input
                  id="video-height"
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  min="200"
                  max="800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-width">Largura</Label>
              <Select value={customWidth} onValueChange={setCustomWidth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100%">100% (Responsivo)</SelectItem>
                  <SelectItem value="800px">800px</SelectItem>
                  <SelectItem value="640px">640px</SelectItem>
                  <SelectItem value="480px">480px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleEmbed} disabled={!preview}>
            Incorporar Vídeo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VideoEmbedDialog;
