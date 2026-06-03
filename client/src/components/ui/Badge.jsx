const PROJECT_STYLES = {
  'chai-fit':   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'leon-coach': 'bg-blue-500/10    text-blue-400    border-blue-500/20',
  'san-charly': 'bg-amber-500/10   text-amber-400   border-amber-500/20',
  'personal':   'bg-violet-500/10  text-violet-400  border-violet-500/20',
};

const PROJECT_LABELS = {
  'chai-fit':   'Chai Fit',
  'leon-coach': 'León Coach',
  'san-charly': 'San Charly',
  'personal':   'Personal',
};

const PRIORITY_STYLES = {
  urgent: 'bg-red-500/10    text-red-400    border-red-500/20',
  high:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low:    'bg-zinc-700/40   text-zinc-400   border-zinc-700/40',
};

const PRIORITY_LABELS = {
  urgent: 'Urgente',
  high:   'Alta',
  medium: 'Media',
  low:    'Baja',
};

export function ProjectBadge({ project, className = '' }) {
  const styles = PROJECT_STYLES[project] || 'bg-zinc-700/40 text-zinc-400 border-zinc-700/40';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${styles} ${className}`}>
      {PROJECT_LABELS[project] || project}
    </span>
  );
}

export function PriorityBadge({ priority, className = '' }) {
  const styles = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${styles} ${className}`}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

export function PriorityDot({ priority, className = '' }) {
  const colors = {
    urgent: 'bg-red-500',
    high:   'bg-orange-500',
    medium: 'bg-yellow-500',
    low:    'bg-zinc-500',
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${colors[priority] || colors.medium} ${className}`} />
  );
}

export default function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-zinc-800 text-zinc-400 border-zinc-700 ${className}`}>
      {children}
    </span>
  );
}
