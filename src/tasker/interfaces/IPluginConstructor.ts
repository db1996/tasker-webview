import type BaseActionType from '../actionTypes/BaseActionType'
import type BasePlugin from '../plugins/BasePlugin'

export interface IPluginConstructor {
    new (actionType: BaseActionType): BasePlugin
}
