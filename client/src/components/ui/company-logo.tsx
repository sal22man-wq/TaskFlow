import logoImage from "@assets/319159472_2787094371424406_3593723820726937846_n_1755707330246.jpg";

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
      <img
        src={logoImage}
        alt="شركة اشراق الودق لتكنولوجيا المعلومات"
        className="w-full h-full object-contain rounded-lg"
        data-testid="company-logo-image"
      />
    </div>
  );
}