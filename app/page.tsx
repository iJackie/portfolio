'use client';

import Hero from '@/components/Hero';
import FolderTabs from '@/components/FolderTabs';
import PageFooter from '@/components/PageFooter';
import PageAscii from '@/components/PageAscii';

/**
 * HomePage — Hero (event lanyard) → FolderTabs → PageFooter, with a
 * page-level <PageAscii /> drift layer that wanders ACROSS the whole
 * second half of the page (folders + footer) instead of stopping at
 * section boundaries. Tokens bounce off the cursor.
 */
export default function HomePage() {
  return (
    <div className="relative">
      <Hero />
      {/* Drift sits behind everything below the hero. Spans the full
          remaining page so coffee/bunny/sparkles travel from folder
          section all the way down through the footer. */}
      <PageAscii />
      <FolderTabs />
      <PageFooter />
    </div>
  );
}
