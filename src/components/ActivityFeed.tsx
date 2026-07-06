// src/components/ActivityFeed.tsx
import { formatDistanceToNow } from 'date-fns';

export interface ActivityItem {
    gmail_message_id: string;
    subject: string | null;
    sender: string | null;
    gmail_label_name: string | null;
    processed_at: string | null;
}

interface Props {
    items: ActivityItem[];
}

// Strip the email address part: "EWII <noreply@ewii.dk>" -> "EWII"
function senderName(sender: string | null): string {
    if (!sender) return 'Unknown sender';
    const match = sender.match(/^"?([^"<]+)"?\s*</);
    return (match ? match[1] : sender).trim();
}

export function ActivityFeed({ items }: Props) {
    return (
        <div className="mt-6">
            <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider mb-4">
                Recent Activity
            </h2>

            {items.length === 0 ? (
                <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-lg p-6">
                    <p className="text-slate-500 font-mono text-sm text-center">
                        No emails sorted yet.
                        <br />
                        <span className="text-slate-600">Labelled emails will show up here.</span>
                    </p>
                </div>
            ) : (
                <div className="bg-slate-900/30 border border-slate-800 rounded-lg divide-y divide-slate-800/50">
                    {items.map(item => (
                        <div key={item.gmail_message_id} className="p-4">
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="text-slate-300 font-mono text-sm truncate">
                                    {item.subject || '(no subject)'}
                                </span>
                                {item.processed_at && (
                                    <span className="text-slate-600 font-mono text-xs shrink-0">
                                        {formatDistanceToNow(new Date(item.processed_at), { addSuffix: true })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 min-w-0">
                                <span className="text-slate-500 font-mono text-xs truncate">
                                    {senderName(item.sender)}
                                </span>
                                {item.gmail_label_name && (
                                    <span className="shrink-0 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30
                                                     rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">
                                        {item.gmail_label_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
