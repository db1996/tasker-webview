import type BaseActionType from '../types/BaseActionType'
import type BasePlugin from '../types/BasePlugin'

export interface IPluginConstructor {
    new (actionType: BaseActionType): BasePlugin
}
