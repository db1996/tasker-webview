import type { ActionArgSpec } from './ActionArgSpec'

export type ActionSpec = {
    categoryCode: number
    code: number
    name: string
    canFail: boolean
    args: Array<ActionArgSpec>
}
