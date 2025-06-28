import React from 'react';
import { useLazyImage } from '../../hooks/useLazyImage';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  loadingClassName?: string;
  errorClassName?: string;
  showSpinner?: boolean;
  spinnerColor?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = '',
  loadingClassName = '',
  errorClassName = '',
  showSpinner = true,
  spinnerColor = '#D946EF',
  threshold = 0.1,
  rootMargin = '100px'
}) => {
  const { imageSrc, isLoaded, hasError, imgRef } = useLazyImage(src, {
    threshold,
    rootMargin,
    placeholder
  });

  return (
    <div className="relative w-full h-full">
      {/* Only show image when it's loaded or if there's an error with placeholder */}
      {(isLoaded || hasError) && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={`transition-all duration-500 ${
            isLoaded ? 'opacity-100 blur-0' : 'opacity-70 blur-sm'
          } ${hasError ? errorClassName : ''} ${className}`}
        />
      )}
      
      {/* Show loading state when not loaded and not in error */}
      {!isLoaded && !hasError && (
        <div className={`absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse flex items-center justify-center ${loadingClassName}`}>
          <div ref={!isLoaded && !hasError ? imgRef : undefined}>
            {showSpinner && (
              <div 
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ 
                  borderColor: `${spinnerColor} transparent transparent transparent` 
                }}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Show error state only when there's an error and no spinner */}
      {hasError && !showSpinner && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
