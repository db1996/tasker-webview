import type BaseActionType from '../actionTypes/BaseActionType'
import type BasePlugin from '../plugins/BasePlugin'

export interface IPluginBasicProperties {
    name: string
    nameStatic: string
    createNewAction(BaseActionType: BaseActionType): BasePlugin
}
