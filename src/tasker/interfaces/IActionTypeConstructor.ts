import type Action from '../types/Action'
import type BaseActionType from '../actionTypes/BaseActionType'

export interface IActionTypeConstructor {
    new (action: Action): BaseActionType
}
