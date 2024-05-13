import { type Metadata } from 'next'

import { Container } from '@/components/Container'

export const metadata: Metadata = {
    title: 'Experience',
    description: 'My experience and education.',
}

export default function Experience() {
    return (
        <Container className="mt-10">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">
                My experience and education
            </h1>


        </Container>
    )
}
