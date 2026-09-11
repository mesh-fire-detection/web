import { Component, type ReactNode } from 'react'

import { Heading } from '@components/shared/typography/Heading'
import { Text } from '@components/shared/typography/Text'
import { Button } from '@components/shared/widgets/Action'

type ErrorBoundaryProperties = {
    readonly children: ReactNode
    /** `landmark` renders the fallback as the page `main`; nested it must not. */
    readonly mode: 'landmark' | 'section'
}

type ErrorBoundaryState = {
    readonly hasError: boolean
}

const errorTitle = 'Something went wrong'
const errorBody = 'Reload the page or return home and try again.'
const reloadLabel = 'Reload'

export class ErrorBoundary extends Component<ErrorBoundaryProperties, ErrorBoundaryState> {
    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true }
    }

    private readonly reload = (): void => {
        window.location.reload()
    }

    override state: ErrorBoundaryState = { hasError: false }

    override render(): ReactNode {
        if (this.state.hasError) {
            const fallback = (
                <>
                    <Heading level={1} size='2xl'>
                        {errorTitle}
                    </Heading>
                    <Text tone='muted'>{errorBody}</Text>
                    <Button onClick={this.reload}>{reloadLabel}</Button>
                </>
            )

            if (this.props.mode === 'landmark') {
                return (
                    <main className='page' id='main' tabIndex={-1}>
                        {fallback}
                    </main>
                )
            }

            return <div className='page'>{fallback}</div>
        }
        return this.props.children
    }
}
