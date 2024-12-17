import type { ActionTypeSpec } from '@/tasker/enums/ActionTypeSpec'

export type ActionArgSpec = {
    id: number
    name: string
    type: ActionTypeSpec
}
