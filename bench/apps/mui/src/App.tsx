import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { useEffect } from 'react'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Typography from '@mui/material/Typography'
import { GROUP_LABEL, TITLE, countFromSearch, optionsFor } from '../../../shared/scenario.js'

const options = optionsFor(countFromSearch(window.location.search))

export default function App() {
  useEffect(() => {
    performance.mark('bench:rendered')
  }, [])

  return (
    <main style={{ padding: 24 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {TITLE}
      </Typography>
      <div id="bench">
        <FormControl>
          <FormLabel id="ringtone-label">{GROUP_LABEL}</FormLabel>
          <RadioGroup aria-labelledby="ringtone-label" defaultValue={options[0].value} name="ringtone">
            {options.map((option) => (
              <FormControlLabel key={option.id} value={option.value} control={<Radio />} label={option.label} />
            ))}
          </RadioGroup>
        </FormControl>
      </div>
    </main>
  )
}
