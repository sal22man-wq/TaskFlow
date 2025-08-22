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
      console.log('Updating profile image with URL:', profileImageURL);
      const response = await apiRequest("PUT", `/api/team-members/${teamMemberId}/profile-image`, {
        profileImageURL,
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Profile image update response:', data);
      toast({
        title: "تم تحديث الصورة الشخصية",
        description: "تم تحديث الصورة الشخصية بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      onImageUpdated?.(data.objectPath);
      
      // Force refresh the page data
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/team-members"] });
      }, 1000);
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

  const handleGetUploadParameters = async (file: any) => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload", {});
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      console.log('Upload completed, URL:', uploadURL);
      updateProfileImageMutation.mutate(uploadURL);
    } else {
      console.error('Upload failed:', result);
      toast({
        title: "خطأ",
        description: "فشل في رفع الصورة",
        variant: "destructive",
      });
    }
  };

  const sizeClasses = {
    sm: "w-14 h-14",
    md: "w-20 h-20", 
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
      <Avatar className={`${sizeClasses[size]} ring-4 ring-blue-200/60 ring-offset-2 transition-all duration-300 group-hover:ring-blue-400/80 shadow-lg`}>
        <AvatarImage 
          src={currentProfileImage || undefined} 
          alt={`صورة ${memberName}`}
          className="object-cover"
          onError={(e) => {
            console.log('Image failed to load:', currentProfileImage);
            e.currentTarget.style.display = 'none';
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', currentProfileImage);
          }}
        />
        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-bold text-lg border-2 border-blue-300 shadow-inner">
          {getInitials(memberName)}
        </AvatarFallback>
      </Avatar>
      
      {showUploadIcon && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-sm">
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={5 * 1024 * 1024} // 5MB
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="bg-transparent hover:bg-transparent p-2 h-auto border-none shadow-none rounded-full hover:bg-white/20 transition-colors"
          >
            <Camera className="w-5 h-5 text-white drop-shadow-sm" />
          </ObjectUploader>
        </div>
      )}
      
      {updateProfileImageMutation.isPending && (
        <div className="absolute inset-0 bg-white bg-opacity-80 rounded-full flex items-center justify-center backdrop-blur-sm">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}