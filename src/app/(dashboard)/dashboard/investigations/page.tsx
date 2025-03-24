"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";

// Types
type Stage = 
  | "not_started" 
  | "data_collection" 
  | "analysis" 
  | "recommendations" 
  | "review" 
  | "completed";

interface Investigation {
  id: string;
  occurrence_id: string;
  stage: Stage;
  lead_investigator_id: string;
  lead_investigator: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  occurrence: {
    id: string;
    occurrence_number: string;
    title: string;
    occurrence_date: string;
    location: string;
    severity: string;
  };
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  not_started: number;
  data_collection: number;
  analysis: number;
  recommendations: number;
  review: number;
  completed: number;
  this_week: number;
  this_month: number;
}

interface InvestigationsResponse {
  investigations: Investigation[];
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

export default function InvestigationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // View state (list or kanban)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  
  // Safely get search params with fallbacks
  const getParam = (key: string): string => {
    return searchParams?.get(key) || '';
  };
  
  // Filter state
  const [stageFilter, setStageFilter] = useState<string>(getParam('stage'));
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({
    startDate: getParam('startDate') || null,
    endDate: getParam('endDate') || null
  });
  
  // Pagination state (for list view)
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Calculate API URL with filters
  const getApiUrl = () => {
    const offset = (page - 1) * limit;
    let url = `/api/investigations?limit=${limit}&offset=${offset}`;
    
    if (stageFilter) url += `&stage=${stageFilter}`;
    if (dateRangeFilter.startDate) url += `&startDate=${dateRangeFilter.startDate}`;
    if (dateRangeFilter.endDate) url += `&endDate=${dateRangeFilter.endDate}`;
    
    return url;
  };

  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR<InvestigationsResponse>(
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
    if (stageFilter) params.set('stage', stageFilter);
    if (dateRangeFilter.startDate) params.set('startDate', dateRangeFilter.startDate);
    if (dateRangeFilter.endDate) params.set('endDate', dateRangeFilter.endDate);
    params.set('view', viewMode);
    
    const url = params.toString() ? `?${params.toString()}` : '';
    window.history.pushState({}, '', `/dashboard/investigations${url}`);
  }, [stageFilter, dateRangeFilter, viewMode]);
  
  // Apply filters and reset to page 1
  const applyFilters = (
    stage: string = stageFilter,
    startDate: string | null = dateRangeFilter.startDate,
    endDate: string | null = dateRangeFilter.endDate
  ) => {
    setStageFilter(stage);
    setDateRangeFilter({ startDate, endDate });
    setPage(1);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setStageFilter('');
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

  // Get stage badge color
  const getStageColor = (stage: Stage) => {
    switch (stage) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      case 'data_collection':
        return 'bg-blue-100 text-blue-800';
      case 'analysis':
        return 'bg-indigo-100 text-indigo-800';
      case 'recommendations':
        return 'bg-purple-100 text-purple-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
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

  // Get stage display name
  const getStageDisplay = (stage: Stage) => {
    switch (stage) {
      case 'not_started':
        return 'Not Started';
      case 'data_collection':
        return 'Data Collection';
      case 'analysis':
        return 'Analysis';
      case 'recommendations':
        return 'Recommendations';
      case 'review':
        return 'Review';
      case 'completed':
        return 'Completed';
      default:
        return stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading investigations...</p>
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

  const investigations = data?.investigations || [];
  const stats = data?.stats || {
    total: 0,
    not_started: 0,
    data_collection: 0,
    analysis: 0,
    recommendations: 0,
    review: 0,
    completed: 0,
    this_week: 0,
    this_month: 0
  };
  const pagination = data?.pagination || { total: 0, limit: 10, offset: 0 };

  // Placeholder - to be implemented
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Investigations</h1>
        <div className="flex space-x-2">
          <Link 
            href="/dashboard/occurrences/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Occurrence
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide">TOTAL INVESTIGATIONS</p>
          <p className="text-4xl font-bold mt-2">{stats.total}</p>
          <div className="flex items-center text-sm mt-4 space-x-2">
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
              {stats.this_week} this week
            </div>
            <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
              {stats.this_month} this month
            </div>
          </div>
          <div className="absolute top-5 right-5 bg-blue-100 text-blue-800 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide">IN PROGRESS</p>
          <p className="text-4xl font-bold mt-2">{stats.data_collection + stats.analysis + stats.recommendations + stats.review}</p>
          <div className="mt-4 text-sm grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              <span className="text-gray-600">Collection: {stats.data_collection}</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
              <span className="text-gray-600">Analysis: {stats.analysis}</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
              <span className="text-gray-600">Recs: {stats.recommendations}</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              <span className="text-gray-600">Review: {stats.review}</span>
            </div>
          </div>
          <div className="absolute top-5 right-5 bg-yellow-100 text-yellow-800 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide">NOT STARTED</p>
          <p className="text-4xl font-bold mt-2">{stats.not_started}</p>
          <div className="flex items-center text-sm mt-4">
            <div className="text-gray-500">
              {stats.total > 0 
                ? `${((stats.not_started / stats.total) * 100).toFixed(0)}% of total`
                : 'NaN% of total'
              }
            </div>
          </div>
          <div className="absolute top-5 right-5 bg-gray-100 text-gray-800 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide">COMPLETED</p>
          <p className="text-4xl font-bold mt-2">{stats.completed}</p>
          <div className="flex items-center text-sm mt-4">
            <div className="text-gray-500">
              {stats.total > 0 
                ? `${((stats.completed / stats.total) * 100).toFixed(0)}% completion rate`
                : '0% completion rate'
              }
            </div>
          </div>
          <div className="absolute top-5 right-5 bg-green-100 text-green-800 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Filters and View Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Stage Filter */}
            <div className="flex items-center">
              <button
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-2"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                Filter
              </button>
              <select
                className="ml-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={stageFilter}
                onChange={(e) => applyFilters(e.target.value)}
              >
                <option value="">All Stages</option>
                <option value="not_started">Not Started</option>
                <option value="data_collection">Data Collection</option>
                <option value="analysis">Analysis</option>
                <option value="recommendations">Recommendations</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            {/* Date Range Filter - simplified for now */}
            <div className="flex items-center space-x-2">
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dateRangeFilter.startDate || ''}
                onChange={(e) => setDateRangeFilter({...dateRangeFilter, startDate: e.target.value || null})}
                placeholder="dd/mm/yyyy"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dateRangeFilter.endDate || ''}
                onChange={(e) => setDateRangeFilter({...dateRangeFilter, endDate: e.target.value || null})}
                placeholder="dd/mm/yyyy"
              />
            </div>
            
            {/* Reset Filters */}
            <button
              className="sm:ml-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">View:</span>
            <div className="bg-gray-100 rounded-md inline-flex p-1">
              <button
                className={`px-3 py-1 rounded-md ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setViewMode('list')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
              <button
                className={`px-3 py-1 rounded-md ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setViewMode('kanban')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                  <line x1="15" y1="21" x2="15" y2="9"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content will be added in the next steps */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {investigations.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Investigation ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Occurrence
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stage
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead Investigator
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {investigations.map((investigation) => (
                      <tr key={investigation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/dashboard/investigations/${investigation.id}`}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
                          >
                            INV-{investigation.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/dashboard/occurrences/${investigation.occurrence_id}`}
                            className="text-gray-900 hover:text-blue-600"
                          >
                            <div className="font-medium">{investigation.occurrence.occurrence_number}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{investigation.occurrence.title}</div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(investigation.stage)}`}>
                            {getStageDisplay(investigation.stage)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {investigation.lead_investigator ? (
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                {investigation.lead_investigator.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {investigation.lead_investigator.full_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {investigation.lead_investigator.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>Started: {formatDate(investigation.started_at)}</div>
                          {investigation.stage === 'completed' && (
                            <div>Completed: {formatDate(investigation.completed_at)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(investigation.occurrence.severity)}`}>
                            {investigation.occurrence.severity.charAt(0).toUpperCase() + investigation.occurrence.severity.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {pagination.total > limit && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} investigations
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className={`px-3 py-1 rounded-md ${
                        page === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.ceil(pagination.total / limit) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`px-3 py-1 rounded-md ${
                          page === i + 1 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {i + 1}
                      </button>
                    )).slice(Math.max(0, page - 3), Math.min(Math.ceil(pagination.total / limit), page + 2))}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page * limit >= pagination.total}
                      className={`px-3 py-1 rounded-md ${
                        page * limit >= pagination.total 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <p className="text-gray-600 mb-1">No investigations found</p>
              <p className="text-gray-500 text-sm">Adjust your filters or create a new occurrence to start an investigation</p>
            </div>
          )}
        </div>
      ) : (
        // Kanban View
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="overflow-x-auto" style={{ 
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch' 
          }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                height: 10px;
              }
              
              div::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
              }
              
              div::-webkit-scrollbar-thumb {
                background: #c0c0c0;
                border-radius: 10px;
              }
              
              div::-webkit-scrollbar-thumb:hover {
                background: #a0a0a0;
              }
              
              .kanban-column:not(:last-child) {
                border-right: 1px solid #e5e7eb;
                padding-right: 1rem;
                margin-right: 1rem;
              }
              
              .kanban-card {
                transition: all 0.2s ease;
              }
              
              .kanban-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              }
            `}</style>
            <div 
              className="flex pb-6" 
              style={{ minWidth: 'max-content' }}
            >
              {/* Not Started */}
              <div className="w-64 flex-shrink-0 kanban-column">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                    Not Started
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                    {investigations.filter(i => i.stage === 'not_started').length}
                  </span>
                </div>
                
                <div className="space-y-3 min-h-[100px]">
                  {investigations.filter(i => i.stage === 'not_started').length > 0 ? (
                    investigations.filter(i => i.stage === 'not_started').map(investigation => (
                      <Link 
                        href={`/dashboard/investigations/${investigation.id}`}
                        key={investigation.id}
                        className="block bg-white border border-gray-200 hover:border-blue-400 rounded-md p-3 transition-colors shadow-sm kanban-card"
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-xs text-gray-600 rounded">
                              {investigation.occurrence.occurrence_number}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(investigation.occurrence.severity)}`}>
                              {investigation.occurrence.severity}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm mt-2 line-clamp-2">
                            {investigation.occurrence.title}
                          </h4>
                          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                            <div className="flex items-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-3 w-3 mr-1" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(investigation.created_at)}
                            </div>
                            {investigation.lead_investigator && (
                              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] text-gray-700">
                                {investigation.lead_investigator.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-4 text-center">
                      <p className="text-sm text-gray-500">No investigations in this stage</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Data Collection */}
              <div className="w-64 flex-shrink-0 kanban-column">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Data Collection
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                    {investigations.filter(i => i.stage === 'data_collection').length}
                  </span>
                </div>
                
                <div className="space-y-3 min-h-[100px]">
                  {investigations.filter(i => i.stage === 'data_collection').length > 0 ? (
                    investigations.filter(i => i.stage === 'data_collection').map(investigation => (
                      <Link 
                        href={`/dashboard/investigations/${investigation.id}`}
                        key={investigation.id}
                        className="block bg-white border border-gray-200 hover:border-blue-400 rounded-md p-3 transition-colors shadow-sm kanban-card"
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-xs text-gray-600 rounded">
                              {investigation.occurrence.occurrence_number}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(investigation.occurrence.severity)}`}>
                              {investigation.occurrence.severity}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm mt-2 line-clamp-2">
                            {investigation.occurrence.title}
                          </h4>
                          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                            <div className="flex items-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-3 w-3 mr-1" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(investigation.started_at)}
                            </div>
                            {investigation.lead_investigator && (
                              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] text-blue-700">
                                {investigation.lead_investigator.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-4 text-center">
                      <p className="text-sm text-gray-500">No investigations in this stage</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Analysis */}
              <div className="w-64 flex-shrink-0 kanban-column">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                    Analysis
                  </h3>
                  <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">
                    {investigations.filter(i => i.stage === 'analysis').length}
                  </span>
                </div>
                
                <div className="space-y-3 min-h-[100px]">
                  {investigations.filter(i => i.stage === 'analysis').length > 0 ? (
                    investigations.filter(i => i.stage === 'analysis').map(investigation => (
                      <Link 
                        href={`/dashboard/investigations/${investigation.id}`}
                        key={investigation.id}
                        className="block bg-white border border-gray-200 hover:border-blue-400 rounded-md p-3 transition-colors shadow-sm kanban-card"
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-xs text-gray-600 rounded">
                              {investigation.occurrence.occurrence_number}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(investigation.occurrence.severity)}`}>
                              {investigation.occurrence.severity}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm mt-2 line-clamp-2">
                            {investigation.occurrence.title}
                          </h4>
                          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                            <div className="flex items-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-3 w-3 mr-1" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(investigation.started_at)}
                            </div>
                            {investigation.lead_investigator && (
                              <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] text-indigo-700">
                                {investigation.lead_investigator.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-4 text-center">
                      <p className="text-sm text-gray-500">No investigations in this stage</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recommendations */}
              <div className="w-64 flex-shrink-0 kanban-column">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Recommendations
                  </h3>
                  <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">
                    {investigations.filter(i => i.stage === 'recommendations').length}
                  </span>
                </div>
                
                <div className="space-y-3 min-h-[100px]">
                  {investigations.filter(i => i.stage === 'recommendations').length > 0 ? (
                    investigations.filter(i => i.stage === 'recommendations').map(investigation => (
                      <Link 
                        href={`/dashboard/investigations/${investigation.id}`}
                        key={investigation.id}
                        className="block bg-white border border-gray-200 hover:border-blue-400 rounded-md p-3 transition-colors shadow-sm kanban-card"
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-xs text-gray-600 rounded">
                              {investigation.occurrence.occurrence_number}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(investigation.occurrence.severity)}`}>
                              {investigation.occurrence.severity}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm mt-2 line-clamp-2">
                            {investigation.occurrence.title}
                          </h4>
                          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                            <div className="flex items-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-3 w-3 mr-1" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(investigation.started_at)}
                            </div>
                            {investigation.lead_investigator && (
                              <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-[10px] text-purple-700">
                                {investigation.lead_investigator.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-4 text-center">
                      <p className="text-sm text-gray-500">No investigations in this stage</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Review */}
              <div className="w-64 flex-shrink-0 kanban-column">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    Review
                  </h3>
                  <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5">
                    {investigations.filter(i => i.stage === 'review').length}
                  </span>
                </div>
                
                <div className="space-y-3 min-h-[100px]">
                  {investigations.filter(i => i.stage === 'review').length > 0 ? (
                    investigations.filter(i => i.stage === 'review').map(investigation => (
                      <Link 
                        href={`/dashboard/investigations/${investigation.id}`}
                        key={investigation.id}
                        className="block bg-white border border-gray-200 hover:border-blue-400 rounded-md p-3 transition-colors shadow-sm kanban-card"
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-xs text-gray-600 rounded">
                              {investigation.occurrence.occurrence_number}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(investigation.occurrence.severity)}`}>
                              {investigation.occurrence.severity}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm mt-2 line-clamp-2">
                            {investigation.occurrence.title}
                          </h4>
                          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                            <div className="flex items-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-3 w-3 mr-1" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(investigation.started_at)}
                            </div>
                            {investigation.lead_investigator && (
                              <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center text-[10px] text-yellow-700">
                                {investigation.lead_investigator.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-4 text-center">
                      <p className="text-sm text-gray-500">No investigations in this stage</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Completed */}
              <div className="w-64 flex-shrink-0 kanban-column">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center text-gray-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Completed
                  </h3>
                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                    {investigations.filter(i => i.stage === 'completed').length}
                  </span>
                </div>
                
                <div className="space-y-3 min-h-[100px]">
                  {investigations.filter(i => i.stage === 'completed').length > 0 ? (
                    investigations.filter(i => i.stage === 'completed').map(investigation => (
                      <Link 
                        href={`/dashboard/investigations/${investigation.id}`}
                        key={investigation.id}
                        className="block bg-white border border-gray-200 hover:border-blue-400 rounded-md p-3 transition-colors shadow-sm kanban-card"
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-xs text-gray-600 rounded">
                              {investigation.occurrence.occurrence_number}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(investigation.occurrence.severity)}`}>
                              {investigation.occurrence.severity}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm mt-2 line-clamp-2">
                            {investigation.occurrence.title}
                          </h4>
                          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                            <div className="flex items-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-3 w-3 mr-1" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(investigation.completed_at)}
                            </div>
                            {investigation.lead_investigator && (
                              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-[10px] text-green-700">
                                {investigation.lead_investigator.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-4 text-center">
                      <p className="text-sm text-gray-500">No investigations in this stage</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 