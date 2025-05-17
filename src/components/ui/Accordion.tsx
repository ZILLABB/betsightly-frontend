import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccordionItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  eventKey: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  isOpen,
  onToggle,
  eventKey
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(isOpen ? undefined : 0);

  useEffect(() => {
    if (!contentRef.current) return;
    
    if (isOpen) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div className="border border-[var(--border)] rounded-lg mb-3 overflow-hidden">
      <button
        className="w-full p-4 flex justify-between items-center bg-[var(--card)] text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${eventKey}`}
      >
        <div className="font-medium">{title}</div>
        <ChevronDown 
          className={cn(
            "transition-transform duration-300", 
            isOpen ? "transform rotate-180" : ""
          )} 
          size={18} 
        />
      </button>
      <div
        id={`accordion-content-${eventKey}`}
        ref={contentRef}
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ height: height !== undefined ? `${height}px` : 'auto' }}
      >
        <div className="p-4 bg-[var(--background)]">
          {children}
        </div>
      </div>
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
  defaultActiveKey?: string;
  alwaysOpen?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  defaultActiveKey,
  alwaysOpen = false,
  className
}) => {
  const [activeKeys, setActiveKeys] = useState<string[]>(
    defaultActiveKey ? [defaultActiveKey] : []
  );

  const handleToggle = (eventKey: string) => {
    setActiveKeys(prevKeys => {
      if (prevKeys.includes(eventKey)) {
        return alwaysOpen ? prevKeys.filter(key => key !== eventKey) : [];
      } else {
        return alwaysOpen ? [...prevKeys, eventKey] : [eventKey];
      }
    });
  };

  // Clone children and pass props
  const items = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const eventKey = child.props.eventKey;
      return React.cloneElement(child, {
        isOpen: activeKeys.includes(eventKey),
        onToggle: () => handleToggle(eventKey),
      });
    }
    return child;
  });

  return (
    <div className={cn("space-y-2", className)}>
      {items}
    </div>
  );
};

export default { Accordion, AccordionItem };
