
import React from 'react';

interface IconButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
  variant?: 'default' | 'primary' | 'secondary';
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, icon, text, variant = 'default' }) => {
  const baseClasses = "flex items-center space-x-2 px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200";
  const variantClasses = {
    default: "bg-primary-light hover:bg-border-color text-text-primary",
    primary: "bg-gold hover:bg-gold-light text-primary-dark",
    secondary: "bg-accent-purple hover:opacity-90 text-white",
  };
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]}`}>
      {icon}
      <span>{text}</span>
    </button>
  );
};

export default IconButton;