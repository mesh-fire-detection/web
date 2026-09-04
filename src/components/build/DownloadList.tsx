import { Badge, Box, Grid, Icon, LinkCard, Row, Stack, Text } from '@/ui'
import { DOWNLOADS } from '@/data/bom'
import type { Download } from '@/data/bom'
import { cx } from '@/lib/cx'

const KIND_LABEL: Record<Download['kind'], string> = {
  stl: 'STL',
  json: 'JSON',
  doc: 'DOC',
}

function Card({ file }: { file: Download }) {
  return (
    <Box tone="surface" padding={4} radius="sm" grow>
      <Row justify="between" align="start" gap={3} wrap={false}>
        <Stack gap={1} minWidth0>
          <Row gap={2}>
            <Text as="span" size="sm" mono weight={600} className="dl__name">
              {file.name}
            </Text>
            <Badge size="xs">{KIND_LABEL[file.kind]}</Badge>
            {!file.available ? (
              <Badge kind="warn" size="xs">
                Not published yet
              </Badge>
            ) : null}
          </Row>
          <Text size="xs" tone="faint" measure={58}>
            {file.detail}
          </Text>
        </Stack>
        <Stack gap={1} align="end">
          <Text as="span" tone="faint" className="dl__icon">
            <Icon name={file.available ? 'download' : 'arrow-up-right'} size={16} />
          </Text>
          <Text as="span" size="2xs" mono tone="faint">
            {file.available ? file.size : 'in repo'}
          </Text>
        </Stack>
      </Row>
    </Box>
  )
}

export function DownloadList({ kind }: { kind?: Download['kind'] | undefined }) {
  const files = kind ? DOWNLOADS.filter((file) => file.kind === kind) : DOWNLOADS

  return (
    <Grid columns={2} minColumnWidth={280} gap={3}>
      {files.map((file) =>
        file.available ? (
          <LinkCard key={file.name} href={file.href} download className="dl">
            <Card file={file} />
          </LinkCard>
        ) : (
          <LinkCard key={file.name} href={file.href} external className={cx('dl', 'dl--pending')}>
            <Card file={file} />
          </LinkCard>
        ),
      )}
    </Grid>
  )
}
