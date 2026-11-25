import { useState, type FormEvent } from 'react'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import { es } from 'date-fns/locale'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import SearchIcon from '@mui/icons-material/Search'
import {
  DEFAULT_DESTINATION,
  DEFAULT_GUESTS,
  DESTINATIONS,
  MAX_GUESTS,
  TRIP_TYPES,
} from '../../../../shared/travel.js'

interface CityOption {
  value: string
  label: string
}

const groupedOptions = DESTINATIONS.map((group) => ({
  label: group.country,
  options: group.cities.map((city) => ({ value: city, label: city })),
}))
const defaultCity = { value: DEFAULT_DESTINATION, label: DEFAULT_DESTINATION }

export interface Stay {
  checkIn: Date
  checkOut: Date
}

interface Props {
  stay: Stay
  onStayChange: (stay: Stay) => void
  onSearch: (city: string) => void
}

const labelSx = { display: 'block', mb: 0.5, fontWeight: 500, color: 'text.primary' }

export default function SearchBar({ stay, onStayChange, onSearch }: Props) {
  const [city, setCity] = useState<CityOption | null>(defaultCity)
  const [guests, setGuests] = useState(DEFAULT_GUESTS)
  const [trip, setTrip] = useState(TRIP_TYPES[0].id)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (city) onSearch(city.value)
  }

  return (
    <Paper component="search" elevation={1} sx={{ p: 2, display: 'block' }}>
      <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2 }}>
        <Box sx={{ minWidth: 220 }}>
          <Typography component="label" htmlFor="destination" sx={labelSx}>
            Destino
          </Typography>
          <Select<CityOption, false>
            inputId="destination"
            options={groupedOptions}
            value={city}
            onChange={setCity}
            placeholder="¿A dónde vas?"
            noOptionsMessage={() => 'Sin resultados'}
          />
        </Box>
        <Box>
          <Typography component="label" htmlFor="check-in" sx={labelSx}>
            Fecha de entrada
          </Typography>
          <DatePicker
            id="check-in"
            locale={es}
            dateFormat="dd/MM/yyyy"
            selected={stay.checkIn}
            onChange={(date: Date | null) => date && onStayChange({ ...stay, checkIn: date })}
            selectsStart
            startDate={stay.checkIn}
            endDate={stay.checkOut}
          />
        </Box>
        <Box>
          <Typography component="label" htmlFor="check-out" sx={labelSx}>
            Fecha de salida
          </Typography>
          <DatePicker
            id="check-out"
            locale={es}
            dateFormat="dd/MM/yyyy"
            selected={stay.checkOut}
            onChange={(date: Date | null) => date && onStayChange({ ...stay, checkOut: date })}
            selectsEnd
            startDate={stay.checkIn}
            endDate={stay.checkOut}
            minDate={stay.checkIn}
          />
        </Box>
        <TextField
          select
          id="guests"
          label="Huéspedes"
          size="small"
          value={guests}
          onChange={(event) => setGuests(Number(event.target.value))}
          sx={{ minWidth: 140 }}
        >
          {Array.from({ length: MAX_GUESTS }, (_, i) => (
            <MenuItem key={i + 1} value={i + 1}>
              {i === 0 ? '1 adulto' : `${i + 1} adultos`}
            </MenuItem>
          ))}
        </TextField>
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Tipo de viaje
          </FormLabel>
          <RadioGroup row name="trip" value={trip} onChange={(event) => setTrip(event.target.value)}>
            {TRIP_TYPES.map((type) => (
              <FormControlLabel key={type.id} value={type.id} control={<Radio size="small" />} label={type.label} />
            ))}
          </RadioGroup>
        </FormControl>
        <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
          Buscar
        </Button>
      </Box>
    </Paper>
  )
}
