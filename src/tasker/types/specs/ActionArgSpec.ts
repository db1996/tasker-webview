import { ActionTypeSpec } from '@/tasker/enums/ActionTypeSpec'

export default class ActionArgSpec {
    public id: number = 0
    public name: string = ''
    public type: ActionTypeSpec = ActionTypeSpec.STRING

    constructor(data: ActionArgSpec) {
        this.id = data['id']
        this.name = data['name']
        this.type = data['type']
    }
}
