// En src/components/ModalFoto.jsx
function ModalFoto({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-foto-content">
        <img src={imageUrl} alt="Vista ampliada" />
      </div>
    </div>
  );
}
export default ModalFoto;