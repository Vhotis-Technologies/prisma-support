import { useState } from "react";
import { useEscapeToClose } from "../app-hooks/useEscapeToClose";
import type { BookingImageItem } from "../types/booking";
import type { BookingImageTabId } from "../app-hooks/useBookingFlow";
import { formatTimestamp } from "../lib/format";

type BookingImagesDialogProps = {
  bookingReference: string;
  tabs: { id: BookingImageTabId; label: string }[];
  activeTab: BookingImageTabId;
  onSelectTab: (id: BookingImageTabId) => void;
  getTabImages: (id: BookingImageTabId) => BookingImageItem[];
  onClose: () => void;
};

export default function BookingImagesDialog({
  bookingReference,
  tabs,
  activeTab,
  onSelectTab,
  getTabImages,
  onClose,
}: BookingImagesDialogProps) {
  const [lightbox, setLightbox] = useState<BookingImageItem | null>(null);
  const images = getTabImages(activeTab);

  useEscapeToClose(true, () => {
    if (lightbox) {
      setLightbox(null);
      return;
    }
    onClose();
  });

  return (
    <>
      <div className="dialog-backdrop" role="presentation" onClick={onClose}>
        <div
          className="dialog dialog--wide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-images-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="dialog-header">
            <h2 id="booking-images-title">Booking images · {bookingReference}</h2>
          </div>
          <div className="dialog-body">
            <div className="photo-tabs" role="tablist" aria-label="Image category">
              {tabs.map((tab) => {
                const count = getTabImages(tab.id).length;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`photo-tab${activeTab === tab.id ? " is-selected" : ""}`}
                    onClick={() => onSelectTab(tab.id)}
                  >
                    {tab.label}
                    {count > 0 ? <span>{count}</span> : null}
                  </button>
                );
              })}
            </div>
            {images.length === 0 ? (
              <p className="muted">There are no images in this category.</p>
            ) : (
              <ul className="photo-grid">
                {images.map((image) => (
                  <li key={image.id}>
                    <button
                      type="button"
                      className="photo-tile"
                      onClick={() => setLightbox(image)}
                    >
                      <img src={image.image_url} alt="" />
                    </button>
                    <p className="muted">{formatTimestamp(image.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
      {lightbox ? (
        <button
          type="button"
          className="lightbox"
          onClick={() => setLightbox(null)}
          aria-label="Close image"
        >
          <img src={lightbox.image_url} alt={`Booking ${bookingReference}`} />
        </button>
      ) : null}
    </>
  );
}
