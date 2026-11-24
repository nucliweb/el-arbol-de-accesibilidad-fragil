import '@fontsource/roboto/400.css'
import '@material/web/radio/radio.js'
import './style.css'
import { GROUP_LABEL, TITLE, countFromSearch, optionsFor } from '../../../shared/scenario.js'

const options = optionsFor(countFromSearch(window.location.search))
const app = document.querySelector<HTMLElement>('#app')!

const heading = document.createElement('h1')
heading.textContent = TITLE

// Markup from the Material Web radio docs: a radiogroup labelled by a title,
// with one <md-radio> plus <label for> per option.
const bench = document.createElement('div')
bench.id = 'bench'
const group = document.createElement('div')
group.setAttribute('role', 'radiogroup')
group.setAttribute('aria-labelledby', 'group-title')
const title = document.createElement('div')
title.id = 'group-title'
title.textContent = GROUP_LABEL
group.append(title)

options.forEach((option, index) => {
  const row = document.createElement('div')
  const radio = document.createElement('md-radio')
  radio.id = option.id
  radio.setAttribute('name', 'ringtone')
  radio.setAttribute('value', option.value)
  if (index === 0) radio.setAttribute('checked', '')
  const label = document.createElement('label')
  label.htmlFor = option.id
  label.textContent = option.label
  row.append(radio, label)
  group.append(row)
})

bench.append(group)
app.append(heading, bench)

customElements.whenDefined('md-radio').then(() => {
  requestAnimationFrame(() => performance.mark('bench:rendered'))
})
