"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvestigationProgress from "@/components/occurrences/InvestigationProgress";
import OccurrenceDetails from "@/components/occurrences/OccurrenceDetails";
import OccurrenceInformation from "@/components/occurrences/OccurrenceInformation";
import InvestigationDetails from "@/components/occurrences/InvestigationDetails";
import { format } from "date-fns";
import { formatFileSize as formatFileSizeUtil, isAllowedFileType, isAllowedFileSize, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/lib/utils/fileUtils';
import { Attachment } from '@/types';
import FileIcon from '@/components/ui/FileIcon';

// Tab types
type TabType = "details" | "investigation" | "attachments" | "comments" | "history";

interface OccurrenceData {
  occurrence: any;
  details: any;
  investigation: any;
}

export default function OccurrencePage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OccurrenceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchOccurrence = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/occurrences/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setData(data);
      } catch (err) {
        console.error("Failed to fetch occurrence:", err);
        setError("Failed to load occurrence details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOccurrence();
    }
  }, [params.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (dropdownOpen) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading occurrence details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-red-500 mx-auto mb-4"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-gray-700 font-medium mb-2">Error</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.occurrence) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-gray-400 mx-auto mb-4"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-gray-700 font-medium mb-2">Not Found</p>
          <p className="text-gray-500">The occurrence you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
        </div>
      </div>
    );
  }

  // Render the appropriate content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return (
          <div>
            <OccurrenceDetails 
              occurrence={data.occurrence} 
              details={data.details} 
            />
            <OccurrenceInformation
              occurrence={data.occurrence}
              details={data.details}
            />
          </div>
        );
      case "investigation":
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-blue-600"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Investigation</h2>
            </div>
            <InvestigationDetails 
              investigation={data.investigation}
            />
          </div>
        );
      case "attachments":
        return (
          <AttachmentsTab occurrenceId={params.id as string} />
        );
      case "comments":
        return (
          <CommentsTab occurrenceId={params.id as string} />
        );
      case "history":
        return (
          <HistoryTab occurrenceId={params.id as string} />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">{data.occurrence.occurrence_number}</h1>
          <p className="text-gray-500">
            Reported on {new Date(data.occurrence.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link 
            href={`/dashboard/occurrences/${params.id}/edit`}
            className="inline-flex items-center justify-center p-2 rounded-md border border-gray-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 mr-2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </Link>
          <div className="relative">
            <button 
              onClick={toggleDropdown}
              className="inline-flex items-center justify-center p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-gray-500"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <Link 
                    href={`/dashboard/occurrences/${params.id}/edit`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit Occurrence
                  </Link>
                  <Link 
                    href={`/dashboard/occurrences/${params.id}/investigation`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    View Full Investigation
                  </Link>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this occurrence?")) {
                        // Handle delete logic here
                        console.log("Delete occurrence", params.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <InvestigationProgress 
        currentStage={data.investigation?.stage || "not_started"} 
      />

      {/* Tab navigation */}
      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          <button 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "details" 
                ? "border-b-2 border-blue-500 text-blue-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "investigation" 
                ? "border-b-2 border-blue-500 text-blue-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("investigation")}
          >
            Investigation
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "attachments" 
                ? "border-b-2 border-blue-500 text-blue-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("attachments")}
          >
            Attachments
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "comments" 
                ? "border-b-2 border-blue-500 text-blue-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("comments")}
          >
            Comments
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "history" 
                ? "border-b-2 border-blue-500 text-blue-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
}

// Tab Components
const AttachmentsTab = ({ occurrenceId }: { occurrenceId: string }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Fetch attachments
  const fetchAttachments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/attachments/${occurrenceId}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setAttachments(data.attachments || []);
    } catch (err) {
      console.error("Failed to fetch attachments:", err);
      setError("Failed to load attachments. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [occurrenceId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // Validate file before upload
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!isAllowedFileType(file.type)) {
      return { 
        valid: false, 
        error: 'File type not allowed. Please upload a supported file type.' 
      };
    }
    
    // Check file size
    if (!isAllowedFileSize(file.size)) {
      return { 
        valid: false, 
        error: `File size exceeds the maximum allowed size of ${formatFileSizeUtil(MAX_FILE_SIZE)}.` 
      };
    }
    
    return { valid: true };
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validation = validateFile(file);
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("occurrenceId", occurrenceId);
      
      const response = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
      
      // Refresh the attachments list
      fetchAttachments();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file deletion
  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/attachments/${attachmentId}/delete`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Deletion failed");
      }
      
      // Refresh the attachments list
      fetchAttachments();
    } catch (err: any) {
      console.error("Deletion error:", err);
      setError(err.message || "Failed to delete file. Please try again.");
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    return formatFileSizeUtil(bytes);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-blue-600"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Attachments</h2>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      <div 
        className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg bg-gray-50 mb-6 transition-colors ${
          dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-12 w-12 text-gray-400 mb-4"
        >
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
        <p className="text-gray-600 mb-2">
          {dragActive 
            ? "Drop file here to upload" 
            : "Drag and drop files here or click to upload"}
        </p>
        <label className="relative">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={isUploading}
          />
          <button 
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
              isUploading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Files"}
          </button>
        </label>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
        </div>
      ) : attachments.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attachments.map((attachment) => (
                <tr key={attachment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                        <FileIcon fileType={attachment.file_type} />
                      </div>
                      <div className="ml-4">
                        <a 
                          href={attachment.public_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {attachment.file_name}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(attachment.file_size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {attachment.uploader?.full_name || "Unknown User"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(attachment.created_at), "MMM d, yyyy, h:mm a")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <a 
                        href={attachment.public_url} 
                        download={attachment.file_name}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </a>
                      <button 
                        onClick={() => handleDelete(attachment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-gray-400 mb-4"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
          <p className="text-gray-600 mb-2">No attachments yet</p>
          <p className="text-gray-500 text-sm">Upload files to add attachments to this occurrence</p>
        </div>
      )}
    </div>
  );
};

const CommentsTab = ({ occurrenceId }: { occurrenceId: string }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-blue-600"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Comments</h2>
      </div>
      
      <div className="mb-6">
        <textarea 
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add a comment..."
          rows={3}
        ></textarea>
        <div className="flex justify-end mt-2">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
            Post Comment
          </button>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-12 w-12 text-gray-400 mb-4"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <p className="text-gray-600">No comments yet</p>
        <p className="text-gray-500 text-sm mt-1">Be the first to comment on this occurrence</p>
      </div>
    </div>
  );
};

const HistoryTab = ({ occurrenceId }: { occurrenceId: string }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-blue-600"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">History</h2>
      </div>
      
      <div className="space-y-6">
        <div className="flex">
          <div className="flex-shrink-0 mr-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-blue-600"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Callum Soutar</span> created this occurrence
            </p>
            <p className="text-xs text-gray-500 mt-1">Mar 10, 2025, 10:03 PM</p>
          </div>
        </div>
        
        <div className="flex">
          <div className="flex-shrink-0 mr-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-blue-600"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Callum Soutar</span> started the investigation
            </p>
            <p className="text-xs text-gray-500 mt-1">Mar 11, 2025, 02:53 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 