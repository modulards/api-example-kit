export default defineAppConfig({
  ui: {
    tv: {
      twMergeConfig: {
        extend: {
          classGroups: {
            'font-size': [{
              text: ['page-title', 'display', 'row', 'meta', 'eyebrow', 'badge', 'mono', 'mono-sm'],
            }],
          },
        },
      },
    },

    colors: {
      primary: 'carbon',
      secondary: 'carbon',
      success: 'mint',
      info: 'carbon',
      warning: 'honey',
      error: 'coral',
      neutral: 'carbon',
    },

    button: {
      slots: {
        base: 'rounded-control transition-colors cursor-pointer',
      },
      variants: {
        size: {
          sm: {
            base: 'h-control px-3 py-0 text-meta gap-1.5',
            leadingIcon: 'size-3.5',
            trailingIcon: 'size-3.5',
          },
          md: {
            base: 'h-10 px-3 py-0 text-row gap-2',
            leadingIcon: 'size-4',
            trailingIcon: 'size-4',
          },
        },
      },
      compoundVariants: [
        { size: 'sm', square: true, class: 'w-control px-0 justify-center' },
        { size: 'md', square: true, class: 'w-10 px-0 justify-center' },
        { color: 'primary', variant: 'solid', class: 'text-(--ui-primary-fg)' },
      ],
      defaultVariants: {
        size: 'sm',
      },
    },

    input: {
      slots: {
        base: 'rounded-control',
      },
      variants: {
        size: {
          sm: { base: 'h-control px-2.5 py-0 text-meta' },
          md: { base: 'h-10 px-3 py-0 text-row' },
        },
      },
      compoundVariants: [
        { fixed: false, size: 'sm', class: 'md:text-meta' },
        { fixed: false, size: 'md', class: 'md:text-row' },
      ],
      defaultVariants: {
        size: 'sm',
      },
    },

    textarea: {
      slots: { base: 'rounded-control' },
      variants: {
        size: {
          sm: { base: 'text-meta' },
          md: { base: 'text-row' },
        },
      },
      compoundVariants: [
        { fixed: false, size: 'sm', class: 'md:text-meta' },
        { fixed: false, size: 'md', class: 'md:text-row' },
      ],
      defaultVariants: { size: 'sm' },
    },

    select: {
      slots: { base: 'rounded-control cursor-pointer', item: 'cursor-pointer' },
      variants: {
        size: {
          sm: { base: 'h-control px-2.5 py-0 text-meta' },
          md: { base: 'h-10 px-3 py-0 text-row' },
        },
      },
      compoundVariants: [
        { fixed: false, size: 'sm', class: 'md:text-meta' },
        { fixed: false, size: 'md', class: 'md:text-row' },
      ],
      defaultVariants: { size: 'sm' },
    },

    selectMenu: {
      slots: { base: 'rounded-control cursor-pointer', content: 'rounded-control', item: 'cursor-pointer' },
      variants: {
        size: {
          sm: { base: 'h-control px-2.5 py-0 text-meta' },
          md: { base: 'h-10 px-3 py-0 text-row' },
        },
      },
      compoundVariants: [
        { fixed: false, size: 'sm', class: 'md:text-meta' },
        { fixed: false, size: 'md', class: 'md:text-row' },
      ],
      defaultVariants: { size: 'sm' },
    },

    dropdownMenu: {
      slots: { item: 'cursor-pointer' },
    },

    badge: {
      variants: {
        size: {
          md: { base: 'text-badge font-medium px-2 py-0.5 rounded-md' },
        },
      },
      compoundVariants: [
        { color: 'primary', variant: 'solid', class: 'text-(--ui-primary-fg)' },
      ],
      defaultVariants: { size: 'md' },
    },

    switch: {
      slots: {
        base: 'data-[state=unchecked]:bg-(--ui-switch-track) cursor-pointer',
        label: 'cursor-pointer',
        description: 'cursor-pointer',
      },
    },

    // Every card header pairs a title with controls, so the row layout is set once here.
    card: {
      slots: {
        root: 'flex min-w-0 flex-col rounded-panel bg-(--ui-bg-panel) ring ring-default shadow-(--ui-shadow-panel)',
        header: 'flex min-h-14 items-center gap-3 px-5 py-3.5 sm:px-5',
        title: 'truncate text-row font-semibold text-highlighted',
        body: 'min-w-0 p-5 sm:p-5',
        footer: 'px-5 py-4 sm:px-5',
      },
      defaultVariants: { variant: 'outline' },
    },

    // UPageCard has its own theme key; without this StatCard falls back to the default surface.
    pageCard: {
      slots: {
        root: 'min-w-0 rounded-panel bg-(--ui-bg-panel) ring ring-default shadow-(--ui-shadow-panel)',
      },
    },

    // The default `outline` variant draws a card within a card inside tables and cards.
    empty: {
      slots: {
        root: 'gap-3 px-4 sm:px-6 lg:px-6',
      },
      variants: {
        size: {
          md: { root: 'py-10 sm:py-10 lg:py-10', title: 'text-row', description: 'text-meta' },
          lg: { root: 'py-20 sm:py-20 lg:py-20', title: 'text-row', description: 'text-meta' },
        },
      },
      defaultVariants: { variant: 'naked' },
    },

    modal: {
      slots: {
        content: 'rounded-panel bg-(--ui-bg-panel) ring ring-default shadow-(--ui-shadow-panel)',
        header: 'px-5 py-3.5 sm:px-5 min-h-0',
        body: 'p-5 sm:p-5',
        footer: 'px-5 py-3.5 sm:px-5 justify-end gap-2',
        title: 'text-row font-semibold text-highlighted',
        description: 'text-meta text-muted',
      },
    },

    table: {
      slots: {
        th: 'h-10 px-4 py-0 text-eyebrow font-medium uppercase text-dimmed text-start',
        td: 'h-row px-4 py-0 text-row text-toned whitespace-nowrap',
        thead: 'bg-(--ui-bg-thead) border-b border-(--ui-table-line)',
        tbody: 'divide-y divide-(--ui-table-line)',
        separator: 'bg-(--ui-table-line)',
        tr: [
          'data-[selected=true]:bg-primary/6',
          '[&[role=button]]:cursor-pointer [&[role=button]]:transition-colors [&[role=button]]:hover:bg-inverted/8',
        ].join(' '),
        empty: 'py-10 text-center text-meta text-muted',
      },
    },

    navigationMenu: {
      slots: {
        link: 'h-8 px-2.5 rounded-control text-row font-medium gap-2.5',
        linkLeadingIcon: 'size-4',
        linkTrailingIcon: 'size-4',
      },
      variants: {
        active: {
          false: {
            link: 'text-toned',
            linkLeadingIcon: 'text-muted',
          },
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'pill',
          active: true,
          class: { link: 'before:bg-(--ui-primary-soft)' },
        },
      ],
    },

    tabs: {
      slots: {
        trigger: 'rounded-none font-medium cursor-pointer',
      },
      variants: {
        size: {
          md: { trigger: 'h-8 px-2.5 text-meta gap-1.5' },
        },
      },
      compoundVariants: [
        {
          orientation: 'horizontal',
          variant: 'link',
          class: {
            list: 'p-0 gap-1 overflow-y-hidden',
            trigger: 'border-b-2 border-transparent data-[state=active]:border-inverted',
          },
        },
      ],
    },

    dashboardSidebar: {
      slots: {
        root: 'bg-(--ui-bg-chrome) border-default',
        header: 'h-auto min-h-20 px-5 py-4 border-b border-default gap-3',
        body: 'px-4 py-5 gap-5',
        footer: 'px-4 py-4 border-t border-default',
      },
    },

    // Pages scroll inside the panel body, so the navbar pins itself and paints its own surface.
    dashboardNavbar: {
      slots: {
        root: 'sticky top-0 z-10 h-auto min-h-16 min-w-0 flex-wrap px-4 py-3 sm:h-(--ui-header-height) sm:flex-nowrap sm:px-6 sm:py-0 border-default bg-(--ui-bg-chrome)',
        left: 'w-full min-w-0 gap-3 sm:w-auto sm:flex-1',
        title: 'min-w-0 text-page-title font-semibold text-highlighted',
        right: 'w-full shrink-0 justify-end gap-2 empty:hidden sm:w-auto sm:justify-start',
      },
    },

    // Wrap instead of scrolling sideways, so each control gets its own row on a phone.
    dashboardToolbar: {
      slots: {
        root: 'flex-wrap gap-3 px-4 py-4 sm:px-6 min-h-0 overflow-visible',
        left: 'min-w-0 grow flex-wrap gap-3',
        right: 'shrink-0',
      },
    },

    dashboardPanel: {
      slots: {
        body: 'p-0 sm:p-0 gap-0 sm:gap-0 [scrollbar-gutter:stable]',
      },
    },

    separator: {
      slots: {
        border: 'border-default',
      },
    },
  },
});
