import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getUploadDonorPhotoUrl, 
  getUploadBeneficiaryPhotoUrl, 
  getUploadTimeMachinePhotosUrl,
  getListDonorsQueryKey,
  getListBeneficiariesQueryKey,
  getListTimeMachineEntriesQueryKey,
  getGetDonorQueryKey,
  getGetBeneficiaryQueryKey,
  getGetTimeMachineEntryQueryKey
} from "@workspace/api-client-react";

// ============================================
// CUSTOM HOOKS FOR MULTIPART UPLOADS
// We use native fetch to properly handle FormData without JSON serialization issues
// ============================================

export function useUploadDonorPhotoNative() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch(getUploadDonorPhotoUrl(id), {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload photo");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: getListDonorsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDonorQueryKey(id) });
    },
  });
}

export function useUploadBeneficiaryPhotoNative() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch(getUploadBeneficiaryPhotoUrl(id), {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload photo");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: getListBeneficiariesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetBeneficiaryQueryKey(id) });
    },
  });
}

export function useUploadTimeMachinePhotosNative() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, files }: { id: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("photos", file);
      });

      const res = await fetch(getUploadTimeMachinePhotosUrl(id), {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload photos");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: getListTimeMachineEntriesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTimeMachineEntryQueryKey(id) });
    },
  });
}
