interface CompanyLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CompanyLogo({ className = "", size = "md" }: CompanyLogoProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-24 h-24"
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E5E7EB" />
          </linearGradient>
        </defs>
        
        {/* Main circle background */}
        <circle 
          cx="50" 
          cy="50" 
          r="48" 
          fill="url(#logoGradient)"
          stroke="#1E40AF"
          strokeWidth="2"
        />
        
        {/* Inner decorative elements - representing technology/data flow */}
        <path
          d="M25 35 L45 25 L65 35 L75 50 L65 65 L45 75 L25 65 L15 50 Z"
          fill="none"
          stroke="url(#textGradient)"
          strokeWidth="1.5"
          opacity="0.3"
        />
        
        {/* Central icon - representing work tracking/management */}
        <rect
          x="35"
          y="35"
          width="30"
          height="20"
          rx="3"
          fill="url(#textGradient)"
          opacity="0.9"
        />
        
        {/* Task lines inside the central rectangle */}
        <line x1="40" y1="42" x2="55" y2="42" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
        <line x1="40" y1="48" x2="60" y2="48" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
        
        {/* Arabic company initials - اشراق الودق */}
        <text
          x="50"
          y="72"
          textAnchor="middle"
          fill="url(#textGradient)"
          fontSize="12"
          fontWeight="bold"
          fontFamily="Arial"
        >
          ا.و
        </text>
        
        {/* Small dots representing data/tracking points */}
        <circle cx="30" cy="30" r="2" fill="url(#textGradient)" opacity="0.6"/>
        <circle cx="70" cy="30" r="2" fill="url(#textGradient)" opacity="0.6"/>
        <circle cx="30" cy="70" r="2" fill="url(#textGradient)" opacity="0.6"/>
        <circle cx="70" cy="70" r="2" fill="url(#textGradient)" opacity="0.6"/>
      </svg>
    </div>
  );
}