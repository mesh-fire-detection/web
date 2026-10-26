import { useState } from 'react'

import { Page } from '@components/layout/Page'
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
import { CollectionToolbar } from '@components/shared/page/CollectionToolbar'
import { DataTable } from '@components/shared/page/DataTable'
import { DescriptionItem, DescriptionList, List, ListItem } from '@components/shared/page/List'
import { MetricGrid } from '@components/shared/page/MetricGrid'
import { SectionHead } from '@components/shared/page/SectionHead'
import { StepItem, StepList } from '@components/shared/page/StepList'
import { Timeline, TimelineItem } from '@components/shared/page/Timeline'
import {
    Box,
    Divider,
    Grid,
    Row,
    ScrollArea,
    Section,
    Spacer,
    Stack,
} from '@components/shared/primitives/Layout'
import { Eyebrow, Heading } from '@components/shared/typography/Heading'
import { Break, CodeBlock, Strong, Text, Value } from '@components/shared/typography/Text'
import {
    BareButton,
    Button,
    ButtonAnchor,
    ButtonLink,
    IconButton,
    IconLink,
    LinkCard,
    NavLink,
    TextLink,
} from '@components/shared/widgets/Action'
import { Badge, Metric, MetricCard, StatusLabel } from '@components/shared/widgets/Badge'
import { Callout, EmptyState, ErrorState } from '@components/shared/widgets/Callout'
import { CostComparison } from '@components/shared/widgets/CostComparison'
import { Icon, type IconName } from '@components/shared/widgets/Icon'
import { SampleDataBanner } from '@components/shared/widgets/SampleDataBanner'

const options = [
    { value: 'one', label: 'First' },
    { value: 'two', label: 'Second' },
] as const
const icons: readonly IconName[] = [
    'map',
    'build',
    'coverage',
    'problem',
    'github',
    'discord',
    'arrow-right',
    'arrow-up-right',
    'download',
    'radio',
    'camera',
    'sensor',
    'cell',
    'battery',
    'menu',
    'close',
    'check',
    'alert',
    'chevron',
    'bluetooth',
    'usb',
    'flask',
]
const rows = [
    { name: 'Sensor', status: 'Online' },
    { name: 'Gateway', status: 'Offline' },
]

