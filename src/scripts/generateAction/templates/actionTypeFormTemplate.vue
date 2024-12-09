<script setup lang="ts">
import type { PropType } from 'vue'
import type {{TS_FILENAME}} from './{{TS_FILENAME}}'

const props = defineProps({
    modelValue: Object as PropType<{{TS_FILENAME}}>,
})
</script>
<template>
    <template v-for="(arg, index) in modelValue?.action.args" :key="index">
        <!-- This will generate default elements for all arguments -->
        <TextElement
            v-if="typeof arg.value === 'string'"
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
