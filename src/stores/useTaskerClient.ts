import { ref } from 'vue'
import { defineStore } from 'pinia'
import TaskerClient from '@/tasker/TaskerClient'

export const useTaskerClient = defineStore('taskerClient', () => {
    const taskerClient = ref<TaskerClient>(new TaskerClient())

    function pingTasker() {
        taskerClient.value.pingTasker()
    }

    return { taskerClient, pingTasker }
})
