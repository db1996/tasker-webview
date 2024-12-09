import { defineStore } from 'pinia'

const useNavTabStore = defineStore('navTab', {
    state: () => ({
        preserveState: false,
        tabName: '',
        tab: '',
    }),
})

export default useNavTabStore
