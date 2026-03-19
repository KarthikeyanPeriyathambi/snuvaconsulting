import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from '@emotion/styled';
import {
  faSearch,
  faMapMarkerAlt,
  faBriefcase,
  faMoneyBillWave,
  faSlidersH,
  faUserGraduate,
  faUserTie,
  faTimesCircle,
  faCalendarAlt,
  faArrowLeft,
  faArrowRight,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { listJobs } from '../actions/jobActions';
import JobCard from '../components/job/JobCard';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';
import { JOB_TYPES, EXPERIENCE_LEVELS } from '../config';

const AnimatedJobCard = styled.div`
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  animation: fadeInUp 0.5s ease forwards;
  animation-delay: ${props => props.index * 150}ms;
  opacity: 0;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const FilterPanel = styled.div`
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  animation: slideIn 0.3s ease forwards;
`;

const PulseLoader = styled.div`
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const ButtonHover = styled.button`
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const JobListScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const jobList = useSelector((state) => state.jobList);
  const { loading, error, jobs, pages, page } = jobList;

  useEffect(() => {
    dispatch(listJobs({
      keyword,
      location,
      jobType,
      experienceLevel,
      page: currentPage
    }));
  }, [dispatch, keyword, location, jobType, experienceLevel, currentPage]);

  const searchHandler = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    dispatch(listJobs({
      keyword,
      location,
      jobType,
      experienceLevel,
      page: 1
    }));
  };

  const clearFilters = () => {
    setKeyword('');
    setLocation('');
    setJobType('');
    setExperienceLevel('');
    setCurrentPage(1);
    dispatch(listJobs({}));
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleApply = (job) => {
    navigate(`/upload-resume?jobId=${job.id}&jobTitle=${encodeURIComponent(job.title)}`);
  };

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Opportunities</h1>
          <p className="text-gray-600">Select a job from the list below to begin your application process.</p>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={searchHandler} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Job title or keywords"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <select
              className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              <option value="">All Job Types</option>
              {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-primary-600 text-white rounded-lg px-4 py-2 hover:bg-primary-700 transition-colors">
                Search
              </button>
              <button 
                type="button" 
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader /></div>
          ) : error ? (
            <Message variant="error">{error}</Message>
          ) : jobs.length === 0 ? (
            <div className="py-20 text-center text-gray-500">No jobs found matching your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Job Title</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Company</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Location</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Level</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Posted</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr 
                      key={job.id} 
                      className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${selectedJobId === job.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{job.title}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{job.admin?.companyName || 'Company'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 text-xs" />
                          {job.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700">
                          {job.jobType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{job.experienceLevel}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApply(job); }}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                          Select & Apply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && pages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setCurrentPage(page - 1)}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 border rounded-lg font-medium transition-colors ${page === i + 1 ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-50'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page === pages}
              onClick={() => setCurrentPage(page + 1)}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobListScreen;
