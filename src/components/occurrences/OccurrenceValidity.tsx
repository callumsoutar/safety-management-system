import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import useSWR from 'swr';
import { AssessmentStatus, IncidentClassification, OccurrenceAssessment } from '@/types';

interface OccurrenceValidityProps {
  occurrenceId: string;
}

interface Investigator {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function OccurrenceValidity({ occurrenceId }: OccurrenceValidityProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch assessment data
  const { data, error, mutate } = useSWR<{ assessment: OccurrenceAssessment }>(
    `/api/occurrences/${occurrenceId}/assessment`,
    fetcher
  );

  // Fetch investigators
  const { data: investigatorsData } = useSWR<{ investigators: Investigator[] }>(
    '/api/investigators',
    fetcher
  );

  // Form state
  const [formData, setFormData] = useState<Partial<OccurrenceAssessment>>({
    status: 'pending_assessment',
    incident_classification: null,
    reasoning: '',
    assigned_investigator_id: null,
    date_assigned: null,
    completion_due_date: null,
    cfi_approved: false,
    cfi_approval_date: null,
  });

  // Update form when data is loaded
  useEffect(() => {
    if (data?.assessment) {
      setFormData({
        status: data.assessment.status,
        incident_classification: data.assessment.incident_classification,
        reasoning: data.assessment.reasoning || '',
        assigned_investigator_id: data.assessment.assigned_investigator_id,
        date_assigned: data.assessment.date_assigned,
        completion_due_date: data.assessment.completion_due_date,
        cfi_approved: data.assessment.cfi_approved,
        cfi_approval_date: data.assessment.cfi_approval_date,
      });
    }
  }, [data]);

  // Handle form changes
  const handleChange = (field: keyof OccurrenceAssessment, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      
      // Add assessment date if status is being changed from pending
      const updateData = {
        ...formData,
        assessment_date: formData.status !== 'pending_assessment' ? new Date().toISOString() : null
      };

      const response = await fetch(`/api/occurrences/${occurrenceId}/assessment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update assessment');
      }

      // Update the cached data
      await mutate();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error updating assessment:', error);
      // Add error notification here
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        Error loading assessment data
      </div>
    );
  }

  // Get status badge color
  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case 'pending_assessment':
        return 'bg-yellow-100 text-yellow-800';
      case 'invalid':
        return 'bg-red-100 text-red-800';
      case 'valid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8 bg-white rounded-xl shadow-md border border-gray-200">
      {/* Header with Save Button */}
      <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white rounded-t-xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Occurrence Validity Assessment</h2>
            <p className="text-sm text-gray-600 mt-1">Assess the validity and classify the occurrence</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!hasUnsavedChanges || isSaving}
            className={`inline-flex items-center px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              hasUnsavedChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow active:bg-blue-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      <div className="px-8 space-y-6">
        {/* Primary Assessment Section */}
        <div className="space-y-6">
          {/* Validity Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validity Status
            </label>
            <div className="flex gap-4">
              <label className={`relative flex items-center p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-sm flex-1 ${
                formData.status === 'valid' 
                  ? 'border-green-500 bg-green-50 ring-1 ring-green-500' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="validity_status"
                  value="valid"
                  checked={formData.status === 'valid'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    formData.status === 'valid' ? 'bg-green-100' : 'bg-green-50'
                  }`}>
                    <svg className="w-5 h-5 text-green-600" 
                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${formData.status === 'valid' ? 'text-green-700' : 'text-gray-900'}`}>
                      Valid
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Occurrence meets criteria</p>
                  </div>
                </div>
              </label>

              <label className={`relative flex items-center p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-sm flex-1 ${
                formData.status === 'invalid' 
                  ? 'border-red-500 bg-red-50 ring-1 ring-red-500' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="validity_status"
                  value="invalid"
                  checked={formData.status === 'invalid'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    formData.status === 'invalid' ? 'bg-red-100' : 'bg-red-50'
                  }`}>
                    <svg className="w-5 h-5 text-red-600" 
                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${formData.status === 'invalid' ? 'text-red-700' : 'text-gray-900'}`}>
                      Invalid
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Does not meet criteria</p>
                  </div>
                </div>
              </label>

              <label className={`relative flex items-center p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-sm flex-1 ${
                formData.status === 'pending_assessment' 
                  ? 'border-yellow-500 bg-yellow-50 ring-1 ring-yellow-500' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="validity_status"
                  value="pending_assessment"
                  checked={formData.status === 'pending_assessment'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    formData.status === 'pending_assessment' ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-5 h-5 ${formData.status === 'pending_assessment' ? 'text-yellow-600' : 'text-gray-500'}`} 
                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${formData.status === 'pending_assessment' ? 'text-yellow-700' : 'text-gray-900'}`}>
                      Pending
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Awaiting assessment</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Reasoning Section */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Assessment Reasoning
            </label>
            <textarea
              value={formData.reasoning || ''}
              onChange={(e) => handleChange('reasoning', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 hover:border-gray-400"
              placeholder="Provide detailed reasoning for your assessment..."
            />
          </div>

          {/* Incident Classification */}
          <div className="max-w-md space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Incident Classification
            </label>
            <select
              value={formData.incident_classification || ''}
              onChange={(e) => handleChange('incident_classification', e.target.value || null)}
              className="w-full rounded-lg border border-gray-300 px-4 pr-10 py-2.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 hover:border-gray-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
            >
              <option value="">Select Classification</option>
              <option value="operational">Operational</option>
              <option value="technical">Technical</option>
              <option value="environmental">Environmental</option>
              <option value="human_factors">Human Factors</option>
              <option value="organizational">Organizational</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Investigation Assignment Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-800">Investigation Details</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Assigned Investigator
              </label>
              <select
                value={formData.assigned_investigator_id || ''}
                onChange={(e) => handleChange('assigned_investigator_id', e.target.value || null)}
                className="w-full rounded-lg border border-gray-300 px-4 pr-10 py-2.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 hover:border-gray-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
              >
                <option value="">Select Investigator</option>
                {investigatorsData?.investigators.map((investigator) => (
                  <option key={investigator.id} value={investigator.id}>
                    {investigator.full_name} ({investigator.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Date Assigned
              </label>
              <input
                type="date"
                value={formData.date_assigned ? format(new Date(formData.date_assigned), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleChange('date_assigned', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 hover:border-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Completion Due Date
              </label>
              <input
                type="date"
                value={formData.completion_due_date ? format(new Date(formData.completion_due_date), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleChange('completion_due_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 hover:border-gray-400"
              />
            </div>
          </div>
        </div>

        {/* CFI Approval Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-800">CFI Approval</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center bg-gray-50 px-5 py-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.cfi_approved}
                onChange={(e) => handleChange('cfi_approved', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 group-hover:border-gray-400"
              />
              <span className="ml-3 text-sm text-gray-700 font-medium">Approved by CFI</span>
            </label>
            {formData.cfi_approved && (
              <div className="pl-8">
                <label className="block text-sm text-gray-600 mb-2">Approval Date</label>
                <input
                  type="date"
                  value={formData.cfi_approval_date ? format(new Date(formData.cfi_approval_date), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleChange('cfi_approval_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 hover:border-gray-400"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Footer */}
      {data?.assessment && (
        <div className="px-8 py-6 bg-gradient-to-t from-gray-50 to-white rounded-b-xl border-t border-gray-200">
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <p className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {format(new Date(data.assessment.updated_at), 'MMM d, yyyy HH:mm')}
            </p>
            {data.assessment.assessment_date && (
              <p className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Assessment date: {format(new Date(data.assessment.assessment_date), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 