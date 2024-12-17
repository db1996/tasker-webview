<script setup lang="ts">
import MdiIcon from '@/components/MdiIcon.vue'
import { computed, ref, type PropType } from 'vue'
import { forEach } from 'lodash'
import type BaseActionType from '@/tasker/actionTypes/BaseActionType'
import BaseButton from '@/components/BaseButton.vue'
import { ActionTypeSupportedType } from '@/tasker/enums/ActionTypeSupportedType'
import { useTaskerClient } from '@/stores/useTaskerClient'
import { type EditButton } from '../types/EditButton'
import DropdownButton from '@/components/DropdownButton.vue'

const taskerClient = useTaskerClient().taskerClient

const emit = defineEmits(['editAction', 'editPlugin', 'refresh'])

const props = defineProps({
    modelValue: {
        type: Object as PropType<BaseActionType>,
        required: true,
    },
})

const toggled = ref(false)
const editLabel = ref(false)

function toggleExpand() {
    if (toggled.value) {
        toggled.value = false
    } else {
        toggled.value = true
    }
}

const argsList = computed(() => {
    const strstr: string[][] = []

    if (!props.modelValue.show_args) {
        return strstr
    }

    forEach(props.modelValue.action.args, (value) => {
        strstr.push([value.name, value.value.toString()])
    })
    return strstr
})

const labelBg = computed(() => {
    if (props.modelValue.action.label !== undefined) {
        return 'bg-primary'
    }
    return 'bg-secondary'
})

const editTypes = computed(() => {
    const ret = {
        main: {
            type: 'custom',
            btnClass: 'btn-primary',
            tooltip: 'Custom action form - no plugin',
            icon: 'pencil',
            plugin: null,
        } as EditButton,
        dropdown: Array<EditButton>(),
    }

    let noPluginMain = {
        type: 'custom',
        btnClass: 'btn-primary',
        tooltip: 'Custom action form - no plugin',
        icon: 'pencil',
        plugin: null,
    } as EditButton

    if (props.modelValue.supportedType === ActionTypeSupportedType.DEFAULT) {
        noPluginMain = {
            type: 'default',
            btnClass: 'btn-secondary',
            tooltip: 'No custom form yet, edit the arguments directly',
            icon: 'pencil',
            plugin: null,
        }
    }

    if (props.modelValue.supported_plugins.length > 0) {
        ret.main = {
            type: 'plugin',
            btnClass: 'btn-success',
            tooltip: 'Edit through plugin: ' + props.modelValue.supported_plugins[0].name,
            icon: props.modelValue.supported_plugins[0].icon,
            plugin: props.modelValue.supported_plugins[0].index,
        }

        ret.dropdown.push(noPluginMain)

        forEach(props.modelValue.supported_plugins, (value, index) => {
            if (index === 0) {
                return
            }
            ret.dropdown.push({
                type: 'plugin',
                btnClass: 'btn-success',
                tooltip: 'Edit through plugin: ' + value.name,
                icon: value.icon,
                plugin: value.index,
            })
        })
    } else {
        ret.main = noPluginMain
    }

    return ret
})

function editClick(plugin: number | null = null) {
    if (plugin !== null) {
        emit('editPlugin', plugin)
        return
    }

    emit('editAction')
}

async function saveLabel() {
    const label = document.querySelector('.input-group input') as HTMLInputElement
    await taskerClient.saveLabel(props.modelValue.index, label.value)
    editLabel.value = false
    emit('refresh')
}

async function deleteAction() {
    await taskerClient.deleteAction(props.modelValue.index)
    emit('refresh')
}
</script>
<template>
    <span class="list-group-item action-row mb-3">
        <div class="action-row-reorder">
            <MdiIcon :icon="'menu'" />
        </div>
        <div class="d-flex">
            <div class="action-row-dragcontent"></div>
            <div class="flex-grow-1 action-row-maincontent">
                <div class="d-flex justify-content-between">
                    <div class="d-flex align-items-center">
                        <h5 class="mb-1 me-2" style="text-wrap: nowrap">
                            {{ modelValue.name !== '' ? modelValue.name : modelValue.tasker_name }}
                        </h5>

                        <div
                            v-if="!editLabel"
                            @click="editLabel = true"
                            class="cursor-pointer badge"
                            :class="labelBg"
                        >
                            {{ modelValue.action.label ?? 'No label' }} <MdiIcon icon="pencil" />
                        </div>

                        <div class="input-group">
                            <input
                                v-if="editLabel"
                                type="text"
                                class="form-control"
                                @keyup.enter="saveLabel"
                                :value="
                                    modelValue.action.label !== undefined
                                        ? modelValue.action.label
                                        : ''
                                "
                            />
                            <BaseButton
                                btn-class="btn-outline-primary"
                                v-if="editLabel"
                                icon-left="content-save"
                                :checkrunning="true"
                                @click="saveLabel"
                            />
                        </div>
                    </div>
                    <div>
                        <div class="btn-group me-2" v-if="editTypes.dropdown.length > 0">
                            <BaseButton
                                sm
                                v-tooltip
                                :data-title="editTypes.main.tooltip"
                                :btn-class="editTypes.main.btnClass"
                                :icon-left="editTypes.main.icon"
                                :checkrunning="true"
                                @click="editClick(editTypes.main.plugin)"
                            />
                            <button
                                type="button"
                                class="btn btn-success dropdown-toggle dropdown-toggle-split btn-sm"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <span class="visually-hidden">Toggle Dropdown</span>
                            </button>
                            <ul class="dropdown-menu">
                                <DropdownButton
                                    v-for="editTypes in editTypes.dropdown"
                                    :key="
                                        editTypes.plugin !== null
                                            ? editTypes.plugin + '-edit'
                                            : 'default-edit'
                                    "
                                    @click="editClick(editTypes.plugin)"
                                    :icon="editTypes.icon"
                                    :txt="editTypes.tooltip"
                                />
                            </ul>
                        </div>
                        <BaseButton
                            v-else
                            sm
                            v-tooltip
                            :data-title="editTypes.main.tooltip"
                            :btn-class="editTypes.main.btnClass"
                            :icon-left="editTypes.main.icon"
                            :checkrunning="true"
                            class="me-2"
                            @click="editClick()"
                        />
                        <BaseButton
                            @click="deleteAction"
                            sm
                            v-tooltip
                            :checkrunning="true"
                            data-title="Delete action"
                            btn-class="btn-outline-danger"
                            icon-left="trash-can"
                        />
                    </div>
                </div>
                <small v-html="modelValue.description"></small>
                <div class="table-responsive">
                    <table class="table" v-if="argsList.length > 0">
                        <thead>
                            <tr>
                                <th scope="col" style="min-width: 175px; max-width: 175px"></th>
                                <th scope="col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="3">Arguments</td>
                            </tr>
                            <tr
                                v-for="(value, key) in argsList"
                                :key="value[0]"
                                v-show="key < 3 || toggled"
                            >
                                <th scope="row">{{ value[0] }}</th>
                                <td>{{ value[1] }}</td>
                            </tr>
                            <tr v-if="argsList.length > 3">
                                <td colspan="3" class="row-hover fs-6" @click="toggleExpand">
                                    <div class="w-100">
                                        <span btn-class="btn-outline-primary">
                                            <MdiIcon
                                                :icon="
                                                    'arrow-collapse-' + (toggled ? 'up' : 'down')
                                                "
                                            />
                                            {{ toggled ? 'Show less' : 'Show more' }}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </span>
</template>
