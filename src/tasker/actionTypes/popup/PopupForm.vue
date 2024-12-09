<script setup lang="ts">
import { type PropType } from 'vue'
import type PopupActionType from './PopupActionType'

defineProps({
    modelValue: Object as PropType<PopupActionType>,
})
</script>
<template>
    <TextElement
        name="message"
        label="Message"
        field-name="message"
        :default="modelValue?.message"
    />
</template>
