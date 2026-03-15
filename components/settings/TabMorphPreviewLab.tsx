import { useState } from 'react';

export const TabMorphPreviewLab = () => {
  const [tabDemoOne, setTabDemoOne] = useState(0);
  const [tabDemoTwo, setTabDemoTwo] = useState(0);
  const [tabDemoThree, setTabDemoThree] = useState(0);

  const demoTabs = ['Dashboard', 'Academic', 'Tasks', 'Timetable'];

  return (
    <div className="rounded-md border border-border/80 bg-background/70 p-4">
      <h4 className="mb-3 font-display text-title-sm text-text-primary">Tab Morph Previews</h4>
      <p className="mb-4 text-caption text-text-tertiary">
        Tap each tab to see the morphing behavior. This lab is intentionally not mounted in production settings.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-border/80 bg-surface/70 p-3">
          <div className="mb-2 text-caption text-text-tertiary">Take 1 - Frosted Slide</div>
          <div className="relative grid grid-cols-4 gap-1 overflow-hidden rounded-sm border border-border/80 bg-background/70 p-1">
            <div
              className="absolute bottom-1 left-1 top-1 w-[calc(25%-4px)] rounded-sm border border-border/80 bg-surface-hover/70 transition-transform duration-300 ease-contemplative"
              style={{ transform: `translateX(${tabDemoOne * 100}%)` }}
            />
            {demoTabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setTabDemoOne(index)}
                className={`relative z-10 rounded-sm py-2 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors ${
                  tabDemoOne === index ? 'text-text-primary' : 'text-text-tertiary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border/80 bg-surface/70 p-3">
          <div className="mb-2 text-caption text-text-tertiary">Take 2 - Glass Layer</div>
          <div className="grid grid-cols-4 gap-1 rounded-sm border border-border/80 bg-background/70 p-1">
            {demoTabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setTabDemoTwo(index)}
                className={`rounded-sm py-2 text-[11px] font-medium uppercase tracking-[0.08em] transition-all duration-300 ease-contemplative ${
                  tabDemoTwo === index
                    ? 'border border-border/80 bg-surface-hover/80 text-text-primary shadow-surface-soft'
                    : 'border border-transparent text-text-tertiary hover:border-border/80'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border/80 bg-surface/70 p-3">
          <div className="mb-2 text-caption text-text-tertiary">Take 3 - Liquid Halo</div>
          <div className="relative grid grid-cols-4 gap-1 overflow-hidden rounded-sm border border-border/80 bg-background/70 p-1">
            <div
              className="absolute bottom-1 left-1 top-1 w-[calc(25%-4px)] rounded-sm bg-gradient-to-r from-border/80 via-surface-hover to-success/30 opacity-90 transition-transform duration-300 ease-contemplative"
              style={{ transform: `translateX(${tabDemoThree * 100}%)` }}
            />
            {demoTabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setTabDemoThree(index)}
                className={`relative z-10 rounded-sm py-2 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors ${
                  tabDemoThree === index ? 'text-text-primary' : 'text-text-tertiary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
