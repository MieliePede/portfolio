export interface Theme {
  id: string
  name: string
  vars: {
    '--bg': string
    '--surface': string
    '--accent1': string
    '--accent2': string
    '--accent3': string
    '--accent4': string
    '--text': string
    '--muted': string
  }
}

export const themes: Theme[] = [
  {
    id: 'dark',
    name: 'Dark',
    vars: {
      '--bg': '#0d0d0d',
      '--surface': '#161616',
      '--accent1': '#ff6b6b',
      '--accent2': '#ffd93d',
      '--accent3': '#6bcb77',
      '--accent4': '#4d96ff',
      '--text': '#f0f0f0',
      '--muted': '#888',
    },
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    vars: {
      '--bg': '#0a0015',
      '--surface': '#12002a',
      '--accent1': '#ff2d78',
      '--accent2': '#f7b731',
      '--accent3': '#a8ff3e',
      '--accent4': '#bc6ff1',
      '--text': '#f0e6ff',
      '--muted': '#9b7ec8',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    vars: {
      '--bg': '#2e3440',
      '--surface': '#3b4252',
      '--accent1': '#bf616a',
      '--accent2': '#ebcb8b',
      '--accent3': '#a3be8c',
      '--accent4': '#88c0d0',
      '--text': '#eceff4',
      '--muted': '#7b88a1',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    vars: {
      '--bg': '#0b1a0e',
      '--surface': '#132118',
      '--accent1': '#f4845f',
      '--accent2': '#f9c74f',
      '--accent3': '#52b788',
      '--accent4': '#74c69d',
      '--text': '#e8f5e9',
      '--muted': '#6d9e7a',
    },
  },
  {
    id: 'mono',
    name: 'Mono',
    vars: {
      '--bg': '#0e0e0e',
      '--surface': '#1a1a1a',
      '--accent1': '#e0e0e0',
      '--accent2': '#bdbdbd',
      '--accent3': '#9e9e9e',
      '--accent4': '#f5f5f5',
      '--text': '#f5f5f5',
      '--muted': '#616161',
    },
  },
  {
    id: 'starry-night',
    name: 'Starry Night',
    vars: {
      '--bg': '#16225B',
      '--surface': '#2F2D28',
      '--accent1': '#CEAA46',
      '--accent2': '#D0D3AD',
      '--accent3': '#5D5146',
      '--accent4': '#8b9fd4',
      '--text': '#D0D3AD',
      '--muted': '#5D5146',
    },
  },
  {
    id: 'ouma',
    name: 'Ouma',
    vars: {
      '--bg': '#f0e2c9',
      '--surface': '#e8d5b5',
      '--accent1': '#db7c27',
      '--accent2': '#e8a84e',
      '--accent3': '#8b6f3a',
      '--accent4': '#502d1e',
      '--text': '#502d1e',
      '--muted': '#8b7355',
    },
  },
]
