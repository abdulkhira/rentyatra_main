import { useState } from 'react';
import { Play } from 'lucide-react';

const ImageCarousel = ({ images = [], video = null, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Prioritize images over video - put images first, then video
  const media = [
    ...images.map(img => ({ type: 'image', src: img })),
    ...(video ? [{ type: 'video', src: video }] : [])
  ];
  
  const totalMedia = media.length;

  const handleImageClick = (e) => {
    e.stopPropagation();
    // Advance to next image on click
    setCurrentIndex((prev) => (prev === totalMedia - 1 ? 0 : prev + 1));
  };

  if (totalMedia === 0) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-400">No media</span>
      </div>
    );
  }

  const currentMedia = media[currentIndex];

  return (
    <div className={`relative group ${className}`}>
      {/* Media Display */}
      {currentMedia.type === 'video' ? (
        <div className="relative w-full h-full bg-black">
          <video
            src={currentMedia.src}
            className="w-full h-full object-cover"
            controls
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <Play size={12} fill="currentColor" />
            Video
          </div>
        </div>
      ) : (
        <img
          src={currentMedia.src}
          alt={`Rental listing image ${currentIndex + 1}`}
          className="w-full h-full object-contain cursor-pointer"
          onClick={handleImageClick}
        />
      )}

      {/* Counter Badge - Only show if more than 1 media */}
      {totalMedia > 1 && (
        <div className="absolute top-1.5 md:top-2 right-1.5 md:right-2 bg-black/50 text-white text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded">
          {currentIndex + 1}/{totalMedia}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;

