export function withAttachmentDownload(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'flags=attachment';
}
