// Píldoras estilo iOS: fill suave sin borde, color de sistema.
const PROJECT_STYLES = {
  'chai-fit':   'bg-ios-green/15  text-ios-green',
  'leon-coach': 'bg-ios-blue/15   text-ios-blue',
  'san-charly': 'bg-ios-orange/15 text-ios-orange',
  'personal':   'bg-ios-purple/15 text-ios-purple',
};

const PROJECT_LABELS = {
  'chai-fit':   'Chai Fit',
  'leon-coach': 'León Coach',
  'san-charly': 'San Charly',
  'personal':   'Personal',
};

const PRIORITY_STYLES = {
  urgent: 'bg-ios-red/15    text-ios-red',
  high:   'bg-ios-orange/15 text-ios-orange',
  medium: 'bg-ios-yellow/15 text-ios-yellow',
  low:    'bg-ios-gray/20   text-ios-label2',
};

const PRIORITY_LABELS = {
  urgent: 'Urgente',
  high:   'Alta',
  medium: 'Media',
  low:    'Baja',
};

export function ProjectBadge({ project, className = '' }) {
  const styles = PROJECT_STYLES[project] || 'bg-ios-gray/20 text-ios-label2';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles} ${className}`}>
      {PROJECT_LABELS[project] || project}
    </span>
  );
}

export function PriorityBadge({ priority, className = '' }) {
  const styles = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles} ${className}`}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

export function PriorityDot({ priority, className = '' }) {
  const colors = {
    urgent: 'bg-ios-red',
    high:   'bg-ios-orange',
    medium: 'bg-ios-yellow',
    low:    'bg-ios-gray',
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors[priority] || colors.medium} ${className}`} />
  );
}

export default function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ios-elev2 text-ios-label2 ${className}`}>
      {children}
    </span>
  );
}
