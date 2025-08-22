import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ObjectUploader } from "./ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileImageUploaderProps {
  teamMemberId: string;
  currentProfileImage?: string | null;
  memberName: string;
  onImageUpdated?: (newImageUrl: string) => void;
  size?: "sm" | "md" | "lg";
  showUploadIcon?: boolean;
}

export function ProfileImageUploader({
  teamMemberId,
  currentProfileImage,
  memberName,
  onImageUpdated,
  size = "md",
  showUploadIcon = true,
}: ProfileImageUploaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfileImageMutation = useMutation({
    mutationFn: async (profileImageURL: string) => {
      return await apiRequest(`/api/team-members/${teamMemberId}/profile-image`, {
        method: "PUT",
        body: { profileImageURL },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "تم تحديث الصورة الشخصية",
        description: "تم تحديث الصورة الشخصية بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      onImageUpdated?.(data.objectPath);
    },
    onError: (error) => {
      console.error("Error updating profile image:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الصورة الشخصية",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("/api/objects/upload", { method: "POST" });
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      updateProfileImageMutation.mutate(uploadURL);
    }
  };

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative group">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage 
          src={currentProfileImage ? `${currentProfileImage}` : undefined} 
          alt={`صورة ${memberName}`}
        />
        <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
          <User className="w-1/2 h-1/2" />
        </AvatarFallback>
      </Avatar>
      
      {showUploadIcon && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={5 * 1024 * 1024} // 5MB
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="bg-transparent hover:bg-transparent p-0 h-auto border-none shadow-none"
          >
            <Camera className="w-4 h-4 text-white" />
          </ObjectUploader>
        </div>
      )}
      
      {updateProfileImageMutation.isPending && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}