import type BaseActionType from '../actionTypes/BaseActionType'
import type BasePlugin from '../types/BasePlugin'

export interface IPluginConstructor {
    new (actionType: BaseActionType): BasePlugin
}
