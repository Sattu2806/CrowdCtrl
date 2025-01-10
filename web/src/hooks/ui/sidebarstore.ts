import {create} from "zustand"

interface SideBarStore {
    isOpen: boolean
    close:() => void
    open:() => void
}

export const useSideBarStore = create<SideBarStore>((set) => (
    {
        isOpen: false,
        close: () => set({isOpen: false}),
        open: () => set({isOpen: true})
    }
))