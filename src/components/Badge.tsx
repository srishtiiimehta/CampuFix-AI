import React from 'react';
import { TicketPriority, TicketStatus, TicketCategory } from '../types/ticket';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Wifi, 
  Droplet, 
  Zap, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const isSm = size === 'sm';
  const padding = isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  switch (status) {
    case 'Open':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-amber-50 text-amber-800 border border-amber-200 ${padding}`}>
          <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
          <span>Open</span>
        </span>
      );
    case 'In Progress':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 ${padding}`}>
          <AlertCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
          <span>In Progress</span>
        </span>
      );
    case 'Resolved':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 ${padding}`}>
          <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
          <span>Resolved</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${padding}`}>
          <span>{status}</span>
        </span>
      );
  }
};

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const isSm = size === 'sm';
  const padding = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  switch (priority) {
    case 'Critical':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200 ${padding}`}>
          <Flame className={isSm ? 'w-3 h-3 text-rose-600' : 'w-3.5 h-3.5 text-rose-600'} aria-hidden="true" />
          <span>Critical</span>
        </span>
      );
    case 'High':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-orange-50 text-orange-700 border border-orange-200 ${padding}`}>
          <AlertCircle className={isSm ? 'w-3 h-3 text-orange-600' : 'w-3.5 h-3.5 text-orange-600'} aria-hidden="true" />
          <span>High Priority</span>
        </span>
      );
    case 'Medium':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-sky-50 text-sky-800 border border-sky-200 ${padding}`}>
          <span>Medium</span>
        </span>
      );
    case 'Low':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${padding}`}>
          <span>Low</span>
        </span>
      );
  }
};

interface CategoryIconProps {
  category: TicketCategory;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className = 'w-4 h-4' }) => {
  switch (category) {
    case 'Plumbing':
      return <Droplet className={`${className} text-teal-600`} aria-label="Plumbing" />;
    case 'Electricity':
      return <Zap className={`${className} text-amber-500`} aria-label="Electricity" />;
    case 'Cleanliness':
      return <Sparkles className={`${className} text-emerald-600`} aria-label="Cleanliness" />;
    case 'Internet Connectivity':
      return <Wifi className={`${className} text-indigo-600`} aria-label="Internet Connectivity" />;
    default:
      return <AlertCircle className={`${className} text-slate-500`} />;
  }
};

export const HazardNotice: React.FC<{ warning?: string }> = ({ warning }) => (
  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed">
    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
    <div>
      <span className="font-semibold text-rose-950">Safety Risk Flagged: </span>
      {warning || 'Potential hazard requiring immediate campus facility inspection.'}
    </div>
  </div>
);
