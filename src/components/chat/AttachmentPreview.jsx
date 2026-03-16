import { getAttachmentKind, formatBytes } from '../../utils/fileHelpers';

export function AttachmentPreview({ attachment, onRemove }) {
  if (!attachment) return null;
  const kind = getAttachmentKind(attachment);
  return (
    <div className="rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 p-4">
      {kind === 'image' && <img src={attachment.previewUrl} className="w-full rounded-[1.25rem] max-h-44 object-cover mb-3" alt="preview" />}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{attachment.name}</p>
          <p className="text-[10px] font-black uppercase text-slate-500">{formatBytes(attachment.size)}</p>
        </div>
        <button onClick={onRemove} className="rounded-full border border-slate-600 px-3 py-2 text-[10px] font-black text-slate-300 hover:text-red-400">Remover</button>
      </div>
    </div>
  );
}