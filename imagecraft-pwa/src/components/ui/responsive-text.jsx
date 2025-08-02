import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

export const ResponsiveText = ({ 
  children, 
  maxLength = 25, 
  mobileMaxLength = 15, 
  className = '',
  showTooltip = true 
}) => {
  const text = typeof children === 'string' ? children : children?.toString() || '';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const currentMaxLength = isMobile ? mobileMaxLength : maxLength;
  const shouldTruncate = text.length > currentMaxLength;
  
  const truncatedText = shouldTruncate 
    ? text.substring(0, currentMaxLength - 3) + '...' 
    : text;
  
  if (!shouldTruncate || !showTooltip) {
    return (
      <span className={`text-balance break-words hyphens-auto ${className}`}>
        {shouldTruncate ? truncatedText : children}
      </span>
    );
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`text-balance break-words hyphens-auto cursor-help ${className}`}>
          {truncatedText}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-balance">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export const ButtonText = ({ 
  children, 
  fullText, 
  shortText, 
  mobileText,
  className = '' 
}) => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isSmallScreen, setIsSmallScreen] = React.useState(false);
  
  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 480);
      setIsSmallScreen(window.innerWidth < 640);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  const displayText = React.useMemo(() => {
    if (mobileText && isMobile) return mobileText;
    if (shortText && isSmallScreen) return shortText;
    if (fullText) return fullText;
    return children;
  }, [children, fullText, shortText, mobileText, isMobile, isSmallScreen]);
  
  return (
    <span className={`text-balance break-words hyphens-auto text-center leading-tight ${className}`}>
      {displayText}
    </span>
  );
};

export default ResponsiveText;