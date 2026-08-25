import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your search query, status filters, or selected date range.',
  icon: Icon = Inbox,
  action
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-surface-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-surface-900">{title}</h4>
      <p className="text-xs text-surface-500 max-w-sm mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
}

export default EmptyState;
