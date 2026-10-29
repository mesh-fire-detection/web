import { List, ListItem } from '@components/shared/page/List'
import { Text } from '@components/shared/typography/Text'
import type { NodeReport } from '@core/api/people'
import { nodeId } from '@core/nearby/model'

/** Nodes by name and Meshtastic ID, as the person would recognise them on the bench. */
export function NodeList({
    nodes,
    unnamed,
}: {
    readonly nodes: readonly NodeReport[]
    readonly unnamed: string
}) {
    return (
        <List marker='none'>
            {nodes.map((node) => (
                <ListItem key={node.nodeNum} tone='default'>
                    {node.name ?? unnamed}{' '}
                    <Text as='span' mono size='sm' tone='faint'>
                        {nodeId(node.nodeNum)}
                        {node.hardware === null ? '' : ` · ${node.hardware}`}
                    </Text>
                </ListItem>
            ))}
        </List>
    )
}
