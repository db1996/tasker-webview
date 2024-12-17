import type ActionArg from './ActionArg'
import ActionBlockProperty from './ActionBlockProperty'
import type ActionCondition from './ActionCondition'
import ActionSpec from './specs/ActionSpec'

export default class Action {
    public code: number = 0
    public name: string = ''
    public blockProperties: ActionBlockProperty = new ActionBlockProperty()
    public args: Array<ActionArg> = []
    public condition: Array<ActionCondition> = []
    public label: string = ''
    public continueTaskOnError: boolean = false

    public index: number = 0
    public actionSpec: ActionSpec | null = null
}
