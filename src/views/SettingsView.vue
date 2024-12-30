<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import { taskerStoreError } from '@/tasker/enums/taskerStoreError'
import { computed, onMounted, ref } from 'vue'
import MdiIcon from '@/components/MdiIcon.vue'
import HomeAssistantPlugin from '@/tasker/plugins/HomeAssistant/HomeAssistantPlugin'
import { useTaskerClient } from '@/stores/useTaskerClient'

const settingForm = ref()

const homeAssistantClient = ref(HomeAssistantPlugin.client)
const taskerClient = useTaskerClient().taskerClient

onMounted(async () => {
    await homeAssistantClient.value.ping()

    settingForm.value?.update({
        tasker_url: taskerClient.url,
        homeassistant_url: homeAssistantClient.value.baseUrl,
        homeassistant_token: homeAssistantClient.value.accessToken,
    })
})

const taskerStatus = computed(() => {
    let ret = {
        text: 'Loading..',
        text_class: '',
        icon: 'clock',
        spin: false,
    }

    if (taskerClient.error === taskerStoreError.OK && taskerClient.ping) {
        ret = {
            text: taskerClient.error,
            text_class: 'text-success',
            icon: 'check-circle',
            spin: false,
        }
    }
    if (
        taskerClient.error === taskerStoreError.NO_CONNECT ||
        taskerClient.error === taskerStoreError.NO_URL
    ) {
        ret = {
            text: taskerClient.error,
            text_class: 'text-danger',
            icon: 'alert',
            spin: false,
        }
    }

    if (taskerClient.isRunning) {
        ret.icon = 'loading'
        ret.spin = true
    }

    return ret
})

const homeAssistantStatus = computed(() => {
    let ret = {
        text: 'Loading..',
        text_class: '',
        icon: 'clock',
    }

    if (homeAssistantClient.value.pingStatus) {
        ret = {
            text: 'Successfully connected to Home Assistant',
            text_class: 'text-success',
            icon: 'check-circle',
        }
    } else {
        if (homeAssistantClient.value.error.length === 0) {
            ret = {
                text: 'Waiting for input',
                text_class: '',
                icon: 'clock',
            }
        }
        ret = {
            text: homeAssistantClient.value.error,
            text_class: 'text-danger',
            icon: 'alert',
        }
    }

    if (homeAssistantClient.value.isRunning) {
        ret.icon = 'loading'
    }

    return ret
})
</script>

<template>
    <MainLayout title="Settings">
        <template #default>
            <Vueform ref="settingForm" validate-on="change" :display-errors="false">
                <StaticElement name="static">
                    <div class="row">
                        <div class="col d-flex">
                            <h4>Tasker</h4>
                        </div>
                        <div class="col-8 d-flex justify-content-end align-items-center">
                            <p class="mb-0 me-2" :class="taskerStatus.text_class">
                                {{ taskerStatus.text }}
                            </p>
                            <MdiIcon :icon="taskerStatus.icon" :spin="taskerStatus.spin" />
                        </div>
                    </div>
                </StaticElement>
                <TextElement
                    readonly
                    name="tasker_url"
                    label="Your URL for tasker WebUI"
                    field-name="URL"
                />
                <StaticElement name="static">
                    <div class="row">
                        <div class="col d-flex">
                            <h4>Home Assistant</h4>
                        </div>
                        <div class="col-8 d-flex justify-content-end align-items-center">
                            <p class="mb-0 me-2" :class="homeAssistantStatus.text_class">
                                {{ homeAssistantStatus.text }}
                            </p>
                            <MdiIcon :icon="homeAssistantStatus.icon" />
                        </div>
                    </div>
                </StaticElement>
                <TextElement
                    readonly
                    name="homeassistant_url"
                    label="Your home assistant url"
                    placeholder="ex: http://homeassistant.local:8123"
                    field-name="URL"
                />
                <TextareaElement
                    readonly
                    name="homeassistant_token"
                    label="Your home assistant access token"
                    field-name="token"
                />
            </Vueform>
        </template>
    </MainLayout>
</template>
