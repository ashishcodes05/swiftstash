import { 
  Video, Music, Image as ImageIcon, FileText, 
  FileSpreadsheet, Presentation, Archive, File, 
  Folder
} from 'lucide-react';

export const getReadableFileType = (mimeType) => {
  if (!mimeType) return "Unknown File";
  if(mimeType === 'file') return 'Text File';
  if(mimeType === 'directory') return 'Folder';
  const primaryType = mimeType.split('/')[0];

  if (primaryType === 'video') return 'Video';
  if (primaryType === 'audio') return 'Audio';
  if (primaryType === 'image') return 'Image';
  if (primaryType === 'text') return 'Text File';

  const lowerMime = mimeType.toLowerCase();
  
  if (lowerMime === 'application/pdf') return 'PDF';
  if (lowerMime.includes('word')) return 'Word Doc';
  if (lowerMime.includes('spreadsheet') || lowerMime.includes('excel')) return 'Spreadsheet';
  if (lowerMime.includes('presentation') || lowerMime.includes('powerpoint')) return 'Presentation';
  if (lowerMime.includes('zip') || lowerMime.includes('rar') || lowerMime.includes('tar')) return 'Archive (Zip)';

  return 'Document';
};

export const getFileUiConfig = (humanReadableType) => {
  const configMap = {
    'Video': { icon: Video, colorClass: 'text-red-500', bgClass: 'bg-red-100' },
    'Audio': { icon: Music, colorClass: 'text-amber-500', bgClass: 'bg-amber-100' },
    'Image': { icon: ImageIcon, colorClass: 'text-blue-500', bgClass: 'bg-blue-100' },
    'PDF': { icon: FileText, colorClass: 'text-red-600', bgClass: 'bg-red-100' },
    'Word Doc': { icon: FileText, colorClass: 'text-blue-600', bgClass: 'bg-blue-100' },
    'Spreadsheet': { icon: FileSpreadsheet, colorClass: 'text-green-600', bgClass: 'bg-green-100' },
    'Presentation': { icon: Presentation, colorClass: 'text-orange-500', bgClass: 'bg-orange-100' },
    'Archive (Zip)': { icon: Archive, colorClass: 'text-purple-500', bgClass: 'bg-purple-100' },
    'Text File': { icon: FileText, colorClass: 'text-gray-600', bgClass: 'bg-gray-200' },
    'Folder' : { icon: Folder, colorClass: 'text-yellow-500 fill-current', bgClass: 'bg-yellow-100' },
  };

  return configMap[humanReadableType] || { icon: File, colorClass: 'text-gray-500', bgClass: 'bg-gray-100' };
};