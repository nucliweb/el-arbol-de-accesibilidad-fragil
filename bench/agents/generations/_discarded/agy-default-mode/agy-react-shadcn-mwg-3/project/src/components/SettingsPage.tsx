import { useEffect, useId, useRef, useState } from 'react'
import { Check, Square, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  RINGTONES,
  getRingtoneById,
  loadSavedRingtone,
  playRingtonePreview,
  saveRingtone,
  type RingtoneId,
  type RingtonePlaybackHandle,
} from '@/lib/ringtones'

interface SettingsPageProps {
  headingRef?: React.RefObject<HTMLHeadingElement | null>
}

export function SettingsPage({ headingRef }: SettingsPageProps) {
  const [savedRingtone, setSavedRingtone] = useState<RingtoneId>(() => loadSavedRingtone())
  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneId>(() => loadSavedRingtone())
  const [playingRingtone, setPlayingRingtone] = useState<RingtoneId | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  const playbackRef = useRef<RingtonePlaybackHandle | null>(null)
  const idPrefix = useId()
  const formHeadingId = `${idPrefix}-calls-heading`
  const radioGroupName = `${idPrefix}-ringtone`

  useEffect(() => {
    return () => {
      playbackRef.current?.stop()
      playbackRef.current = null
    }
  }, [])

  function stopPreview() {
    playbackRef.current?.stop()
    playbackRef.current = null
    setPlayingRingtone(null)
  }

  function handleTogglePreview(id: RingtoneId) {
    if (playingRingtone === id) {
      stopPreview()
      return
    }

    stopPreview()
    setPlayingRingtone(id)
    playbackRef.current = playRingtonePreview(id, () => {
      playbackRef.current = null
      setPlayingRingtone((current) => (current === id ? null : current))
    })
  }

  function handleSelectRingtone(id: RingtoneId) {
    setSelectedRingtone(id)
    if (statusMessage) {
      setStatusMessage('')
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveRingtone(selectedRingtone)
    setSavedRingtone(selectedRingtone)
    const savedOption = getRingtoneById(selectedRingtone)
    setStatusMessage(`Tono de llamada guardado: ${savedOption.name}.`)
  }

  const savedOption = getRingtoneById(savedRingtone)
  const hasUnsavedChanges = selectedRingtone !== savedRingtone

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight text-foreground outline-none"
        >
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Personaliza las preferencias de sonido para tus llamadas entrantes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2" id={formHeadingId}>
            Llamadas
          </CardTitle>
          <CardDescription>
            Tono actual: <strong className="font-medium text-foreground">{savedOption.name}</strong>
          </CardDescription>
        </CardHeader>

        <form aria-labelledby={formHeadingId} onSubmit={handleSubmit}>
          <CardContent className="pb-6">
            <fieldset className="ringtone-fieldset">
              <legend className="ringtone-legend">Tono de llamada</legend>

              <div className="ringtone-options">
                {RINGTONES.map((ringtone) => {
                  const inputId = `${idPrefix}-ringtone-${ringtone.id}`
                  const isSelected = selectedRingtone === ringtone.id
                  const isSaved = savedRingtone === ringtone.id
                  const isPlaying = playingRingtone === ringtone.id

                  return (
                    <div
                      key={ringtone.id}
                      className="ringtone-option"
                      data-selected={isSelected ? 'true' : undefined}
                    >
                      <div className="ringtone-choice">
                        <input
                          type="radio"
                          id={inputId}
                          name={radioGroupName}
                          value={ringtone.id}
                          checked={isSelected}
                          onChange={() => handleSelectRingtone(ringtone.id)}
                          className="ringtone-radio"
                        />
                        <label htmlFor={inputId} className="ringtone-label">
                          <span className="ringtone-label-text">{ringtone.name}</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSaved && (
                          <span className="ringtone-badge">Actual</span>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePreview(ringtone.id)}
                          className="ringtone-preview-btn"
                        >
                          {isPlaying ? (
                            <>
                              <Square aria-hidden="true" />
                              <span>
                                Detener{' '}
                                <span className="visually-hidden">
                                  tono {ringtone.name}
                                </span>
                              </span>
                            </>
                          ) : (
                            <>
                              <Volume2 aria-hidden="true" />
                              <span>
                                Escuchar{' '}
                                <span className="visually-hidden">
                                  tono {ringtone.name}
                                </span>
                              </span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </fieldset>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="lg" className="min-h-12 px-4 text-base md:text-sm">
                Guardar cambios
              </Button>
              {hasUnsavedChanges && (
                <span className="text-sm text-muted-foreground">
                  Cambios sin guardar
                </span>
              )}
            </div>

            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="flex items-center gap-1.5 text-sm font-medium text-foreground empty:hidden"
            >
              {statusMessage && (
                <>
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                  <span>{statusMessage}</span>
                </>
              )}
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
