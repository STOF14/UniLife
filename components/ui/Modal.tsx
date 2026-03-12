'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'phosphor-react';
import type { ModalProps } from '@/lib/types';

export const Modal = ({ isOpen, onClose, title, chapterLabel = 'Form', children }: ModalProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end desktop:items-center justify-center">
      <div 
        className={`absolute inset-0 bg-text-primary/35 backdrop-blur-[2px] transition-opacity duration-420 ease-contemplative ${
          visible ? 'opacity-100' : 'opacity-0'
        }`} 
        data-testid="modal-backdrop"
        onClick={onClose} 
      />
      <div className={`relative w-full max-h-[90vh] overflow-y-auto scroll-container border border-border/80 bg-surface desktop:mx-4 desktop:max-w-2xl shadow-surface transition-all duration-420 ease-contemplative ${
        visible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-8 opacity-0'
      }`}>
        <div className="h-[1px] bg-border-hover" />
        <div className="p-4 desktop:p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="chapter-label mb-1">{chapterLabel}</p>
              <h2 className="font-display text-title text-text-primary">{title}</h2>
            </div>
            <button 
              onClick={onClose} 
              data-testid="modal-close-btn"
              className="rounded-sm p-1 text-text-tertiary transition-colors duration-300 ease-contemplative hover:text-text-primary"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
