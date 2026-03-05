declare module '*.png' {
  const src: number;
  export default src;
}

declare module '*.jpg' {
  const src: number;
  export default src;
}

declare module '*.jpeg' {
  const src: number;
  export default src;
}

declare module '*.gif' {
  const src: number;
  export default src;
}

declare module '*.webp' {
  const src: number;
  export default src;
}

declare module '*.svg' {
  import React from 'react';
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}
