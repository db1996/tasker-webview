import type Action from '../types/Action'
import type { IActionTypeConstructor } from '../interfaces/IActionTypeConstructor'
import BaseActionType from '../types/BaseActionType'
import type { IPluginConstructor } from '../interfaces/IPluginConstructor'
import type BasePlugin from '../types/BasePlugin'
import { forEach } from 'lodash'

export class ActionTypeManager {
    private types: IActionTypeConstructor[] = []
    private pluginTypes: IPluginConstructor[] = []

    async loadForms() {
        const formModules = [
            import('./../actionTypes/popup/PopupActionType'),

            import('./../actionTypes/HttpRequest/HttpRequestActionType'),
            // {{ADDIMPORT}}
            import('./../actionTypes/default/DefaultActionType'),
        ]

        const loadedForms = await Promise.all(formModules)

        // Store constructors in `types`
        this.types = loadedForms.map((m) => m.default as IActionTypeConstructor)
    }

    async loadPlugins() {
        const pluginModules = [import('./../plugins/HomeAssistant/HomeAssistantPlugin')]

        const loadedPlugins = await Promise.all(pluginModules)

        // Store constructors in `types`
        this.pluginTypes = this.pluginTypes.concat(
            loadedPlugins.map((m) => m.default as IPluginConstructor),
        )
    }

    getFormForAction(action: Action): BaseActionType | null {
        const typeClass = this.types.find((TypeClass) => new TypeClass(action).canHandle())

        const type = typeClass ? new typeClass(action) : null
        if (type) {
            type.supported_plugins = this.getPluginsForAction(type)
        }

        return type
    }

    getPluginsForAction(actionType: BaseActionType): Array<BasePlugin> {
        const ret: BasePlugin[] = []
        let nr = 0
        forEach(this.pluginTypes, (TypeClass) => {
            const newType = new TypeClass(actionType)

            if (newType.canHandle()) {
                newType.index = nr
                ret.push(newType)
                nr++
            }
        })

        return ret
    }
}