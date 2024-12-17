import { forEach } from 'lodash'
import Action from '@/tasker/types/Action'
import ActionArg from '@/tasker/types/ActionArg'
import ActionArgSpec from './ActionArgSpec'
import { ActionTypeSpec } from '@/tasker/enums/ActionTypeSpec'

export default class ActionSpec {
    public categoryCode: number = 0
    public code: number = 0
    public name: string = ''
    public canFail: boolean = false
    public isBoolean: boolean = false
    public isString: boolean = false
    public isInt: boolean = false
    public isMandatory: boolean = false
    public sortOrder: string = ''
    public spec: string = ''
    public args: Array<ActionArgSpec> = []

    constructor(data: ActionSpec) {
        this.categoryCode = data['categoryCode']
        this.code = data['code']
        this.name = data['name']
        this.canFail = data['canFail']
        this.isBoolean = data['isBoolean']
        this.isString = data['isString']
        this.isInt = data['isInt']
        this.isMandatory = data['isMandatory']
        this.sortOrder = data['sortOrder']
        this.spec = data['spec']
        forEach(data['args'], (arg) => {
            this.args.push(new ActionArgSpec(arg))
        })
    }

    createAction(): Action {
        const action = new Action()
        console.log('createAction', action)

        action.code = this.code
        action.name = this.name
        forEach(this.args, (argSpec) => {
            const arg = new ActionArg()
            arg.id = argSpec.id
            arg.name = argSpec.name
            switch (argSpec.type) {
                case ActionTypeSpec.STRING:
                    arg.value = ''
                    break
                case ActionTypeSpec.BOOLEAN:
                    arg.value = false
                    break
                case ActionTypeSpec.INT:
                    arg.value = 0
                    break
                default:
                    arg.value = ''
                    break
            }
            action.args.push(arg)
        })

        action.actionSpec = this

        return action
    }
}
