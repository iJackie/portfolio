'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import EventRecap from '@/components/EventRecap';
import ContentBento from '@/components/ContentBento';
import GlobePreview from '@/components/GlobePreview';
import ResumeFolder from '@/components/ResumeFolder';
/* FolderAscii removed — PageAscii at the page level now provides the
   cross-section ASCII drift + cursor-repel. */

/**
 * FolderTabs — file-folder navigation that sits directly below the Hero.
 *
 * Design goals (this rewrite):
 *   1. ALWAYS OPEN. There is no "closed" state, no collapse-to-zero, no
 *      close button. One folder is always the active one in front.
 *   2. NO PAGE REFLOW on switch. All four folder bodies are mounted
 *      simultaneously and stacked absolutely. Only the active one is
 *      visible (opacity 1, pointer-events on); the others sit behind
 *      with opacity 0, pointer-events: none. Swapping tabs only
 *      crossfades opacity — the page never grows or shrinks.
 *   3. FILE-FOLDER LOOK. Tabs have a slight upward lift on the active
 *      tab, the body sits flush behind the tab strip with a shared
 *      hairline so the active tab visually merges into the folder body.
 */

type FolderId = 'global-events' | 'deep-dive' | 'content' | 'resume';

type Folder = {
  id: FolderId;
  index: string;
  title: string;
  blurb: string;
  /** Tailwind class on the tab + body that picks the ombre tint */
  tintClass: string;
};

const FOLDERS: Folder[] = [
  { id: 'global-events', index: '01', title: 'MAP',         blurb: 'World map + city pins.',    tintClass: 'folder-tint-peach'    },
  { id: 'deep-dive',     index: '02', title: 'EVENT RECAP', blurb: 'Recaps, merch, lessons.',   tintClass: 'folder-tint-lavender' },
  { id: 'content',       index: '03', title: 'CONTENT',     blurb: 'Reels, talks, posts.',      tintClass: 'folder-tint-rose'     },
  { id: 'resume',        index: '04', title: 'RESUME',      blurb: 'Roles, scope, results.',    tintClass: 'folder-tint-ember'    },
];

export default function FolderTabs() {
  // Always one folder is open — start with MAP.
  const [openId, setOpenId] = useState<FolderId>('global-events');

  const openFolder = FOLDERS.find((f) => f.id === openId)!;

  return (
    <section
      aria-label="Portfolio sections"
      // No background — page-wide .ombre-page on <main> carries through.
      // Comfortable top pad gives breathing room between the bio and tabs.
      className="relative w-full px-6 pt-6 pb-8"
    >
      {/* ASCII drift now lives at the page level (<PageAscii />) so it
          flows across the WHOLE second half of the page. */}

      {/* Folder width — sized for big screens but slightly smaller than
          before so the peek card can pop OFF the left edge. */}
      <div className="relative mx-auto max-w-[1180px]" style={{ zIndex: 1 }}>
        {/* TAB ROW — file-folder strip. All tabs share the same baseline
            (no Y movement on the active one) so the row's bottom edge
            meets the body's top edge cleanly with no overlap. */}
        <div
          role="tablist"
          aria-label="Folders"
          className="flex flex-wrap items-end gap-1.5 relative z-20"
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
                <span className="folder-tab__divider">/</span>
                <span className="folder-tab__title">{f.title}</span>
              </button>
            );
          })}
        </div>

        {/*
          FOLDER STAGE
          ──────────────────────────────────────────────────────────
          All four bodies are mounted at once and stacked using CSS
          grid (every body lives in the same grid cell). Only the
          active one is visible (opacity 1, pointer-events: auto);
          the others sit underneath, hidden but already laid out.

          This means tab swaps NEVER change layout height — no jump,
          no reflow, no animation glitch. The crossfade is opacity only.

          The grid container's height is determined by the TALLEST body
          (because every body is in the same cell), which is what we
          want — the page is stable.
        */}
        {/*
          STAGE — single panel rendered at a time.
          AnimatePresence with mode="wait" gives a clean fade-out then
          fade-in. Only the ACTIVE folder's content is mounted, so the
          OGL canvas in EventRecap (and the globe, etc.) only spins up
          when actually visible — no hidden-panel lag or bug.

          A min-height on the stage keeps the page from collapsing
          visibly during the brief transition between panels.
        */}
        {/* No fixed min-height — each tab sizes to its own content so
            shorter tabs (EVENT RECAP / CONTENT) don't leave dead space
            below them. MAP's popped-out peek card overflows the body
            naturally via overflow:visible. */}
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
              <FolderBody folder={openFolder} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function FolderBody({ folder }: { folder: Folder }) {
  // The MAP tab needs overflow: visible so the globe's peek card can pop
  // OUT past the left edge of the folder body. Other tabs keep the
  // default folder-body styling (overflow: hidden for clean corners).
  const isMap = folder.id === 'global-events';
  return (
    <div
      className={`folder-body ${folder.tintClass}`}
      style={isMap ? { overflow: 'visible' } : undefined}
    >
      {/* Folder header strip */}
      <div className="folder-body__header">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] tracking-[0.22em]" style={{ color: 'rgba(63,31,45,0.55)' }}>
            FOLDER {folder.index}
          </span>
          <span className="font-mono text-[11px]" style={{ color: 'rgba(63,31,45,0.35)' }}>•</span>
          <span className="font-mono text-[11px] tracking-[0.22em]" style={{ color: 'rgba(63,31,45,0.55)' }}>
            {folder.blurb.toUpperCase()}
          </span>
        </div>
        <span
          aria-hidden
          className="font-mono text-[11px] tracking-[0.22em]"
          style={{ color: 'rgba(63,31,45,0.4)' }}
        >
          ✿
        </span>
      </div>

      {/* Content — routes by folder id. Tab 01/MAP renders the globe
          directly (no header copy on top). */}
      <div className="folder-body__content">
        {folder.id === 'global-events' ? (
          <GlobePreview />
        ) : folder.id === 'deep-dive' ? (
          <EventRecap />
        ) : folder.id === 'content' ? (
          <ContentBento />
        ) : (
          <ResumeFolder />
        )}
      </div>
    </div>
  );
}
