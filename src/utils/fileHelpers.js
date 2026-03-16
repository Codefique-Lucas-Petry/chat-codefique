export const getFileExtension = (value = '') => {
    const cleanValue = value.split('?')[0].split('#')[0];
    const parts = cleanValue.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };
  
  export const getAttachmentKind = ({ name = '', type = '', url = '' }) => {
    const extension = getFileExtension(name || url);
    const mime = type.toLowerCase();
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    if (mime === 'application/pdf' || extension === 'pdf') return 'pdf';
    return 'file';
  };
  
  export const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
    return `${Math.round(bytes / 104857.6) / 10} MB`;
  };