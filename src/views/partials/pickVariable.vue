<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import BsModal from '@/components/BsModal.vue'
import MdiIcon from '@/components/MdiIcon.vue'
import { useTaskerClient } from '@/stores/useTaskerClient'
import type { Variable } from '@/tasker/types/Variable'
import { computed, onMounted, ref, watch } from 'vue'

defineEmits(['close'])
const taskerClient = useTaskerClient().taskerClient
const variables = ref<Array<Variable>>([])
const searchStr = ref('')
const searchInp = ref<HTMLInputElement | null>(null)
const clicked = ref('')

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
})

watch(
    () => props.show,
    async (show) => {
        if (show) {
            variables.value = (await taskerClient.getVariables()) ?? []
        } else {
            variables.value = []
        }
    },
)

onMounted(async () => {
    variables.value = (await taskerClient.getVariables()) ?? []
})

const variableCards = computed(() => {
    const cards: Array<{ title: string; variable: string; description: string; clicked: boolean }> =
        []
    variables.value.forEach((variable) => {
        let title = ''
        let variableName = ''
        let description = ''

        if (variable.f !== undefined) {
            title = variable.f + ': ('
        }
        if (variable.b !== undefined) {
            title += variable.b
        }
        if (variable.f !== undefined) {
            title += ')'
        }

        variableName = variable.a ?? ''

        if (variable.c !== undefined) {
            description = variable.c
        }
        const isClicked = clicked.value === variableName

        if (searchStr.value !== '') {
            if (
                title.toLowerCase().includes(searchStr.value.toLowerCase()) ||
                variableName.toLowerCase().includes(searchStr.value.toLowerCase()) ||
                description.toLowerCase().includes(searchStr.value.toLowerCase())
            ) {
                cards.push({
                    title: title,
                    variable: variableName,
                    description: description,
                    clicked: isClicked,
                })
            }
        } else {
            cards.push({
                title: title,
                variable: variableName,
                description: description,
                clicked: isClicked,
            })
        }
    })

    return cards
})

function reset() {
    searchStr.value = ''
    if (searchInp.value) {
        searchInp.value.value = ''
    }
}

function click(variable: string) {
    // copy to clipboard
    clicked.value = variable
    navigator.clipboard.writeText(variable)

    setTimeout(() => {
        clicked.value = ''
    }, 500)
}
</script>
<template>
    <BsModal :show="show" :width-class="'lg'" @close="$emit('close')">
        <template #title>
            <h5>Click a variable to copy it to your clipboard</h5>
        </template>
        <template #content>
            <div class="row">
                <div class="col-11">
                    <div class="input-group mb-3">
                        <input
                            ref="searchInp"
                            type="text"
                            class="form-control"
                            name="search"
                            @input="searchStr = ($event.target as HTMLInputElement).value"
                        />
                        <span class="input-group-text" id="basic-addon1">
                            <MdiIcon icon="magnify" />
                        </span>
                    </div>
                </div>
                <div class="col-1">
                    <BaseButton
                        @click="reset"
                        :btn-class="'btn-secondary'"
                        icon-left="close"
                        v-tooltip
                        data-title="Empty search"
                    />
                </div>
            </div>
            <ul class="list-group">
                <li
                    class="list-group-item hover-active"
                    v-for="(value, key) in variableCards"
                    :class="value.clicked ? 'bg-success' : ''"
                    :key="key"
                    @click="click(value.variable)"
                >
                    <div class="row">
                        <div class="col-10">
                            <div class="fw-bold">{{ value.title }}</div>
                            <div class="fw-bold">{{ value.variable }}</div>
                        </div>
                        <div class="col-2 d-flex justify-content-end" v-if="value.clicked">
                            <MdiIcon icon="clipboard-check-outline" /> &nbsp; Copied
                        </div>
                        <div class="col-12">
                            {{ value.description }}
                        </div>
                    </div>
                </li>
            </ul>
        </template>
    </BsModal>
</template>
