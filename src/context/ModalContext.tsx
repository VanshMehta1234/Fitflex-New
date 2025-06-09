import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isModalOpen: boolean;
  modalContent: React.ReactNode;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const openModal = (content: React.ReactNode) => {
    setModalContent(content);
    setIsModalOpen(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Small delay to ensure animation completes before removing content
    setTimeout(() => {
      setModalContent(null);
      // Restore body scrolling
      document.body.style.overflow = '';
    }, 300);
  };

  return (
    <ModalContext.Provider value={{ isModalOpen, modalContent, openModal, closeModal }}>
      {children}
      {isModalOpen && (
        <div className="modal-wrapper">
          <div className="modal-backdrop" onClick={closeModal} />
          <div className="modal-content animate-fade-in">
            {modalContent}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
} 