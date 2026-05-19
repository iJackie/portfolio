'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EVENTS } from '@/data/events';

type Line = { type: 'in' | 'out'; text: string };

const HELP = [
  'available commands:',
  '  help              show this help',
  '  whoami            who is jacqueline?',
  '  ls events         list every event by slug',
  '  cat about         read the bio',
  '  open <slug>       jump to /events/<slug>',
  '  clear             clear the screen',
  '  exit              close the terminal',
];

const ABOUT = [
  'jacqueline mach · brooklyn → everywhere',
  'head of community @ infrared finance',
  '20+ events shipped across 10+ cities',
  'previously: kana co., 8it / ediblenft, vmware',
  'reach: jacquelinegiale@gmail.com · @ijackie_eth',
];

export default function Terminal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [lines, setLines] = useState<Line[]>([
    { type: 'out', text: "welcome. type 'help' to see commands. esc to close." },
  ]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Open/close hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't trigger when typing in an input or textarea
      const t = e.target as HTMLElement | null;
      const typing = t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable;
      if (!typing && e.key === '/') {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Focus on open + autoscroll
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    setHistory((h) => [...h, cmd]);
    setHistIdx(-1);

    const out: Line[] = [{ type: 'in', text: cmd }];
    const [base, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(' ');

    switch (base) {
      case 'help':
        out.push(...HELP.map((l) => ({ type: 'out' as const, text: l })));
        break;
      case 'whoami':
        out.push({ type: 'out', text: 'head of community @ infrared finance' });
        break;
      case 'cat':
        if (arg === 'about') out.push(...ABOUT.map((l) => ({ type: 'out' as const, text: l })));
        else out.push({ type: 'out', text: `cat: ${arg || '(empty)'}: no such file` });
        break;
      case 'ls':
        if (arg === 'events' || arg === '') {
          out.push(...EVENTS.map((e) => ({ type: 'out' as const, text: `  ${e.slug}` })));
        } else {
          out.push({ type: 'out', text: `ls: cannot access '${arg}': no such directory` });
        }
        break;
      case 'open': {
        const e = EVENTS.find((x) => x.slug === arg);
        if (e) {
          out.push({ type: 'out', text: `opening ${e.name}…` });
          setLines((l) => [...l, ...out]);
          setInput('');
          setTimeout(() => { setOpen(false); router.push(`/events#${e.slug}`); }, 350);
          return;
        }
        out.push({ type: 'out', text: `open: no event with slug '${arg}'. try 'ls events'.` });
        break;
      }
      case 'clear':
        setLines([]);
        setInput('');
        return;
      case 'exit':
        setOpen(false);
        setInput('');
        return;
      default:
        out.push({ type: 'out', text: `command not found: ${base}. type 'help'.` });
    }

    setLines((l) => [...l, ...out]);
    setInput('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') run(input);
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const next = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next);
      setInput(history[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx === -1) return;
      const next = histIdx + 1;
      if (next >= history.length) { setHistIdx(-1); setInput(''); }
      else { setHistIdx(next); setInput(history[next]); }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab-complete event slug after "open "
      if (input.startsWith('open ')) {
        const partial = input.slice(5).trim();
        const match = EVENTS.find((ev) => ev.slug.startsWith(partial));
        if (match) setInput(`open ${match.slug}`);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-5 right-5 z-[90] w-[min(540px,calc(100vw-2rem))]"
        >
          <div className="glass rounded-2xl overflow-hidden shadow-[0_24px_60px_-24px_rgba(43,20,16,0.55)] border border-rust-500/15">
            <header className="flex items-center justify-between px-4 py-2 border-b border-rust-500/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rust-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-rust-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-sage-500" />
                <span className="ml-3 text-[11px] uppercase tracking-[0.14em] text-warm-500">
                  jackie@web3 ~
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close terminal"
                className="text-warm-500 hover:text-rust-500 transition-colors"
              >
                <X size={14} />
              </button>
            </header>
            <div className="font-mono text-[12.5px] leading-[1.6] text-ink-900 p-4 max-h-[55vh] overflow-y-auto">
              {lines.map((l, i) => (
                <div key={i} className="whitespace-pre">
                  {l.type === 'in' ? (
                    <span><span className="text-rust-500">jackie@web3</span><span className="text-sage-700">:~$ </span>{l.text}</span>
                  ) : (
                    <span className="text-ink-900/80">{l.text}</span>
                  )}
                </div>
              ))}
              <div className="flex items-center">
                <span className="text-rust-500">jackie@web3</span>
                <span className="text-sage-700">:~$ </span>
                <input
                  ref={inputRef}
                  className="ml-1 flex-1 bg-transparent outline-none text-ink-900 caret-rust-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div ref={endRef} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
