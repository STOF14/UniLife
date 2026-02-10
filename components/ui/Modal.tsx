'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'phosphor-react';
import type { ModalProps } from '@/lib/types';

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
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
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-background/85 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`} 
        onClick={onClose} 
      />
      {/* Panel */}
      <div className={`relative bg-surface w-full desktop:max-w-2xl desktop:mx-4 max-h-[90vh] overflow-y-auto scroll-container transition-all duration-400 ease-swiss ${
        visible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-8 opacity-0'
      }`}>
        {/* Top accent line */}
        <div className="h-[2px] bg-text-primary" />
        <div className="p-4 desktop:p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-overline uppercase tracking-[0.12em] text-text-secondary mb-1">Form</p>
              <h2 className="text-title text-text-primary">{title}</h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-text-tertiary hover:text-text-primary transition-colors duration-200 p-1"
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
