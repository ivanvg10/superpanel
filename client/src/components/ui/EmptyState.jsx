import { motion } from 'framer-motion';
import { fadeUp } from '../../lib/animations';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      {...fadeUp}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="w-14 h-14 bg-zinc-800/60 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4">
        {Icon && <Icon className="w-6 h-6 text-zinc-600" />}
      </div>
      <h3 className="text-sm font-semibold text-zinc-300 mb-1">{title}</h3>
      <p className="text-sm text-zinc-600 max-w-xs leading-relaxed mb-5">{description}</p>
      {action}
    </motion.div>
  );
}
