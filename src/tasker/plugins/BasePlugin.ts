import BaseActionType from '@/tasker/actionTypes/BaseActionType'
import type { PluginFormComponent } from '@/tasker/ComponentTypes/PluginFormComponent'
import type { IPluginBasicProperties } from '../interfaces/IPluginBasicProperties'

export default class BasePlugin implements IPluginBasicProperties {
    actionType: BaseActionType

    name: string = ''
    icon: string = 'connection'
    index: number = 0
    nameStatic: string = ''
    content_height: string = '500px'

    constructor(actionType: BaseActionType) {
        this.actionType = actionType
        this.nameStatic = this.name
    }

    createNewAction(BaseActionType: BaseActionType): BasePlugin {
        console.log('createNewAction', BaseActionType)
        throw new Error('Method not implemented.')
    }

    // If the action is supported by this type. By default it is false so you need to override this and implement logic to recognize an action for this plugin. You can do this by checking the actionType, the actionType.action is the raw tasker action you can check
    canHandle(): boolean {
        return false
    }

    // return a promise with the form component vue file
    getFormComponent(): Promise<PluginFormComponent> {
        throw new Error('Not implemented getFormComponent')
    }

    // return a promise with the row component vue file. This is shown in the action list, the row component will be placed under the title and edit button(s)
    getRowComponent(): Promise<PluginFormComponent> {
        throw new Error('Not implemented getRowComponent')
    }

    buildFormComponentEntry(markRawComponent: unknown): PluginFormComponent {
        return {
            component: markRawComponent,
            props: { modelValue: this },
        }
    }

    // Will be called when the form in the modal is submitted
    submitForm(values: object): boolean {
        console.log('submitForm', values)
        throw new Error('Not implemented submitForm')
    }

    // Will be called before saving the action, set all the args on this.actiontype.args here
    setArgs() {}
}
