// Base visual do app (specs/acabamento-visual-v012.md, G3).
// Um único lugar para cores, raios, espaçamentos, sombra e tempos de animação.

export const COLORS = {
  blue: '#185FA5',
  blueDark: '#0C447C',
  blueLight: '#E6F1FB',
  lightBlue: '#DCEAF7',
  yellow: '#EF9F27',
  paleYellow: '#FFF3D9',
  yellowText: '#633806',
  lightYellow: '#FCEBCB',
  text: '#17212B',
  // Cinza de apoio: 5,4:1 sobre branco (o anterior, #6B7680, ficava abaixo de 4,5:1 sobre o fundo).
  muted: '#5F6B76',
  border: '#D9E0E6',
  background: '#F7F9FB',
  white: '#FFFFFF',
  danger: '#B42318',
  lightRed: '#FBE4E1',
  green: '#1E6B35',
  lightGreen: '#DFF1E3',
} as const;

export const RADIUS = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

// Área mínima de toque.
export const TOUCH = 44;

export const SHADOW = {
  card: {
    elevation: 2,
    shadowColor: '#0B2540',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  floating: {
    elevation: 5,
    shadowColor: '#0B2540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
} as const;

// Tempos de animação (ms). Curtos de propósito: nunca atrasar o toque.
export const MOTION = {
  fast: 150,
  base: 250,
  slow: 320,
  stagger: 60,
  staggerMax: 8,
} as const;
