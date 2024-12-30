import type BaseActionType from '../actionTypes/BaseActionType'
import type BasePlugin from '../plugins/BasePlugin'
import type { IPluginBasicProperties } from './IPluginBasicProperties'

export interface IPluginConstructor extends IPluginBasicProperties {
    new (actionType: BaseActionType): BasePlugin
}
