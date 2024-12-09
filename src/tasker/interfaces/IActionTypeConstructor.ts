import type Action from '../types/Action'
import type BaseActionType from '../types/BaseActionType'

export interface IActionTypeConstructor {
    new (action: Action): BaseActionType
}
