import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AccessibleIcon from '@mui/icons-material/Accessible'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import LocalParkingIcon from '@mui/icons-material/LocalParking'
import PetsIcon from '@mui/icons-material/Pets'
import PlaceIcon from '@mui/icons-material/Place'
import PoolIcon from '@mui/icons-material/Pool'
import SpaIcon from '@mui/icons-material/Spa'
import WifiIcon from '@mui/icons-material/Wifi'
import {
  AMENITIES,
  formatDistance,
  formatPrice,
  formatRating,
  hotelImage,
  imageAlt,
  starsLabel,
  type Hotel,
} from '../../../../shared/travel.js'

const AMENITY_ICONS: Record<string, typeof WifiIcon> = {
  wifi: WifiIcon,
  pool: PoolIcon,
  parking: LocalParkingIcon,
  gym: FitnessCenterIcon,
  spa: SpaIcon,
  pets: PetsIcon,
  wheelchair: AccessibleIcon,
  air: AcUnitIcon,
}

interface Props {
  hotel: Hotel
  onDetails: (hotel: Hotel) => void
}

export default function HotelCard({ hotel, onDetails }: Props) {
  const nameId = `${hotel.id}-name`
  return (
    <Card component="article" aria-labelledby={nameId} sx={{ display: 'flex', flexWrap: 'wrap', p: 2, gap: 2 }}>
      <CardMedia
        component="img"
        image={hotelImage(hotel)}
        alt={imageAlt(hotel)}
        width={320}
        height={200}
        sx={{ width: 192, height: 'auto', borderRadius: 1 }}
      />
      <CardContent sx={{ flex: 1, p: 0, '&:last-child': { pb: 0 } }}>
        <Typography id={nameId} variant="h6" component="h3">
          {hotel.name}
        </Typography>
        <Rating value={hotel.stars} readOnly size="small" getLabelText={starsLabel} />
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
          <PlaceIcon fontSize="small" />
          <Typography variant="body2">{formatDistance(hotel)}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {formatRating(hotel)}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
          {hotel.amenities.map((id) => {
            const Icon = AMENITY_ICONS[id]
            return <Chip key={id} size="small" variant="outlined" icon={<Icon />} label={AMENITIES.find((a) => a.id === id)!.label} />
          })}
        </Box>
      </CardContent>
      <Stack spacing={0.5} sx={{ alignItems: 'flex-end', justifyContent: 'flex-end', textAlign: 'right' }}>
        {hotel.freeCancellation && (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'success.dark' }}>
            <CheckCircleIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Cancelación gratuita
            </Typography>
          </Stack>
        )}
        <Typography>
          <Box component="strong" sx={{ fontSize: '1.5rem' }}>
            {formatPrice(hotel.price)}
          </Box>{' '}
          por noche
        </Typography>
        <Button variant="contained" onClick={() => onDetails(hotel)}>
          Ver detalles
          <Box component="span" sx={visuallyHidden}>
            {` de ${hotel.name}`}
          </Box>
        </Button>
      </Stack>
    </Card>
  )
}

export const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
} as const
