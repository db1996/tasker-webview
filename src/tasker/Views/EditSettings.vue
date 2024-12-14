<script setup lang="ts">
import { type PropType } from 'vue'
import type BaseActionType from '@/tasker/actionTypes/BaseActionType'
import type { SettingsFormComponent } from '../ComponentTypes/SettingsFormComponent'

const props = defineProps({
    modelValue: {
        type: Object as PropType<BaseActionType>,
        required: true,
    },
    editSettingsForm: {
        type: Object as PropType<SettingsFormComponent | null>,
    },
})
</script>
<template>
    <GroupElement name="settingsform">
        <TextElement
            name="label"
            label="Label"
            field-name="label"
            :default="props.modelValue?.action.label"
        />

        <component
            v-if="editSettingsForm"
            :is="editSettingsForm.component"
            v-bind="editSettingsForm.props"
        />
    </GroupElement>
</template>
