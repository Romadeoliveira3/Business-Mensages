
import React from 'react';

interface StatusBadgeProps {
  text: string;
  color: 'purple' | 'green' | 'yellow' | 'red';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ text, color }) => {
  const colorClasses = {
    purple: 'bg-accent-purple/20 text-accent-purple',
    green: 'bg-accent-green/20 text-accent-green',
    yellow: 'bg-gold-dark/30 text-gold-light',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${colorClasses[color]}`}>
      {text}
    </span>
  );
};

export default StatusBadge;