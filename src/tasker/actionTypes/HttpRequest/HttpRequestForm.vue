<script setup lang="ts">
import { computed, onMounted, ref, type PropType } from 'vue'
import type { Ref } from 'vue'
import type HttpRequestActionType from './HttpRequestActionType'
import { MethodType } from './helpers/MethodType'
import { forEach } from 'lodash'

const props = defineProps({
    modelValue: Object as PropType<HttpRequestActionType>,
})

const currentTab = ref(0)
const methodTypeOptions = computed(() => {
    const ret: Array<{ value: number; label: string }> = []
    forEach(MethodType, (value, key) => {
        if (!isNaN(parseInt(key))) ret.push({ value: parseInt(key), label: value.toString() })
    })

    return ret
})

function radioTabChanged(value: number) {
    currentTab.value = value
}

const formHeaders: Ref<{ value: Array<{ key: string; value: string }> } | null> = ref(null)
const formQueryParameters: Ref<{ value: Array<{ key: string; value: string }> } | null> = ref(null)
onMounted(() => {
    if (formHeaders.value !== null) {
        formHeaders.value.value = props.modelValue?.params.headers ?? []
    }
    if (formQueryParameters.value !== null) {
        formQueryParameters.value.value = props.modelValue?.params.query_parameters ?? []
    }
})
</script>
<template>
    <GroupElement name="method_url">
        <SelectElement
            name="method_type"
            label="Method"
            :items="methodTypeOptions"
            :default="modelValue?.params.method_type"
            :columns="{
                sm: 2,
            }"
        />
        <TextElement
            name="url"
            label="URL"
            :default="modelValue?.params.url"
            :columns="{
                sm: 10,
            }"
        />
    </GroupElement>
    <StaticElement name="margin">
        <hr />
    </StaticElement>
    <RadiogroupElement
        name="radioTabs"
        view="tabs"
        @change="radioTabChanged"
        :items="[
            {
                value: 0,
                label: 'Headers',
            },
            {
                value: 1,
                label: 'Params',
            },
            {
                value: 2,
                label: 'Body',
            },
            {
                value: 3,
                label: 'Settings',
            },
        ]"
        :default="currentTab"
    />
    <ListElement v-show="currentTab === 0" name="headers" ref="formHeaders">
        <template v-slot="{ index }">
            <ObjectElement :name="index">
                <TextElement
                    name="key"
                    :columns="{
                        container: 6,
                    }"
                    placeholder="Key"
                />
                <TextElement
                    name="value"
                    :columns="{
                        container: 6,
                    }"
                    placeholder="Value"
                />
            </ObjectElement>
        </template>
    </ListElement>
    <ListElement v-show="currentTab === 1" name="query_parameters" ref="formQueryParameters">
        <template v-slot="{ index }">
            <ObjectElement :name="index">
                <TextElement
                    name="key"
                    :columns="{
                        container: 6,
                    }"
                    placeholder="Key"
                />
                <TextElement
                    name="value"
                    :columns="{
                        container: 6,
                    }"
                    placeholder="Value"
                />
            </ObjectElement>
        </template>
    </ListElement>
    <TextareaElement
        name="body"
        v-show="currentTab === 2"
        :default="modelValue?.params.body"
        :rows="10"
    />
    <TextElement
        v-show="currentTab === 3"
        name="timeout"
        label="Timeout (s)"
        input-type="number"
        :default="modelValue?.params.timeout"
    />
    <ToggleElement
        v-show="currentTab === 3"
        name="trust_any_certificate"
        label="Trust any certificate"
        :default="modelValue?.params.trust_any_certificate"
    />
    <ToggleElement
        v-show="currentTab === 3"
        name="follow_redirects"
        label="Follow Redirects"
        :default="modelValue?.params.follow_redirects"
    />
    <ToggleElement
        v-show="currentTab === 3"
        name="use_cookies"
        label="Use Cookies"
        :default="modelValue?.params.use_cookies"
    />
    <ToggleElement
        v-show="currentTab === 3"
        name="structure_output"
        label="Structure Output (JSON)"
        :default="modelValue?.params.structure_output"
    />
</template>
