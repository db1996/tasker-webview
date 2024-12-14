import type { HaServiceFieldType } from '../enums/HaServiceFieldType'

export type HaServiceField = {
    id: string
    name?: string | undefined
    type?: HaServiceFieldType | undefined
    min?: number | undefined
    max?: number | undefined
    unit_of_measurement?: string | undefined
    example?: string | undefined
    required?: boolean | undefined
    options?: { label: string; value: string }[] | undefined
    entity_domain?: string | undefined
    attribute_filters?: Record<string, string[]> | undefined
    description?: string | undefined
}
