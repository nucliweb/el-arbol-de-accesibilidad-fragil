import { createTheme } from '@mui/material/styles'
import { esES } from '@mui/material/locale'

export const theme = createTheme(
  {
    palette: {
      primary: { main: '#0b5cad' },
      background: { default: '#f4f5f7' },
    },
    shape: { borderRadius: 8 },
  },
  esES,
)
