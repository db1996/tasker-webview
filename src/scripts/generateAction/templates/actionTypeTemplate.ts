import {{VUE_FILENAME}} from './{{VUE_FILENAME}}.vue'
import { markRaw } from 'vue'
import BaseActionType from '@/tasker/types/BaseActionType'
import type { ActiontypeFormComponent } from '@/tasker/types/FormComponentEntry'
import type Action from '@/tasker/types/Action'

export default class {{TS_FILENAME}} extends BaseActionType {
    // base tasker configuration
    tasker_code: number = {{TASKER_CODE}}
    tasker_name: string = '{{TASKER_NAME}}'

    // front-end configuration
    modal_width: string = '{{ACTIONTYPE_MODAL_WIDTH}}'
    show_args: boolean = {{ACTIONTYPE_SHOW_ARGS}}

    constructor(action: Action) {
        super(action)
        // Use the action to populate any default values you might need
    }

    canHandle(): boolean {
        // this is the default, if you don't plan on changing this you can remove this
        return this.action.code === this.tasker_code && this.action.name === this.tasker_name
    }

    getFormComponent(): Promise<FormComponentEntry> {
        return Promise.resolve(this.buildFormComponentEntry(markRaw({{VUE_FILENAME}})))
    }

    submitForm(values: object): boolean {
        // when your form is submitted, you can do any validation here, and return false if it fails
        console.log('submitForm', values)
        return true
    }

    setArgs(): void {
        // if you use any internal names for your arguments, you can set back to the action here. This is called before saving the action
    }
}
