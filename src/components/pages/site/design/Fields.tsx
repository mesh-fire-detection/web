import { useState } from 'react'

import { Group, Specimen } from '@components/pages/site/design/Specimen'
import { CheckboxField, RadioGroup, SegmentedField } from '@components/shared/forms/ChoiceFields'
import {
    PasswordField,
    SearchField,
    TextareaField,
    TextField,
} from '@components/shared/forms/Field'
import { Form, FormActions, FormSection } from '@components/shared/forms/Form'
import {
    FileField,
    NumberField,
    SelectField,
    SliderField,
} from '@components/shared/forms/NumericFields'
import { Grid, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'

const options = [
    { value: 'one', label: 'First' },
    { value: 'two', label: 'Second' },
] as const
const ERROR = 'Example validation error'

/** The specimens show the control only; the chosen file goes nowhere. */
function ignoreFile(): void {
    // Nothing to do.
}

export function Fields() {
    const [text, setText] = useState('Example')
    const [empty, setEmpty] = useState('')
    const [number, setNumber] = useState(12)
    const [choice, setChoice] = useState<'one' | 'two'>('one')
    const [checked, setChecked] = useState(false)
    const [submitted, setSubmitted] = useState(0)
    const [busy, setBusy] = useState(false)
    return (
        <Specimen title='Fields' lede='Interactive examples; changes stay on this page.'>
            <Group label='Default: with description, hint, placeholder, suffix and required'>
                <Grid columns={2}>
                    <TextField
                        label='Text'
                        value={text}
                        onChange={setText}
                        description='Supporting text'
                        hint='Optional'
                    />
                    <TextField
                        label='Empty with placeholder'
                        value={empty}
                        onChange={setEmpty}
                        placeholder='Placeholder'
                        required
                    />
                    <TextField
                        label='Email'
                        type='email'
                        value={empty}
                        onChange={setEmpty}
                        placeholder='name@example.com'
                    />
                    <TextField
                        label='Phone'
                        type='tel'
                        value={empty}
                        onChange={setEmpty}
                        placeholder='+1 555 0100'
                    />
                    <TextField
                        label='URL'
                        type='url'
                        value={empty}
                        onChange={setEmpty}
                        placeholder='https://'
                    />
                    <PasswordField label='Password' value={text} onChange={setText} />
                    <SearchField
                        label='Search'
                        value={text}
                        onChange={setText}
                        placeholder='Search nodes'
                    />
                    <NumberField
                        label='Number with suffix'
                        value={number}
                        onChange={setNumber}
                        suffix='km'
                        min={0}
                        max={100}
                    />
                    <SelectField
                        label='Select'
                        value={choice}
                        options={options}
                        onChange={setChoice}
                    />
                    <FileField label='File' accept='.txt' onChange={ignoreFile} />
                    <SliderField
                        label='Slider'
                        min={0}
                        max={100}
                        value={number}
                        onChange={setNumber}
                        format={(value) => `${String(value)}%`}
                    />
                    <TextareaField
                        label='Message'
                        value={text}
                        onChange={setText}
                        maxLength={200}
                    />
                    <CheckboxField
                        label='Checkbox'
                        checked={checked}
                        onChange={setChecked}
                        description='With a description'
                    />
                    <RadioGroup
                        label='Radio group'
                        value={choice}
                        options={options}
                        onChange={setChoice}
                    />
                    <SegmentedField
                        label='Segmented'
                        value={choice}
                        options={options}
                        onChange={setChoice}
                    />
                </Grid>
            </Group>
            <Group label='Invalid'>
                <Grid columns={2}>
                    <TextField label='Text' value={text} onChange={setText} error={ERROR} />
                    <PasswordField label='Password' value={text} onChange={setText} error={ERROR} />
                    <TextareaField label='Message' value={text} onChange={setText} error={ERROR} />
                    <NumberField label='Number' value={number} onChange={setNumber} error={ERROR} />
                    <SelectField
                        label='Select'
                        value={choice}
                        options={options}
                        onChange={setChoice}
                        error={ERROR}
                    />
                    <FileField label='File' accept='.txt' onChange={ignoreFile} error={ERROR} />
                    <CheckboxField
                        label='Checkbox'
                        checked={checked}
                        onChange={setChecked}
                        error={ERROR}
                    />
                    <RadioGroup
                        label='Radio group'
                        value={choice}
                        options={options}
                        onChange={setChoice}
                        error={ERROR}
                    />
                </Grid>
            </Group>
            <Group label='Disabled'>
                <Grid columns={2}>
                    <TextField label='Text' value={text} onChange={setText} disabled />
                    <PasswordField label='Password' value={text} onChange={setText} disabled />
                    <TextareaField label='Message' value={text} onChange={setText} disabled />
                    <NumberField label='Number' value={number} onChange={setNumber} disabled />
                    <SelectField
                        label='Select'
                        value={choice}
                        options={options}
                        onChange={setChoice}
                        disabled
                    />
                    <FileField label='File' accept='.txt' onChange={ignoreFile} disabled />
                    <SliderField
                        label='Slider'
                        min={0}
                        max={100}
                        value={number}
                        onChange={setNumber}
                        format={(value) => `${String(value)}%`}
                        disabled
                    />
                    <CheckboxField label='Checkbox' checked onChange={setChecked} disabled />
                    <RadioGroup
                        label='Radio group'
                        value={choice}
                        options={options}
                        onChange={setChoice}
                        disabled
                    />
                </Grid>
            </Group>
            <Group label='Form: sections, disabled section, busy, actions'>
                <Form
                    busy={busy}
                    onSubmit={(event) => {
                        event.preventDefault()
                        setBusy(true)
                        setSubmitted((value) => value + 1)
                        setTimeout(() => {
                            setBusy(false)
                        }, 1500)
                    }}
                >
                    <FormSection
                        title='Example form'
                        description='Labels, descriptions and errors are associated with their controls.'
                    >
                        <TextField label='Name' value={text} onChange={setText} required />
                    </FormSection>
                    <FormSection
                        title='Disabled section'
                        description='Every control inside a disabled section is disabled.'
                        disabled
                    >
                        <TextField label='Locked' value={text} onChange={setText} />
                    </FormSection>
                    <FormActions>
                        <Button type='submit' loading={busy}>
                            Submit example
                        </Button>
                        <Button variant='ghost' type='reset'>
                            Reset
                        </Button>
                    </FormActions>
                </Form>
                <Stack gap={0}>
                    <Text size='xs' tone='faint' ariaLive='polite'>
                        {submitted === 0
                            ? 'Not submitted yet.'
                            : `Submitted ${String(submitted)} times.`}
                    </Text>
                </Stack>
            </Group>
        </Specimen>
    )
}
