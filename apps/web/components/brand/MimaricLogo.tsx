import Image from 'next/image';

interface MimaricLogoProps {
  variant?: 'light' | 'dark'; // light = transparent, dark = black bg version
  width?: number;
  className?: string;
  priority?: boolean;
}

export function MimaricLogo({
  variant = 'light',
  width = 160,
  className = '',
  priority = true,
}: MimaricLogoProps) {
  // Use the official logo copied to public directory
  const src = '/assets/brand/logo.png';
    
  // Official logo aspect ratio: 1890 × 921 -> 921 / 1890 = 0.487
  const height = Math.round(width * 0.487);

  return (
    <div className={cn("relative flex items-center", className)} style={{ filter: variant === 'dark' ? 'brightness(0) invert(1)' : 'none' }}>
      <Image
        src={src}
        alt="Mimaric"
        width={width}
        height={height}
        priority={priority}
        className="object-contain"
        style={{ width: "auto", height: "auto" }}
      />
    </div>
  );
}

// Add cn helper if not imported
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
