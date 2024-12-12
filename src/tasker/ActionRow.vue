<script setup lang="ts">
import MdiIcon from '@/components/MdiIcon.vue'
import { computed, ref, type PropType } from 'vue'
import { forEach } from 'lodash'
import type BaseActionType from './actionTypes/BaseActionType'
import BaseButton from '@/components/BaseButton.vue'
import { ActionTypeSupportedType } from './enums/ActionTypeSupportedType'
import TaskerClient from './TaskerClient';

const emit = defineEmits(['editAction', 'editPlugin', 'deleteAction', 'saveLabel'])
const props = defineProps({
    modelValue: {
        type: Object as PropType<BaseActionType>,
        required: true,
    },
})

const toggled = ref(false)

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

const editType = computed(() => {
    if (props.modelValue.supported_plugins.length > 0) {
        return {
            type: 'plugin',
            btnClass: 'btn-success',
            tooltip: 'Edit through plugin: ' + props.modelValue.supported_plugins[0].name,
            icon: props.modelValue.supported_plugins[0].icon,
        }
    }
    switch (props.modelValue.supportedType) {
        case ActionTypeSupportedType.DEFAULT:
            return {
                type: 'default',
                btnClass: 'btn-secondary',
                tooltip: 'No custom form yet, edit the arguments directly',
                icon: 'pencil',
            }

        default:
            return {
                type: 'custom',
                btnClass: 'btn-primary',
                tooltip: 'Custom form available, more customized editing',
                icon: 'pencil',
            }
    }
})

function mainEditClick() {
    if (editType.value.type === 'plugin') {
        emit('editPlugin', props.modelValue.supported_plugins[0])
    } else {
        emit('editAction', props.modelValue)
    }
}

const editLabel = ref(false)

const labelBg = computed(() => {
    console.log(props.modelValue.action.label !== undefined);

    if (props.modelValue.action.label !== undefined) {
        return 'bg-primary'
    }
    return 'bg-secondary'
})

function saveLabel() {
    const label = document.querySelector('.input-group input') as HTMLInputElement
    emit('saveLabel', label.value)
    editLabel.value = false
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
                        <h5 class="mb-1 me-2" style="text-wrap: nowrap;">
                            {{ modelValue.name !== '' ? modelValue.name : modelValue.tasker_name }}
                        </h5>

                        <div v-if="!editLabel" @click="editLabel = true" class="cursor-pointer badge" :class="labelBg">{{ modelValue.action.label ?? 'No label' }} <MdiIcon icon="pencil" /></div>

                        <div class="input-group">
                            <input v-if="editLabel" type="text" class="form-control" :value="modelValue.action.label !== undefined ? modelValue.action.label : ''">
                            <BaseButton btn-class="btn-outline-primary" v-if="editLabel" icon-left="content-save" @click="saveLabel"/>
                        </div>
                    </div>
                    <div>
                        <BaseButton
                            sm
                            v-tooltip
                            :data-title="editType.tooltip"
                            :btn-class="editType.btnClass"
                            :icon-left="editType.icon"
                            class="me-2"
                            @click="mainEditClick"
                        />
                        <BaseButton
                            @click="$emit('deleteAction')"
                            sm
                            v-tooltip
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
