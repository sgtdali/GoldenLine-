import React from 'react';

// Bu bileşen, 'isOpen' true olduğunda 'children' (içeriğini) gösteren
// basit bir modal (popup) oluşturur.
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) {
    return null; // Eğer açık değilse, hiçbir şey render etme
  }

  return (
    // 'modal-overlay' tüm ekranı kaplayarak arkadaki içeriğe tıklamayı engeller
    <div className="modal-overlay" onClick={onClose}>
      {/* 'modal-content' asıl penceredir. Tıklamaların overlay'e gitmesini engeller */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{title || 'Detay Penceresi'}</h2>
          <button className="modal-close-button" onClick={onClose}>
            &times; {/* Çarpı işareti */}
          </button>
        </header>
        <div className="modal-body">
          {children} {/* 3D Görüntüleyici buraya gelecek */}
        </div>
      </div>
    </div>
  );
}

export default Modal;

