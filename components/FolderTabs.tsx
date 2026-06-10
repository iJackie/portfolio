'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import EventRecap from '@/components/EventRecap';
import ContentBento from '@/components/ContentBento';
import GlobePreview from '@/components/GlobePreview';
import ResumeFolder from '@/components/ResumeFolder';
import DropdeckFolder from '@/components/DropdeckFolder';

/**
 * FolderTabs — the OG file-folder navigation, supersized.
 *
 *   - A row of big manila tabs (01/map … 05/dropdeck). One folder is
 *     ALWAYS open; clicking a tab crossfades to that folder's body.
 *   - Tabs carry the big italic display titles; bodies are wide and
 *     size to their own content (no fixed stage, no clipping).
 */

type FolderId = 'global-events' | 'deep-dive' | 'content' | 'resume' | 'dropdeck';

type Folder = {
  id: FolderId;
  index: string;
  title: string;
  /** Tailwind/CSS class that picks the pastel tint (dark-mode aware) */
  tintClass: string;
};

const FOLDERS: Folder[] = [
  { id: 'global-events', index: '01', title: 'map',          tintClass: 'folder-tint-peach'    },
  { id: 'deep-dive',     index: '02', title: 'event recap',  tintClass: 'folder-tint-lavender' },
  { id: 'content',       index: '03', title: 'content',      tintClass: 'folder-tint-rose'     },
  { id: 'resume',        index: '04', title: 'resume',       tintClass: 'folder-tint-ember'    },
  { id: 'dropdeck',      index: '05', title: 'dropdeck',     tintClass: 'folder-tint-peach'    },
];

function folderBody(id: FolderId) {
  switch (id) {
    case 'global-events': return <GlobePreview />;
    case 'deep-dive':     return <EventRecap />;
    case 'content':       return <ContentBento />;
    case 'resume':        return <ResumeFolder />;
    case 'dropdeck':      return <DropdeckFolder />;
  }
}

export default function FolderTabs() {
  // Always one folder open — start with MAP.
  const [openId, setOpenId] = useState<FolderId>('global-events');
  const openFolder = FOLDERS.find((f) => f.id === openId)!;

  return (
    <section
      aria-label="Portfolio sections"
      className="relative w-full px-5 md:px-8 pt-6 pb-12"
    >
      <div className="relative mx-auto max-w-[1280px]" style={{ zIndex: 1 }}>
        {/* TAB ROW — big folder tabs sharing one baseline */}
        <div
          role="tablist"
          aria-label="Folders"
          className="flex flex-wrap items-end gap-2 relative z-20"
        >
          {FOLDERS.map((f) => {
            const isOpen = openId === f.id;
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={isOpen}
                aria-controls={`panel-${f.id}`}
                id={`tab-${f.id}`}
                onClick={() => setOpenId(f.id)}
                className={`folder-tab ${f.tintClass} ${isOpen ? 'folder-tab--open' : ''}`}
              >
                <span className="folder-tab__index">{f.index}</span>
                <span className="folder-tab__title">{f.title}</span>
              </button>
            );
          })}
        </div>

        {/* BODY — single open panel, crossfades on tab switch. Sizes to
            its own content so nothing is ever clipped. */}
        <div className="relative z-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={openFolder.id}
              id={`panel-${openFolder.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${openFolder.id}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={`folder-body ${openFolder.tintClass}`}>
                <div className="folder-body__content">
                  {folderBody(openFolder.id)}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
