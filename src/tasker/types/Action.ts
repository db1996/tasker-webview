import type ActionArg from './ActionArg'
import ActionBlockProperty from './ActionBlockProperty'
import type ActionCondition from './ActionCondition'

export default class Action {
    public code: number = 0
    public name: string = ''
    public blockProperties: ActionBlockProperty = new ActionBlockProperty()
    public args: Array<ActionArg> = []
    public condition: Array<ActionCondition> = []
    public label: string = ''

    public index: number = 0
}
