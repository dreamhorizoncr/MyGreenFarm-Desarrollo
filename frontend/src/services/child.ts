import { apiClient } from "./api.ts";

export interface ChildOption {
    studentId: string;
    childName: string;
    fullName: string;
}

export const childService = {
    // Obtiene las opciones de niños (studentId + nombre) para selectors/dropdowns
    async getChildrenOptions(): Promise<ChildOption[]> {
        const response = await apiClient.get<ChildOption[]>("/child/options");
        return response.data;
    },
};