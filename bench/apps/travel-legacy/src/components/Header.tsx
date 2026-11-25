import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import FlightIcon from '@mui/icons-material/Flight'
import HotelIcon from '@mui/icons-material/Hotel'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import { NAV_LINKS, SITE_NAME } from '../../../../shared/travel.js'

const ICONS = [HotelIcon, FlightIcon, DirectionsCarIcon, LocalOfferIcon, AccountCircleIcon]

export default function Header() {
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography component="p" variant="h6" sx={{ fontWeight: 700 }}>
          <Box component="a" href="#" sx={{ color: 'inherit', textDecoration: 'none' }}>
            {SITE_NAME}
          </Box>
        </Typography>
        <Box component="nav" aria-label="Principal" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {NAV_LINKS.map((link, i) => {
            const Icon = ICONS[i]
            return (
              <Button
                key={link}
                href="#"
                color="inherit"
                startIcon={<Icon />}
                aria-current={i === 0 ? 'page' : undefined}
                sx={{ textTransform: 'none', textDecoration: i === 0 ? 'underline' : 'none' }}
              >
                {link}
              </Button>
            )
          })}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
