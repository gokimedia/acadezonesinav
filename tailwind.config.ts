import type { Config } from 'tailwindcss'
import { theme } from './styles/theme'

// Tailwind resmi eklentileri
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import lineClamp from '@tailwindcss/line-clamp'

const config: Config = {
  // Koyu tema desteği eklemek için (opsiyonel).
  // 'media' derseniz, işletim sisteminin koyu/aydınlık ayarına göre otomatik karar verir.
  // 'class' derseniz, .dark class'ı eklediğinizde koyu tema aktif olur.
  darkMode: 'class', 

  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    // Ekran boyutu kırılımlarını özelleştirmek isterseniz:
    // (Tailwind’in varsayılan değerleri sm=640px, md=768px, lg=1024px, xl=1280px, 2xl=1536px)
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },

    // Container için varsayılanları özelleştirme (opsiyonel)
    container: {
      center: true,
      padding: '1rem',
      screens: {
        // Yukarıda tanımladığınız ekran boyutlarını burada kullanabilirsiniz
        xs: '100%',
        sm: '600px',
        md: '728px',
        lg: '984px',
        xl: '1240px',
        '2xl': '1440px',
      },
    },

    extend: {
      // theme nesnesinden gelen özel tanımlar
      colors: {
        primary: theme.colors.primary,
        error: theme.colors.error,
        success: theme.colors.success,
        warning: theme.colors.warning,
      },
      fontFamily: {
        sans: ['var(--font-poppins)', ...theme.typography.fontFamily.sans],
        mono: ['var(--font-jetbrains-mono)', ...theme.typography.fontFamily.mono],
      },
      fontSize: theme.typography.fontSize,
      fontWeight: theme.typography.fontWeight,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      boxShadow: theme.shadows,

      // Animasyon veya keyframes tanımlamak isterseniz örnek:
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        wiggle: 'wiggle 1s ease-in-out infinite',
      },

      // Geçiş eğrileri
      transitionTimingFunction: {
        base: theme.transitions.base,
        smooth: theme.transitions.smooth,
      },
    },
  },

  // Resmi TailwindCSS eklentileri
  plugins: [
    forms,        // Form elemanlarını (input, select, checkbox vs.) varsayılan stillerle uyumlu hale getirir
    typography,   // Projenizde makale, blog yazısı vb. metinleri otomatik güzel stillerle sunar
    lineClamp,    // Metinleri bir satır veya birkaç satırda kısaltmanızı kolaylaştırır (clamp)
  ],
}

export default config
