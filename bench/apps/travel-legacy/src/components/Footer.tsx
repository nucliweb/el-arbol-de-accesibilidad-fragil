import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { SITE_NAME } from '../../../../shared/travel.js'

const LINKS = ['Ayuda', 'Declaración de accesibilidad', 'Privacidad', 'Condiciones']

export default function Footer() {
  return (
    <Box component="footer" sx={{ p: 3, borderTop: 1, borderColor: 'divider', color: 'text.secondary' }}>
      <Box component="nav" aria-label="Pie de página" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {LINKS.map((link) => (
          <Link key={link} href="#">
            {link}
          </Link>
        ))}
      </Box>
      <Typography variant="body2" sx={{ mt: 2 }}>
        © 2026 {SITE_NAME}. Una web ficticia para un benchmark.
      </Typography>
    </Box>
  )
}
