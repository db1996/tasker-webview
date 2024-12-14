<script setup lang="ts">
import type { PropType } from 'vue'
import type HttpRequestActionType from '../HttpRequestActionType'

defineProps({
    modelValue: {
        type: Object as PropType<HttpRequestActionType>,
    },
})
</script>
<template>
    <GroupElement name="settingsForm">
        <TextElement
            name="timeout"
            label="Timeout (s)"
            input-type="number"
            :default="modelValue?.params.timeout"
        />
        <ToggleElement
            name="trust_any_certificate"
            label="Trust any certificate"
            :default="modelValue?.params.trust_any_certificate"
        />
        <ToggleElement
            name="follow_redirects"
            label="Follow Redirects"
            :default="modelValue?.params.follow_redirects"
        />
        <ToggleElement
            name="use_cookies"
            label="Use Cookies"
            :default="modelValue?.params.use_cookies"
        />
        <ToggleElement
            name="structure_output"
            label="Structure Output (JSON)"
            :default="modelValue?.params.structure_output"
        />
    </GroupElement>
</template>
