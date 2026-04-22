'use client'

import type { Group } from '@taxilink/core'
import type { AddressSuggestion } from '@/services/addressService'
import { AddressField } from '../AddressField'
import { GuidedBooleanInput, GuidedChoiceInput, GuidedPassengersInput } from './GuidedChoiceInput'
import { GuidedGroupsInput } from './GuidedGroupsInput'
import { GuidedTextInput } from './GuidedTextInput'
import type { GuidedQuestion } from './guidedTypes'

interface Props {
  question: GuidedQuestion
  value: unknown
  myGroups: Group[]
  onChange: (value: unknown) => void
  onAutoCommit: (value: unknown) => void
  onEnterSubmit: () => void
}

/**
 * Rendu de l'input correspondant à la question courante.
 * - onAutoCommit : clic immédiat = validation (chips, suggestion d'adresse)
 * - onChange     : saisie libre à confirmer via bouton externe (texte, groupes)
 */
export function GuidedQuestionRenderer({
  question, value, myGroups, onChange, onAutoCommit, onEnterSubmit,
}: Props) {
  switch (question.kind) {
    case 'choice':
      return (
        <GuidedChoiceInput
          options={question.options ?? []}
          value={value}
          onChange={(v) => onAutoCommit(v)}
        />
      )
    case 'boolean':
      return <GuidedBooleanInput value={value} onChange={(v) => onAutoCommit(v)} />
    case 'passengers':
      return <GuidedPassengersInput value={value} onChange={(v) => onAutoCommit(v)} />
    case 'groups':
      return <GuidedGroupsInput myGroups={myGroups} value={value} onChange={(v) => onChange(v)} />
    case 'address': {
      const str = typeof value === 'string'
        ? value
        : (value && typeof value === 'object' && 'label' in value ? (value as { label: string }).label : '')
      return (
        <AddressField
          label={question.shortLabel}
          placeholder="Adresse, lieu, POI…"
          value={str}
          onChange={(v) => onChange(v)}
          onSelectSuggestion={(s: AddressSuggestion) => onAutoCommit({ label: s.label, lat: s.lat, lng: s.lng })}
          filled={str.trim().length >= 5}
        />
      )
    }
    case 'text':
    case 'phone':
    case 'date':
    case 'time':
      return (
        <GuidedTextInput
          kind={question.kind}
          value={value}
          onChange={(v) => onChange(v)}
          onSubmit={onEnterSubmit}
          autoFocus
        />
      )
  }
}
