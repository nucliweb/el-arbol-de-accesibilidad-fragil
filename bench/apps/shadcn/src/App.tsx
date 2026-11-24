import { useEffect } from 'react'
import { Field, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { GROUP_LABEL, TITLE, countFromSearch, optionsFor } from '../../../shared/scenario.js'

const options = optionsFor(countFromSearch(window.location.search))

export default function App() {
  useEffect(() => {
    performance.mark('bench:rendered')
  }, [])

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">{TITLE}</h1>
      <div id="bench">
        <FieldSet>
          <FieldLegend variant="label">{GROUP_LABEL}</FieldLegend>
          <RadioGroup defaultValue={options[0].value}>
            {options.map((option) => (
              <Field orientation="horizontal" key={option.id}>
                <RadioGroupItem value={option.value} id={option.id} />
                <FieldLabel htmlFor={option.id}>{option.label}</FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        </FieldSet>
      </div>
    </main>
  )
}
