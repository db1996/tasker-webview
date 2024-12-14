import type { HaServiceField } from './HaServiceField'

export type ActualService = {
    id: string
    name?: string | undefined
    description?: string | undefined
    type?: string | undefined
    fields: HaServiceField[]
}
