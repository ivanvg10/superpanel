import { motion } from 'framer-motion';
import { fadeUp } from '../../lib/animations';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      {...fadeUp}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="w-16 h-16 bg-ios-elev rounded-ios-lg flex items-center justify-center mb-4">
        {Icon && <Icon className="w-7 h-7 text-ios-label3" />}
      </div>
      <h3 className="text-[17px] font-semibold text-ios-label mb-1">{title}</h3>
      <p className="text-[15px] text-ios-label2 max-w-xs leading-relaxed mb-5">{description}</p>
      {action}
    </motion.div>
  );
}
