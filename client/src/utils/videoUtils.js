/**
 * Video URL detection and embed link generator
 */

export function parseVideoUrl(url) {
  if (!url || typeof url !== 'string') {
    return { type: 'none', embedUrl: null, originalUrl: '' };
  }

  const cleanUrl = url.trim();

  // 1. YouTube detection (standard, shortened, embed, shorts, live)
  const ytMatch = cleanUrl.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
      originalUrl: cleanUrl,
      videoId,
    };
  }

  // 2. Google Drive video preview detection (file/d/, open?id=, uc?id=)
  const gdriveMatch =
    cleanUrl.match(/(?:drive\.google\.com\/file\/d\/)([\w-]+)(?:\/(?:view|preview|edit))?/i) ||
    cleanUrl.match(/(?:drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=)([\w-]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    const fileId = gdriveMatch[1];
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      originalUrl: cleanUrl,
      fileId,
    };
  }

  // 3. Loom detection
  const loomMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    const loomId = loomMatch[1];
    return {
      type: 'loom',
      embedUrl: `https://www.loom.com/embed/${loomId}?autoplay=1`,
      originalUrl: cleanUrl,
      loomId,
    };
  }

  // 4. Vimeo detection
  const vimeoMatch = cleanUrl.match(
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|)(\d+)/i
  );
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
      originalUrl: cleanUrl,
      vimeoId,
    };
  }

  // 5. Direct video files (.mp4, .webm, .ogg, .mov, .m4v) or AWS S3 / CloudFront video URLs
  const isDirectVideo = /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(cleanUrl) || cleanUrl.includes('video/mp4');
  if (isDirectVideo) {
    return {
      type: 'video',
      embedUrl: cleanUrl,
      originalUrl: cleanUrl,
    };
  }

  // 6. Generic embed or fallback iframe
  return {
    type: 'iframe',
    embedUrl: cleanUrl,
    originalUrl: cleanUrl,
  };
}
