import { useState } from 'react'

import { draftOf, parseDraft, type Draft, type DraftErrors } from '@components/pages/nodes/editing'
import { NODE_TYPES } from '@components/pages/nodes/listing'
import { CheckboxField } from '@components/shared/forms/ChoiceFields'
import { TextareaField, TextField } from '@components/shared/forms/Field'
import { Form, FormActions } from '@components/shared/forms/Form'
import { SelectField } from '@components/shared/forms/NumericFields'
import { Grid, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'
import { updateNode, type Node } from '@core/api/nodes'
import { nodeContent } from '@core/content/nodes/node'
import { nodesContent } from '@core/content/nodes/nodes'

const copy = nodeContent.edit

const TYPE_OPTIONS = [
    { value: 'none', label: copy.notSet },
    ...NODE_TYPES.map((type) => ({ value: type, label: nodesContent.types[type] })),
] as const

const SAVE_ERRORS = ['bad_request', 'rate_limited', 'unreachable'] as const

const saveError = (error: string): string =>
    (SAVE_ERRORS as readonly string[]).includes(error)
        ? copy.errors[error as (typeof SAVE_ERRORS)[number]]
        : copy.errors.fallback

/** Editing a node, for the people on it and admins. The mesh ID and enabling stay with admins. */
export function NodeEditor({
    node,
    onSaved,
    onCancel,
}: {
    readonly node: Node
    readonly onSaved: (node: Node) => void
    readonly onCancel: () => void
}) {
    const [draft, setDraft] = useState<Draft>(() => draftOf(node))
    const [errors, setErrors] = useState<DraftErrors>({})
    const [formError, setFormError] = useState<string | undefined>()
    const [busy, setBusy] = useState(false)

    const field =
        <Key extends keyof Draft>(key: Key) =>
        (value: Draft[Key]) => {
            setDraft((current) => ({ ...current, [key]: value }))
        }

    return (
        <Form
            ariaLabel={copy.title}
            busy={busy}
            onSubmit={(event) => {
                event.preventDefault()
                setFormError(undefined)
                const parsed = parseDraft(draft)
                if (!parsed.ok) {
                    setErrors(parsed.errors)
                    return
                }
                setErrors({})
                setBusy(true)
                void updateNode(node.id, parsed.changes).then((result) => {
                    setBusy(false)
                    if (result.ok) onSaved(result.data)
                    else setFormError(saveError(result.error))
                })
            }}
        >
            <Stack gap={4}>
                <Heading level={2} size='md'>
                    {copy.title}
                </Heading>
                <TextField
                    error={errors.name}
                    label={copy.name}
                    name='name'
                    onChange={field('name')}
                    required
                    value={draft.name}
                />
                <SelectField
                    label={copy.type}
                    name='type'
                    onChange={field('type')}
                    options={TYPE_OPTIONS}
                    value={draft.type}
                />
                <Stack gap={1}>
                    <Heading level={3} size='sm'>
                        {copy.recordTitle}
                    </Heading>
                    <Text size='sm' tone='muted'>
                        {copy.recordLede}
                    </Text>
                </Stack>
                <Grid gap={4} minColumnWidth={200}>
                    <TextField
                        description={copy.positionHint}
                        error={errors.latitude}
                        inputMode='decimal'
                        label={copy.latitude}
                        name='latitude'
                        onChange={field('latitude')}
                        value={draft.latitude}
                    />
                    <TextField
                        error={errors.longitude}
                        inputMode='decimal'
                        label={copy.longitude}
                        name='longitude'
                        onChange={field('longitude')}
                        value={draft.longitude}
                    />
                    <TextField
                        error={errors.elevationM}
                        inputMode='decimal'
                        label={copy.elevation}
                        name='elevationM'
                        onChange={field('elevationM')}
                        value={draft.elevationM}
                    />
                    <TextField
                        error={errors.antennaHeightM}
                        inputMode='decimal'
                        label={copy.antenna}
                        name='antennaHeightM'
                        onChange={field('antennaHeightM')}
                        value={draft.antennaHeightM}
                    />
                    <TextField
                        description={copy.deployedHint}
                        error={errors.deployedOn}
                        label={copy.deployed}
                        name='deployedOn'
                        onChange={field('deployedOn')}
                        value={draft.deployedOn}
                    />
                </Grid>
                <CheckboxField
                    checked={draft.exactPosition}
                    description={copy.exactHint}
                    label={copy.exactPosition}
                    name='exactPosition'
                    onChange={field('exactPosition')}
                />
                <TextareaField
                    label={copy.note}
                    maxLength={500}
                    name='note'
                    onChange={field('note')}
                    value={draft.note}
                />
                {formError === undefined ? null : (
                    <Text role='alert' size='sm' tone='dead'>
                        {formError}
                    </Text>
                )}
                <FormActions>
                    <Button loading={busy} type='submit'>
                        {copy.save}
                    </Button>
                    <Button onClick={onCancel} variant='secondary'>
                        {copy.cancel}
                    </Button>
                </FormActions>
            </Stack>
        </Form>
    )
}
