import { useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  DEFAULT_CHECK_IN,
  DEFAULT_CHECK_OUT,
  DEFAULT_DESTINATION,
  DEFAULT_FILTERS,
  HOTELS,
  PAGE_COUNT,
  SORT_OPTIONS,
  filterHotels,
  resultsStatus,
  sortHotels,
  type Hotel,
} from '../../../shared/travel.js'
import FiltersPanel from './components/FiltersPanel.tsx'
import Footer from './components/Footer.tsx'
import Header from './components/Header.tsx'
import HotelCard, { visuallyHidden } from './components/HotelCard.tsx'
import HotelModal from './components/HotelModal.tsx'
import SearchBar, { type Stay } from './components/SearchBar.tsx'

const noon = (value: string) => new Date(`${value}T12:00:00`)

export default function App() {
  const [city, setCity] = useState(DEFAULT_DESTINATION)
  const [stay, setStay] = useState<Stay>({ checkIn: noon(DEFAULT_CHECK_IN), checkOut: noon(DEFAULT_CHECK_OUT) })
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sort, setSort] = useState(SORT_OPTIONS[0].id)
  const [selected, setSelected] = useState<Hotel | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  const hotels = useMemo(() => sortHotels(filterHotels(HOTELS, filters), sort), [filters, sort])

  useEffect(() => {
    performance.mark('bench:rendered')
  }, [])

  const search = (newCity: string) => {
    setCity(newCity)
    heading.current?.focus()
  }

  return (
    <>
      <Box component="a" href="#results-heading" sx={{ ...visuallyHidden, '&:focus': { position: 'static', width: 'auto', height: 'auto', clipPath: 'none', p: 1 } }}>
        Saltar a los resultados
      </Box>
      <Header />
      <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Encuentra tu hotel
        </Typography>
        <SearchBar stay={stay} onStayChange={setStay} onSearch={search} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(14rem, 18rem) 1fr' }, gap: 3, mt: 3 }}>
          <FiltersPanel filters={filters} onChange={setFilters} />
          <Box component="section" aria-labelledby="results-heading">
            <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
              <Typography id="results-heading" ref={heading} tabIndex={-1} variant="h5" component="h2" sx={{ flexBasis: '100%' }}>
                Hoteles en {city}
              </Typography>
              <Typography role="status" color="text.secondary">
                {resultsStatus(hotels.length)}
              </Typography>
              <TextField
                select
                id="sort"
                label="Ordenar por"
                size="small"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                sx={{ minWidth: 200 }}
              >
                {SORT_OPTIONS.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack spacing={2} sx={{ my: 2 }}>
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} onDetails={setSelected} />
              ))}
            </Stack>
            <Pagination count={PAGE_COUNT} color="primary" />
          </Box>
        </Box>
      </Container>
      <Footer />
      <HotelModal hotel={selected} stay={stay} onClose={() => setSelected(null)} />
    </>
  )
}
