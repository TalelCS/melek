'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface DockItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface DockProps {
  items: DockItem[];
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
}

function DockIcon({ 
  item, 
  mouseX, 
  baseItemSize = 50, 
  magnification = 70 
}: { 
  item: DockItem; 
  mouseX: any; 
  baseItemSize: number; 
  magnification: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [baseItemSize, magnification, baseItemSize]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.button
      ref={ref}
      style={{ width }}
      onClick={item.onClick}
      className="aspect-square w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-400 hover:bg-white/20 hover:border-amber-500/50 transition-colors shadow-lg"
      title={item.label}
    >
      {item.icon}
    </motion.button>
  );
}

export default function Dock({ 
  items, 
  panelHeight = 68, 
  baseItemSize = 50, 
  magnification = 70 
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      style={{ height: panelHeight }}
      className="mx-auto flex items-end gap-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 pb-3 shadow-2xl"
    >
      {items.map((item, i) => (
        <DockIcon
          key={i}
          item={item}
          mouseX={mouseX}
          baseItemSize={baseItemSize}
          magnification={magnification}
        />
      ))}
    </motion.div>
  );
}