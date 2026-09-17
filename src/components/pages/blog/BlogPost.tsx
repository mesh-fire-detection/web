import { useParams } from 'react-router-dom'

import { Page } from '@components/layout/Page'
import { MarkdownBody } from '@components/pages/blog/Markdown'
import { NotFoundPage } from '@components/pages/site/NotFound'
import { Row, Section, Stack } from '@components/shared/primitives/Layout'
import { Text } from '@components/shared/typography/Text'
import { TextLink } from '@components/shared/widgets/Action'
import { Badge } from '@components/shared/widgets/Badge'
import { blogContent } from '@core/content/blog/blog'
import { blogPosts } from '@core/content/blog/posts'

export function BlogPostPage() {
    const { slug } = useParams()
    const copy = blogContent
    const post = blogPosts.find((candidate) => candidate.slug === slug)

    return post ? (
        <Page
            aside={
                <Row gap={3}>
                    <Text mono size='xs' tone='faint'>
                        {post.date}
                    </Text>
                    {post.draft ? <Badge kind='warn'>{copy.draftLabel}</Badge> : null}
                    {post.tags.map((tag) => (
                        <Badge key={tag} kind='neutral' size='xs'>
                            {tag}
                        </Badge>
                    ))}
                </Row>
            }
            eyebrow={copy.eyebrow}
            lede={post.excerpt}
            title={post.title}
        >
            <Section space='md' width='narrow'>
                <Stack gap={7}>
                    <MarkdownBody blocks={post.blocks} />
                    <TextLink size='sm' to='/blog' tone='quiet'>
                        {copy.backCta}
                    </TextLink>
                </Stack>
            </Section>
        </Page>
    ) : (
        <NotFoundPage />
    )
}
