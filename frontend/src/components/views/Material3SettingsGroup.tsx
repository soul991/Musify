import React from 'react';
import { motion } from 'framer-motion';

export interface SettingsItemProps {
  id?: string;
  icon?: React.ReactNode;
  customIcon?: React.ReactNode;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  trailingContent?: React.ReactNode;
  isHighlighted?: boolean;
  enabled?: boolean;
  onClick?: () => void;
  badge?: string;
}

interface Material3SettingsGroupProps {
  title?: string;
  items: SettingsItemProps[];
  className?: string;
}

export const Material3SettingsGroup: React.FC<Material3SettingsGroupProps> = ({
  title,
  items,
  className = ''
}) => {
  return (
    <div className={`flex flex-col w-full ${className}`}>
      {title && (
        <span className="text-xs font-extrabold tracking-normal text-white/50 px-3.5 pb-2 pt-3 select-none">
          {title}
        </span>
      )}

      <div className="flex flex-col gap-[2px] w-full">
        {items.map((item, index) => {
          const isSingle = items.length === 1;
          const isFirst = index === 0;
          const isLast = index === items.length - 1;

          // Material 3 Expressive grouped connected container radius
          const cornerClass = isSingle
            ? 'rounded-3xl'
            : isFirst
            ? 'rounded-t-3xl rounded-b-[4px]'
            : isLast
            ? 'rounded-t-[4px] rounded-b-3xl'
            : 'rounded-[4px]';

          const isDisabled = item.enabled === false;

          return (
            <motion.div
              key={item.id || index}
              whileTap={item.onClick && !isDisabled ? { scale: 0.995 } : undefined}
              onClick={!isDisabled ? item.onClick : undefined}
              className={`w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 transition-colors duration-200 select-none ${cornerClass} ${
                item.isHighlighted
                  ? 'bg-white/15 border border-white/20'
                  : 'bg-white/[0.06] hover:bg-white/[0.09]'
              } ${
                item.onClick && !isDisabled ? 'cursor-pointer' : ''
              } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {item.customIcon ? (
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    {item.customIcon}
                  </div>
                ) : item.icon ? (
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.07] flex items-center justify-center text-white/85 shrink-0 shadow-sm border border-white/5">
                    {item.icon}
                  </div>
                ) : null}

                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-semibold text-white/95 leading-snug">
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--accent-color)] text-white text-xs font-black tracking-normal shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <span className="text-xs text-white/50 leading-relaxed mt-0.5">
                      {item.description}
                    </span>
                  )}
                </div>
              </div>

              {item.trailingContent && (
                <div className="shrink-0 flex items-center pl-3">
                  {item.trailingContent}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
