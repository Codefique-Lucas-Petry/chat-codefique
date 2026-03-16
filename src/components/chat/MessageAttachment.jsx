import { normalizeFileUrl } from '../../utils/urlHelpers';
import { getAttachmentKind } from '../../utils/fileHelpers';
import { RemoteImage } from '../common/RemoteImage';
import { FileTypeIcon } from '../common/Icons';

export function MessageAttachment({ fileUrl, fileName }) {
  const normalizedUrl = normalizeFileUrl(fileUrl);
  if (!normalizedUrl) return null;
  const kind = getAttachmentKind({ name: fileName, url: normalizedUrl });

  if (kind === 'image') {
    return (
      <a href={normalizedUrl} target="_blank" rel="noreferrer" className="mt-3 block">
        <RemoteImage src={normalizedUrl} className="max-h-56 w-full rounded-[1.5rem] object-cover" />
      </a>
    );
  }

  return (
    <a href={normalizedUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-3 rounded-[1.25rem] border border-slate-700/60 bg-slate-900/70 p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700 text-slate-200">
        <FileTypeIcon />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{fileName || 'Arquivo'}</p>
      </div>
    </a>
  );
}