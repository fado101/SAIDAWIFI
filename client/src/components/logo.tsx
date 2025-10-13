import logoImage from "@assets/saida-wifi-logo-new.jpg";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  frame?: boolean;
}

export default function Logo({ size = "md", className = "", frame = true }: LogoProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-36 h-36"
  };

  const logoElement = (
    <img
      src={logoImage}
      alt="شعار شبكة صيدا واي فاي - SAIDA WiFi"
      className="w-full h-full object-contain"
      data-testid="img-logo"
      loading="lazy"
      decoding="async"
    />
  );

  if (!frame) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
        {logoElement}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-full overflow-hidden`}
         style={{
           background: 'transparent'
         }}>
      {logoElement}
    </div>
  );
}