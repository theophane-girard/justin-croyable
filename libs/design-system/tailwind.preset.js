const role = variable => `var(--${variable})`;

function ramp(name) {
  return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].reduce((scale, step) => {
    scale[step] = role(`${name}-${step}`);
    return scale;
  }, {});
}

module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: role('background'),
        foreground: role('foreground'),
        border: role('border'),
        input: role('input'),
        ring: role('ring'),
        card: {
          DEFAULT: role('card'),
          foreground: role('card-foreground'),
        },
        popover: {
          DEFAULT: role('popover'),
          foreground: role('popover-foreground'),
        },

        brand: {
          DEFAULT: role('brand'),
          ...ramp('brand'),
        },
        primary: {
          DEFAULT: role('primary'),
          foreground: role('primary-foreground'),
        },
        secondary: {
          DEFAULT: role('secondary'),
          foreground: role('secondary-foreground'),
        },
        muted: {
          DEFAULT: role('muted'),
          foreground: role('muted-foreground'),
        },
        accent: {
          DEFAULT: role('accent'),
          foreground: role('accent-foreground'),
        },
        destructive: role('destructive'),
        sidebar: {
          DEFAULT: role('sidebar'),
          foreground: role('sidebar-foreground'),
          primary: role('sidebar-primary'),
          'primary-foreground': role('sidebar-primary-foreground'),
          accent: role('sidebar-accent'),
          'accent-foreground': role('sidebar-accent-foreground'),
          border: role('sidebar-border'),
          ring: role('sidebar-ring'),
        },
        chart: {
          1: role('chart-1'),
          2: role('chart-2'),
          3: role('chart-3'),
          4: role('chart-4'),
          5: role('chart-5'),
        },

        success: role('success'),
        warning: role('warning'),
        error: role('error'),
        info: role('info'),

        primaryScale: ramp('primary'),
        gray: ramp('gray'),
        orange: ramp('orange'),
        lime: ramp('lime'),
        cyan: ramp('cyan'),
        violet: ramp('violet'),
        rose: ramp('rose'),
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
      },

      fontFamily: {
        display: role('font-display'),
        body: role('font-body'),
        mono: role('font-mono'),
      },
    },
  },
};
