// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html"
    ],
    darkMode: 'class', // Enable dark mode with class strategy
    theme: {
      extend: {
        // Custom color palette for ShopSawa brand
        colors: {
          primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554'
          },
          secondary: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617'
          },
          success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d'
          },
          warning: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f'
          },
          error: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d'
          }
        },
        
        // Custom font family
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          display: ['Poppins', 'system-ui', 'sans-serif']
        },
        
        // Custom spacing
        spacing: {
          '18': '4.5rem',
          '88': '22rem',
          '128': '32rem'
        },
        
        // Custom border radius
        borderRadius: {
          '4xl': '2rem',
          '5xl': '2.5rem'
        },
        
        // Custom box shadows
        boxShadow: {
          'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.1)',
          'medium': '0 4px 25px 0 rgba(0, 0, 0, 0.15)',
          'hard': '0 10px 40px 0 rgba(0, 0, 0, 0.2)',
          'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
        },
        
        // Custom animations
        animation: {
          'fade-in': 'fadeIn 0.5s ease-in-out',
          'slide-up': 'slideUp 0.3s ease-out',
          'slide-down': 'slideDown 0.3s ease-out',
          'scale-in': 'scaleIn 0.2s ease-out',
          'pulse-slow': 'pulse 3s infinite',
          'bounce-slow': 'bounce 2s infinite'
        },
        
        // Custom keyframes
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' }
          },
          slideUp: {
            '0%': { transform: 'translateY(100%)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' }
          },
          slideDown: {
            '0%': { transform: 'translateY(-100%)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' }
          },
          scaleIn: {
            '0%': { transform: 'scale(0.95)', opacity: '0' },
            '100%': { transform: 'scale(1)', opacity: '1' }
          }
        },
        
        // Custom transitions
        transitionProperty: {
          'height': 'height',
          'spacing': 'margin, padding'
        },
        
        // Custom screen sizes
        screens: {
          'xs': '475px',
          '3xl': '1600px'
        },
        
        // Custom line heights
        lineHeight: {
          'extra-loose': '2.5',
          '12': '3rem'
        },
        
        // Custom letter spacing
        letterSpacing: {
          'extra-wide': '0.1em'
        },
        
        // Custom backdrop blur
        backdropBlur: {
          'xs': '2px'
        }
      }
    },
    plugins: [
      require('@tailwindcss/forms')({
        strategy: 'class', // Use class strategy for forms
      }),
      require('@tailwindcss/typography'),
      
      // Custom plugin for utilities
      function({ addUtilities, addComponents, theme }) {
        // Custom utilities
        const newUtilities = {
          '.text-shadow': {
            textShadow: '0 2px 4px rgba(0,0,0,0.10)'
          },
          '.text-shadow-md': {
            textShadow: '0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)'
          },
          '.text-shadow-lg': {
            textShadow: '0 15px 35px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.07)'
          },
          '.text-shadow-none': {
            textShadow: 'none'
          },
          '.scrollbar-hide': {
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none',
            '&::-webkit-scrollbar': {
              display: 'none'
            }
          },
          '.scrollbar-thin': {
            'scrollbar-width': 'thin',
            '&::-webkit-scrollbar': {
              width: '6px'
            },
            '&::-webkit-scrollbar-track': {
              background: theme('colors.gray.100')
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme('colors.gray.400'),
              borderRadius: '3px'
            }
          }
        };
        
        // Custom components
        const newComponents = {
          '.btn': {
            padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
            borderRadius: theme('borderRadius.md'),
            fontWeight: theme('fontWeight.medium'),
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:disabled': {
              opacity: '0.5',
              cursor: 'not-allowed'
            }
          },
          '.card': {
            backgroundColor: theme('colors.white'),
            borderRadius: theme('borderRadius.lg'),
            boxShadow: theme('boxShadow.soft'),
            padding: theme('spacing.6'),
            transition: 'all 0.2s ease-in-out'
          },
          '.input': {
            width: '100%',
            padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
            border: `1px solid ${theme('colors.gray.300')}`,
            borderRadius: theme('borderRadius.md'),
            fontSize: theme('fontSize.sm'),
            transition: 'all 0.2s ease-in-out',
            '&:focus': {
              outline: 'none',
              borderColor: theme('colors.primary.500'),
              boxShadow: `0 0 0 3px ${theme('colors.primary.100')}`
            }
          }
        };
        
        addUtilities(newUtilities);
        addComponents(newComponents);
      }
    ]
  };