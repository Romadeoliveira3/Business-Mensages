import React from 'react';

interface TooltipProps {
  text: string;
  example: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, example }) => {
  return (
    <div className="relative group flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
        />
      </svg>
      <div className="absolute bottom-full mb-2 w-72 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 left-1/2 -translate-x-1/2">
        <p className="font-sans">{text}</p>
        <p className="mt-2 font-mono bg-slate-700 p-1.5 rounded text-slate-300 text-[11px] whitespace-pre-wrap">{example}</p>
        <svg
          className="absolute text-slate-800 h-2 w-full left-0 top-full"
          x="0px"
          y="0px"
          viewBox="0 0 255 255"
        >
          <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
        </svg>
      </div>
    </div>
  );
};

export default Tooltip;
