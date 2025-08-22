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
  const [localProfileImage, setLocalProfileImage] = useState(currentProfileImage);
  const [imageKey, setImageKey] = useState(0); // Force re-render of image

  const updateProfileImageMutation = useMutation({
    mutationFn: async (profileImageURL: string) => {
      console.log('Updating profile image for member:', teamMemberId, 'with URL:', profileImageURL);
      const response = await apiRequest("PUT", `/api/team-members/${teamMemberId}/profile-image`, {
        profileImageURL,
      });
      const data = await response.json();
      console.log('Profile image update response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Profile image successfully updated:', data);
      toast({
        title: "نجح الرفع",
        description: "تم تحديث الصورة الشخصية بنجاح",
      });
      
      // Update local state immediately and force re-render
      if (data.objectPath) {
        setLocalProfileImage(data.objectPath);
        setImageKey(prev => prev + 1); // Force image re-render
        
        // Add cache buster to image URL
        const imageWithCacheBuster = `${data.objectPath}?t=${Date.now()}`;
        setLocalProfileImage(imageWithCacheBuster);
      }
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      queryClient.refetchQueries({ queryKey: ["/api/team-members"] });
      
      onImageUpdated?.(data.objectPath);
    },
    onError: (error) => {
      console.error("Error updating profile image:", error);
      toast({
        title: "خطأ في الرفع", 
        description: "فشل في تحديث الصورة الشخصية: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async (file: any) => {
    try {
      console.log('Getting upload parameters for file:', file.name, file.type, file.size);
      const response = await apiRequest("POST", "/api/objects/upload", {});
      const data = await response.json();
      console.log('Got upload parameters:', data);
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      toast({
        title: "خطأ",
        description: "فشل في الحصول على رابط الرفع",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = (result: any) => {
    console.log('Upload result:', result);
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      console.log('Upload completed, URL:', uploadURL);
      // Extract the object path from the full URL
      const urlObj = new URL(uploadURL);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part.includes('replit-objstore'));
      if (bucketIndex >= 0) {
        const objectPath = pathParts.slice(bucketIndex).join('/');
        console.log('Extracted object path:', objectPath);
        updateProfileImageMutation.mutate(uploadURL);
      } else {
        updateProfileImageMutation.mutate(uploadURL);
      }
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
          key={imageKey} // Force re-render when image changes
          src={localProfileImage || currentProfileImage || undefined} 
          alt={`صورة ${memberName}`}
          className="object-cover"
          onError={(e) => {
            console.log('Image failed to load:', localProfileImage || currentProfileImage);
            // Fallback to original image without cache buster
            if (localProfileImage && localProfileImage.includes('?t=')) {
              const originalImage = localProfileImage.split('?t=')[0];
              setLocalProfileImage(originalImage);
            }
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', localProfileImage || currentProfileImage);
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