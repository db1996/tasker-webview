<script setup lang="ts">
import type { PropType } from 'vue'
import BaseActionType from '../BaseActionType'

defineProps({
    modelValue: Object as PropType<BaseActionType>,
})
</script>
<template>
    <GroupElement name="defaultForm">
        <template v-for="(arg, index) in modelValue?.action.args" :key="index">
            <TextElement
                v-if="typeof arg.value === 'string'"
                :name="arg.name"
                :label="arg.name"
                :field-name="arg.name"
                :default="arg.value"
            />
            <TextElement
                v-if="typeof arg.value === 'number'"
                input-type="number"
                :name="arg.name"
                :label="arg.name"
                :field-name="arg.name"
                :default="arg.value"
            />
            <ToggleElement
                v-else-if="typeof arg.value === 'boolean'"
                :name="arg.name"
                :label="arg.name"
                :field-name="arg.name"
                :default="arg.value"
            />
        </template>
    </GroupElement>
</template>
