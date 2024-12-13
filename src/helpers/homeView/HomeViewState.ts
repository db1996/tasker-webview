import type BaseActionType from '@/tasker/actionTypes/BaseActionType'
import { EditStatusEnum } from './EditStatusEnum'

export default class HomeViewState {
    public isBooting: boolean = false
    public isRefreshing: boolean = false
    public actionTypeRows: BaseActionType[] = []

    private _editStatus: EditStatusEnum = EditStatusEnum.None
    // a boolean prop with a setter function
    public set editStatus(value: EditStatusEnum) {
        this._editStatus = value
        if (value === EditStatusEnum.None) {
            this.actionTypeRows = []
        }
    }

    public get editStatus(): EditStatusEnum {
        return this._editStatus
    }
}
