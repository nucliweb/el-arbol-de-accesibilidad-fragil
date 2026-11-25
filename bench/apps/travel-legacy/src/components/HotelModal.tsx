import { useState } from 'react'
import Modal from 'react-modal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ROOM_TYPES, formatPrice, hotelImage, imageAlt, type Hotel } from '../../../../shared/travel.js'
import type { Stay } from './SearchBar.tsx'

interface Props {
  hotel: Hotel | null
  stay: Stay
  onClose: () => void
}

const styles = {
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1300 },
  content: { inset: '50% auto auto 50%', transform: 'translate(-50%, -50%)', width: 'min(36rem, 100% - 2rem)', padding: 24, borderRadius: 8 },
}

export default function HotelModal({ hotel, stay, onClose }: Props) {
  const [room, setRoom] = useState(ROOM_TYPES[0].id)
  const day = (date: Date) => format(date, "d 'de' MMMM", { locale: es })

  return (
    <Modal
      isOpen={hotel !== null}
      onRequestClose={onClose}
      onAfterOpen={() => setRoom(ROOM_TYPES[0].id)}
      aria={{ labelledby: 'details-name' }}
      style={styles}
    >
      {hotel && (
        <>
          <Typography id="details-name" variant="h5" component="h2" gutterBottom>
            {hotel.name}
          </Typography>
          <Box component="img" src={hotelImage(hotel)} alt={imageAlt(hotel)} width={320} height={200} sx={{ width: '100%', height: 'auto', borderRadius: 1 }} />
          <Typography sx={{ my: 1 }}>{hotel.description}</Typography>
          <Typography>
            Del {day(stay.checkIn)} al {day(stay.checkOut)}
          </Typography>
          <FormControl component="fieldset" sx={{ my: 2 }}>
            <FormLabel component="legend" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Tipo de habitación
            </FormLabel>
            <RadioGroup name="room" value={room} onChange={(event) => setRoom(event.target.value)}>
              {ROOM_TYPES.map((type) => (
                <FormControlLabel
                  key={type.id}
                  value={type.id}
                  control={<Radio size="small" />}
                  label={`${type.label}, ${formatPrice(hotel.price + type.extra)} por noche`}
                />
              ))}
            </RadioGroup>
          </FormControl>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={onClose}>
              Reservar
            </Button>
            <Button variant="outlined" onClick={onClose}>
              Cerrar
            </Button>
          </Stack>
        </>
      )}
    </Modal>
  )
}
