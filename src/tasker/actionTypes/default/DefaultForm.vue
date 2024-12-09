<script setup lang="ts">
import type { PropType } from 'vue'
import type DefaultActionType from './DefaultActionType'

defineProps({
    modelValue: Object as PropType<DefaultActionType>,
})
</script>
<template>
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
</template>
