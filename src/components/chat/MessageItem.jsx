import { memo } from 'react';
import { formatAvatarUrl } from '../../utils/urlHelpers';
import { RemoteImage } from '../common/RemoteImage';
import { MessageAttachment } from './MessageAttachment';

export const MessageItem = memo(({ msg, isMe }) => (
  <div className={`flex items-start gap-3 w-full ${isMe ? 'flex-row-reverse' : ''}`}>
    <div className="shrink-0">
      <RemoteImage src={formatAvatarUrl(msg.userAvatarUrl)} className="h-10 w-10 rounded-2xl object-cover shadow-lg" />
    </div>
    <div className={`flex max-w-[80%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`rounded-[1.5rem] p-4 shadow-xl ${isMe ? 'rounded-tr-none bg-indigo-600 text-white' : 'rounded-tl-none border border-slate-700/50 bg-slate-800'}`}>
        {!isMe && <p className="mb-1 text-[10px] font-black uppercase opacity-40 truncate max-w-[150px]">{msg.userName}</p>}
        {msg.content && <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>}
        {msg.fileUrl && <MessageAttachment fileUrl={msg.fileUrl} fileName={msg.fileName} />}
      </div>
      <span className="mt-1 text-[9px] font-black uppercase opacity-30">
        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
      </span>
    </div>
  </div>
));