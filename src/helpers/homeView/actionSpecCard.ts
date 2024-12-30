export default class actionSpecCard {
    public type: string = 'action' // can be 'action', 'plugin or 'filter
    public filter: string = ''
    public categoryCode: number = 0
    public code: number = 0
    public plugin: string | null = null
    public name: string = ''
    public bgColor: string = ''
    public icon: string = 'help'
}
