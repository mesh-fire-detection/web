import { Page } from '@components/layout/Page'
import { Box, Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { TextLink } from '@components/shared/widgets/Action'
import { Badge } from '@components/shared/widgets/Badge'
import { Callout } from '@components/shared/widgets/Callout'
import { blogContent } from '@core/content/blog/blog'
import { blogPosts } from '@core/content/blog/posts'

export function BlogPage() {
    const copy = blogContent

    return (
        <Page eyebrow={copy.eyebrow} lede={copy.lede} title={copy.title}>
            <Section space='md' width='narrow'>
                {blogPosts.length === 0 ? (
                    <Callout title={copy.emptyTitle}>{copy.emptyBody}</Callout>
                ) : (
                    <Stack gap={4}>
                        {blogPosts.map((post) => (
                            <Box key={post.slug} padding={5} radius='md' tone='surface'>
                                <Stack gap={3}>
                                    <Row gap={3}>
                                        <Text mono size='xs' tone='faint'>
                                            {post.date}
                                        </Text>
                                        {post.draft ? (
                                            <Badge kind='warn'>{copy.draftLabel}</Badge>
                                        ) : null}
                                    </Row>
                                    <Heading level={2} measure={40} size='lg'>
                                        <TextLink to={`/blog/${post.slug}`}>{post.title}</TextLink>
                                    </Heading>
                                    <Text measure={76} tone='muted'>
                                        {post.excerpt}
                                    </Text>
                                    {post.tags.length > 0 ? (
                                        <Row gap={2}>
                                            {post.tags.map((tag) => (
                                                <Badge key={tag} kind='neutral' size='xs'>
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </Row>
                                    ) : null}
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Section>
        </Page>
    )
}
