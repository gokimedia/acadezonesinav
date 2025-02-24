export const theme = {
  colors: {
    primary: {
      50: '#E6F0F9',
      100: '#CCE1F3',
      200: '#99C3E7',
      300: '#66A5DB',
      400: '#3387CF',
      500: '#004E8C', // Ana renk (DEFAULT ile eşleştirilebilir)
      DEFAULT: '#004E8C', // "bg-primary" veya "text-primary" yazınca 500'ü kullanır
      600: '#003E70',
      700: '#002F54',
      800: '#001F38',
      900: '#00101C',
    },
    error: {
      50: '#FFE5E6',
      100: '#FABABB',
      200: '#F28F8F',
      300: '#EB6464',
      400: '#E53A3A',
      500: '#DC3545', // main
      DEFAULT: '#DC3545', // "bg-error" -> #DC3545
      600: '#C82333', // dark
      700: '#A71D2A',
      800: '#821522',
      900: '#5C0F19',
    },
    success: {
      50: '#E6F6EA',
      100: '#CCEEDD',
      200: '#99DDBB',
      300: '#66CC99',
      400: '#33BB77',
      500: '#28A745', // main
      DEFAULT: '#28A745',
      600: '#218838', // dark
      700: '#1A6D2D',
      800: '#135223',
      900: '#0C3718',
    },
    warning: {
      50: '#FFF8E6',
      100: '#FFF1CC',
      200: '#FFE399',
      300: '#FFD666',
      400: '#FFC933',
      500: '#FFC107', // main
      DEFAULT: '#FFC107',
      600: '#E0A800', // dark
      700: '#B38800',
      800: '#866800',
      900: '#594700',
    },
  },

  typography: {
    fontFamily: {
      sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      mono: ['var(--font-jetbrains-mono)', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT:
      '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  transitions: {
    base: 'cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1) 150ms',
    fast: 'cubic-bezier(0.4, 0, 0.2, 1) 100ms',
    slow: 'cubic-bezier(0.4, 0, 0.2, 1) 300ms',
  },
} as const;
