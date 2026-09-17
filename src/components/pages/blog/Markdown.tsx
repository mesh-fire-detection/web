import { DataTable, type Column } from '@components/shared/page/DataTable'
import { List, ListItem } from '@components/shared/page/List'
import { Box, Divider, ScrollArea, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Break, Strong, Text, Value } from '@components/shared/typography/Text'
import { TextLink } from '@components/shared/widgets/Action'
import type { MarkdownBlock, MarkdownInline } from '@core/format/markdown'

type Inlines = readonly MarkdownInline[]
type TableBlock = Extract<MarkdownBlock, { kind: 'table' }>
type TableRow = TableBlock['rows'][number]

const HEADING_SIZE = { 1: '2xl', 2: 'lg', 3: 'md', 4: 'sm', 5: 'sm', 6: 'sm' } as const

function InlineRun({ content }: { content: Inlines }) {
    return (
        <>
            {content.map((node) => (
                <InlineNode key={node.at} node={node} />
            ))}
        </>
    )
}

function InlineNode({ node }: { node: MarkdownInline }) {
    switch (node.kind) {
        case 'text': {
            return <>{node.text}</>
        }
        case 'break': {
            return <Break />
        }
        case 'code': {
            return <Value>{node.text}</Value>
        }
        case 'strong': {
            return (
                <Strong>
                    <InlineRun content={node.children} />
                </Strong>
            )
        }
        case 'emphasis': {
            return (
                <span className='md_em'>
                    <InlineRun content={node.children} />
                </span>
            )
        }
        case 'link': {
            return (
                <TextLink to={node.href}>
                    <InlineRun content={node.children} />
                </TextLink>
            )
        }
    }
}

function MarkdownTable({ block }: { block: TableBlock }) {
    const columns: readonly Column<TableRow>[] = block.header.map((cell, index) => ({
        key: `column_${String(index)}`,
        header: <InlineRun content={cell} />,
        align: block.align[index] ?? 'start',
        render: (row: TableRow) => (
            <Text as='span' size='sm' tone='muted'>
                <InlineRun content={row.cells[index] ?? []} />
            </Text>
        ),
    }))

    return (
        <DataTable columns={columns} getRowKey={(row) => String(row.at)} rows={block.rows} dense />
    )
}

function BlockNode({ block }: { block: MarkdownBlock }) {
    switch (block.kind) {
        case 'heading': {
            return (
                <Heading
                    id={block.id}
                    level={block.level}
                    measure={44}
                    size={HEADING_SIZE[block.level]}
                >
                    <InlineRun content={block.content} />
                </Heading>
            )
        }
        case 'paragraph': {
            return (
                <Text measure={72} tone='muted'>
                    <InlineRun content={block.content} />
                </Text>
            )
        }
        case 'quote': {
            return (
                <Box accent='fire' border={false} padding={5} radius='sm' tone='fire'>
                    <Text measure={70} size='lg'>
                        <InlineRun content={block.content} />
                    </Text>
                </Box>
            )
        }
        case 'list': {
            return (
                <List gap={2} marker={block.ordered ? 'number' : 'dash'}>
                    {block.items.map((item) => (
                        <ListItem key={item.at}>
                            <InlineRun content={item.content} />
                        </ListItem>
                    ))}
                </List>
            )
        }
        case 'code': {
            return (
                <Box padding={4} radius='sm' tone='surface-2'>
                    <ScrollArea label='Diagram'>
                        <Text className='md_code' mono size='sm' tone='muted'>
                            {block.text}
                        </Text>
                    </ScrollArea>
                </Box>
            )
        }
        case 'table': {
            return <MarkdownTable block={block} />
        }
        case 'rule': {
            return <Divider space={4} />
        }
    }
}

/** Renders parsed Markdown with the site's own components — never raw HTML. */
export function MarkdownBody({ blocks }: { blocks: readonly MarkdownBlock[] }) {
    return (
        <Stack gap={5}>
            {blocks.map((block) => (
                <BlockNode block={block} key={block.at} />
            ))}
        </Stack>
    )
}
