<script setup lang="ts">
import type { PropType } from 'vue'
import type HttpRequestActionType from '../HttpRequestActionType'

defineProps({
    HttpActionType: {
        type: Object as PropType<HttpRequestActionType>,
        required: false,
    },
})
</script>
<template>
    <GroupElement name="settingsForm" v-if="HttpActionType">
        <TextElement
            name="timeout"
            label="Timeout (s)"
            input-type="number"
            :default="HttpActionType.params.timeout"
        />
        <ToggleElement
            name="trust_any_certificate"
            label="Trust any certificate"
            :default="HttpActionType.params.trust_any_certificate"
        />
        <ToggleElement
            name="follow_redirects"
            label="Follow Redirects"
            :default="HttpActionType.params.follow_redirects"
        />
        <ToggleElement
            name="use_cookies"
            label="Use Cookies"
            :default="HttpActionType.params.use_cookies"
        />
        <ToggleElement
            name="structure_output"
            label="Structure Output (JSON)"
            :default="HttpActionType.params.structure_output"
        />
    </GroupElement>
</template>
