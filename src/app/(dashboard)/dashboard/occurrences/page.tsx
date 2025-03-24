"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";

// Types
interface Occurrence {
  id: string;
  occurrence_number: string;
  title: string;
  occurrence_date: string;
  created_at: string;
  location: string;
  status: string;
  severity: string;
  occurrence_type: string;
  reporter: {
    id: string;
    full_name: string;
    email: string;
  };
  investigations: {
    id: string;
    stage: string;
    lead_investigator_id: string;
    lead_investigator: {
      id: string;
      full_name: string;
      email: string;
    } | null;
  }[] | null;
}

interface Stats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  this_week: number;
  this_month: number;
  high_severity: number;
}

interface OccurrenceResponse {
  occurrences: Occurrence[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  stats: Stats;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }
  return response.json();
};

export default function OccurrencesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Safely get search params with fallbacks
  const getParam = (key: string): string => {
    return searchParams?.get(key) || '';
  };
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>(getParam('status'));
  const [severityFilter, setSeverityFilter] = useState<string>(getParam('severity'));
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({
    startDate: getParam('startDate') || null,
    endDate: getParam('endDate') || null
  });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Calculate API URL with filters
  const getApiUrl = () => {
    const offset = (page - 1) * limit;
    let url = `/api/occurrences?limit=${limit}&offset=${offset}`;
    
    if (statusFilter) url += `&status=${statusFilter}`;
    if (severityFilter) url += `&severity=${severityFilter}`;
    if (dateRangeFilter.startDate) url += `&startDate=${dateRangeFilter.startDate}`;
    if (dateRangeFilter.endDate) url += `&endDate=${dateRangeFilter.endDate}`;
    
    return url;
  };
  
  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR<OccurrenceResponse>(
    getApiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnReconnect: true
    }
  );
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (severityFilter) params.set('severity', severityFilter);
    if (dateRangeFilter.startDate) params.set('startDate', dateRangeFilter.startDate);
    if (dateRangeFilter.endDate) params.set('endDate', dateRangeFilter.endDate);
    
    const url = params.toString() ? `?${params.toString()}` : '';
    window.history.pushState({}, '', `/dashboard/occurrences${url}`);
  }, [statusFilter, severityFilter, dateRangeFilter]);
  
  // Apply filters and reset to page 1
  const applyFilters = (
    status: string = statusFilter,
    severity: string = severityFilter,
    startDate: string | null = dateRangeFilter.startDate,
    endDate: string | null = dateRangeFilter.endDate
  ) => {
    setStatusFilter(status);
    setSeverityFilter(severity);
    setDateRangeFilter({ startDate, endDate });
    setPage(1);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setStatusFilter('');
    setSeverityFilter('');
    setDateRangeFilter({ startDate: null, endDate: null });
    setPage(1);
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
      case 'under_investigation':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status display name
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'in_progress':
        return 'In Progress';
      case 'under_investigation':
        return 'Under Investigation';
      case 'closed':
        return 'Closed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading occurrences...</p>
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
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }
  
  const stats = data?.stats || {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    this_week: 0,
    this_month: 0,
    high_severity: 0
  };
  
  const occurrences = data?.occurrences || [];
  const pagination = data?.pagination || { total: 0, limit: 10, offset: 0 };
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Occurrences</h1>
          <p className="text-gray-500">Manage and track all safety occurrences</p>
        </div>
        <div>
          <Link
            href="/dashboard/occurrences/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Report New Occurrence
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Occurrences</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Pending Review</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">High Severity</p>
              <p className="text-2xl font-bold">{stats.high_severity}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Occurrences Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-500 text-sm">This Week</p>
            <p className="text-2xl font-bold">{stats.this_week}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">This Month</p>
            <p className="text-2xl font-bold">{stats.this_month}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">In Progress</p>
            <p className="text-2xl font-bold">{stats.in_progress}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Pending Investigation</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Reset Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => applyFilters(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => applyFilters(undefined, e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRangeFilter.startDate || ''}
                onChange={(e) => {
                  const newStartDate = e.target.value || null;
                  applyFilters(undefined, undefined, newStartDate, dateRangeFilter.endDate);
                }}
                className="rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={dateRangeFilter.endDate || ''}
                onChange={(e) => {
                  const newEndDate = e.target.value || null;
                  applyFilters(undefined, undefined, dateRangeFilter.startDate, newEndDate);
                }}
                className="rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="End Date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Occurrences Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occurrence
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investigation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {occurrences.length > 0 ? (
                occurrences.map((occurrence) => (
                  <tr key={occurrence.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/dashboard/occurrences/${occurrence.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {occurrence.occurrence_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-1">{occurrence.title}</div>
                      <div className="text-xs text-gray-500">{occurrence.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(occurrence.occurrence_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(occurrence.status)}`}
                      >
                        {getStatusDisplay(occurrence.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(occurrence.severity)}`}
                      >
                        {occurrence.severity.charAt(0).toUpperCase() + occurrence.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {occurrence.reporter?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {occurrence.investigations && occurrence.investigations.length > 0 ? (
                        <div>
                          <span 
                            className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              occurrence.investigations[0].stage === 'completed' ? 'bg-green-500' : 
                              occurrence.investigations[0].stage === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}
                          ></span>
                          <Link 
                            href={`/dashboard/investigations/${occurrence.investigations[0].id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            View
                          </Link>
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    {statusFilter || severityFilter || dateRangeFilter.startDate || dateRangeFilter.endDate ? 
                      'No occurrences match your filters' :
                      'No occurrences found'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{Math.min(pagination.offset + 1, pagination.total)}</span> to{' '}
              <span className="font-medium">{Math.min(pagination.offset + pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> results
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 rounded border ${
                page === 1
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(pageNum => {
                // Show first page, last page, current page, and pages around current page
                return pageNum === 1 || 
                       pageNum === totalPages || 
                       (pageNum >= page - 1 && pageNum <= page + 1);
              })
              .map((pageNum, index, array) => {
                const showEllipsis = index > 0 && array[index - 1] !== pageNum - 1;
                
                return (
                  <div key={pageNum} className="flex items-center">
                    {showEllipsis && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded ${
                        pageNum === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  </div>
                );
              })}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded border ${
                page === totalPages
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 