import { Star } from 'lucide-react';

const StarRating = ({ 
  rating, 
  maxStars = 5, 
  size = 16, 
  showNumber = false,
  interactive = false,
  onRatingChange = null,
  className = ''
}) => {
  const handleStarClick = (starIndex) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[...Array(maxStars)].map((_, index) => {
          const isFilled = index < Math.floor(rating);
          const isPartial = index === Math.floor(rating) && rating % 1 !== 0;
          
          return interactive ? (
            <button
              key={index}
              type="button"
              onClick={() => handleStarClick(index)}
              className="relative cursor-pointer hover:scale-110 transition-transform"
            >
              {isPartial ? (
                <div className="relative">
                  <Star
                    size={size}
                    className="text-gray-300"
                    fill="currentColor"
                  />
                  <div
                    className="absolute top-0 left-0 overflow-hidden"
                    style={{ width: `${(rating % 1) * 100}%` }}
                  >
                    <Star
                      size={size}
                      className="text-yellow-400"
                      fill="currentColor"
                    />
                  </div>
                </div>
              ) : (
                <Star
                  size={size}
                  className={isFilled ? 'text-yellow-400' : 'text-gray-300'}
                  fill="currentColor"
                />
              )}
            </button>
          ) : (
            <div
              key={index}
              className="relative cursor-default"
            >
              {isPartial ? (
                <div className="relative">
                  <Star
                    size={size}
                    className="text-gray-300"
                    fill="currentColor"
                  />
                  <div
                    className="absolute top-0 left-0 overflow-hidden"
                    style={{ width: `${(rating % 1) * 100}%` }}
                  >
                    <Star
                      size={size}
                      className="text-yellow-400"
                      fill="currentColor"
                    />
                  </div>
                </div>
              ) : (
                <Star
                  size={size}
                  className={isFilled ? 'text-yellow-400' : 'text-gray-300'}
                  fill="currentColor"
                />
              )}
            </div>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-sm font-semibold text-gray-700 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;