export function DesignPage() {
    const [text, setText] = useState('Example')
    const [number, setNumber] = useState(12)
    const [choice, setChoice] = useState<'one' | 'two'>('one')
    const [checked, setChecked] = useState(false)
    return (
        <Page
            title='UI Kit'
            eyebrow='Design system'
            lede='Live examples of the shared components and their states.'
        >
            <Section space='sm' bordered>
                <Stack gap={8}>
                    <Stack gap={4}>
                        <SectionHead
                            title='Typography and layout'
                            lede='Use semantic headings, token-based spacing and shared surfaces.'
                        />
                        <Box>
                            <Stack gap={3}>
                                <Eyebrow>Eyebrow</Eyebrow>
                                <Heading level={3} size='lg'>
                                    Heading
                                </Heading>
                                <Text>
                                    Body text with <Strong>emphasis</Strong> and{' '}
                                    <Value>42 km</Value>.<Break />A second line.
                                </Text>
                                <CodeBlock>{'const status = "online"'}</CodeBlock>
                            </Stack>
                        </Box>
                        <Grid columns={2}>
                            <Box tone='surface-2'>Surface</Box>
                            <Box tone='fire' accent='fire'>
                                Accent surface
                            </Box>
                        </Grid>
                        <Divider />
                        <Spacer size={1} />
                    </Stack>
                    <Stack gap={4}>
                        <SectionHead title='Actions and navigation' />
                        <Row>
                            {(
                                [
                                    'primary',
                                    'secondary',
                                    'ghost',
                                    'danger',
                                    'bluetooth',
                                    'usb',
                                    'contrast',
                                ] as const
                            ).map((variant) => (
                                <Button key={variant} variant={variant}>
                                    {variant}
                                </Button>
                            ))}
                        </Row>
                        <Row>
                            <BareButton
                                onClick={() => {
                                    setText('Bare action')
                                }}
                            >
                                Bare action
                            </BareButton>
                            <Button size='sm'>Small</Button>
                            <Button size='lg'>Large</Button>
                            <Button disabled>Disabled</Button>
                            <Button loading>Loading</Button>
                            <IconButton
                                label='Close example'
                                onClick={() => {
                                    setText('Example')
                                }}
                            >
                                <Icon name='close' />
                            </IconButton>
                        </Row>
                        <Row>
                            <ButtonLink to='/'>Internal link</ButtonLink>
                            <ButtonAnchor href='https://example.com'>External link</ButtonAnchor>
                            <TextLink to='/'>Text link</TextLink>
                            <NavLink to='/design'>Navigation</NavLink>
                            <IconLink href='https://github.com' label='GitHub'>
                                <Icon name='github' />
                            </IconLink>
                            <LinkCard href='https://example.com'>
                                <Box>Link card</Box>
                            </LinkCard>
                        </Row>
                    </Stack>
                    <Stack gap={4}>
                        <SectionHead
                            title='Fields'
                            lede='Interactive examples; changes stay on this page.'
                        />
                        <Form
                            onSubmit={(event) => {
                                event.preventDefault()
                            }}
                        >
                            <FormSection
                                title='Example form'
                                description='Labels, descriptions and errors are associated with their controls.'
                            >
                                <Grid columns={2}>
                                    <TextField
                                        label='Text'
                                        value={text}
                                        onChange={setText}
                                        description='Supporting text'
                                    />
                                    <TextField
                                        label='Invalid field'
                                        value={text}
                                        onChange={setText}
                                        error='Example validation error'
                                    />
                                    <PasswordField
                                        label='Password'
                                        value={text}
                                        onChange={setText}
                                    />
                                    <SearchField label='Search' value={text} onChange={setText} />
                                    <TextareaField
                                        label='Message'
                                        value={text}
                                        onChange={setText}
                                    />
                                    <NumberField
                                        label='Number'
                                        value={number}
                                        onChange={setNumber}
                                    />
                                    <SelectField
                                        label='Select'
                                        value={choice}
                                        options={options}
                                        onChange={setChoice}
                                    />
                                    <FileField
                                        label='File'
                                        accept='.txt'
                                        onChange={(file) => {
                                            setText(file?.name ?? '')
                                        }}
                                    />
                                    <SliderField
                                        label='Slider'
                                        min={0}
                                        max={100}
                                        value={number}
                                        onChange={setNumber}
                                        format={(value) => `${String(value)}%`}
                                    />
                                    <CheckboxField
                                        label='Checkbox'
                                        checked={checked}
                                        onChange={setChecked}
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
                            </FormSection>
                            <FormActions>
                                <Button type='submit'>Submit example</Button>
                            </FormActions>
                        </Form>
                    </Stack>
                    <Stack gap={4}>
                        <SectionHead title='Status and feedback' />
                        <Row>
                            {(['live', 'warn', 'dead', 'fire', 'neutral'] as const).map((kind) => (
                                <Badge kind={kind} key={kind}>
                                    {kind}
                                </Badge>
                            ))}
                        </Row>
                        <StatusLabel kind='live'>Online</StatusLabel>
                        <MetricGrid>
                            <Metric label='Packets' value='42' />
                            <MetricCard label='Signal' value='−90 dBm' />
                        </MetricGrid>
                        <SampleDataBanner />
                        <CostComparison />
                        <Callout title='Notice'>A shared callout.</Callout>
                        <EmptyState title='Nothing here'>
                            No items match the current filter.
                        </EmptyState>
                        <ErrorState
                            title='Unable to load'
                            onRetry={() => {
                                setText('Retry requested')
                            }}
                        >
                            Try again.
                        </ErrorState>
                    </Stack>
                    <Stack gap={4}>
                        <SectionHead title='Data and content' />
                        <CollectionToolbar resultCount={rows.length} itemLabel='item'>
                            <SearchField label='Filter examples' value={text} onChange={setText} />
                        </CollectionToolbar>
                        <DataTable
                            label='Example table'
                            columns={[
                                { key: 'name', header: 'Name', render: (row) => row.name },
                                { key: 'status', header: 'Status', render: (row) => row.status },
                            ]}
                            rows={rows}
                            getRowKey={(row) => row.name}
                        />
                        <List>
                            <ListItem>List item</ListItem>
                            <ListItem>Another item</ListItem>
                        </List>
                        <DescriptionList>
                            <DescriptionItem term='Type'>Sensor</DescriptionItem>
                            <DescriptionItem term='Status'>Online</DescriptionItem>
                        </DescriptionList>
                        <StepList>
                            <StepItem index={1}>First step</StepItem>
                            <StepItem index={2}>Second step</StepItem>
                        </StepList>
                        <Timeline>
                            <TimelineItem meta='Today'>An event</TimelineItem>
                        </Timeline>
                        <ScrollArea label='Scrollable example'>
                            <CodeBlock>{'Scrollable content'}</CodeBlock>
                        </ScrollArea>
                    </Stack>
                    <Stack gap={4}>
                        <SectionHead title='Icons' />
                        <Row gap={4}>
                            {icons.map((name) => (
                                <Stack key={name} align='center' gap={1}>
                                    <Icon name={name} size={24} />
                                    <Text size='2xs' tone='faint'>
                                        {name}
                                    </Text>
                                </Stack>
                            ))}
                        </Row>
                    </Stack>
                </Stack>
            </Section>
        </Page>
    )
}
