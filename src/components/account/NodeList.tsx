import { List, ListItem } from '@components/shared/page/List'
import { Text } from '@components/shared/typography/Text'
import type { MyNode, NodeReport } from '@core/api/people'
import { meshId } from '@core/nearby/model'

type ListedNode = {
    readonly key: string
    readonly name: string | null
    /** The IDs a person would recognise it by, set in mono. */
    readonly ids: string
    readonly hardware: string | null
}

/** A node this browser connected, before it is registered. */
export const fromReport = (node: NodeReport): ListedNode => ({
    key: String(node.nodeNum),
    name: node.name,
    ids: meshId(node.nodeNum),
    hardware: node.hardware,
})

/** A registered node, by the ID the server gave it as well. */
export const fromMine = (node: MyNode): ListedNode => ({
    key: node.id,
    name: node.name,
    ids: `${node.id} · ${node.meshId}`,
    hardware: node.details?.hardware ?? null,
})

/** Nodes by name and ID, as the person would recognise them on the bench. */
export function NodeList({
    nodes,
    unnamed,
}: {
    readonly nodes: readonly ListedNode[]
    readonly unnamed: string
}) {
    return (
        <List marker='none'>
            {nodes.map((node) => (
                <ListItem key={node.key} tone='default'>
                    {node.name ?? unnamed}{' '}
                    <Text as='span' mono size='sm' tone='faint'>
                        {node.ids}
                        {node.hardware === null ? '' : ` · ${node.hardware}`}
                    </Text>
                </ListItem>
            ))}
        </List>
    )
}
