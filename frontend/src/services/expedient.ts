import { apiClient } from "./api.ts";
import { sanitizeFileName } from "../utils/sanitizeFileName.ts";

import type { Expedient, ExpedientRequest } from "../types/expedient.ts";

export const expedientService = {
  //Obtiene todos los expedientes.
  async getExpedients(): Promise<Expedient[]> {
    const response = await apiClient.get<Expedient[]>("/expedients");
    return response.data;
  },

  //Obtiene un expediente por su ID
  async getById(id: string): Promise<Expedient> {
    const response = await apiClient.get<Expedient>(`/expedients/${id}`);
    return response.data;
  },

  //Crea un nuevo expediente
  async create(data: ExpedientRequest, file?: File): Promise<Expedient> {
    const formData = new FormData();
    //El backend espera los datos del expediente como JSON
    formData.append("data", JSON.stringify(data));

    if (file) {
      const sanitizedFile = new File([file], sanitizeFileName(file.name), {
        type: file.type,
      });
      formData.append("file", sanitizedFile);
    }

    const response = await apiClient.post<Expedient>("/expedients", formData, {
      headers: { "Content-Type": undefined },
    });

    return response.data;
  },

  // Actualiza un expediente
  async update(
    id: string,
    data: ExpedientRequest,
    file?: File,
  ): Promise<Expedient> {
    const formData = new FormData();

    // El backend espera los datos del expediente como JSON
    formData.append("data", JSON.stringify(data));

    // Agrega una nueva fotografía si fue seleccionada
    if (file) {
      const sanitizedFile = new File([file], sanitizeFileName(file.name), {
        type: file.type,
      });

      formData.append("file", sanitizedFile);
    }

    const response = await apiClient.put<Expedient>(
      `/expedients/${id}`,
      formData,
      {
        headers: { "Content-Type": undefined },
      },
    );

    return response.data;
  },

  //Elimina la fotografía del expediente
  async deletePhoto(id: string): Promise<void> {
    await apiClient.delete(`/expedients/${id}/photo`);
  },

  //Elimina el expediente
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/expedients/${id}`);
  },
};
