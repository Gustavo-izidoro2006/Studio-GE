// Base visual do app (specs/acabamento-visual-v012.md e specs/identidade-visual.md).
// Um único lugar para cores, raios, espaçamentos, sombra e tempos de animação.
//
// Identidade do Studio Geração Energia (cores do logo): azul-marinho #002478 e verde-limão #A8DC24.
// Regras de uso:
// - marinho: cabeçalhos, botões principais, texto de destaque, ícones e seleções;
// - limão: fundos e botões de destaque, sempre com texto marinho por cima (nunca texto limão sobre branco);
// - âmbar: só "atenção" (a vencer, adaptação, despesas); vermelho: erro/atraso; verde: pago/sucesso.

export const COLORS = {
  // Marca — o nome "blue" é mantido para não mexer em todas as telas: é o marinho do logo.
  blue: '#002478',
  blueDark: '#001A57',
  blueLight: '#E3E9F6',
  lightBlue: '#E3E9F6',
  lime: '#A8DC24',
  limeLight: '#EEF7D6',
  limePill: '#E8F5C8',
  limeText: '#3D5A0A',
  onNavyMuted: '#C9D4EC',
  // Atenção (âmbar)
  yellow: '#EF9F27',
  paleYellow: '#FFF3D9',
  yellowText: '#633806',
  lightYellow: '#FCEBCB',
  // Neutros
  text: '#14213D',
  muted: '#5F6B76',
  border: '#D5DCE8',
  background: '#F4F6FA',
  white: '#FFFFFF',
  // Estados
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
    shadowColor: '#002478',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  floating: {
    elevation: 5,
    shadowColor: '#001A57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
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
