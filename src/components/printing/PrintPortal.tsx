import React from 'react';
import { createPortal } from 'react-dom';

interface PrintPortalProps {
  children: React.ReactNode;
}

export const PrintPortal: React.FC<PrintPortalProps> = ({ children }) => {
  return createPortal(
    <div className="print-portal-root print-only">
      {children}
    </div>,
    document.body
  );
};
