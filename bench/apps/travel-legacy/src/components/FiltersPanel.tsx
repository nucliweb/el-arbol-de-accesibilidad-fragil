import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import Paper from '@mui/material/Paper'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import {
  AMENITIES,
  ANY_BOARD,
  BOARD_TYPES,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  STAR_OPTIONS,
  formatPrice,
  starsLabel,
  type Filters,
} from '../../../../shared/travel.js'

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
}

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
const legendSx = { fontWeight: 600, color: 'text.primary', mb: 0.5 }

export default function FiltersPanel({ filters, onChange }: Props) {
  return (
    <Paper component="aside" aria-labelledby="filters-heading" elevation={0} sx={{ p: 2, alignSelf: 'start' }}>
      <Typography id="filters-heading" variant="h6" component="h2" sx={{ mb: 2 }}>
        Filtros
      </Typography>
      <Stack spacing={2.5}>
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={legendSx}>
            Estrellas
          </FormLabel>
          <FormGroup>
            {STAR_OPTIONS.map((stars) => (
              <FormControlLabel
                key={stars}
                label={starsLabel(stars)}
                control={
                  <Checkbox
                    size="small"
                    checked={filters.stars.includes(stars)}
                    onChange={() => onChange({ ...filters, stars: toggle(filters.stars, stars) })}
                  />
                }
              />
            ))}
          </FormGroup>
        </FormControl>
        <div>
          <Typography id="max-price-label" sx={legendSx}>
            Precio máximo por noche
          </Typography>
          <Slider
            aria-labelledby="max-price-label"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={filters.maxPrice}
            valueLabelDisplay="auto"
            valueLabelFormat={formatPrice}
            getAriaValueText={formatPrice}
            onChange={(_, value) => onChange({ ...filters, maxPrice: value as number })}
          />
          <Typography variant="body2">{formatPrice(filters.maxPrice)}</Typography>
        </div>
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={legendSx}>
            Régimen
          </FormLabel>
          <RadioGroup
            name="board"
            value={filters.board}
            onChange={(event) => onChange({ ...filters, board: event.target.value })}
          >
            {[ANY_BOARD, ...BOARD_TYPES].map((board) => (
              <FormControlLabel key={board.id} value={board.id} control={<Radio size="small" />} label={board.label} />
            ))}
          </RadioGroup>
        </FormControl>
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={legendSx}>
            Servicios
          </FormLabel>
          <FormGroup>
            {AMENITIES.map((amenity) => (
              <FormControlLabel
                key={amenity.id}
                label={amenity.label}
                control={
                  <Checkbox
                    size="small"
                    checked={filters.amenities.includes(amenity.id)}
                    onChange={() => onChange({ ...filters, amenities: toggle(filters.amenities, amenity.id) })}
                  />
                }
              />
            ))}
          </FormGroup>
        </FormControl>
        <FormControlLabel
          label="Cancelación gratuita"
          control={
            <Switch
              checked={filters.freeCancellation}
              onChange={(event) => onChange({ ...filters, freeCancellation: event.target.checked })}
            />
          }
        />
      </Stack>
    </Paper>
  )
}
