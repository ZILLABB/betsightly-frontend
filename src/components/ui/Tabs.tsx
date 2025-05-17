import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface TabProps {
  eventKey: string;
  title: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

interface TabsProps {
  activeKey?: string;
  defaultActiveKey?: string;
  onSelect?: (key: string) => void;
  className?: string;
  children: React.ReactElement<TabProps>[] | React.ReactElement<TabProps>;
}

export const Tabs: React.FC<TabsProps> = ({
  activeKey: controlledActiveKey,
  defaultActiveKey,
  onSelect,
  className,
  children
}) => {
  const [internalActiveKey, setInternalActiveKey] = useState<string>(
    defaultActiveKey || (Array.isArray(children) ? children[0]?.props.eventKey : '')
  );
  
  const activeKey = controlledActiveKey !== undefined ? controlledActiveKey : internalActiveKey;
  
  const handleSelect = (key: string) => {
    if (onSelect) {
      onSelect(key);
    } else {
      setInternalActiveKey(key);
    }
  };
  
  // Extract tab titles and content
  const tabs = React.Children.toArray(children) as React.ReactElement<TabProps>[];
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex border-b border-[var(--border)] mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.props.eventKey}
            className={cn(
              'px-4 py-2 font-medium text-sm transition-colors',
              activeKey === tab.props.eventKey
                ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
            onClick={() => handleSelect(tab.props.eventKey)}
            disabled={tab.props.disabled}
          >
            {tab.props.title}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tabs.map((tab) => (
          <div
            key={tab.props.eventKey}
            className={cn(
              'transition-opacity duration-300',
              activeKey === tab.props.eventKey ? 'block' : 'hidden'
            )}
          >
            {tab.props.children}
          </div>
        ))}
      </div>
    </div>
  );
};

export default { Tabs, Tab };
