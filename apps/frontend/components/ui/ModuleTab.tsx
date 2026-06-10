'use client';

interface Tab {
  key: string;
  label: string;
}

interface ModuleTabProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

export function ModuleTab({ tabs, active, onChange }: ModuleTabProps) {
  return (
    <div className="flex items-center gap-1 border-b" style={{ borderColor: '#EDE9FE' }}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="relative px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: isActive ? '#5B52D1' : '#9CA3AF',
            }}
          >
            {tab.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: '#5B52D1' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
